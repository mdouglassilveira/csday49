import { useState } from 'react'
import { calcHS, hsc, hsbg, daysSince, presencaDone } from '../lib/helpers'
import { autoRiskLevel } from '../lib/metrics'

function hscDark(hs) {
  return hs >= 70 ? 'var(--green)' : hs >= 40 ? 'var(--amber)' : 'var(--red)'
}
function hsbgDark(hs) {
  return hs >= 70 ? 'var(--green-dim)' : hs >= 40 ? 'var(--amber-dim)' : 'var(--red-dim)'
}

function NavBtn({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} title={label} style={{
      width: 48, padding: '9px 0',
      background: active ? 'var(--orange-dim)' : 'transparent',
      color: active ? 'var(--orange)' : 'var(--txt-3)',
      border: `1px solid ${active ? 'var(--orange-glow)' : 'transparent'}`,
      borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-m)', fontWeight: 600, fontSize: 8,
      letterSpacing: '.1em', transition: 'all .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      position: 'relative',
      boxShadow: active ? '0 0 12px var(--orange-glow)' : 'none',
    }}>
      {icon}
      {label}
      {badge > 0 && (
        <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: 'var(--txt)', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-2)', animation: 'pulse 2s infinite' }}>{badge}</div>
      )}
    </button>
  )
}

function StartupItem({ s, cs, selected, onClick }) {
  const hs = calcHS(s, cs)
  const col = hscDark(hs)
  const bg  = hsbgDark(hs)
  const { attended, total } = presencaDone(s)
  const risk = autoRiskLevel(s)
  const preview = cs.notes
    ? cs.notes.slice(0, 45) + (cs.notes.length > 45 ? '…' : '')
    : `${attended}/${total} encontros · ${s.escritorio_regional || '—'}`

  return (
    <div onClick={onClick} style={{
      padding: '9px 14px', borderBottom: '1px solid var(--border)',
      cursor: 'pointer', display: 'flex', gap: 9, alignItems: 'flex-start',
      background: selected ? 'var(--orange-dim)' : 'transparent',
      borderLeft: selected ? '2px solid var(--orange)' : '2px solid transparent',
      transition: 'all .15s',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600, flexShrink: 0, background: bg, color: col, border: `1px solid ${col}44` }}>
        {hs}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selected ? 'var(--orange)' : 'var(--txt)' }}>{s.nome}</div>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', marginBottom: 2 }}>{s.founder_nome}</div>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-m)' }}>{preview}</div>
        <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
          {s.nome_gt && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'var(--blue-dim)', color: 'var(--blue)', fontWeight: 600, fontFamily: 'var(--font-m)', letterSpacing: '.05em' }}>{s.nome_gt}</span>}
          {cs.status !== 'ativo' && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--amber-dim)':'var(--bg-4)', color: cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--txt-3)', fontWeight: 600, fontFamily: 'var(--font-m)', letterSpacing: '.05em' }}>{cs.status}</span>}
          {risk === 'critico' && cs.status === 'ativo' && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'var(--red-dim)', color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font-m)', letterSpacing: '.05em' }}>CRÍTICO</span>}
        </div>
      </div>
      <span style={{ fontSize: 9, color: 'var(--txt-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-m)', marginTop: 1 }}>{daysSince(cs.lastContact)}</span>
    </div>
  )
}

