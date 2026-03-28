import { useState } from 'react'
import { calcHS, hsc, hsbg, daysSince, presencaDone } from '../lib/helpers'

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 500,
      border: `1px solid ${active ? 'var(--orange)' : 'var(--gray-5)'}`,
      borderRadius: 20, cursor: 'pointer',
      background: active ? 'var(--orange)' : 'transparent',
      color: active ? 'var(--white)' : 'var(--gray-3)',
      fontFamily: 'var(--font-b)', transition: 'all .15s',
    }}>
      {label}
    </button>
  )
}

function StartupItem({ s, cs, selected, onClick }) {
  const hs = calcHS(s, cs)
  const { attended, total } = presencaDone(s)
  const pills = []
  if (s.nome_gt) pills.push({ t: s.nome_gt, c: 'var(--blue-soft)', ct: 'var(--blue)' })
  if (s.segmento) pills.push({ t: s.segmento.slice(0, 18), c: 'var(--gray-6)', ct: 'var(--gray-3)' })
  if (cs.status === 'churn')   pills.push({ t: 'Churn',   c: 'var(--red-soft)',   ct: 'var(--red)'   })
  if (cs.status === 'risco')   pills.push({ t: 'Risco',   c: 'var(--amber-soft)', ct: 'var(--amber)' })
  if (cs.status === 'inativo') pills.push({ t: 'Inativo', c: 'var(--gray-6)',     ct: 'var(--gray-3)'})
  const preview = cs.notes
    ? cs.notes.slice(0, 55) + (cs.notes.length > 55 ? '…' : '')
    : `${attended}/${total} sprints · ${s.escritorio_regional || s.segmento || '—'}`
  return (
    <div onClick={onClick} style={{
      padding: '10px 18px', borderBottom: '1px solid var(--gray-6)',
      cursor: 'pointer', display: 'flex', gap: 9, alignItems: 'flex-start',
      background: selected ? 'var(--orange-soft)' : 'var(--white)',
      borderLeft: selected ? '3px solid var(--orange)' : '3px solid transparent',
      transition: 'background .1s',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 500, flexShrink: 0, background: hsbg(hs), color: hsc(hs), border: `1.5px solid ${hsc(hs)}` }}>
        {hs}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1 }}>{s.nome}</div>
        <div style={{ fontSize: 10, color: 'var(--gray-4)', marginBottom: 3 }}>{s.founder_nome}{s.escritorio_regional ? ` · ${s.escritorio_regional}` : ''}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{preview}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {pills.map((p, i) => <span key={i} style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: p.c, color: p.ct }}>{p.t}</span>)}
        </div>
      </div>
      <span style={{ fontSize: 9, color: 'var(--gray-4)', whiteSpace: 'nowrap', fontFamily: 'var(--font-m)', marginTop: 2 }}>{daysSince(cs.lastContact)}</span>
    </div>
  )
}

export default function Sidebar({ startups, selected, getCS, onSelect }) {
  const [filter, setFilter] = useState('todas')
  const [gtFilter, setGtFilter] = useState('todos')
  const [query, setQuery] = useState('')
  const churns = startups.filter((s) => getCS(s.startup_id).status === 'churn').length
  const riscos  = startups.filter((s) => getCS(s.startup_id).status === 'risco').length
  const filtered = startups
    .filter((s) => {
      const cs = getCS(s.startup_id)
      if (query) { const q = query.toLowerCase(); if (!s.nome?.toLowerCase().includes(q) && !s.founder_nome?.toLowerCase().includes(q)) return false }
      if (gtFilter !== 'todos' && s.nome_gt !== gtFilter) return false
      if (filter === 'risco')   return cs.status === 'risco'
      if (filter === 'churn')   return cs.status === 'churn'
      if (filter === 'inativo') return cs.status === 'inativo'
      return true
    })
    .sort((a, b) => calcHS(a, getCS(a.startup_id)) - calcHS(b, getCS(b.startup_id)))
  return (
    <aside style={{ width: 290, minWidth: 290, height: '100vh', background: 'var(--white)', borderRight: '1px solid var(--gray-6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--gray-6)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, background: 'var(--orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 13, color: 'var(--white)', letterSpacing: -1 }}>49</div>
          <div>
            <div style={{ fontFamily: 'var(--font-h)', fontWeight: 600, fontSize: 15, letterSpacing: '-.02em' }}>CS Day</div>
            <div style={{ fontSize: 11, color: 'var(--gray-4)', marginTop: 1 }}>START · Tamara Moraes</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {['todos','GT1','GT2','GT3'].map((gt) => (
            <button key={gt} onClick={() => setGtFilter(gt)} style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 500, border: `1px solid ${gtFilter === gt ? 'var(--orange)' : 'var(--gray-5)'}`, borderRadius: 6, cursor: 'pointer', background: gtFilter === gt ? 'var(--orange-soft)' : 'transparent', color: gtFilter === gt ? 'var(--orange)' : 'var(--gray-4)', fontFamily: 'var(--font-b)' }}>{gt}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          <FilterChip label="Todas"                                         active={filter==='todas'}  onClick={() => setFilter('todas')}  />
          <FilterChip label={`Risco${riscos>0?` (${riscos})`:''}`}         active={filter==='risco'}  onClick={() => setFilter('risco')}  />
          <FilterChip label={`Churn${churns>0?` (${churns})`:''}`}         active={filter==='churn'}  onClick={() => setFilter('churn')}  />
          <FilterChip label="Inativas"                                      active={filter==='inativo'} onClick={() => setFilter('inativo')} />
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#9A9A9A" strokeWidth="1.2"/>
            <path d="M9.5 9.5L12 12" stroke="#9A9A9A" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 12, fontFamily: 'var(--font-b)', border: '1px solid var(--gray-6)', borderRadius: 6, background: 'var(--gray-7)', color: 'var(--black)', outline: 'none' }} placeholder="Buscar startup ou founder…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: '10px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Startups</span>
        <span style={{ fontSize: 11, color: 'var(--gray-4)', fontFamily: 'var(--font-m)' }}>{filtered.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--gray-4)' }}>Nenhuma startup encontrada</div>}
        {filtered.map((s) => <StartupItem key={s.startup_id} s={s} cs={getCS(s.startup_id)} selected={selected?.startup_id === s.startup_id} onClick={() => onSelect(s)} />)}
      </div>
    </aside>
  )
}
