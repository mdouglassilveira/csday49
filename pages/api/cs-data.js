import { db } from '../../lib/supabase'

export default async function handler(req, res) {
  // GET — load all cs_followup records
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('cs_followup')
      .select('*')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data: data || [] })
  }

  // PATCH — upsert a single cs_followup record
  if (req.method === 'PATCH') {
    const { startup_id, status, notes, last_contact } = req.body
    if (!startup_id) return res.status(400).json({ error: 'startup_id is required' })

    const update = { startup_id, updated_at: new Date().toISOString() }
    if (status !== undefined) update.status = status
    if (notes !== undefined) update.notes = notes
    if (last_contact !== undefined) update.last_contact = last_contact

    const { data, error } = await db
      .from('cs_followup')
      .upsert(update, { onConflict: 'startup_id' })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data: data?.[0] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
