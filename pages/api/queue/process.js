import { db } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { batch_id } = req.body
  if (!batch_id) return res.status(400).json({ error: 'batch_id required' })

  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  if (!baseUrl || !apiKey || !instance) {
    return res.status(500).json({ error: 'Evolution API not configured' })
  }

  // Pick next pending or failed (with retries left) item from this batch
  const { data: items } = await db
    .from('message_queue')
    .select('*')
    .eq('batch_id', batch_id)
    .or('status.eq.pending,and(status.eq.failed,attempts.lt.3)')
    .order('id', { ascending: true })
    .limit(1)

  if (!items?.length) {
    // No more items to process — mark batch as completed
    const { data: stats } = await db
      .from('message_queue')
      .select('status')
      .eq('batch_id', batch_id)

    const sent = stats?.filter(s => s.status === 'sent').length || 0
    const failed = stats?.filter(s => s.status === 'failed').length || 0

    await db.from('message_batches').update({
      status: 'completed',
      sent,
      failed,
      completed_at: new Date().toISOString(),
    }).eq('id', batch_id)

    return res.status(200).json({ done: true, sent, failed })
  }

  const item = items[0]

  // Mark as sending
  await db.from('message_queue')
    .update({ status: 'sending', attempts: item.attempts + 1 })
    .eq('id', item.id)

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number: item.phone, text: item.message_text }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`)
    }

    // Success
    await db.from('message_queue').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      last_error: null,
    }).eq('id', item.id)

    // Also log to message_history
    await db.from('message_history').insert({
      startup_id: item.startup_id,
      phone: item.phone,
      message_text: item.message_text,
      direction: 'outgoing',
      status: 'sent',
      template_name: null,
      remote_id: data?.key?.id || null,
    })

    // Update batch counters
    const { data: batchStats } = await db
      .from('message_queue')
      .select('status')
      .eq('batch_id', batch_id)

    const sentCount = batchStats?.filter(s => s.status === 'sent').length || 0
    const failedCount = batchStats?.filter(s => s.status === 'failed' && s.attempts >= 3).length || 0

    await db.from('message_batches').update({ sent: sentCount, failed: failedCount }).eq('id', batch_id)

    return res.status(200).json({
      done: false,
      processed: { id: item.id, startup: item.startup_name, status: 'sent' },
      progress: { sent: sentCount, failed: failedCount, total: batchStats?.length || 0 },
    })

  } catch (err) {
    const errorMsg = err.message || 'Unknown error'
    const newAttempts = item.attempts + 1
    const finalStatus = newAttempts >= 3 ? 'failed' : 'failed'

    await db.from('message_queue').update({
      status: finalStatus,
      last_error: errorMsg,
    }).eq('id', item.id)

    // Update batch counters
    const { data: batchStats } = await db
      .from('message_queue')
      .select('status')
      .eq('batch_id', batch_id)

    const sentCount = batchStats?.filter(s => s.status === 'sent').length || 0
    const failedCount = batchStats?.filter(s => s.status === 'failed' && s.attempts >= 3).length || 0

    await db.from('message_batches').update({ sent: sentCount, failed: failedCount }).eq('id', batch_id)

    return res.status(200).json({
      done: false,
      processed: { id: item.id, startup: item.startup_name, status: 'failed', error: errorMsg, attempts: newAttempts },
      progress: { sent: sentCount, failed: failedCount, total: batchStats?.length || 0 },
    })
  }
}
