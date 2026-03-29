import { useState } from 'react'
import { calcHS, ini } from '../lib/helpers'
import { SPRINTS, FUP_TEMPLATES, firstName } from '../lib/constants'

const card = { background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
const sTitle = { fontSize: 9, fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12, fontFamily: 'var(--font-m)' }

function hscDark(hs) { return hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)' }

function TabBar({ active, onChange }) {
  const tabs = ['Perfil', 'Presença', 'Follow-up', 'Mensagens']
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 18px', gap: 2, flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', color: active===t?'var(--orange)':'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.06em', borderBottom: active===t?'2px solid var(--orange)':'2px solid transparent', marginBottom: -1, transition: 'all .15s', textTransform: 'uppercase', fontSize: 9 }}>{t}</button>
      ))}
    </div>
  )
}

function InfoBox({ label, value, link }) {
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 8, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4, fontFamily: 'var(--font-m)', fontWeight: 700 }}>{label}</div>
      {link && value ? <a href={value.startsWith('http')?value:'https://'+value} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 500, color: 'var(--orange)', wordBreak: 'break-all' }}>{value}</a>
        : <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)', wordBreak: 'break-word' }}>{value || '—'}</div>}
    </div>
  )
}

function TabPerfil({ s }) {
  return (
    <div>
      <div style={sTitle}>dados da startup</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <InfoBox label="CNPJ"      value={s.cnpj} />
        <InfoBox label="Segmento"  value={s.segmento} />
        <InfoBox label="Escritório" value={s.escritorio_regional} />
        <InfoBox label="Grupo"     value={s.nome_gt} />
        <InfoBox label="Mentor"    value={s.nome_mentor} />
        <InfoBox label="Site"      value={s.site_url} link />
      </div>
      <div style={sTitle}>founder</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <InfoBox label="Nome"     value={s.founder_nome} />
        <InfoBox label="Email"    value={s.founder_email} />
        <InfoBox label="Telefone" value={s.founder_telefone} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {s.link_meet && <a href={s.link_meet.startsWith('http')?s.link_meet:'https://'+s.link_meet} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '6px 14px', background: 'var(--blue-dim)', color: 'var(--blue)', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontFamily: 'var(--font-m)', letterSpacing: '.06em', border: '1px solid var(--blue)44' }}>MEET →</a>}
        {s.grupo_wpp && <a href={s.grupo_wpp} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '6px 14px', background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontFamily: 'var(--font-m)', letterSpacing: '.06em', border: '1px solid var(--green)44' }}>WHATSAPP →</a>}
      </div>
    </div>
  )
}

