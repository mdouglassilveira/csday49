import { useState, useEffect, useRef } from 'react'
import { FUP_TEMPLATES, firstName } from '../lib/constants'

function resolveText(tpl, s) {
  if (typeof tpl.text === 'function') return tpl.text(s)
  return (tpl.text_template||'')
    .replace(/\{nome\}/g, firstName(s))
    .replace(/\{startup\}/g, s.nome||'')
    .replace(/\{gt\}/g, s.nome_gt||'GT')
    .replace(/\{mentor\}/g, s.nome_mentor||'responsável')
    .replace(/\{link_meet\}/g, s.link_meet||'disponível no app')
    .replace(/\{email\}/g, s.founder_email||'')
    .replace(/\{telefone\}/g, s.founder_telefone||'')
    .replace(/\{segmento\}/g, s.segmento||'')
    .replace(/\{escritorio\}/g, s.escritorio_regional||'')
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
}

function formatDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
  if (d.toDateString()===today.toDateString()) return 'Hoje'
  if (d.toDateString()===yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
}

// standalone=true means no negative margins (used in ConversationsView)
export default function ChatView({ s, messages, onRefresh, standalone }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTplPicker, setShowTplPicker] = useState(false)
  const [templates, setTemplates] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  useEffect(() => {
    fetch('/api/templates').then(r=>r.json()).then(j=>setTemplates(j.data||[])).catch(()=>{})
  }, [])

  async function sendMessage(text) {
    if (!text.trim() || sending) return
    const phone = s.founder_telefone
    if (!phone) return
    setSending(true)
    setInput('')
    setShowTplPicker(false)
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone, text, startup_id: s.startup_id }),
      })
      if (!res.ok) throw new Error()
    } catch {}
    setSending(false)
    onRefresh()
  }

  function useTemplate(tpl) {
    setInput(resolveText(tpl, s))
    setShowTplPicker(false)
  }

  // Group messages by date
  let lastDate = ''
  const grouped = []
  const sorted = [...messages].sort((a,b) => new Date(a.sent_at) - new Date(b.sent_at))
  sorted.forEach(msg => {
    const date = formatDate(msg.sent_at)
    if (date !== lastDate) { grouped.push({ type:'date', date }); lastDate = date }
    grouped.push({ type:'msg', ...msg })
  })

  const wrapStyle = standalone
    ? { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', minHeight:0 }
    : { display:'flex', flexDirection:'column', height:'100%', margin:'-18px -20px', overflow:'hidden', minHeight:0, maxWidth:'100%' }

  return (
    <div style={wrapStyle}>
      {/* Chat messages */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'14px 16px', minHeight:0 }}>
        {grouped.length === 0 && (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="var(--txt-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', textAlign:'center' }}>Nenhuma mensagem com {firstName(s)} ainda.<br/>Use um template ou escreva direto.</div>
          </div>
        )}
        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`d-${i}`} style={{ textAlign:'center', padding:'8px 0 4px' }}>
                <span style={{ fontSize:10, color:'var(--txt-3)', background:'var(--bg-3)', padding:'3px 10px', borderRadius:10, fontFamily:'var(--font-body)', fontWeight:500 }}>{item.date}</span>
              </div>
            )
          }
          const isOut = item.direction === 'outgoing'
          return (
            <div key={item.id} style={{ display:'flex', justifyContent:isOut?'flex-end':'flex-start', marginBottom:4 }}>
              <div style={{ maxWidth:'75%', minWidth:0 }}>
                <div style={{
                  background:isOut?'var(--orange-dim)':'var(--bg-3)',
                  color:'var(--txt)',
                  padding:'9px 12px',
                  borderRadius:isOut?'12px 12px 4px 12px':'4px 12px 12px 12px',
                  fontSize:12, lineHeight:1.55, whiteSpace:'pre-wrap', overflowWrap:'anywhere',
                  fontFamily:'var(--font-body)', fontWeight:400,
                  border:isOut?'1px solid rgba(255,79,17,0.12)':'1px solid var(--border)',
                }}>
                  {!isOut && item.sender_name && (
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--orange)', marginBottom:3 }}>{item.sender_name}</div>
                  )}
                  {item.message_text}
                </div>
                <div style={{ fontSize:9, color:'var(--txt-3)', marginTop:2, fontFamily:'var(--font-mono)', textAlign:isOut?'right':'left', paddingLeft:isOut?0:4, paddingRight:isOut?4:0 }}>
                  {formatTime(item.sent_at)}
                  {isOut && item.status === 'failed' && <span style={{ color:'var(--red)', marginLeft:4 }}>Falhou</span>}
                </div>
              </div>
            </div>
          )
        })}
        {sending && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
            <div style={{ maxWidth:'75%' }}>
              <div style={{ background:'var(--orange-dim)', padding:'9px 12px', borderRadius:'12px 12px 4px 12px', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', animation:'pulse 1.5s infinite', border:'1px solid rgba(255,79,17,0.12)' }}>Enviando…</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Template picker */}
      {showTplPicker && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'8px 12px', maxHeight:180, overflowY:'auto', background:'var(--bg-2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', fontFamily:'var(--font-body)' }}>TEMPLATES</span>
            <button onClick={()=>setShowTplPicker(false)} style={{ fontSize:10, color:'var(--txt-3)', background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font-body)' }}>Fechar</button>
          </div>
          {[...FUP_TEMPLATES, ...templates.map(t=>({...t, id:`db-${t.id}`}))].map(tpl => (
            <button key={tpl.id} onClick={()=>useTemplate(tpl)} style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 10px', marginBottom:4, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--orange)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}
            >
              <div style={{ fontSize:11, fontWeight:600, color:'var(--txt)', marginBottom:2 }}>{tpl.name}</div>
              <div style={{ fontSize:10, color:'var(--txt-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{resolveText(tpl, s).slice(0,60)}…</div>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'10px 12px', display:'flex', gap:6, alignItems:'flex-end', background:'var(--bg-2)', flexShrink:0 }}>
        <button onClick={()=>setShowTplPicker(v=>!v)} title="Templates" style={{ width:34, height:34, borderRadius:8, border:'none', background:showTplPicker?'var(--orange-dim)':'var(--bg-3)', color:showTplPicker?'var(--orange)':'var(--txt-3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
        </button>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input)}}}
          placeholder={s.founder_telefone ? `Mensagem para ${firstName(s)}…` : 'Sem telefone cadastrado'}
          disabled={!s.founder_telefone}
          rows={1}
          style={{ flex:1, padding:'8px 12px', fontSize:12, border:'1px solid var(--border)', borderRadius:10, background:'var(--bg-3)', color:'var(--txt)', fontFamily:'var(--font-body)', fontWeight:400, outline:'none', resize:'none', maxHeight:80, lineHeight:1.5, transition:'border-color .15s' }}
          onFocus={e=>e.target.style.borderColor='var(--orange)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
          onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,80)+'px'}}
        />
        <button onClick={()=>sendMessage(input)} disabled={sending||!input.trim()||!s.founder_telefone} style={{ width:34, height:34, borderRadius:8, border:'none', background:input.trim()?'var(--orange)':'var(--bg-3)', color:input.trim()?'#fff':'var(--txt-3)', cursor:input.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', opacity:sending?0.5:1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L7 9M14 2l-4.5 12-2-5.5L2 6.5 14 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

export { resolveText, formatTime, formatDate }
