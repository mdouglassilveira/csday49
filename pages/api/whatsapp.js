import { db } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { number, text, startup_id, template_id, template_name } = req.body
  if (!number || !text) return res.status(400).json({ error: 'number and text are required' })

  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  if (!baseUrl || !apiKey || !instance) {
    return res.status(500).json({ error: 'Evolution API not configured' })
  }

  // Normalize phone number: remove non-digits, ensure country code
  const clean = number.replace(/\D/g, '')
  const phone = clean.startsWith('55') ? clean : '55' + clean

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: phone,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Log failed attempt too
      if (startup_id) {
        await db.from('message_history').insert({
          startup_id,
          phone,
          template_id: template_id || null,
          template_name: template_name || null,
          message_text: text,
          direction: 'outgoing',
          status: 'failed',
        })
      }
      return res.status(response.status).json({ error: data.message || 'Failed to send message', details: data })
    }

    // Log successful message to history with remote_id to prevent webhook duplicate
    const remoteId = data?.key?.id || null
    if (startup_id) {
      await db.from('message_history').insert({
        startup_id,
        phone,
        template_id: template_id || null,
        template_name: template_name || null,
        message_text: text,
        direction: 'outgoing',
        remote_id: remoteId,
        status: 'sent',
      })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to connect to Evolution API', details: err.message })
  }
}
