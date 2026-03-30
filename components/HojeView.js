import { useMemo } from 'react'
import { SPRINTS, CURRENT_SPRINT, getCurrentEvent, firstName } from '../lib/constants'
import { autoRiskLevel, getEventAttendance, getStartupsNeedingFollowup, DONE_SPRINTS, pct, presencaRate, encontrosPresente } from '../lib/metrics'
import { daysSince, calcHS, ini } from '../lib/helpers'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px' }
const sTitle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }

function ActionRow({ s, cs, label, color, onClick }) {
  const hs = calcHS(s, cs)
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg-3)', borderRadius:8, cursor:'pointer', transition:'background .15s', marginBottom:4 }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-4)'}
      onMouseLeave={e=>e.currentTarget.style.background='var(--bg-3)'}
    >
      <div style={{ width:28, height:28, borderRadius:6, background:color==='var(--red)'?'var(--red-dim)':color==='var(--amber)'?'var(--amber-dim)':'var(--bg-4)', color:color||'var(--txt-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, fontFamily:'var(--font-body)', flexShrink:0 }}>{ini(s.nome)}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.nome}</div>
        <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>{s.founder_nome} · {s.nome_gt||''}</div>
      </div>
      <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:color==='var(--red)'?'var(--red-dim)':'var(--amber-dim)', color, fontWeight:600, fontFamily:'var(--font-body)', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:11, fontWeight:700, color:hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{hs}</span>
    </div>
  )
}

export default function HojeView({ startups, getCS, onSelectStartup }) {
  const event = useMemo(() => getCurrentEvent(), [])
  const attendance = useMemo(() => {
    if (!event) return null
    return getEventAttendance(startups, event.sprint.n, event.type)
  }, [startups, event])

  const needFollowup = useMemo(() => getStartupsNeedingFollowup(startups, getCS, 7), [startups, getCS])
  const neverAttended = useMemo(() => startups.filter(s => encontrosPresente(s) === 0), [startups])
  const recentRisk = useMemo(() => startups.filter(s => autoRiskLevel(s) === 'atencao'), [startups])
  const criticos = useMemo(() => startups.filter(s => autoRiskLevel(s) === 'critico'), [startups])

  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  const eventLabel = event?.type === 'workshop' ? 'Workshop' : 'Mentoria'
  const eventDate = event?.date ? event.date.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'short' }) : ''

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>

      {/* Event banner */}
      <div style={{ ...card, marginBottom:10, borderLeft:'3px solid var(--orange)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>
            {event?.sprint?.status === 'now' ? 'Sprint atual' : 'Último encontro'}
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--txt)', fontFamily:'var(--font-body)', letterSpacing:'-0.3px' }}>
            Sprint {event?.sprint?.n} — {eventLabel}
          </div>
          <div style={{ fontSize:12, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400, marginTop:2 }}>
            {event?.sprint?.tema} · {eventDate}
          </div>
        </div>
        {attendance && (
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:32, fontWeight:800, color:attendance.rate>=0.7?'var(--green)':'var(--orange)', fontFamily:'var(--font-body)', letterSpacing:'-1px' }}>{pct(attendance.rate)}%</div>
            <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>{attendance.present.length}/{attendance.total} presentes</div>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
        {[
          { label:'Sem contato +7d', value:needFollowup.length, color:needFollowup.length>10?'var(--red)':'var(--amber)' },
          { label:'Nunca participaram', value:neverAttended.length, color:neverAttended.length>0?'var(--red)':'var(--green)' },
          { label:'Atenção (faltou 1x)', value:recentRisk.length, color:'var(--amber)' },
          { label:'Críticos', value:criticos.length, color:criticos.length>0?'var(--red)':'var(--green)' },
        ].map(m=>(
          <div key={m.label} style={{ ...card, padding:'14px 16px', borderLeft:`2px solid ${m.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:m.color, fontFamily:'var(--font-body)', letterSpacing:'-0.5px' }}>{m.value}</div>
            <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500, marginTop:2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance split */}
      {attendance && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          {/* Absent */}
          <div style={{ ...card }}>
            <div style={{ ...sTitle, color:'var(--red)', display:'flex', justifyContent:'space-between' }}>
              <span>Ausentes — {eventLabel} S{event.sprint.n}</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{attendance.absent.length}</span>
            </div>
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              {attendance.absent.slice(0,15).map(s=>(
                <ActionRow key={s.startup_id} s={s} cs={getCS(s.startup_id)} label="Ausente" color="var(--red)" onClick={()=>onSelectStartup(s)} />
              ))}
              {attendance.absent.length > 15 && <div style={{ fontSize:10, color:'var(--txt-3)', textAlign:'center', padding:8, fontFamily:'var(--font-body)' }}>+{attendance.absent.length-15} mais</div>}
            </div>
          </div>
          {/* Present */}
          <div style={{ ...card }}>
            <div style={{ ...sTitle, color:'var(--green)', display:'flex', justifyContent:'space-between' }}>
              <span>Presentes — {eventLabel} S{event.sprint.n}</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{attendance.present.length}</span>
            </div>
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              {attendance.present.slice(0,15).map(s=>(
                <ActionRow key={s.startup_id} s={s} cs={getCS(s.startup_id)} label="Presente" color="var(--green)" onClick={()=>onSelectStartup(s)} />
              ))}
              {attendance.present.length > 15 && <div style={{ fontSize:10, color:'var(--txt-3)', textAlign:'center', padding:8, fontFamily:'var(--font-body)' }}>+{attendance.present.length-15} mais</div>}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up needed */}
      {needFollowup.length > 0 && (
        <div style={{ ...card }}>
          <div style={{ ...sTitle, display:'flex', justifyContent:'space-between' }}>
            <span>Precisam de follow-up (sem contato +7 dias)</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--amber)' }}>{needFollowup.length}</span>
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {needFollowup.slice(0,10).map(s=>(
              <ActionRow key={s.startup_id} s={s} cs={getCS(s.startup_id)} label={daysSince(getCS(s.startup_id).lastContact)||'Nunca'} color="var(--amber)" onClick={()=>onSelectStartup(s)} />
            ))}
            {needFollowup.length > 10 && <div style={{ fontSize:10, color:'var(--txt-3)', textAlign:'center', padding:8, fontFamily:'var(--font-body)' }}>+{needFollowup.length-10} mais</div>}
          </div>
        </div>
      )}

      {/* Sprint progress */}
      <div style={{ ...card, marginTop:10 }}>
        <div style={sTitle}>Progresso do programa</div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {SPRINTS.map(sp=>(
            <div key={sp.n} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', height:6, borderRadius:99, background:sp.status==='done'?'var(--green)':sp.status==='now'?'var(--orange)':'var(--bg-4)' }} />
              <span style={{ fontSize:9, color:sp.status==='now'?'var(--orange)':'var(--txt-3)', fontWeight:sp.status==='now'?700:400, fontFamily:'var(--font-body)' }}>S{sp.n}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:8 }}>Sprint {CURRENT_SPRINT.n} de 10 — {CURRENT_SPRINT.tema}</div>
      </div>
    </div>
  )
}