function TabPresenca({ s }) {
  const done = SPRINTS.filter(x => x.status !== 'fut')
  const wkP  = done.filter(sp => s[`workshop${sp.n}`]).length
  const mtP  = done.filter(sp => s[`mentoria${sp.n}`]).length
  const atP  = done.filter(sp => s[`sprint_${sp.n}`]).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'WORKSHOPS', val: `${wkP}/${done.length}`, color: 'var(--orange)'  },
          { label: 'MENTORIAS', val: `${mtP}/${done.length}`, color: 'var(--magenta)' },
          { label: 'ATIVIDADES',val: `${atP}/${done.length}`, color: 'var(--txt-2)'   },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 24, fontWeight: 700, color: m.color, letterSpacing: '-.02em', textShadow: m.color !== 'var(--txt-2)' ? `0 0 10px ${m.color}` : 'none' }}>{m.val}</div>
            <div style={{ fontSize: 8, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 5, fontFamily: 'var(--font-m)', fontWeight: 700 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={sTitle}>detalhamento por sprint</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {SPRINTS.map(sp => {
          const wkOk = s[`workshop${sp.n}`]
          const mtOk = s[`mentoria${sp.n}`]
          const atOk = s[`sprint_${sp.n}`]
          const isFut = sp.status === 'fut'
          const isNow = sp.status === 'now'
          const hasAny = wkOk || mtOk
          const bg = isFut ? 'var(--bg-3)' : hasAny ? 'var(--bg-4)' : 'var(--red-dim)'
          const bdr = isNow ? 'var(--orange)' : isFut ? 'var(--border)' : hasAny ? 'var(--border-2)' : 'var(--red)44'
          return (
            <div key={sp.n} style={{ borderRadius: 6, padding: '8px 6px', textAlign: 'center', border: `1px solid ${bdr}`, background: bg, opacity: isFut ? .4 : 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isNow?'var(--orange)':'var(--txt-3)', marginBottom: 5, fontFamily: 'var(--font-m)' }}>S{sp.n}</div>
              {!isFut && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
                  <span title="Workshop"  style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: wkOk?'var(--orange-dim)':'var(--bg-5)', color: wkOk?'var(--orange)':'var(--txt-3)', fontFamily: 'var(--font-m)', fontWeight: 700 }}>W</span>
                  <span title="Mentoria"  style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: mtOk?'var(--magenta-dim)':'var(--bg-5)', color: mtOk?'var(--magenta)':'var(--txt-3)', fontFamily: 'var(--font-m)', fontWeight: 700 }}>M</span>
                  <span title="Atividade" style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: atOk?'var(--bg-5)':'var(--bg-5)', color: atOk?'var(--txt-2)':'var(--txt-3)', fontFamily: 'var(--font-m)', fontWeight: 700, border: atOk?'1px solid var(--border-3)':'none' }}>A</span>
                </div>
              )}
              <div style={{ fontSize: 8, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>{sp.wk}</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>W = Workshop · M = Mentoria · A = Atividade</div>
    </div>
  )
}

