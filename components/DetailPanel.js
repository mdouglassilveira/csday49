import { useState, useEffect, useRef } from 'react'
import { calcHS, ini } from '../lib/helpers'
import { SPRINTS, FUP_TEMPLATES, firstName } from '../lib/constants'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12 }
const sTitle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }

function hscDark(hs) { return hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)' }

function TabBar({ active, onChange }) {
  const tabs = ['Perfil','Presença','Follow-up','Mensagens']
  return (
    <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 20px', gap:0, flexShrink:0 }}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} style={{ padding:'11px 16px', fontSize:11, fontWeight:active===t?600:400, border:'none', background:'transparent', cursor:'pointer', color:active===t?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', borderBottom:active===t?'2px solid var(--orange)':'2px solid transparent', marginBottom:-1, transition:'all .15s' }}>{t}</button>
      ))}
    </div>
  )
}

function InfoBox({ label, value, link }) {
  return (
    <div style={{ background:'var(--bg-3)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)' }}>
      <div style={sTitle}>{label}</div>
      {link&&value
        ? <a href={value.startsWith('http')?value:'https://'+value} target="_blank" rel="noreferrer" style={{ fontSize:12, fontWeight:500, color:'var(--orange)', wordBreak:'break-all', fontFamily:'var(--font-body)' }}>{value}</a>
        : <div style={{ fontSize:12, fontWeight:500, color:'var(--txt)', wordBreak:'break-word', fontFamily:'var(--font-body)' }}>{value||'—'}</div>}
    </div>
  )
}

function TabPerfil({ s }) {
  return (
    <div>
      <div style={sTitle}>dados da startup</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        <InfoBox label="CNPJ"       value={s.cnpj} />
        <InfoBox label="SEGMENTO"   value={s.segmento} />
        <InfoBox label="ESCRITÓRIO" value={s.escritorio_regional} />
        <InfoBox label="GRUPO"      value={s.nome_gt} />
        <InfoBox label="MENTOR"     value={s.nome_mentor} />
        <InfoBox label="SITE"       value={s.site_url} link />
      </div>
      <div style={sTitle}>founder</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        <InfoBox label="NOME"     value={s.founder_nome} />
        <InfoBox label="EMAIL"    value={s.founder_email} />
        <InfoBox label="TELEFONE" value={s.founder_telefone} />
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {s.link_meet && <a href={s.link_meet.startsWith('http')?s.link_meet:'https://'+s.link_meet} target="_blank" rel="noreferrer" style={{ fontSize:11, padding:'8px 16px', background:'var(--blue-dim)', color:'var(--blue)', borderRadius:8, textDecoration:'none', fontWeight:600, fontFamily:'var(--font-body)' }}>Google Meet →</a>}
        {s.grupo_wpp && <a href={s.grupo_wpp} target="_blank" rel="noreferrer" style={{ fontSize:11, padding:'8px 16px', background:'var(--green-dim)', color:'var(--green)', borderRadius:8, textDecoration:'none', fontWeight:600, fontFamily:'var(--font-body)' }}>Grupo WhatsApp →</a>}
      </div>
    </div>
  )
}

function TabPresenca({ s }) {
  const done = SPRINTS.filter(x=>x.status!=='fut')
  const wkP  = done.filter(sp=>s[`workshop${sp.n}`]).length
  const mtP  = done.filter(sp=>s[`mentoria${sp.n}`]).length
  const atP  = done.filter(sp=>s[`sprint_${sp.n}`]).length

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
        {[
          { label:'WORKSHOPS',  val:`${wkP}/${done.length}`, color:'var(--orange)' },
          { label:'MENTORIAS',  val:`${mtP}/${done.length}`, color:'#FF8C4B'       },
          { label:'ATIVIDADES', val:`${atP}/${done.length}`, color:'var(--txt-2)'  },
        ].map(m=>(
          <div key={m.label} style={{ background:'var(--bg-3)', borderRadius:10, padding:'16px', textAlign:'center', border:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:26, fontWeight:800, color:m.color, marginBottom:4 }}>{m.val}</div>
            <div style={sTitle}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={sTitle}>detalhamento por sprint</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
        {SPRINTS.map(sp=>{
          const wkOk = s[`workshop${sp.n}`]
          const mtOk = s[`mentoria${sp.n}`]
          const atOk = s[`sprint_${sp.n}`]
          const isFut = sp.status==='fut'
          const isNow = sp.status==='now'
          const hasAny = wkOk||mtOk
          return (
            <div key={sp.n} style={{ borderRadius:8, padding:'8px 6px', textAlign:'center', border:`1px solid ${isNow?'var(--orange)':isFut?'var(--border)':hasAny?'var(--border-2)':'rgba(239,68,68,0.2)'}`, background:isFut?'transparent':hasAny?'var(--bg-3)':'var(--red-dim)', opacity:isFut?.35:1 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:isNow?'var(--orange)':'var(--txt-3)', marginBottom:5 }}>S{sp.n}</div>
              {!isFut && (
                <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:4 }}>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:wkOk?'var(--orange-dim)':'var(--bg-4)', color:wkOk?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700 }}>W</span>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:mtOk?'rgba(255,140,75,0.12)':'var(--bg-4)', color:mtOk?'#FF8C4B':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700 }}>M</span>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:atOk?'var(--bg-5)':'var(--bg-4)', color:atOk?'var(--txt-2)':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700 }}>A</span>
                </div>
              )}
              <div style={{ fontSize:8, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{sp.wk}</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:10, fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>W = Workshop · M = Mentoria · A = Atividade</div>
    </div>
  )
}

