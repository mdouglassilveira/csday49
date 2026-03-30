import { useState, useEffect, useRef } from 'react'
import { firstName } from '../lib/constants'

export default function BulkSendModal({ recipients, onClose }) {
  const [step, setStep] = useState('compose') // compose | sending | done
  const [templates, setTemplates] = useState([])
  const [selectedTpl, setSelectedTpl] = useState(null)
  const [customText, setCustomText] = useState('')
  const [batchId, setBatchId] = useState(null)
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [log, setLog] = useState([])
  const [cancelled, setCancelled] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(j => setTemplates(j.data || [])).catch(() => {})
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function resolveForRecipient(text, r) {
    return text
      .replace(/\{nome\}/g, (r.founder_name || '').split(' ')[0] || 'Olá')
      .replace(/\{startup\}/g, r.startup_name || '')
      .replace(/\{gt\}/g, r.gt || '')
      .replace(/\{mentor\}/g, r.mentor || '')
      .replace(/\{link_meet\}/g, r.link_meet || 'disponível no app')
  }

  async function startSending() {
    const text = selectedTpl ? selectedTpl.text_template : customText
    if (!text.trim()) return

    const items = recipients.map(r => ({
      startup_id: r.startup_id,
      startup_name: r.startup_name,
      founder_name: r.founder_name,
      phone: r.phone,
      personalized_text: resolveForRecipient(text, r),
    }))

    setStep('sending')
    setProgress({ sent: 0, failed: 0, total: items.length })

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: items,
          message_text: text,
          template_name: selectedTpl?.name || 'Mensagem personalizada',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBatchId(data.batch_id)
      processNext(data.batch_id)
    } catch (e) {
      setLog(prev => [...prev, { type: 'error', text: `Erro ao criar fila: ${e.message}` }])
      setStep('done')
    }
  }

  async function processNext(id) {
    if (cancelled) return

    try {
      const res = await fetch('/api/queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: id }),
      })
      const data = await res.json()

      if (data.processed) {
        const p = data.processed
        setLog(prev => [...prev, {
          type: p.status === 'sent' ? 'success' : 'error',
          text: p.status === 'sent'
            ? `✓ ${p.startup} — enviada`
            : `✕ ${p.startup} — falhou (tentativa ${p.attempts}/3): ${p.error || 'erro'}`,
        }])
      }

      if (data.progress) setProgress(data.progress)

      if (data.done) {
        setProgress(prev => ({ ...prev, sent: data.sent || prev.sent, failed: data.failed || prev.failed }))
        setStep('done')
        return
      }

      // Wait 15 seconds before next
      timerRef.current = setTimeout(() => processNext(id), 15000)
    } catch (e) {
      setLog(prev => [...prev, { type: 'error', text: `Erro de rede: ${e.message}` }])
      // Retry after 20s on network error
      timerRef.current = setTimeout(() => processNext(id), 20000)
    }
  }

  async function cancelBatch() {
    setCancelled(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (batchId) {
      await fetch('/api/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId }),
      })
    }
    setStep('done')
    setLog(prev => [...prev, { type: 'warn', text: 'Envio cancelado. Mensagens pendentes foram descartadas.' }])
  }

  const noPhone = recipients.filter(r => !r.phone).length
  const validCount = recipients.length - noPhone

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={e => { if (e.target === e.currentTarget && step !== 'sending') onClose() }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, width:560, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--txt)', fontFamily:'var(--font-body)', letterSpacing:'-0.2px' }}>
              {step === 'compose' ? 'Envio em massa' : step === 'sending' ? 'Enviando…' : 'Concluído'}
            </div>
            <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:2 }}>
              {validCount} destinatários{noPhone > 0 ? ` (${noPhone} sem telefone)` : ''}
            </div>
          </div>
          {step !== 'sending' && (
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-3)', fontSize:18, fontFamily:'var(--font-body)' }}>×</button>
          )}
        </div>

        {/* Compose step */}
        {step === 'compose' && (
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
            {/* Template selector */}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-body)' }}>Escolher template</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
              <button onClick={() => { setSelectedTpl(null); setCustomText('') }} style={{ padding:'6px 12px', fontSize:11, border:'none', borderRadius:8, cursor:'pointer', background:!selectedTpl ? 'var(--orange-dim)' : 'var(--bg-3)', color:!selectedTpl ? 'var(--orange)' : 'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Personalizada</button>
              {templates.map(t => (
                <button key={t.id} onClick={() => { setSelectedTpl(t); setCustomText('') }} style={{ padding:'6px 12px', fontSize:11, border:'none', borderRadius:8, cursor:'pointer', background:selectedTpl?.id === t.id ? 'var(--orange-dim)' : 'var(--bg-3)', color:selectedTpl?.id === t.id ? 'var(--orange)' : 'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>{t.name}</button>
              ))}
            </div>

            {/* Message editor */}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-body)' }}>Mensagem</div>
            {selectedTpl ? (
              <div style={{ background:'var(--bg-3)', borderRadius:8, padding:'12px 14px', fontSize:12, color:'var(--txt-2)', lineHeight:1.6, fontFamily:'var(--font-body)', whiteSpace:'pre-wrap', marginBottom:12, border:'1px solid var(--border)' }}>
                {selectedTpl.text_template}
              </div>
            ) : (
              <textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Escreva a mensagem. Use {nome} para personalizar com o nome do founder, {startup} para o nome da startup."
                style={{ width:'100%', minHeight:100, padding:'12px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', color:'var(--txt)', fontFamily:'var(--font-body)', outline:'none', resize:'vertical', lineHeight:1.6, marginBottom:12 }}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            )}

            <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginBottom:12, lineHeight:1.5 }}>
              Variáveis: <code style={{ background:'var(--bg-4)', padding:'1px 4px', borderRadius:3, fontSize:10 }}>{'{nome}'}</code> <code style={{ background:'var(--bg-4)', padding:'1px 4px', borderRadius:3, fontSize:10 }}>{'{startup}'}</code> <code style={{ background:'var(--bg-4)', padding:'1px 4px', borderRadius:3, fontSize:10 }}>{'{gt}'}</code> <code style={{ background:'var(--bg-4)', padding:'1px 4px', borderRadius:3, fontSize:10 }}>{'{mentor}'}</code>
            </div>

            {/* Preview */}
            {recipients.length > 0 && (
              <>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-body)' }}>Preview — {recipients[0].startup_name}</div>
                <div style={{ background:'var(--bg-4)', borderRadius:8, padding:'10px 14px', fontSize:11, color:'var(--txt-2)', lineHeight:1.6, fontFamily:'var(--font-body)', whiteSpace:'pre-wrap', marginBottom:12 }}>
                  {resolveForRecipient(selectedTpl?.text_template || customText || '...', recipients[0])}
                </div>
              </>
            )}

            {/* Recipients summary */}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-body)' }}>Destinatários ({validCount})</div>
            <div style={{ maxHeight:120, overflowY:'auto', background:'var(--bg-3)', borderRadius:8, border:'1px solid var(--border)' }}>
              {recipients.slice(0, 20).map(r => (
                <div key={r.startup_id} style={{ padding:'6px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--txt)', fontFamily:'var(--font-body)' }}>{r.startup_name} — {r.founder_name}</span>
                  <span style={{ fontSize:10, color: r.phone ? 'var(--txt-3)' : 'var(--red)', fontFamily:'var(--font-mono)' }}>{r.phone || 'sem tel'}</span>
                </div>
              ))}
              {recipients.length > 20 && <div style={{ padding:8, textAlign:'center', fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>+{recipients.length - 20} mais</div>}
            </div>
          </div>
        )}

        {/* Sending / Done step */}
        {(step === 'sending' || step === 'done') && (
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
            {/* Progress bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'var(--txt-2)', fontFamily:'var(--font-body)' }}>
                  {progress.sent + progress.failed} / {progress.total || validCount}
                </span>
                <span style={{ fontSize:11, fontFamily:'var(--font-mono)' }}>
                  <span style={{ color:'var(--green)' }}>{progress.sent} enviadas</span>
                  {progress.failed > 0 && <span style={{ color:'var(--red)', marginLeft:8 }}>{progress.failed} falharam</span>}
                </span>
              </div>
              <div style={{ height:6, borderRadius:99, background:'var(--bg-4)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(progress.total ? ((progress.sent + progress.failed) / progress.total) * 100 : 0)}%`, background: progress.failed > 0 ? 'var(--amber)' : 'var(--green)', borderRadius:99, transition:'width .5s' }} />
              </div>
              {step === 'sending' && (
                <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:6 }}>
                  Enviando com intervalo de 15s entre mensagens…
                </div>
              )}
            </div>

            {/* Log */}
            <div style={{ background:'var(--bg-3)', borderRadius:8, border:'1px solid var(--border)', maxHeight:250, overflowY:'auto' }}>
              {log.map((l, i) => (
                <div key={i} style={{ padding:'6px 12px', borderBottom:'1px solid var(--border)', fontSize:11, fontFamily:'var(--font-body)', color: l.type === 'success' ? 'var(--green)' : l.type === 'error' ? 'var(--red)' : 'var(--amber)' }}>
                  {l.text}
                </div>
              ))}
              {log.length === 0 && <div style={{ padding:12, fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', textAlign:'center' }}>Aguardando…</div>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          {step === 'compose' && (
            <>
              <button onClick={onClose} style={{ padding:'8px 16px', fontSize:11, fontWeight:500, border:'none', borderRadius:8, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Cancelar</button>
              <button onClick={startSending} disabled={!validCount || (!selectedTpl && !customText.trim())} style={{ padding:'8px 20px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)', opacity:(!validCount || (!selectedTpl && !customText.trim())) ? 0.5 : 1 }}>
                Enviar para {validCount} startups
              </button>
            </>
          )}
          {step === 'sending' && (
            <button onClick={cancelBatch} style={{ padding:'8px 16px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer', background:'var(--red-dim)', color:'var(--red)', fontFamily:'var(--font-body)' }}>Cancelar envio</button>
          )}
          {step === 'done' && (
            <button onClick={onClose} style={{ padding:'8px 20px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)' }}>Fechar</button>
          )}
        </div>
      </div>
    </div>
  )
}
