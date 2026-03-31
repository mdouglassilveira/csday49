import { db } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Get all messages grouped by startup_id, with the last message info
  const { data, error } = await db
    .from('message_history')
    .select('*')
    .order('sent_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Group by startup_id
  const map = {}
  ;(data || []).forEach(msg => {
    if (!map[msg.startup_id]) {
      map[msg.startup_id] = {
        startup_id: msg.startup_id,
        lastMessage: msg,
        totalMessages: 0,
        unread: 0,
      }
    }
    map[msg.startup_id].totalMessages++
    // Count incoming messages without read_at as unread
    if (msg.direction === 'incoming' && !msg.read_at) {
      map[msg.startup_id].unread++
    }
  })

  const conversations = Object.values(map).sort(
    (a, b) => new Date(b.lastMessage.sent_at) - new Date(a.lastMessage.sent_at)
  )

  return res.status(200).json({ data: conversations })
}