export default function Sidebar({ startups, selected, getCS, onSelect, activeView, onViewChange }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [filter, setFilter]       = useState('todas')
  const [gtFilter, setGtFilter]   = useState('todos')
  const [query, setQuery]         = useState('')

  const churns   = startups.filter(s => getCS(s.startup_id).status === 'churn').length
  const riscos   = startups.filter(s => getCS(s.startup_id).status === 'risco').length
  const criticos = startups.filter(s => autoRiskLevel(s) === 'critico').length
  const alertTotal = criticos + churns

  const filtered = startups.filter(s => {
    const cs = getCS(s.startup_id)
    if (query) { const q = query.toLowerCase(); if (!s.nome?.toLowerCase().includes(q) && !s.founder_nome?.toLowerCase().includes(q)) return false }
    if (gtFilter !== 'todos' && s.nome_gt !== gtFilter) return false
    if (filter === 'risco')   return cs.status === 'risco'
    if (filter === 'churn')   return cs.status === 'churn'
    if (filter === 'critico') return autoRiskLevel(s) === 'critico'
    return true
  }).sort((a, b) => calcHS(a, getCS(a.startup_id)) - calcHS(b, getCS(b.startup_id)))

  function handleNav(v) { onViewChange(v); setPanelOpen(false) }

  return (
    <aside style={{ display: 'flex', height: '100vh', flexShrink: 0 }}>

      {/* nav strip */}
      <div style={{ width: 64, background: 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 6, flexShrink: 0 }}>
        {/* logo */}
        <div style={{ width: 38, height: 38, background: 'var(--orange)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontWeight: 700, fontSize: 15, color: 'var(--bg)', letterSpacing: -1, marginBottom: 2, boxShadow: '0 0 20px var(--orange-glow)' }}>49</div>
        <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '.15em', marginBottom: 12 }}>CS DAY</div>

        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="START"
          active={panelOpen}
          badge={alertTotal}
          onClick={() => setPanelOpen(o => !o)}
        />

        <div style={{ height: 1, width: 32, background: 'var(--border)', margin: '4px 0' }} />

        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>}
          label="DASH"
          active={!panelOpen && activeView === 'dashboard'}
          onClick={() => handleNav('dashboard')}
        />

        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 13l4-5 3 3 3-5 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="ANÁLISE"
          active={!panelOpen && activeView === 'analytics'}
          onClick={() => handleNav('analytics')}
        />
      </div>

      {/* startup panel */}
      {panelOpen && (
        <div style={{ width: 268, background: 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600, color: 'var(--orange)', letterSpacing: '.08em', marginBottom: 2 }}>START PRIMEIRAS VENDAS</div>
            <div style={{ fontSize: 10, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', marginBottom: 12 }}>150 startups · Tamara Moraes</div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['todos','GT1','GT2','GT3'].map(gt => (
                <button key={gt} onClick={() => setGtFilter(gt)} style={{ flex: 1, padding: '4px 0', fontSize: 9, fontWeight: 600, border: `1px solid ${gtFilter===gt?'var(--orange)':'var(--border-2)'}`, borderRadius: 4, cursor: 'pointer', background: gtFilter===gt?'var(--orange-dim)':'transparent', color: gtFilter===gt?'var(--orange)':'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.06em', transition: 'all .15s' }}>{gt}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'todas',   label: 'TODAS' },
                { key: 'critico', label: `CRÍTICO·${criticos}` },
                { key: 'risco',   label: `RISCO·${riscos}` },
                { key: 'churn',   label: `CHURN·${churns}` },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '3px 8px', fontSize: 8, fontWeight: 700, border: `1px solid ${filter===f.key?'var(--magenta)':'var(--border-2)'}`, borderRadius: 4, cursor: 'pointer', background: filter===f.key?'var(--magenta-dim)':'transparent', color: filter===f.key?'var(--magenta)':'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.08em', transition: 'all .15s', whiteSpace: 'nowrap' }}>{f.label}</button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="var(--txt-3)" strokeWidth="1.2"/>
                <path d="M9.5 9.5L12 12" stroke="var(--txt-3)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input style={{ width: '100%', padding: '7px 9px 7px 28px', fontSize: 11, fontFamily: 'var(--font-m)', border: '1px solid var(--border-2)', borderRadius: 6, background: 'var(--bg-3)', color: 'var(--txt)', outline: 'none', transition: 'border-color .15s' }} placeholder="buscar startup…" value={query} onChange={e => setQuery(e.target.value)} onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='var(--border-2)'} />
            </div>
          </div>

          <div style={{ padding: '6px 14px 4px', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '.1em', fontFamily: 'var(--font-m)' }}>STARTUPS</span>
            <span style={{ fontSize: 9, color: 'var(--orange)', fontFamily: 'var(--font-m)', fontWeight: 600 }}>{filtered.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>nenhum resultado</div>}
            {filtered.map(s => (
              <StartupItem
                key={s.startup_id} s={s} cs={getCS(s.startup_id)}
                selected={selected?.startup_id === s.startup_id}
                onClick={() => { onSelect(s); onViewChange('startup') }}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
