import { db } from '../../lib/supabase'

export default async function handler(req, res) {
  // GET — fetch message history for a startup (or all)
  if (req.method === 'GET') {
    const { startup_id, limit = 50 } = req.query

    let query = db
      .from('message_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(parseInt(limit))

    if (startup_id) query = query.eq('startup_id', startup_id)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data: data || [] })
  }

  // POST — log a sent message
  if (req.method === 'POST') {
    const { startup_id, phone, template_id, template_name, message_text, sent_by } = req.body
    if (!startup_id || !message_text) {
      return res.status(400).json({ error: 'startup_id and message_text are required' })
    }

    const { data, error } = await db
      .from('message_history')
      .insert({
        startup_id,
        phone: phone || '',
        template_id: template_id || null,
        template_name: template_name || null,
        message_text,
        sent_by: sent_by || 'tamara',
      })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ data: data?.[0] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
