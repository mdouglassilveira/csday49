import { db } from '../../../lib/supabase'

export default async function handler(req, res) {
  // POST — create a new batch with queue items
  if (req.method === 'POST') {
    const { recipients, message_text, template_name } = req.body

    if (!recipients?.length || !message_text) {
      return res.status(400).json({ error: 'recipients and message_text are required' })
    }

    // Filter out recipients without phone
    const valid = recipients.filter(r => r.phone)
    if (!valid.length) return res.status(400).json({ error: 'No recipients with phone numbers' })

    // Create batch
    const { data: batch, error: batchErr } = await db
      .from('message_batches')
      .insert({
        template_name: template_name || null,
        message_text,
        total: valid.length,
        status: 'pending',
      })
      .select()
      .single()

    if (batchErr) return res.status(500).json({ error: batchErr.message })

    // Create queue items
    const items = valid.map(r => ({
      batch_id: batch.id,
      startup_id: r.startup_id,
      startup_name: r.startup_name || '',
      founder_name: r.founder_name || '',
      phone: r.phone.replace(/\D/g, '').replace(/^(?!55)/, '55'),
      message_text: r.personalized_text || message_text,
      status: 'pending',
    }))

    const { error: queueErr } = await db.from('message_queue').insert(items)
    if (queueErr) return res.status(500).json({ error: queueErr.message })

    // Mark batch as processing
    await db.from('message_batches').update({ status: 'processing' }).eq('id', batch.id)

    return res.status(201).json({ batch_id: batch.id, total: valid.length })
  }

  // GET — get batch status
  if (req.method === 'GET') {
    const { batch_id } = req.query

    if (batch_id) {
      const { data: batch } = await db
        .from('message_batches')
        .select('*')
        .eq('id', batch_id)
        .single()

      const { data: items } = await db
        .from('message_queue')
        .select('id, startup_name, founder_name, phone, status, attempts, last_error, sent_at')
        .eq('batch_id', batch_id)
        .order('id', { ascending: true })

      return res.status(200).json({ batch, items: items || [] })
    }

    // List recent batches
    const { data: batches } = await db
      .from('message_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return res.status(200).json({ batches: batches || [] })
  }

  // DELETE — cancel a batch
  if (req.method === 'DELETE') {
    const { batch_id } = req.body
    if (!batch_id) return res.status(400).json({ error: 'batch_id required' })

    await db.from('message_queue')
      .update({ status: 'cancelled' })
      .eq('batch_id', batch_id)
      .in('status', ['pending', 'failed'])

    await db.from('message_batches')
      .update({ status: 'cancelled' })
      .eq('id', batch_id)

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
