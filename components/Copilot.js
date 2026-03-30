import { useState, useRef, useEffect } from 'react'
import { calcHS, presencaDone } from '../lib/helpers'
import { SPRINTS, CURRENT_SPRINT, firstName } from '../lib/constants'

export default function Copilot({ startup, cs, getCS, allStartups }) {
  const [messages, setMessages] = useState([{ role:'assistant', text:'Olá, Tamara! Selecione uma startup e pergunte o que quiser — presença, risco de churn, próxima ação ou visão geral do programa.' }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  function buildSystem() {
    const criticos = allStartups.filter(s=>{ const {attended}=presencaDone(s); return attended===0 }).length
    const base = `Você é o Copilot de CS da 49 Educação, assistindo Tamara Moraes no START Primeiras Vendas 2026. 10 Sprints: Workshop terça 10h + Mentoria quinta 10h. 150 startups em GT1/GT2/GT3. Sprint atual: ${CURRENT_SPRINT.n} — ${CURRENT_SPRINT.tema}. Total: ${allStartups.length} startups · ${criticos} sem presença. Responda em português, conciso e acionável.`
    if (!startup) return base
    const { attended, total } = presencaDone(startup)
    const detail = SPRINTS.filter(x=>x.status!=='fut').map(sp=>`S${sp.n}:W${startup[`workshop${sp.n}`]?'✓':'✗'}M${startup[`mentoria${sp.n}`]?'✓':'✗'}A${startup[`sprint_${sp.n}`]?'✓':'✗'}`).join(' ')
    return `${base}\n\nStartup: ${startup.nome} | ${startup.founder_nome}\nGrupo: ${startup.nome_gt} | Mentor: ${startup.nome_mentor} | Região: ${startup.escritorio_regional}\nHealth: ${calcHS(startup,cs)}/100 | Status: ${cs?.status||'ativo'} | Presença: ${attended}/${total}\n${detail}\nAnotações: ${cs?.notes||'nenhuma'} | Último contato: ${cs?.lastContact||'não registrado'}`
  }

  const quickPrompts = startup
    ? [`Analisar presença de ${firstName(startup)}`, `${firstName(startup)} está em risco?`, `Próxima ação para ${firstName(startup)}`, `Comparar ${startup.nome_gt} com os outros`]
    : ['Menor presença geral', 'Visão dos grupos GT', 'Maiores riscos de churn']

  async function send(text) {
    if (!text.trim()||loading) return
    const userMsg = { role:'user', text }
    setMessages(p=>[...p,userMsg]); setInput(''); setLoading(true)
    try {
      const msgs = [...messages,userMsg].filter((m,i)=>i>0||m.role!=='assistant').map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.text}))
      const res = await fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemPrompt:buildSystem(),messages:msgs})})
      const data = await res.json()
      setMessages(p=>[...p,{role:'assistant',text:data.reply||data.error||'Erro.'}])
    } catch { setMessages(p=>[...p,{role:'assistant',text:'Erro de conexão.'}]) }
    setLoading(false)
  }

  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--orange)', animation:'pulse 2.5s infinite' }} />
        <span style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'var(--orange)', textTransform:'uppercase' }}>Copilot</span>
        {startup && <span style={{ marginLeft:'auto', fontSize:10, color:'var(--txt-3)', background:'var(--bg-4)', padding:'3px 8px', borderRadius:6, fontFamily:'var(--font-body)', fontWeight:400, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{startup.nome}</span>}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ alignSelf:m.role==='user'?'flex-end':'flex-start', maxWidth:'92%', background:m.role==='user'?'var(--orange-dim)':'var(--bg-3)', color:m.role==='user'?'var(--orange)':'var(--txt)', padding:'10px 14px', borderRadius:m.role==='user'?'12px 12px 4px 12px':'4px 12px 12px 12px', fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap', fontFamily:'var(--font-body)', fontWeight:m.role==='user'?500:400 }}>{m.text}</div>
        ))}
        {loading && <div style={{ alignSelf:'flex-start', background:'var(--bg-3)', padding:'10px 14px', borderRadius:'4px 12px 12px 12px', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', animation:'pulse 1.5s infinite' }}>Analisando…</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:5, borderTop:'1px solid var(--border)', flexShrink:0 }}>
        {quickPrompts.map(q=><button key={q} onClick={()=>send(q)} disabled={loading} style={{ fontSize:10, padding:'5px 10px', border:'none', borderRadius:6, cursor:'pointer', background:'var(--bg-3)', fontFamily:'var(--font-body)', fontWeight:400, color:'var(--txt-3)', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-4)';e.currentTarget.style.color='var(--orange)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-3)';e.currentTarget.style.color='var(--txt-3)'}}>{q}</button>)}
      </div>

      <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:6, flexShrink:0 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)} placeholder="Pergunte sobre a startup…" style={{ flex:1, padding:'9px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', color:'var(--txt)', fontFamily:'var(--font-body)', fontWeight:400, outline:'none', transition:'border-color .15s' }} onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
        <button onClick={()=>send(input)} disabled={loading} style={{ padding:'9px 18px', fontSize:11, fontWeight:600, background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, cursor:loading?'not-allowed':'pointer', fontFamily:'var(--font-body)', opacity:loading?.5:1 }}>Enviar</button>
      </div>
    </div>
  )
}
