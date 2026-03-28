import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('view_startups_export')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error

    return res.status(200).json({ data: data || [], total: (data || []).length })
  } catch (err) {
    console.error('Supabase error:', err)
    return res.status(500).json({ error: err.message || 'Erro ao buscar dados' })
  }
}
