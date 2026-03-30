import { db } from '../../lib/supabase'

export default async function handler(req, res) {
  // GET — fetch custom templates
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('custom_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data: data || [] })
  }

  // POST — create a new custom template
  if (req.method === 'POST') {
    const { name, situation, text_template } = req.body
    if (!name || !text_template) {
      return res.status(400).json({ error: 'name and text_template are required' })
    }

    const { data, error } = await db
      .from('custom_templates')
      .insert({ name, situation: situation || 'Personalizado', text_template })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ data: data?.[0] })
  }

  // DELETE — soft delete (deactivate) a template
  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })

    const { error } = await db
      .from('custom_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
