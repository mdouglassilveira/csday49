import { useState } from 'react'
import { calcHS, hsc, hsbg, ini } from '../lib/helpers'
import { SPRINTS, FUP_TEMPLATES, firstName } from '../lib/constants'

const sTitle = { fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }

function TabBar({ active, onChange }) {
  const tabs = ['Perfil', 'Presença', 'Follow-up', 'Mensagens']
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-6)', padding: '0 20px', gap: 2, flexShrink: 0 }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{ padding: '9px 12px', fontSize: 12, fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', color: active === t ? 'var(--orange)' : 'var(--gray-4)', fontFamily: 'var(--font-b)', borderBottom: active === t ? '2px solid var(--orange)' : '2px solid transparent', marginBottom: -1, transition: 'all .15s' }}>{t}</button>
      ))}
    </div>
  )
}

function TabPerfil({ s }) {
  const fields = [
    { lbl: 'CNPJ',              val: s.cnpj },
    { lbl: 'Segmento',          val: s.segmento },
    { lbl: 'Escritório',        val: s.escritorio_regional },
    { lbl: 'Grupo de trabalho', val: s.nome_gt },
    { lbl: 'Mentor',            val: s.nome_mentor },
    { lbl: 'Site',              val: s.site_url },
  ]
  return (
    <div>
      <div style={sTitle}>Dados da startup</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {fields.map((f) => (
          <div key={f.lbl} style={{ background: 'var(--gray-7)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{f.lbl}</div>
            <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-word' }}>
              {f.lbl === 'Site' && f.val
                ? <a href={f.val.startsWith('http') ? f.val : 'https://'+f.val} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)' }}>{f.val}</a>
                : f.val || '—'}
            </div>
          </div>
        ))}
      </div>
      <div style={sTitle}>Contato do founder</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { lbl: 'Nome', val: s.founder_nome },
          { lbl: 'Email', val: s.founder_email },
          { lbl: 'Telefone', val: s.founder_telefone },
        ].map((f) => (
          <div key={f.lbl} style={{ background: 'var(--gray-7)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{f.lbl}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{f.val || '—'}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {s.link_meet && <a href={s.link_meet.startsWith('http') ? s.link_meet : 'https://'+s.link_meet} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: '6px 14px', background: 'var(--blue-soft)', color: 'var(--blue)', borderRadius: 20, textDecoration: 'none', fontWeight: 500 }}>📹 Abrir Meet</a>}
        {s.grupo_wpp && <a href={s.grupo_wpp} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: '6px 14px', background: 'var(--green-soft)', color: 'var(--green)', borderRadius: 20, textDecoration: 'none', fontWeight: 500 }}>💬 Grupo WhatsApp</a>}
      </div>
    </div>
  )
}

function TabPresenca({ s }) {
  const done = SPRINTS.filter((x) => x.status !== 'fut')
  const spPresent  = done.filter((sp) => s[`sprint_${sp.n}`] === true).length
  const wkPresent  = done.filter((sp) => s[`workshop${sp.n}`] === true).length
  const mtPresent  = done.filter((sp) => s[`mentoria${sp.n}`] === true).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { lbl: 'Sprints', val: `${spPresent}/${done.length}`, color: spPresent/done.length >= .7 ? 'var(--green)' : spPresent/done.length >= .4 ? 'var(--amber)' : 'var(--red)' },
          { lbl: 'Workshops', val: `${wkPresent}/${done.length}`, color: 'var(--blue)' },
          { lbl: 'Mentorias', val: `${mtPresent}/${done.length}`, color: 'var(--purple, #7C3AED)' },
        ].map((m) => (
          <div key={m.lbl} style={{ background: 'var(--gray-7)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, fontWeight: 700, color: m.color, letterSpacing: '-.03em' }}>{m.val}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{m.lbl}</div>
          </div>
        ))}
      </div>

      <div style={sTitle}>Detalhamento por sprint</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {SPRINTS.map((sp) => {
          const spOk = s[`sprint_${sp.n}`] === true
          const wkOk = s[`workshop${sp.n}`] === true
          const mtOk = s[`mentoria${sp.n}`] === true
          const isFut = sp.status === 'fut'
          const isNow = sp.status === 'now'
          const border = isNow ? '2px solid var(--orange)' : '1px solid var(--gray-6)'
          const bg = isFut ? 'var(--gray-7)' : spOk ? 'var(--green-soft)' : 'var(--red-soft)'
          return (
            <div key={sp.n} style={{ borderRadius: 8, padding: '10px 6px', textAlign: 'center', border, background: bg, opacity: isFut ? .5 : 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isNow ? 'var(--orange)' : 'var(--gray-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>S{sp.n}</div>
              <div title="Sprint" style={{ fontSize: 13, marginBottom: 2 }}>{isFut ? '—' : spOk ? '✓' : '✗'}</div>
              <div style={{ fontSize: 8, color: 'var(--gray-4)', fontFamily: 'var(--font-m)' }}>{sp.wk}</div>
              {!isFut && (
                <div style={{ marginTop: 5, display: 'flex', justifyContent: 'center', gap: 3 }}>
                  <span title="Workshop" style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: wkOk ? 'var(--blue-soft)' : 'var(--gray-6)', color: wkOk ? 'var(--blue)' : 'var(--gray-4)' }}>W</span>
                  <span title="Mentoria" style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: mtOk ? '#EDE9FE' : 'var(--gray-6)', color: mtOk ? '#7C3AED' : 'var(--gray-4)' }}>M</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--gray-4)' }}>
        W = Workshop (terça 10h) · M = Mentoria coletiva (quinta 10h)
      </div>
    </div>
  )
}

function TabFollowup({ s, cs, patchCS }) {
  const statuses = [
    { key: 'ativo',   label: '✓ Ativo',   bg: 'var(--green-soft)',  bdr: '#86EFAC',  col: 'var(--green)'  },
    { key: 'risco',   label: '⚠ Risco',   bg: 'var(--amber-soft)',  bdr: '#FDE68A',  col: 'var(--amber)'  },
    { key: 'churn',   label: '✕ Churn',   bg: 'var(--red-soft)',    bdr: '#FCA5A5',  col: 'var(--red)'    },
    { key: 'inativo', label: '○ Inativo', bg: 'var(--gray-6)',      bdr: 'var(--gray-5)', col: 'var(--gray-3)' },
  ]
  return (
    <div>
      <div style={sTitle}>Status</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {statuses.map((st) => (
          <button key={st.key} onClick={() => patchCS(s.startup_id, { status: st.key })} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 500, border: `1px solid ${cs.status === st.key ? st.bdr : 'var(--gray-5)'}`, borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-b)', background: cs.status === st.key ? st.bg : 'var(--white)', color: cs.status === st.key ? st.col : 'var(--gray-3)', transition: 'all .15s' }}>{st.label}</button>
        ))}
      </div>
      <div style={sTitle}>Anotações</div>
      <textarea
        defaultValue={cs.notes || ''}
        onChange={(e) => patchCS(s.startup_id, { notes: e.target.value })}
        placeholder="Observações do onboarding, última conversa, próximos passos…"
        style={{ width: '100%', minHeight: 90, padding: '10px 12px', fontSize: 12, fontFamily: 'var(--font-b)', border: '1px solid var(--gray-6)', borderRadius: 6, background: 'var(--gray-7)', color: 'var(--black)', outline: 'none', resize: 'vertical', marginBottom: 16 }}
      />
      <div style={sTitle}>Último contato</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="date" defaultValue={cs.lastContact || new Date().toISOString().slice(0,10)} onChange={(e) => patchCS(s.startup_id, { lastContact: e.target.value })} style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--gray-6)', borderRadius: 6, fontFamily: 'var(--font-b)', color: 'var(--black)', background: 'var(--gray-7)', outline: 'none' }} />
        <button onClick={() => patchCS(s.startup_id, { lastContact: new Date().toISOString().slice(0,10) })} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 500, background: 'var(--orange)', color: 'var(--white)', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-b)' }}>Registrar hoje</button>
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
      <div style={{ fontSize: 11, color: 'var(--gray-4)', marginBottom: 14 }}>Clique em "Copiar" e cole no WhatsApp. Já personalizado para {firstName(s)}.</div>
      {FUP_TEMPLATES.map((tpl) => (
        <div key={tpl.id} style={{ background: 'var(--gray-7)', border: '1px solid var(--gray-6)', borderRadius: 6, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{tpl.name}</div>
              <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: tpl.color+'22', color: tpl.color }}>{tpl.situation}</span>
            </div>
            <button onClick={() => copy(tpl)} style={{ fontSize: 10, padding: '4px 10px', border: `1px solid ${copied===tpl.id?'#86EFAC':'var(--gray-5)'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', background: copied===tpl.id?'var(--green-soft)':'var(--white)', color: copied===tpl.id?'var(--green)':'var(--gray-3)', transition: 'all .2s', flexShrink: 0 }}>
              {copied===tpl.id ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-2)', lineHeight: 1.6, fontFamily: 'var(--font-m)', whiteSpace: 'pre-wrap', background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 4, padding: '8px 10px' }}>{tpl.text(s)}</div>
        </div>
      ))}
    </div>
  )
}

export default function DetailPanel({ startup, cs, patchCS }) {
  const [tab, setTab] = useState('Perfil')
  if (!startup) {
    return (
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--gray-4)', height: '100%' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="8" stroke="#D4D4D4" strokeWidth="2"/><path d="M13 20h14M13 14h9M13 26h7" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round"/></svg>
        <p style={{ fontSize: 13 }}>Selecione uma startup para ver o perfil</p>
      </div>
    )
  }
  const hs = calcHS(startup, cs)
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--gray-6)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15, flexShrink: 0, background: 'var(--orange-soft)', color: 'var(--orange)' }}>{ini(startup.nome)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 17, fontWeight: 600, letterSpacing: '-.02em' }}>{startup.nome}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-4)', marginTop: 2 }}>{startup.founder_nome}{startup.escritorio_regional ? ` · ${startup.escritorio_regional}` : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-3)', marginTop: 3, fontFamily: 'var(--font-m)' }}>{startup.founder_email}{startup.founder_telefone ? ` · ${startup.founder_telefone}` : ''}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {startup.nome_gt && <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: 'var(--blue-soft)', color: 'var(--blue)' }}>{startup.nome_gt}</span>}
            {startup.segmento && <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: 'var(--gray-6)', color: 'var(--gray-3)' }}>{startup.segmento}</span>}
            {cs.status !== 'ativo' && <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: cs.status==='churn'?'var(--red-soft)':cs.status==='risco'?'var(--amber-soft)':'var(--gray-6)', color: cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--gray-3)' }}>{cs.status.charAt(0).toUpperCase()+cs.status.slice(1)}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 34, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: hsc(hs) }}>{hs}</div>
          <div style={{ fontSize: 9, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>Health Score</div>
        </div>
      </div>
      <TabBar active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {tab === 'Perfil'    && <TabPerfil    s={startup} />}
        {tab === 'Presença'  && <TabPresenca  s={startup} />}
        {tab === 'Follow-up' && <TabFollowup  s={startup} cs={cs} patchCS={patchCS} />}
        {tab === 'Mensagens' && <TabMensagens s={startup} />}
      </div>
    </div>
  )
}
