import { useState } from 'react'
import { calcHS, ini } from '../lib/helpers'
import { SPRINTS, FUP_TEMPLATES, firstName } from '../lib/constants'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10 }
const sTitle = { fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:12 }

function hscDark(hs) { return hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)' }

function TabBar({ active, onChange }) {
  const tabs = ['Perfil','Presença','Follow-up','Mensagens']
  return (
    <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 20px', gap:0, flexShrink:0 }}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} style={{ padding:'10px 14px', fontSize:11, fontWeight:active===t?700:500, border:'none', background:'transparent', cursor:'pointer', color:active===t?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', borderBottom:active===t?'2px solid var(--orange)':'2px solid transparent', marginBottom:-1, transition:'all .15s' }}>{t}</button>
      ))}
    </div>
  )
}

function InfoBox({ label, value, link }) {
  return (
    <div style={{ background:'var(--bg-3)', borderRadius:6, padding:'10px 12px', border:'1px solid var(--border)' }}>
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
        {s.link_meet && <a href={s.link_meet.startsWith('http')?s.link_meet:'https://'+s.link_meet} target="_blank" rel="noreferrer" style={{ fontSize:11, padding:'7px 16px', background:'var(--blue-dim)', color:'var(--blue)', borderRadius:6, textDecoration:'none', fontWeight:600, fontFamily:'var(--font-body)', border:'1px solid var(--blue-dim)' }}>Google Meet →</a>}
        {s.grupo_wpp && <a href={s.grupo_wpp} target="_blank" rel="noreferrer" style={{ fontSize:11, padding:'7px 16px', background:'var(--green-dim)', color:'var(--green)', borderRadius:6, textDecoration:'none', fontWeight:600, fontFamily:'var(--font-body)', border:'1px solid var(--green-dim)' }}>Grupo WhatsApp →</a>}
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
          <div key={m.label} style={{ background:'var(--bg-3)', borderRadius:8, padding:'14px', textAlign:'center', border:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font-title)', fontSize:28, color:m.color, marginBottom:4 }}>{m.val}</div>
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
            <div key={sp.n} style={{ borderRadius:6, padding:'8px 6px', textAlign:'center', border:`1px solid ${isNow?'var(--orange)':isFut?'var(--border)':hasAny?'var(--border-2)':'rgba(239,68,68,0.3)'}`, background:isFut?'transparent':hasAny?'var(--bg-3)':'var(--red-dim)', opacity:isFut?.4:1 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:isNow?'var(--orange)':'var(--txt-3)', marginBottom:5 }}>S{sp.n}</div>
              {!isFut && (
                <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:4 }}>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2, background:wkOk?'var(--orange-dim)':'var(--bg-4)', color:wkOk?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700 }}>W</span>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2, background:mtOk?'rgba(255,140,75,0.15)':'var(--bg-4)', color:mtOk?'#FF8C4B':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700 }}>M</span>
                  <span style={{ fontSize:8, padding:'1px 4px', borderRadius:2, background:atOk?'var(--bg-5)':'var(--bg-4)', color:atOk?'var(--txt-2)':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:700, border:atOk?'1px solid var(--border-3)':'none' }}>A</span>
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
          <button key={st.key} onClick={()=>patchCS(s.startup_id,{status:st.key})} style={{ padding:'7px 18px', fontSize:11, fontWeight:600, border:`1px solid ${cs.status===st.key?st.col:'var(--border-2)'}`, borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)', background:cs.status===st.key?st.dim:'transparent', color:cs.status===st.key?st.col:'var(--txt-3)', transition:'all .15s' }}>{st.label}</button>
        ))}
      </div>
      <div style={sTitle}>anotações</div>
      <textarea defaultValue={cs.notes||''} onChange={e=>patchCS(s.startup_id,{notes:e.target.value})} placeholder="Observações do onboarding, última conversa, próximos passos…" style={{ width:'100%', minHeight:90, padding:'10px 12px', fontSize:12, fontFamily:'var(--font-body)', fontWeight:400, border:'1px solid var(--border-2)', borderRadius:6, background:'var(--bg-3)', color:'var(--txt)', outline:'none', resize:'vertical', marginBottom:18, transition:'border-color .15s', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='var(--border-2)'} />
      <div style={sTitle}>último contato</div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="date" defaultValue={cs.lastContact||new Date().toISOString().slice(0,10)} onChange={e=>patchCS(s.startup_id,{lastContact:e.target.value})} style={{ padding:'7px 10px', fontSize:12, border:'1px solid var(--border-2)', borderRadius:6, fontFamily:'var(--font-body)', color:'var(--txt)', background:'var(--bg-3)', outline:'none' }} />
        <button onClick={()=>patchCS(s.startup_id,{lastContact:new Date().toISOString().slice(0,10)})} style={{ padding:'8px 18px', fontSize:11, fontWeight:600, background:'var(--orange)', color:'var(--bg)', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)', boxShadow:'0 0 10px var(--orange-glow)' }}>Registrar hoje</button>
      </div>
    </div>
  )
}

