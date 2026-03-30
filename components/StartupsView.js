import { useState, useMemo } from 'react'
import { DONE_SPRINTS } from '../lib/metrics'
import { calcHS, daysSince, ini } from '../lib/helpers'
import { autoRiskLevel, workshopRate, mentoriaRate, pct } from '../lib/metrics'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12 }

export default function StartupsView({ startups, getCS, onSelectStartup }) {
  const [sortBy, setSortBy] = useState('hs')
  const [sortDir, setSortDir] = useState('asc')
  const [gtFilter, setGtFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [query, setQuery] = useState('')

  const done = DONE_SPRINTS.length

  const rows = useMemo(() => {
    let list = [...startups]

    if (query) {
      const q = query.toLowerCase()
      list = list.filter(s => s.nome?.toLowerCase().includes(q) || s.founder_nome?.toLowerCase().includes(q) || s.founder_email?.toLowerCase().includes(q))
    }
    if (gtFilter !== 'todos') list = list.filter(s => s.nome_gt === gtFilter)
    if (statusFilter !== 'todos') {
      if (statusFilter === 'critico') list = list.filter(s => autoRiskLevel(s) === 'critico')
      else list = list.filter(s => getCS(s.startup_id).status === statusFilter)
    }

    list.sort((a, b) => {
      let va, vb
      const csA = getCS(a.startup_id), csB = getCS(b.startup_id)
      switch (sortBy) {
        case 'nome': va = a.nome||''; vb = b.nome||''; return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va)
        case 'founder': va = a.founder_nome||''; vb = b.founder_nome||''; return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va)
        case 'hs': va = calcHS(a, csA); vb = calcHS(b, csB); break
        case 'wk': va = pct(workshopRate(a)); vb = pct(workshopRate(b)); break
        case 'mt': va = pct(mentoriaRate(a)); vb = pct(mentoriaRate(b)); break
        case 'contato':
          va = csA.lastContact ? new Date(csA.lastContact).getTime() : 0
          vb = csB.lastContact ? new Date(csB.lastContact).getTime() : 0
          break
        default: va = 0; vb = 0
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })

    return list
  }, [startups, sortBy, sortDir, gtFilter, statusFilter, query, getCS])

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function SortHeader({ col, label, width }) {
    const active = sortBy === col
    return (
      <div onClick={()=>toggleSort(col)} style={{ width, fontSize:9, fontWeight:600, color:active?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', letterSpacing:'.06em', textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:3, userSelect:'none' }}>
        {label}
        {active && <span style={{ fontSize:8 }}>{sortDir==='asc'?'↑':'↓'}</span>}
      </div>
    )
  }

  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>

      {/* Filters bar */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'0 0 200px' }}>
          <svg style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="12" height="12" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--txt-3)" strokeWidth="1.2"/>
            <path d="M9.5 9.5L12 12" stroke="var(--txt-3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input style={{ width:'100%', padding:'7px 8px 7px 26px', fontSize:11, fontFamily:'var(--font-body)', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-2)', color:'var(--txt)', outline:'none' }}
            placeholder="Buscar startup, founder…" value={query} onChange={e=>setQuery(e.target.value)}
          />
        </div>

        <div style={{ display:'flex', gap:4 }}>
          {['todos','GT1','GT2','GT3'].map(gt=>(
            <button key={gt} onClick={()=>setGtFilter(gt)} style={{ padding:'5px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:gtFilter===gt?'var(--blue-dim)':'var(--bg-2)', color:gtFilter===gt?'var(--blue)':'var(--txt-3)', fontFamily:'var(--font-body)' }}>{gt==='todos'?'Todos':gt}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:4 }}>
          {[{key:'todos',label:'Todos'},{key:'risco',label:'Risco'},{key:'churn',label:'Churn'},{key:'critico',label:'Crítico'}].map(f=>(
            <button key={f.key} onClick={()=>setStatusFilter(f.key)} style={{ padding:'5px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:statusFilter===f.key?'var(--orange-dim)':'var(--bg-2)', color:statusFilter===f.key?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)' }}>{f.label}</button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{rows.length} startups</div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'36px 1.2fr 1fr 55px 55px 70px 70px 65px 70px', padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', alignItems:'center', gap:4 }}>
          <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:600 }}>#</div>
          <SortHeader col="nome" label="Startup" />
          <SortHeader col="founder" label="Founder" />
          <div style={{ fontSize:9, fontWeight:600, color:'var(--txt-3)', fontFamily:'var(--font-body)', letterSpacing:'.06em' }}>GT</div>
          <SortHeader col="hs" label="HS" />
          <SortHeader col="wk" label="Workshop" />
          <SortHeader col="mt" label="Mentoria" />
          <div style={{ fontSize:9, fontWeight:600, color:'var(--txt-3)', fontFamily:'var(--font-body)', letterSpacing:'.06em' }}>STATUS</div>
          <SortHeader col="contato" label="Contato" />
        </div>

        {/* Rows */}
        {rows.map((s,i) => {
          const cs = getCS(s.startup_id)
          const hs = calcHS(s, cs)
          const wk = pct(workshopRate(s))
          const mt = pct(mentoriaRate(s))
          const risk = autoRiskLevel(s)
          const statusColor = cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':risk==='critico'?'var(--red)':'var(--txt-3)'
          const statusLabel = cs.status!=='ativo'?cs.status:risk==='critico'?'crítico':risk==='engajado'?'engajado':'ativo'

          return (
            <div key={s.startup_id} onClick={()=>onSelectStartup(s)} style={{ display:'grid', gridTemplateColumns:'36px 1.2fr 1fr 55px 55px 70px 70px 65px 70px', padding:'8px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', alignItems:'center', gap:4, transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.nome}</div>
              <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.founder_nome}</div>
              <div style={{ fontSize:10, color:'var(--blue)', fontFamily:'var(--font-body)', fontWeight:500 }}>{s.nome_gt||'—'}</div>
              <div style={{ fontSize:11, fontWeight:700, color:hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)', fontFamily:'var(--font-mono)' }}>{hs}</div>
              <div style={{ fontSize:10, color:wk>=70?'var(--green)':wk>=40?'var(--amber)':'var(--red)', fontFamily:'var(--font-mono)' }}>{wk}%</div>
              <div style={{ fontSize:10, color:mt>=70?'var(--green)':mt>=40?'var(--amber)':'var(--red)', fontFamily:'var(--font-mono)' }}>{mt}%</div>
              <div><span style={{ fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4, background:statusColor==='var(--red)'?'var(--red-dim)':statusColor==='var(--amber)'?'var(--amber-dim)':'var(--bg-4)', color:statusColor, fontFamily:'var(--font-body)', textTransform:'capitalize' }}>{statusLabel}</span></div>
              <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{daysSince(cs.lastContact)||'—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