function TabFollowup({ s, cs, patchCS }) {
  const statuses = [
    { key:'ativo',   label:'ATIVO',   col:'var(--green)',   dim:'var(--green-dim)'   },
    { key:'risco',   label:'RISCO',   col:'var(--amber)',   dim:'var(--amber-dim)'   },
    { key:'churn',   label:'CHURN',   col:'var(--red)',     dim:'var(--red-dim)'     },
    { key:'inativo', label:'INATIVO', col:'var(--txt-3)',   dim:'var(--bg-4)'        },
  ]
  return (
    <div>
      <div style={sTitle}>status</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {statuses.map(st => (
          <button key={st.key} onClick={() => patchCS(s.startup_id, { status: st.key })} style={{ padding: '7px 16px', fontSize: 9, fontWeight: 700, border: `1px solid ${cs.status===st.key?st.col:'var(--border-2)'}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-m)', letterSpacing: '.1em', background: cs.status===st.key?st.dim:'transparent', color: cs.status===st.key?st.col:'var(--txt-3)', transition: 'all .15s', boxShadow: cs.status===st.key?`0 0 10px ${st.col}44`:'none' }}>{st.label}</button>
        ))}
      </div>
      <div style={sTitle}>anotações</div>
      <textarea defaultValue={cs.notes||''} onChange={e => patchCS(s.startup_id, {notes:e.target.value})} placeholder="observações do onboarding, última conversa, próximos passos…" style={{ width:'100%', minHeight:90, padding:'10px 12px', fontSize:12, fontFamily:'var(--font-m)', border:'1px solid var(--border-2)', borderRadius:6, background:'var(--bg-3)', color:'var(--txt)', outline:'none', resize:'vertical', marginBottom:16, transition:'border-color .15s' }} onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='var(--border-2)'} />
      <div style={sTitle}>último contato</div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="date" defaultValue={cs.lastContact||new Date().toISOString().slice(0,10)} onChange={e=>patchCS(s.startup_id,{lastContact:e.target.value})} style={{ padding:'7px 10px', fontSize:11, border:'1px solid var(--border-2)', borderRadius:6, fontFamily:'var(--font-m)', color:'var(--txt)', background:'var(--bg-3)', outline:'none' }} />
        <button onClick={()=>patchCS(s.startup_id,{lastContact:new Date().toISOString().slice(0,10)})} style={{ padding:'7px 16px', fontSize:9, fontWeight:700, background:'var(--orange)', color:'var(--bg)', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-m)', letterSpacing:'.08em', boxShadow:'0 0 10px var(--orange-glow)' }}>REGISTRAR HOJE</button>
      </div>
    </div>
  )
}

function TabMensagens({ s }) {
  const [copied, setCopied] = useState(null)
  function copy(tpl) {
    navigator.clipboard.writeText(tpl.text(s)).then(() => {
      setCopied(tpl.id); setTimeout(() => setCopied(null), 2500)
    })
  }
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--txt-3)', marginBottom: 14, fontFamily: 'var(--font-m)' }}>clique em copiar · cole direto no whatsapp · já personalizado para {firstName(s)}</div>
      {FUP_TEMPLATES.map(tpl => (
        <div key={tpl.id} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>{tpl.name}</div>
              <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'var(--magenta-dim)', color: 'var(--magenta)', fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>{tpl.situation.toUpperCase()}</span>
            </div>
            <button onClick={() => copy(tpl)} style={{ fontSize: 9, padding: '5px 12px', border: `1px solid ${copied===tpl.id?'var(--green)':'var(--border-2)'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-m)', fontWeight: 700, letterSpacing: '.08em', background: copied===tpl.id?'var(--green-dim)':'transparent', color: copied===tpl.id?'var(--green)':'var(--txt-3)', transition: 'all .2s', flexShrink: 0 }}>
              {copied===tpl.id ? '✓ COPIADO' : 'COPIAR'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.7, fontFamily: 'var(--font-m)', whiteSpace: 'pre-wrap', background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>{tpl.text(s)}</div>
        </div>
      ))}
    </div>
  )
}

export default function DetailPanel({ startup, cs, patchCS }) {
  const [tab, setTab] = useState('Perfil')

  if (!startup) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, height: '100%' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="4" stroke="var(--border-2)" strokeWidth="1.5"/><path d="M13 20h14M13 14h9M13 26h7" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <p style={{ fontSize: 11, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>SELECIONE UMA STARTUP</p>
      </div>
    )
  }

  const hs = calcHS(startup, cs)
  const col = hscDark(hs)

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontWeight: 700, fontSize: 14, flexShrink: 0, background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange-glow)' }}>{ini(startup.nome)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--txt)' }}>{startup.nome}</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>{startup.founder_nome} · {startup.escritorio_regional}</div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2, fontFamily: 'var(--font-m)' }}>{startup.founder_email}{startup.founder_telefone ? ` · ${startup.founder_telefone}` : ''}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
            {startup.nome_gt && <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: 'var(--blue-dim)', color: 'var(--blue)', fontWeight: 700, fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>{startup.nome_gt}</span>}
            {startup.segmento && <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: 'var(--bg-4)', color: 'var(--txt-3)', fontWeight: 700, fontFamily: 'var(--font-m)', letterSpacing: '.06em', border: '1px solid var(--border)' }}>{startup.segmento}</span>}
            {cs.status !== 'ativo' && <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--magenta-dim)':'var(--bg-4)', color: cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--magenta)':'var(--txt-3)', fontWeight: 700, fontFamily: 'var(--font-m)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{cs.status}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 36, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1, color: col, textShadow: `0 0 14px ${col}` }}>{hs}</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.12em', marginTop: 3, fontFamily: 'var(--font-m)' }}>HEALTH SCORE</div>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {tab === 'Perfil'    && <TabPerfil    s={startup} />}
        {tab === 'Presença'  && <TabPresenca  s={startup} />}
        {tab === 'Follow-up' && <TabFollowup  s={startup} cs={cs} patchCS={patchCS} />}
        {tab === 'Mensagens' && <TabMensagens s={startup} />}
      </div>
    </div>
  )
}
