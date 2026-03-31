import { useState, useMemo } from 'react'
import { calcHS, daysSince, ini } from '../lib/helpers'
import { autoRiskLevel, workshopRate, mentoriaRate, pct } from '../lib/metrics'
import BulkSendModal from './BulkSendModal'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12 }

export default function StartupsView({ startups, getCS, onSelectStartup, onStartBatch, cal }) {
  const [sortBy, setSortBy] = useState('hs')
  const [sortDir, setSortDir] = useState('asc')
  const [gtFilter, setGtFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [selected, setSelected] = useState(new Set())
  const [showBulkSend, setShowBulkSend] = useState(false)
  const [query, setQuery] = useState('')

  const done = cal?.doneSprints?.length || 0

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

  function toggleSelect(id) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function selectAll() { setSelected(new Set(rows.map(s => s.startup_id))) }
  function selectNone() { setSelected(new Set()) }

  function getBulkRecipients() {
    return rows.filter(s => selected.has(s.startup_id)).map(s => ({
      startup_id: s.startup_id, startup_name: s.nome, founder_name: s.founder_nome,
      phone: s.founder_telefone, gt: s.nome_gt, mentor: s.nome_mentor, link_meet: s.link_meet,
    }))
  }

  function exportCSV() {
    const exportRows = rows.filter(s => selected.has(s.startup_id))
    const headers = ['Startup','Founder','Email','Telefone','GT','Mentor','Segmento','Escritório','Health Score','Workshop %','Mentoria %','Status','Último Contato']
    const csvRows = exportRows.map(s => {
      const cs = getCS(s.startup_id)
      const hs = calcHS(s, cs)
      return [
        `"${(s.nome||'').replace(/"/g,'""')}"`,
        `"${(s.founder_nome||'').replace(/"/g,'""')}"`,
        `"${s.founder_email||''}"`,
        `"${s.founder_telefone||''}"`,
        s.nome_gt||'',
        `"${(s.nome_mentor||'').replace(/"/g,'""')}"`,
        `"${(s.segmento||'').replace(/"/g,'""')}"`,
        `"${(s.escritorio_regional||'').replace(/"/g,'""')}"`,
        hs,
        `${pct(workshopRate(s))}%`,
        `${pct(mentoriaRate(s))}%`,
        cs.status||'ativo',
        cs.lastContact||'',
      ].join(',')
    })
    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `startups_${statusFilter}_${gtFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>
      {showBulkSend && <BulkSendModal recipients={getBulkRecipients()} onClose={() => { setShowBulkSend(false); setSelected(new Set()) }} onStartSend={(items, text, name) => onStartBatch(items, text, name)} />}

      {/* Selection bar */}
      {selected.size > 0 && (
        <div style={{ ...card, marginBottom:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderLeft:'2px solid var(--orange)', borderRadius:12 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--orange)', fontFamily:'var(--font-body)' }}>{selected.size} selecionadas</span>
          <button onClick={selectNone} style={{ fontSize:10, padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Limpar</button>
          <div style={{ flex:1 }} />
          <button onClick={exportCSV} style={{ fontSize:11, padding:'7px 16px', border:'none', borderRadius:8, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-2)', fontFamily:'var(--font-body)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6l3.5 3.5L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 11h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Exportar CSV
          </button>
          <button onClick={() => setShowBulkSend(true)} style={{ fontSize:11, padding:'7px 16px', border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)', fontWeight:600 }}>
            Enviar mensagem para {selected.size}
          </button>
        </div>
      )}

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
        <div style={{ display:'grid', gridTemplateColumns:'30px 36px 1.2fr 1fr 55px 55px 70px 70px 65px 70px', padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', alignItems:'center', gap:4 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <input type="checkbox" checked={selected.size===rows.length&&rows.length>0} onChange={()=>selected.size===rows.length?selectNone():selectAll()} style={{ accentColor:'var(--orange)', cursor:'pointer' }} />
          </div>
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
            <div key={s.startup_id} style={{ display:'grid', gridTemplateColumns:'30px 36px 1.2fr 1fr 55px 55px 70px 70px 65px 70px', padding:'8px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', alignItems:'center', gap:4, transition:'background .1s', background:selected.has(s.startup_id)?'var(--orange-soft)':'transparent' }}
              onMouseEnter={e=>{if(!selected.has(s.startup_id))e.currentTarget.style.background='var(--bg-3)'}}
              onMouseLeave={e=>{if(!selected.has(s.startup_id))e.currentTarget.style.background='transparent'}}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(s.startup_id)} onChange={()=>toggleSelect(s.startup_id)} style={{ accentColor:'var(--orange)', cursor:'pointer' }} />
              </div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{String(i+1).padStart(2,'0')}</div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:11, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.nome}</div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.founder_nome}</div>
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
