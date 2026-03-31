import { db } from '../../../lib/supabase'

export default async function handler(req, res) {
  // DELETE — mark as unread (clear read_at on last incoming message)
  if (req.method === 'DELETE') {
    const { startup_id } = req.body
    if (!startup_id) return res.status(400).json({ error: 'startup_id is required' })

    // Get the last incoming message and set read_at to null
    const { data: msgs } = await db
      .from('message_history')
      .select('id')
      .eq('startup_id', startup_id)
      .eq('direction', 'incoming')
      .not('read_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(1)

    if (msgs?.length) {
      await db.from('message_history')
        .update({ read_at: null })
        .eq('id', msgs[0].id)
    }

    return res.status(200).json({ success: true })
  }

  // POST — mark as read
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { startup_id } = req.body
  if (!startup_id) return res.status(400).json({ error: 'startup_id is required' })

  // 1. Get all unread incoming messages for this startup
  const { data: unread, error: fetchErr } = await db
    .from('message_history')
    .select('id, phone, remote_id')
    .eq('startup_id', startup_id)
    .eq('direction', 'incoming')
    .is('read_at', null)

  if (fetchErr) return res.status(500).json({ error: fetchErr.message })
  if (!unread?.length) return res.status(200).json({ success: true, count: 0 })

  // 2. Mark as read in DB first (don't block on Evolution API)
  const ids = unread.map(m => m.id)
  const { error: updateErr } = await db
    .from('message_history')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)

  if (updateErr) return res.status(500).json({ error: updateErr.message })

  // 3. Send read receipts to Evolution API (fire and forget)
  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  if (baseUrl && apiKey && instance) {
    // Build read messages array from messages that have remote_id
    const readMessages = unread
      .filter(m => m.remote_id && m.phone)
      .map(m => ({
        remoteJid: `${m.phone}@s.whatsapp.net`,
        fromMe: false,
        id: m.remote_id,
      }))

    if (readMessages.length > 0) {
      // Fire and forget — don't await, don't block the response
      fetch(`${baseUrl}/chat/markMessageAsRead/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
        body: JSON.stringify({ readMessages }),
      }).catch(() => {}) // silently ignore errors
    }
  }

  return res.status(200).json({ success: true, count: ids.length })
}
