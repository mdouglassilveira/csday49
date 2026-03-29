import { useState } from 'react'
import { calcHS, hsc, hsbg, daysSince, presencaDone } from '../lib/helpers'
import { autoRiskLevel } from '../lib/metrics'

function NavBtn({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} title={label} style={{ width: 44, padding: '8px 0', background: active ? 'var(--orange)' : 'var(--orange-soft)', color: active ? 'var(--white)' : 'var(--orange)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 9, letterSpacing: '.04em', transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
      {icon}
      {label}
      {badge > 0 && (
        <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--white)' }}>{badge}</div>
      )}
    </button>
  )
}

function StartupItem({ s, cs, selected, onClick }) {
  const hs = calcHS(s, cs)
  const { attended, total } = presencaDone(s)
  const risk = autoRiskLevel(s)
  const preview = cs.notes
    ? cs.notes.slice(0, 45) + (cs.notes.length > 45 ? '…' : '')
    : `${attended}/${total} encontros · ${s.escritorio_regional || '—'}`

  return (
    <div onClick={onClick} style={{ padding: '9px 16px', borderBottom: '1px solid var(--gray-6)', cursor: 'pointer', display: 'flex', gap: 9, alignItems: 'flex-start', background: selected ? '#FFF0EB' : 'transparent', borderLeft: selected ? '3px solid var(--orange)' : '3px solid transparent', transition: 'background .1s' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 500, flexShrink: 0, background: hsbg(hs), color: hsc(hs), border: `1.5px solid ${hsc(hs)}` }}>{hs}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</div>
        <div style={{ fontSize: 10, color: 'var(--gray-4)', marginBottom: 2 }}>{s.founder_nome}</div>
        <div style={{ fontSize: 10, color: 'var(--gray-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
        <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
          {s.nome_gt && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--blue-soft)', color: 'var(--blue)', fontWeight: 500 }}>{s.nome_gt}</span>}
          {cs.status !== 'ativo' && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: cs.status==='churn'?'var(--red-soft)':cs.status==='risco'?'var(--amber-soft)':'var(--gray-6)', color: cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--gray-3)', fontWeight: 500 }}>{cs.status}</span>}
          {risk === 'critico' && cs.status === 'ativo' && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--red-soft)', color: 'var(--red)', fontWeight: 500 }}>crítico</span>}
        </div>
      </div>
      <span style={{ fontSize: 9, color: 'var(--gray-4)', whiteSpace: 'nowrap', fontFamily: 'var(--font-m)', marginTop: 1 }}>{daysSince(cs.lastContact)}</span>
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

  function handleNavClick(view) {
    onViewChange(view)
    setPanelOpen(false)
  }

  function handleStartClick() {
    setPanelOpen(o => !o)
    if (!panelOpen) onViewChange('dashboard')
  }

  return (
    <aside style={{ display: 'flex', height: '100vh', flexShrink: 0 }}>

      {/* ── nav strip ── */}
      <div style={{ width: 64, background: 'var(--white)', borderRight: '1px solid var(--gray-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 16px', gap: 8, flexShrink: 0 }}>
        {/* logo */}
        <div style={{ width: 36, height: 36, background: 'var(--orange)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: 'var(--white)', letterSpacing: -1, marginBottom: 4 }}>49</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--gray-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>CS DAY</div>

        {/* START */}
        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
          label="START"
          active={panelOpen}
          badge={alertTotal}
          onClick={handleStartClick}
        />

        <div style={{ height: 1, width: 32, background: 'var(--gray-6)', margin: '4px 0' }} />

        {/* Dashboard */}
        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>}
          label="DASH"
          active={!panelOpen && activeView === 'dashboard'}
          onClick={() => handleNavClick('dashboard')}
        />

        {/* Análise */}
        <NavBtn
          icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 13l4-5 3 3 3-5 4 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="ANÁLISE"
          active={!panelOpen && activeView === 'analytics'}
          onClick={() => handleNavClick('analytics')}
        />
      </div>

      {/* ── startup panel ── */}
      {panelOpen && (
        <div style={{ width: 272, background: 'var(--white)', borderRight: '1px solid var(--gray-6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--gray-6)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>START Primeiras Vendas</div>
            <div style={{ fontSize: 10, color: 'var(--gray-4)', marginBottom: 12 }}>150 startups · Tamara Moraes</div>

            {/* GT filter */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['todos','GT1','GT2','GT3'].map(gt => (
                <button key={gt} onClick={() => setGtFilter(gt)} style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 500, border: `1px solid ${gtFilter===gt?'var(--orange)':'var(--gray-5)'}`, borderRadius: 6, cursor: 'pointer', background: gtFilter===gt?'var(--orange-soft)':'transparent', color: gtFilter===gt?'var(--orange)':'var(--gray-4)', fontFamily: 'var(--font-b)' }}>{gt}</button>
              ))}
            </div>

            {/* status filter */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'todas',   label: 'Todas' },
                { key: 'critico', label: `Crítico (${criticos})` },
                { key: 'risco',   label: `Risco (${riscos})` },
                { key: 'churn',   label: `Churn (${churns})` },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 500, border: `1px solid ${filter===f.key?'var(--orange)':'var(--gray-5)'}`, borderRadius: 20, cursor: 'pointer', background: filter===f.key?'var(--orange)':'transparent', color: filter===f.key?'var(--white)':'var(--gray-3)', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap' }}>{f.label}</button>
              ))}
            </div>

            {/* search */}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#9A9A9A" strokeWidth="1.2"/>
                <path d="M9.5 9.5L12 12" stroke="#9A9A9A" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input style={{ width: '100%', padding: '7px 9px 7px 28px', fontSize: 12, fontFamily: 'var(--font-b)', border: '1px solid var(--gray-6)', borderRadius: 6, background: 'var(--gray-7)', color: 'var(--black)', outline: 'none' }} placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>

          <div style={{ padding: '7px 16px 5px', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Startups</span>
            <span style={{ fontSize: 10, color: 'var(--gray-4)', fontFamily: 'var(--font-m)' }}>{filtered.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--gray-4)' }}>Nenhuma startup encontrada</div>}
            {filtered.map(s => (
              <StartupItem
                key={s.startup_id}
                s={s}
                cs={getCS(s.startup_id)}
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