function TabMensagens({ s }) {
  const [copied,setCopied] = useState(null)
  function copy(tpl) {
    navigator.clipboard.writeText(tpl.text(s)).then(()=>{ setCopied(tpl.id); setTimeout(()=>setCopied(null),2500) })
  }
  return (
    <div>
      <div style={{ fontSize:11, color:'var(--txt-3)', marginBottom:16, fontFamily:'var(--font-body)', fontWeight:400, lineHeight:1.5 }}>Clique em copiar e cole direto no WhatsApp. Texto personalizado para {firstName(s)}.</div>
      {FUP_TEMPLATES.map(tpl=>(
        <div key={tpl.id} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--txt)', marginBottom:4, fontFamily:'var(--font-body)' }}>{tpl.name}</div>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:'var(--orange-dim)', color:'var(--orange)', fontFamily:'var(--font-body)', letterSpacing:'.06em' }}>{tpl.situation.toUpperCase()}</span>
            </div>
            <button onClick={()=>copy(tpl)} style={{ fontSize:11, padding:'6px 14px', border:`1px solid ${copied===tpl.id?'var(--green)':'var(--border-2)'}`, borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, background:copied===tpl.id?'var(--green-dim)':'transparent', color:copied===tpl.id?'var(--green)':'var(--txt-3)', transition:'all .2s', flexShrink:0 }}>
              {copied===tpl.id?'✓ Copiado':'Copiar'}
            </button>
          </div>
          <div style={{ fontSize:11, color:'var(--txt-2)', lineHeight:1.7, fontFamily:'var(--font-body)', fontWeight:300, whiteSpace:'pre-wrap', background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:4, padding:'10px 12px' }}>{tpl.text(s)}</div>
        </div>
      ))}
    </div>
  )
}

export default function DetailPanel({ startup, cs, patchCS }) {
  const [tab, setTab] = useState('Perfil')
  if (!startup) {
    return (
      <div style={{ ...card, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, height:'100%' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="4" stroke="var(--border-3)" strokeWidth="1.5"/><path d="M13 20h14M13 14h9M13 26h7" stroke="var(--border-3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <p style={{ fontSize:12, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>Selecione uma startup para ver o perfil</p>
      </div>
    )
  }
  const hs = calcHS(startup, cs)
  const col = hscDark(hs)

  return (
    <div style={{ ...card, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%' }}>
      <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:14, flexShrink:0 }}>
        <div style={{ width:46, height:46, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontWeight:700, fontSize:14, flexShrink:0, background:'var(--orange-dim)', color:'var(--orange)', border:'1px solid rgba(255,79,17,0.3)' }}>{ini(startup.nome)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:20, color:'var(--txt)', letterSpacing:'.02em', marginBottom:2 }}>{startup.nome}</div>
          <div style={{ fontSize:12, color:'var(--txt-3)', marginTop:2, fontFamily:'var(--font-body)', fontWeight:400 }}>{startup.founder_nome} · {startup.escritorio_regional}</div>
          <div style={{ fontSize:11, color:'var(--txt-3)', marginTop:2, fontFamily:'var(--font-body)', fontWeight:300 }}>{startup.founder_email}{startup.founder_telefone?` · ${startup.founder_telefone}`:''}</div>
          <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
            {startup.nome_gt && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:'var(--blue-dim)', color:'var(--blue)', fontWeight:600, fontFamily:'var(--font-body)' }}>{startup.nome_gt}</span>}
            {startup.segmento && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:'var(--bg-4)', color:'var(--txt-3)', fontWeight:500, fontFamily:'var(--font-body)', border:'1px solid var(--border-2)' }}>{startup.segmento}</span>}
            {cs.status!=='ativo' && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--amber-dim)':'var(--bg-4)', color:cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--txt-3)', fontWeight:600, fontFamily:'var(--font-body)', textTransform:'capitalize' }}>{cs.status}</span>}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:40, lineHeight:1, color:col }}>{hs}</div>
          <div style={{ fontSize:9, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:3, fontFamily:'var(--font-body)', fontWeight:700 }}>HEALTH SCORE</div>
        </div>
      </div>
      <TabBar active={tab} onChange={setTab} />
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
        {tab==='Perfil'    && <TabPerfil    s={startup} />}
        {tab==='Presença'  && <TabPresenca  s={startup} />}
        {tab==='Follow-up' && <TabFollowup  s={startup} cs={cs} patchCS={patchCS} />}
        {tab==='Mensagens' && <TabMensagens s={startup} />}
      </div>
    </div>
  )
}
