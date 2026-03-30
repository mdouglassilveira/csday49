import { supabase, db } from '../../../lib/supabase'

// Evolution API sends webhooks for various events
// We only care about MESSAGES_UPSERT (incoming messages)
// Payload structure:
// {
//   event: "messages.upsert",
//   instance: "tamara",
//   data: {
//     key: { remoteJid: "5511999999999@s.whatsapp.net", fromMe: false, id: "..." },
//     message: { conversation: "text here" | extendedTextMessage: { text: "..." } },
//     messageTimestamp: 1234567890,
//     pushName: "Contact Name"
//   }
// }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body

  // Only process incoming text messages
  const event = body.event
  if (event !== 'messages.upsert') return res.status(200).json({ ok: true, skipped: event })

  const data = body.data
  if (!data?.key) return res.status(200).json({ ok: true, skipped: 'no key' })

  // Skip messages sent by us
  if (data.key.fromMe) return res.status(200).json({ ok: true, skipped: 'fromMe' })

  // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
  const remoteJid = data.key.remoteJid || ''
  const phone = remoteJid.split('@')[0]
  if (!phone || phone.includes('-')) {
    // Group messages have a hyphen — skip
    return res.status(200).json({ ok: true, skipped: 'group' })
  }

  // Extract message text
  const msg = data.message || {}
  const text = msg.conversation
    || msg.extendedTextMessage?.text
    || msg.imageMessage?.caption
    || msg.videoMessage?.caption
    || null

  if (!text) return res.status(200).json({ ok: true, skipped: 'no text' })

  const senderName = data.pushName || ''
  const remoteId = data.key.id || ''
  const timestamp = data.messageTimestamp
    ? new Date(Number(data.messageTimestamp) * 1000).toISOString()
    : new Date().toISOString()

  // Look up this phone in the startups database
  // Phone in DB may be in various formats, so we search flexibly
  const phoneVariants = []
  // Original phone from WhatsApp (e.g. 5511999999999)
  phoneVariants.push(phone)
  // Without country code
  if (phone.startsWith('55')) phoneVariants.push(phone.slice(2))
  // With formatting
  if (phone.length === 13) { // 55 + 11 + 999999999
    const ddd = phone.slice(2, 4)
    const num = phone.slice(4)
    phoneVariants.push(`(${ddd}) ${num.slice(0,5)}-${num.slice(5)}`)
    phoneVariants.push(`${ddd}${num}`)
    phoneVariants.push(`(${ddd}) ${num.slice(0,4)}-${num.slice(4)}`)
  }
  if (phone.length === 12) { // 55 + 11 + 99999999
    const ddd = phone.slice(2, 4)
    const num = phone.slice(4)
    phoneVariants.push(`(${ddd}) ${num.slice(0,4)}-${num.slice(4)}`)
    phoneVariants.push(`${ddd}${num}`)
  }

  // Search for matching startup
  const { data: startups } = await supabase
    .from('view_startups_export')
    .select('startup_id, nome, founder_nome, founder_telefone')

  let matchedStartup = null
  if (startups) {
    for (const s of startups) {
      if (!s.founder_telefone) continue
      const cleanDb = s.founder_telefone.replace(/\D/g, '')
      const cleanPhone = phone.replace(/\D/g, '')
      // Match if the digits match (ignoring country code differences)
      if (cleanDb === cleanPhone
        || cleanDb === cleanPhone.slice(2)
        || '55' + cleanDb === cleanPhone
        || cleanDb.slice(2) === cleanPhone.slice(2)) {
        matchedStartup = s
        break
      }
    }
  }

  // Only save if it's a known contact
  if (!matchedStartup) {
    return res.status(200).json({ ok: true, skipped: 'unknown contact', phone })
  }

  // Save to message_history
  const { error } = await db.from('message_history').insert({
    startup_id: matchedStartup.startup_id,
    phone,
    message_text: text,
    direction: 'incoming',
    sender_name: senderName || matchedStartup.founder_nome,
    remote_id: remoteId,
    status: 'received',
    sent_at: timestamp,
  })

  if (error) {
    console.error('Webhook save error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    ok: true,
    saved: true,
    startup: matchedStartup.nome,
    from: senderName,
  })
}
