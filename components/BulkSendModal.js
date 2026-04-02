import { useState, useEffect } from 'react'

export default function BulkSendModal({ recipients, onClose, onStartSend }) {
  const [templates, setTemplates] = useState([])
  const [selectedTpl, setSelectedTpl] = useState(null)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(j => setTemplates(j.data || [])).catch(() => {})
  }, [])

  function resolveForRecipient(text, r) {
    return text
      .replace(/\{nome\}/g, (r.founder_name || '').split(' ')[0] || 'Olá')
      .replace(/\{startup\}/g, r.startup_name || '')
      .replace(/\{gt\}/g, r.gt || '')
      .replace(/\{mentor\}/g, r.mentor || '')
      .replace(/\{link_meet\}/g, r.link_meet || 'disponível no app')
  }

  function handleSend() {
    const text = selectedTpl ? selectedTpl.text_template : customText
    if (!text.trim()) return

    const items = recipients.map(r => ({
      ...r,
      personalized_text: resolveForRecipient(text, r),
    }))

    onStartSend(items, text, selectedTpl?.name)
    onClose()
  }

  const noPhone = recipients.filter(r => !r.phone).length
  const validCount = recipients.length - noPhone

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, width:560, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--txt)', fontFamily:'var(--font-body)', letterSpacing:'-0.2px' }}>Envio em massa</div>
            <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:2 }}>
              {validCount} destinatários{noPhone > 0 ? ` (${noPhone} sem telefone)` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-3)', fontSize:18, fontFamily:'var(--font-body)' }}>×</button>
        </div>

        {/* Content */}
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
            <textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Escreva a mensagem. Use {nome} para personalizar."
              style={{ width:'100%', minHeight:100, padding:'12px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', color:'var(--txt)', fontFamily:'var(--font-body)', outline:'none', resize:'vertical', lineHeight:1.6, marginBottom:12 }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          )}

          <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginBottom:12, lineHeight:1.5 }}>
            Variáveis: {['{nome}','{startup}','{gt}','{mentor}','{link_meet}','{email}','{telefone}','{segmento}','{escritorio}'].map(v=>(
              <code key={v} style={{ background:'var(--bg-4)', padding:'1px 5px', borderRadius:3, fontSize:10, marginRight:4, cursor:'pointer', display:'inline-block', marginBottom:2 }} onClick={()=>{ if(!selectedTpl) setCustomText(prev=>prev+v) }}>{v}</code>
            ))}
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

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>
            Intervalo de 15s entre envios. Você pode fechar e acompanhar no topbar.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', fontSize:11, fontWeight:500, border:'none', borderRadius:8, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Cancelar</button>
            <button onClick={handleSend} disabled={!validCount || (!selectedTpl && !customText.trim())} style={{ padding:'8px 20px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)', opacity:(!validCount || (!selectedTpl && !customText.trim())) ? 0.5 : 1 }}>
              Enviar para {validCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
