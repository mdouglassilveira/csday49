import { useState, useMemo } from 'react'
import { SPRINTS } from '../lib/constants'
import { getEventAttendance, pct, DONE_SPRINTS } from '../lib/metrics'
import { calcHS, ini } from '../lib/helpers'
import BulkSendModal from './BulkSendModal'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px' }
const sTitle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }

export default function EncountersView({ startups, getCS, onSelectStartup }) {
  const [sprintN, setSprintN] = useState(DONE_SPRINTS.length > 0 ? DONE_SPRINTS[DONE_SPRINTS.length-1].n : 1)
  const [eventType, setEventType] = useState('workshop')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [gtFilter, setGtFilter] = useState('todos')
  const [sortBy, setSortBy] = useState('status')
  const [selected, setSelected] = useState(new Set())
  const [showBulkSend, setShowBulkSend] = useState(false)

  const attendance = useMemo(() => getEventAttendance(startups, sprintN, eventType), [startups, sprintN, eventType])

  const sprint = SPRINTS.find(s=>s.n===sprintN)

  // Filter and sort
  const rows = useMemo(() => {
    let list = [...startups]

    if (gtFilter !== 'todos') list = list.filter(s => s.nome_gt === gtFilter)
    if (filterStatus === 'presentes') list = list.filter(s => attendance.present.some(p=>p.startup_id===s.startup_id))
    if (filterStatus === 'ausentes') list = list.filter(s => attendance.absent.some(a=>a.startup_id===s.startup_id))

    const field = eventType === 'workshop' ? `workshop${sprintN}` :
                  eventType === 'mentoria' ? `mentoria${sprintN}` :
                  `sprint_${sprintN}`

    list.sort((a, b) => {
      if (sortBy === 'status') {
        const aP = a[field] === true ? 1 : 0
        const bP = b[field] === true ? 1 : 0
        if (aP !== bP) return aP - bP // ausentes primeiro
        return (a.nome||'').localeCompare(b.nome||'')
      }
      if (sortBy === 'nome') return (a.nome||'').localeCompare(b.nome||'')
      if (sortBy === 'hs') return calcHS(a, getCS(a.startup_id)) - calcHS(b, getCS(b.startup_id))
      return 0
    })

    return list
  }, [startups, sprintN, eventType, filterStatus, gtFilter, sortBy, attendance])

  // Stats for filtered view
  const filteredPresent = rows.filter(s => {
    const field = eventType === 'workshop' ? `workshop${sprintN}` : eventType === 'mentoria' ? `mentoria${sprintN}` : `sprint_${sprintN}`
    return s[field] === true
  })
  const filteredAbsent = rows.filter(s => !filteredPresent.some(p => p.startup_id === s.startup_id))

  function toggleSelect(id) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function selectAll() { setSelected(new Set(rows.map(s => s.startup_id))) }
  function selectNone() { setSelected(new Set()) }
  function selectAbsent() {
    const field = eventType === 'workshop' ? `workshop${sprintN}` : eventType === 'mentoria' ? `mentoria${sprintN}` : `sprint_${sprintN}`
    setSelected(new Set(rows.filter(s => s[field] !== true).map(s => s.startup_id)))
  }

  function getBulkRecipients() {
    return rows.filter(s => selected.has(s.startup_id)).map(s => ({
      startup_id: s.startup_id, startup_name: s.nome, founder_name: s.founder_nome,
      phone: s.founder_telefone, gt: s.nome_gt, mentor: s.nome_mentor, link_meet: s.link_meet,
    }))
  }

  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>
      {showBulkSend && <BulkSendModal recipients={getBulkRecipients()} onClose={() => { setShowBulkSend(false); setSelected(new Set()) }} />}

      {/* Sprint selector */}
      <div style={{ ...card, marginBottom:10, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {SPRINTS.map(sp=>(
            <button key={sp.n} onClick={()=>setSprintN(sp.n)} style={{
              flex:1, padding:'8px 0', fontSize:11, fontWeight:sprintN===sp.n?700:500, border:'none', borderRadius:8, cursor:'pointer',
              background:sprintN===sp.n?'var(--orange-dim)':sp.status==='fut'?'transparent':'var(--bg-3)',
              color:sprintN===sp.n?'var(--orange)':sp.status==='fut'?'var(--txt-3)':'var(--txt-2)',
              fontFamily:'var(--font-body)', transition:'all .15s', opacity:sp.status==='fut'?0.4:1,
            }}>S{sp.n}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'space-between' }}>
          {/* Event type */}
          <div style={{ display:'flex', gap:4 }}>
            {[{key:'workshop',label:'Workshop'},{key:'mentoria',label:'Mentoria'},{key:'atividade',label:'Atividade'}].map(t=>(
              <button key={t.key} onClick={()=>setEventType(t.key)} style={{ padding:'6px 14px', fontSize:11, fontWeight:eventType===t.key?600:400, border:'none', borderRadius:6, cursor:'pointer', background:eventType===t.key?'var(--orange)':'var(--bg-3)', color:eventType===t.key?'#fff':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{t.label}</button>
            ))}
          </div>

          {/* Info */}
          <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>
            {sprint?.tema} · {eventType==='workshop'?sprint?.wk:sprint?.mt}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ ...card, marginBottom:10, padding:'14px 20px', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ height:8, borderRadius:99, background:'var(--bg-4)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct(attendance.rate)}%`, background:attendance.rate>=0.7?'var(--green)':'var(--orange)', borderRadius:99, transition:'width .5s' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:16, flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:attendance.rate>=0.7?'var(--green)':'var(--orange)', fontFamily:'var(--font-body)' }}>{attendance.present.length}</div>
            <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Presentes</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--red)', fontFamily:'var(--font-body)' }}>{attendance.absent.length}</div>
            <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Ausentes</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--txt-2)', fontFamily:'var(--font-body)' }}>{pct(attendance.rate)}%</div>
            <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Taxa</div>
          </div>
        </div>
      </div>

      {/* Selection actions */}
      {selected.size > 0 && (
        <div style={{ ...card, marginBottom:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderLeft:'2px solid var(--orange)' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--orange)', fontFamily:'var(--font-body)' }}>{selected.size} selecionadas</span>
          <button onClick={selectNone} style={{ fontSize:10, padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Limpar</button>
          <div style={{ flex:1 }} />
          <button onClick={() => setShowBulkSend(true)} style={{ fontSize:11, padding:'7px 16px', border:'none', borderRadius:8, cursor:'pointer', background:'var(--orange)', color:'#fff', fontFamily:'var(--font-body)', fontWeight:600 }}>
            Enviar mensagem para {selected.size}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {[{key:'todos',label:'Todos'},{key:'ausentes',label:`Ausentes (${filteredAbsent.length})`},{key:'presentes',label:`Presentes (${filteredPresent.length})`}].map(f=>(
            <button key={f.key} onClick={()=>setFilterStatus(f.key)} style={{ padding:'5px 12px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:filterStatus===f.key?'var(--orange-dim)':'var(--bg-3)', color:filterStatus===f.key?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{f.label}</button>
          ))}
        </div>
        <div style={{ width:1, height:16, background:'var(--border)' }} />
        <div style={{ display:'flex', gap:4 }}>
          {['todos','GT1','GT2','GT3'].map(gt=>(
            <button key={gt} onClick={()=>setGtFilter(gt)} style={{ padding:'5px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:gtFilter===gt?'var(--blue-dim)':'var(--bg-3)', color:gtFilter===gt?'var(--blue)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{gt==='todos'?'Todos':gt}</button>
          ))}
        </div>
        <div style={{ width:1, height:16, background:'var(--border)' }} />
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={selectAll} style={{ padding:'5px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Selec. todos</button>
          <button onClick={selectAbsent} style={{ padding:'5px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:20, cursor:'pointer', background:'var(--red-dim)', color:'var(--red)', fontFamily:'var(--font-body)' }}>Selec. ausentes</button>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          {[{key:'status',label:'Status'},{key:'nome',label:'Nome'},{key:'hs',label:'HS'}].map(s=>(
            <button key={s.key} onClick={()=>setSortBy(s.key)} style={{ padding:'5px 10px', fontSize:9, fontWeight:500, border:'none', borderRadius:4, cursor:'pointer', background:sortBy===s.key?'var(--bg-4)':'transparent', color:sortBy===s.key?'var(--txt-2)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, padding:0, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'30px 36px 1fr 120px 55px 55px 70px', padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <input type="checkbox" checked={selected.size===rows.length&&rows.length>0} onChange={()=>selected.size===rows.length?selectNone():selectAll()} style={{ accentColor:'var(--orange)', cursor:'pointer' }} />
          </div>
          {['#','Startup','Founder','GT','HS','Status'].map(h=>(
            <div key={h} style={{ fontSize:9, fontWeight:600, color:'var(--txt-3)', fontFamily:'var(--font-body)', letterSpacing:'.06em', textTransform:'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((s,i) => {
          const field = eventType === 'workshop' ? `workshop${sprintN}` : eventType === 'mentoria' ? `mentoria${sprintN}` : `sprint_${sprintN}`
          const present = s[field] === true
          const hs = calcHS(s, getCS(s.startup_id))

          return (
            <div key={s.startup_id} style={{ display:'grid', gridTemplateColumns:'30px 36px 1fr 120px 55px 55px 70px', padding:'9px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', alignItems:'center', transition:'background .1s', background:selected.has(s.startup_id)?'var(--orange-soft)':'transparent' }}
              onMouseEnter={e=>{if(!selected.has(s.startup_id))e.currentTarget.style.background='var(--bg-3)'}}
              onMouseLeave={e=>{if(!selected.has(s.startup_id))e.currentTarget.style.background='transparent'}}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(s.startup_id)} onChange={()=>toggleSelect(s.startup_id)} style={{ accentColor:'var(--orange)', cursor:'pointer' }} />
              </div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{String(i+1).padStart(2,'0')}</div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:11, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', paddingRight:8 }}>{s.nome}</div>
              <div onClick={()=>onSelectStartup(s)} style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.founder_nome}</div>
              <div style={{ fontSize:10, color:'var(--blue)', fontFamily:'var(--font-body)', fontWeight:500 }}>{s.nome_gt||'—'}</div>
              <div style={{ fontSize:11, fontWeight:700, color:hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)', fontFamily:'var(--font-mono)' }}>{hs}</div>
              <div>
                <span style={{ fontSize:9, fontWeight:600, padding:'3px 8px', borderRadius:4, background:present?'var(--green-dim)':'var(--red-dim)', color:present?'var(--green)':'var(--red)', fontFamily:'var(--font-body)' }}>{present?'Presente':'Ausente'}</span>
              </div>
            </div>
          )
        })}

        {rows.length === 0 && <div style={{ padding:24, textAlign:'center', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Nenhuma startup encontrada</div>}
      </div>
    </div>
  )
}
