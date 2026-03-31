import { useState, useRef, useCallback } from 'react'

export function useQueue() {
  const [activeBatch, setActiveBatch] = useState(null) // { id, total, sent, failed, status, log }
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)

  const startBatch = useCallback(async (recipients, messageText, templateName) => {
    const items = recipients.filter(r => r.phone).map(r => ({
      startup_id: r.startup_id,
      startup_name: r.startup_name,
      founder_name: r.founder_name,
      phone: r.phone,
      personalized_text: r.personalized_text,
    }))

    if (!items.length) return null

    cancelledRef.current = false

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: items,
          message_text: messageText,
          template_name: templateName || 'Mensagem personalizada',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const batch = {
        id: data.batch_id,
        total: data.total,
        sent: 0,
        failed: 0,
        status: 'processing',
        log: [],
      }
      setActiveBatch(batch)
      scheduleProcess(data.batch_id)
      return data.batch_id
    } catch (e) {
      setActiveBatch(prev => prev ? { ...prev, status: 'error', log: [...(prev?.log||[]), { type: 'error', text: `Erro: ${e.message}` }] } : null)
      return null
    }
  }, [])

  function scheduleProcess(batchId) {
    timerRef.current = setTimeout(() => processNext(batchId), 1000) // first one starts quickly
  }

  async function processNext(batchId) {
    if (cancelledRef.current) return

    try {
      const res = await fetch('/api/queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId }),
      })
      const data = await res.json()

      setActiveBatch(prev => {
        if (!prev) return null
        const newLog = [...prev.log]
        if (data.processed) {
          newLog.push({
            type: data.processed.status === 'sent' ? 'success' : 'error',
            text: data.processed.status === 'sent'
              ? `✓ ${data.processed.startup}`
              : `✕ ${data.processed.startup} (${data.processed.attempts}/3)`,
          })
        }
        return {
          ...prev,
          sent: data.progress?.sent ?? prev.sent,
          failed: data.progress?.failed ?? prev.failed,
          status: data.done ? 'completed' : 'processing',
          log: newLog,
        }
      })

      if (data.done) return

      // Wait 15s before next
      if (!cancelledRef.current) {
        timerRef.current = setTimeout(() => processNext(batchId), 15000)
      }
    } catch (e) {
      setActiveBatch(prev => prev ? {
        ...prev,
        log: [...prev.log, { type: 'error', text: `Erro de rede: ${e.message}` }],
      } : null)
      // Retry after 20s
      if (!cancelledRef.current) {
        timerRef.current = setTimeout(() => processNext(batchId), 20000)
      }
    }
  }

  const cancelBatch = useCallback(async () => {
    cancelledRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    if (activeBatch?.id) {
      await fetch('/api/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: activeBatch.id }),
      })
    }
    setActiveBatch(prev => prev ? { ...prev, status: 'cancelled' } : null)
  }, [activeBatch])

  const dismissBatch = useCallback(() => {
    if (activeBatch?.status === 'processing') return // can't dismiss while processing
    setActiveBatch(null)
  }, [activeBatch])

  return { activeBatch, startBatch, cancelBatch, dismissBatch }
}