function TabFollowup({ s, cs, patchCS }) {
  const statuses = [
    { key:'ativo',   label:'Ativo',   col:'var(--green)', dim:'var(--green-dim)' },
    { key:'risco',   label:'Risco',   col:'var(--amber)', dim:'var(--amber-dim)' },
    { key:'churn',   label:'Churn',   col:'var(--red)',   dim:'var(--red-dim)'   },
    { key:'inativo', label:'Inativo', col:'var(--txt-3)', dim:'var(--bg-4)'      },
  ]
  return (
    <div>
      <div style={sTitle}>status</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {statuses.map(st=>(
          <button key={st.key} onClick={()=>patchCS(s.startup_id,{status:st.key})} style={{ padding:'8px 18px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', background:cs.status===st.key?st.dim:'var(--bg-3)', color:cs.status===st.key?st.col:'var(--txt-3)', transition:'all .15s' }}>{st.label}</button>
        ))}
      </div>
      <div style={sTitle}>anotações</div>
      <textarea defaultValue={cs.notes||''} onChange={e=>patchCS(s.startup_id,{notes:e.target.value})} placeholder="Observações do onboarding, última conversa, próximos passos…" style={{ width:'100%', minHeight:90, padding:'12px 14px', fontSize:12, fontFamily:'var(--font-body)', fontWeight:400, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', color:'var(--txt)', outline:'none', resize:'vertical', marginBottom:18, transition:'border-color .15s', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
      <div style={sTitle}>último contato</div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="date" defaultValue={cs.lastContact||new Date().toISOString().slice(0,10)} onChange={e=>patchCS(s.startup_id,{lastContact:e.target.value})} style={{ padding:'8px 12px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font-body)', color:'var(--txt)', background:'var(--bg-3)', outline:'none' }} />
        <button onClick={()=>patchCS(s.startup_id,{lastContact:new Date().toISOString().slice(0,10)})} style={{ padding:'8px 18px', fontSize:11, fontWeight:600, background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)' }}>Registrar hoje</button>
      </div>
    </div>
  )
}

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

function ChatView({ s, messages, onRefresh }) {
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
    const text = resolveText(tpl, s)
    setInput(text)
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

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', margin:'-18px -20px', overflow:'hidden', minHeight:0, maxWidth:'100%' }}>
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

function TemplatesView({ s }) {
  const [copied,setCopied] = useState(null)
  const [sending,setSending] = useState(null)
  const [sent,setSent] = useState(null)
  const [error,setError] = useState(null)
  const [customTemplates,setCustomTemplates] = useState([])
  const [showNewTpl,setShowNewTpl] = useState(false)
  const [newTpl,setNewTpl] = useState({ name:'', situation:'', text:'' })

  useEffect(() => {
    fetch('/api/templates').then(r=>r.json()).then(j=>setCustomTemplates(j.data||[])).catch(()=>{})
  }, [])

  function copy(tpl) {
    navigator.clipboard.writeText(resolveText(tpl, s)).then(()=>{ setCopied(tpl.id); setTimeout(()=>setCopied(null),2500) })
  }

  async function sendWhatsApp(tpl) {
    const phone = s.founder_telefone
    if (!phone) { setError(tpl.id); setTimeout(()=>setError(null),3000); return }
    setSending(tpl.id)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone, text: resolveText(tpl, s), startup_id: s.startup_id, template_id: String(tpl.id), template_name: tpl.name }),
      })
      if (!res.ok) throw new Error()
      setSent(tpl.id); setTimeout(()=>setSent(null),3000)
    } catch { setError(tpl.id); setTimeout(()=>setError(null),3000) }
    finally { setSending(null) }
  }

  async function saveTemplate() {
    if (!newTpl.name || !newTpl.text) return
    const res = await fetch('/api/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: newTpl.name, situation: newTpl.situation||'Personalizado', text_template: newTpl.text }) })
    if (res.ok) { const j=await res.json(); setCustomTemplates(p=>[j.data,...p]); setNewTpl({name:'',situation:'',text:''}); setShowNewTpl(false) }
  }

  async function deleteTemplate(id) {
    await fetch('/api/templates', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) })
    setCustomTemplates(p=>p.filter(t=>t.id!==id))
  }

  function renderTpl(tpl, isCustom) {
    const tplId = isCustom ? `custom-${tpl.id}` : tpl.id
    return (
      <div key={tplId} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--txt)', marginBottom:4, fontFamily:'var(--font-body)' }}>{tpl.name}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:4, background:isCustom?'var(--blue-dim)':'var(--orange-dim)', color:isCustom?'var(--blue)':'var(--orange)', fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>{(tpl.situation||'').toUpperCase()}</span>
              {isCustom && <button onClick={()=>deleteTemplate(tpl.id)} style={{ fontSize:9, padding:'2px 6px', border:'none', borderRadius:4, cursor:'pointer', background:'var(--red-dim)', color:'var(--red)', fontFamily:'var(--font-body)', fontWeight:600 }}>Remover</button>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={()=>copy(tpl)} style={{ fontSize:11, padding:'6px 14px', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, background:copied===tplId?'var(--green-dim)':'var(--bg-4)', color:copied===tplId?'var(--green)':'var(--txt-3)', transition:'all .2s' }}>{copied===tplId?'✓ Copiado':'Copiar'}</button>
            <button onClick={()=>sendWhatsApp({...tpl,id:tplId})} disabled={sending===tplId} style={{ fontSize:11, padding:'6px 14px', border:'none', borderRadius:8, cursor:sending===tplId?'wait':'pointer', fontFamily:'var(--font-body)', fontWeight:600, background:sent===tplId?'var(--green-dim)':error===tplId?'var(--red-dim)':'var(--green-dim)', color:sent===tplId?'var(--green)':error===tplId?'var(--red)':'var(--green)', transition:'all .2s', opacity:sending===tplId?0.6:1 }}>{sending===tplId?'Enviando…':sent===tplId?'✓ Enviado':error===tplId?(s.founder_telefone?'Erro':'Sem telefone'):'Enviar'}</button>
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--txt-2)', lineHeight:1.7, fontFamily:'var(--font-body)', fontWeight:400, whiteSpace:'pre-wrap', background:'var(--bg-4)', borderRadius:8, padding:'12px 14px' }}>{resolveText(tpl, s)}</div>
      </div>
    )
  }

  return (
    <div>
      {customTemplates.map(tpl => renderTpl(tpl, true))}
      <div style={{ marginTop:16 }}>
        {!showNewTpl ? (
          <button onClick={()=>setShowNewTpl(true)} style={{ fontSize:11, padding:'8px 16px', border:'1px dashed var(--border-3)', borderRadius:8, cursor:'pointer', background:'transparent', color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500, width:'100%', transition:'all .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--orange)';e.currentTarget.style.color='var(--orange)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-3)';e.currentTarget.style.color='var(--txt-3)'}}
          >+ Criar template</button>
        ) : (
          <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, padding:'16px' }}>
            <div style={{ ...sTitle, marginBottom:10 }}>NOVO TEMPLATE</div>
            <input value={newTpl.name} onChange={e=>setNewTpl(p=>({...p,name:e.target.value}))} placeholder="Nome do template" style={{ width:'100%', padding:'8px 12px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-4)', color:'var(--txt)', fontFamily:'var(--font-body)', outline:'none', marginBottom:8 }} />
            <input value={newTpl.situation} onChange={e=>setNewTpl(p=>({...p,situation:e.target.value}))} placeholder="Situação (ex: Follow-up, Lembrete)" style={{ width:'100%', padding:'8px 12px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-4)', color:'var(--txt)', fontFamily:'var(--font-body)', outline:'none', marginBottom:8 }} />
            <textarea value={newTpl.text} onChange={e=>setNewTpl(p=>({...p,text:e.target.value}))} placeholder="Use {nome}, {startup}, {gt}, {mentor}, {link_meet}…" style={{ width:'100%', minHeight:80, padding:'10px 12px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-4)', color:'var(--txt)', fontFamily:'var(--font-body)', outline:'none', resize:'vertical', lineHeight:1.6, marginBottom:10 }} />
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
              <button onClick={()=>{setShowNewTpl(false);setNewTpl({name:'',situation:'',text:''})}} style={{ fontSize:11, padding:'7px 14px', border:'none', borderRadius:8, cursor:'pointer', background:'var(--bg-4)', color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Cancelar</button>
              <button onClick={saveTemplate} style={{ fontSize:11, padding:'7px 14px', border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)', fontWeight:600 }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabMensagens({ s }) {
  const [subTab, setSubTab] = useState('chat')
  const [messages, setMessages] = useState([])

  function loadMessages() {
    fetch(`/api/messages?startup_id=${s.startup_id}&limit=100`)
      .then(r=>r.json()).then(j=>setMessages(j.data||[])).catch(()=>{})
  }

  useEffect(() => { loadMessages() }, [s.startup_id])

  // Poll for new messages every 10s when on chat tab
  useEffect(() => {
    if (subTab !== 'chat') return
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [s.startup_id, subTab])

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, margin:'-18px -20px', minHeight:0, overflow:'hidden' }}>
      {/* Sub-tab bar */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 16px', flexShrink:0 }}>
        {[{key:'chat',label:'Chat'},{key:'templates',label:'Templates'}].map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)} style={{ padding:'9px 14px', fontSize:11, fontWeight:subTab===t.key?600:400, border:'none', background:'transparent', cursor:'pointer', color:subTab===t.key?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', borderBottom:subTab===t.key?'2px solid var(--orange)':'2px solid transparent', marginBottom:-1, transition:'all .15s' }}>
            {t.label}
            {t.key==='chat' && messages.length > 0 && <span style={{ marginLeft:5, fontSize:9, background:'var(--bg-4)', padding:'1px 5px', borderRadius:8, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{messages.length}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:subTab==='chat'?'hidden':'auto', padding:subTab==='templates'?'16px 16px':'0', minHeight:0, display:'flex', flexDirection:'column' }}>
        {subTab === 'chat' && <ChatView s={s} messages={messages} onRefresh={loadMessages} />}
        {subTab === 'templates' && <TemplatesView s={s} />}
      </div>
    </div>
  )
}

export default function DetailPanel({ startup, cs, patchCS }) {
  const [tab, setTab] = useState('Perfil')
  if (!startup) {
    return (
      <div style={{ ...card, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, height:'100%' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="6" stroke="var(--border-3)" strokeWidth="1.5"/><path d="M13 20h14M13 14h9M13 26h7" stroke="var(--border-3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <p style={{ fontSize:12, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>Selecione uma startup para ver o perfil</p>
      </div>
    )
  }
  const hs = calcHS(startup, cs)
  const col = hscDark(hs)

  return (
    <div style={{ ...card, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%', minWidth:0 }}>
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:14, flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontWeight:700, fontSize:14, flexShrink:0, background:'var(--orange-dim)', color:'var(--orange)' }}>{ini(startup.nome)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:18, fontWeight:700, color:'var(--txt)', letterSpacing:'-0.2px', marginBottom:2 }}>{startup.nome}</div>
          <div style={{ fontSize:12, color:'var(--txt-3)', marginTop:2, fontFamily:'var(--font-body)', fontWeight:400 }}>{startup.founder_nome} · {startup.escritorio_regional}</div>
          <div style={{ fontSize:11, color:'var(--txt-3)', marginTop:2, fontFamily:'var(--font-body)', fontWeight:300 }}>{startup.founder_email}{startup.founder_telefone?` · ${startup.founder_telefone}`:''}</div>
          <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
            {startup.nome_gt && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--blue-dim)', color:'var(--blue)', fontWeight:600, fontFamily:'var(--font-body)' }}>{startup.nome_gt}</span>}
            {startup.segmento && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--bg-4)', color:'var(--txt-3)', fontWeight:500, fontFamily:'var(--font-body)' }}>{startup.segmento}</span>}
            {cs.status!=='ativo' && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--amber-dim)':'var(--bg-4)', color:cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--txt-3)', fontWeight:600, fontFamily:'var(--font-body)', textTransform:'capitalize' }}>{cs.status}</span>}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:36, fontWeight:800, lineHeight:1, color:col, letterSpacing:'-1px' }}>{hs}</div>
          <div style={{ fontSize:9, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:4, fontFamily:'var(--font-body)', fontWeight:600 }}>HEALTH SCORE</div>
        </div>
      </div>
      <TabBar active={tab} onChange={setTab} />
      <div style={{ flex:1, overflowY:tab==='Mensagens'?'hidden':'auto', padding:'18px 20px', display:'flex', flexDirection:'column', minHeight:0 }}>
        {tab==='Perfil'    && <TabPerfil    s={startup} />}
        {tab==='Presença'  && <TabPresenca  s={startup} />}
        {tab==='Follow-up' && <TabFollowup  s={startup} cs={cs} patchCS={patchCS} />}
        {tab==='Mensagens' && <TabMensagens s={startup} />}
      </div>
    </div>
  )
}
