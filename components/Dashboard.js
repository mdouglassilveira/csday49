import { useMemo } from 'react'
import { programMetrics, pct, autoRiskLevel, DONE_SPRINTS } from '../lib/metrics'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px' }
const sTitle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }

function MetCard({ label, value, sub, color, accent }) {
  return (
    <div style={{ ...card, borderLeft: accent ? `2px solid ${color||'var(--orange)'}` : '1px solid var(--border)' }}>
      <div style={sTitle}>{label}</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:32, fontWeight:800, lineHeight:1, color: color||'var(--txt)', letterSpacing:'-0.5px', marginBottom:6 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>{sub}</div>}
    </div>
  )
}

function AlertStrip({ startups, onSelect }) {
  const criticos = startups.filter(s=>autoRiskLevel(s)==='critico')
  const riscos   = startups.filter(s=>autoRiskLevel(s)==='risco')
  if (!criticos.length && !riscos.length) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14, flexShrink:0 }}>
      {criticos.length > 0 && (
        <div style={{ background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'var(--red)', whiteSpace:'nowrap', flexShrink:0, fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>SEM PRESENÇA · {criticos.length}</span>
          <div style={{ width:1, height:14, background:'rgba(239,68,68,0.2)', flexShrink:0 }}/>
          {criticos.slice(0,8).map(s=>(
            <button key={s.startup_id} onClick={()=>onSelect(s)} style={{ fontSize:10, padding:'3px 10px', background:'transparent', color:'var(--red)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:500, whiteSpace:'nowrap', transition:'all .15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='var(--red-dim)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
            >{s.nome}</button>
          ))}
          {criticos.length>8 && <span style={{ fontSize:10, color:'var(--red)', fontFamily:'var(--font-mono)' }}>+{criticos.length-8}</span>}
        </div>
      )}
      {riscos.length > 0 && (
        <div style={{ background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'var(--amber)', whiteSpace:'nowrap', flexShrink:0, fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>EM RISCO · {riscos.length}</span>
          <div style={{ width:1, height:14, background:'rgba(245,158,11,0.2)', flexShrink:0 }}/>
          {riscos.slice(0,8).map(s=>(
            <button key={s.startup_id} onClick={()=>onSelect(s)} style={{ fontSize:10, padding:'3px 10px', background:'transparent', color:'var(--amber)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:500, whiteSpace:'nowrap', transition:'all .15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='var(--amber-dim)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
            >{s.nome}</button>
          ))}
          {riscos.length>8 && <span style={{ fontSize:10, color:'var(--amber)', fontFamily:'var(--font-mono)' }}>+{riscos.length-8}</span>}
        </div>
      )}
    </div>
  )
}

function SprintChart({ data, total }) {
  if (!data||!data.length) return null
  return (
    <div style={card}>
      <div style={sTitle}>presença por sprint — evolução</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:150 }}>
        {data.map(sp=>{
          const hW = total>0?(sp.workshop/total)*100:0
          const hM = total>0?(sp.mentoria/total)*100:0
          const hA = total>0?(sp.atividade/total)*100:0
          return (
            <div key={sp.n} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ fontSize:10, color:'var(--txt-2)', fontFamily:'var(--font-mono)', fontWeight:500 }}>{sp.workshop}</div>
              <div style={{ width:'100%', display:'flex', gap:2, alignItems:'flex-end', height:110 }}>
                <div title={`Workshop: ${sp.workshop}`}   style={{ flex:1, height:`${hW}%`, background:'var(--orange)', borderRadius:'4px 4px 0 0', minHeight:2 }} />
                <div title={`Mentoria: ${sp.mentoria}`}   style={{ flex:1, height:`${hM}%`, background:'#FF8C4B', borderRadius:'4px 4px 0 0', minHeight:2, opacity:.7 }} />
                <div title={`Atividade: ${sp.atividade}`} style={{ flex:1, height:`${hA}%`, background:'var(--bg-5)', borderRadius:'4px 4px 0 0', minHeight:2 }} />
              </div>
              <div style={{ fontSize:11, color:'var(--txt-2)', fontFamily:'var(--font-body)', fontWeight:600 }}>S{sp.n}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:12, borderTop:'1px solid var(--border)' }}>
        {[
          { color:'var(--orange)', label:'Workshop' },
          { color:'#FF8C4B',       label:'Mentoria' },
          { color:'var(--bg-5)',   label:'Atividades' },
        ].map(l=>(
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>
            <div style={{ width:8, height:8, background:l.color, borderRadius:2, flexShrink:0 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ startups, onSelectStartup }) {
  const m = useMemo(()=>programMetrics(startups),[startups])
  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>
      <AlertStrip startups={startups} onSelect={onSelectStartup} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
        <MetCard label="TOTAL DE STARTUPS"  value={m.total}                  sub={`${DONE_SPRINTS.length} sprints realizados`} />
        <MetCard label="PRESENÇA MÉDIA"      value={`${pct(m.avgPresenca)}%`} sub="workshop + mentoria"          color={pct(m.avgPresenca)>=70?'var(--green)':'var(--orange)'} accent />
        <MetCard label="SEM PRESENÇA"        value={m.riskMap.critico||0}     sub="nunca participaram"            color={(m.riskMap.critico||0)>5?'var(--red)':'var(--txt-2)'} accent={(m.riskMap.critico||0)>5} />
        <MetCard label="ENGAJADAS"           value={m.riskMap.engajado||0}    sub="+80% de presença"             color="var(--green)" accent />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
        <MetCard label="WORKSHOPS"   value={`${pct(m.avgWorkshop)}%`}  sub="presença média nos workshops"  color="var(--orange)" accent />
        <MetCard label="MENTORIAS"   value={`${pct(m.avgMentoria)}%`}  sub="presença média nas mentorias"  color="#FF8C4B" accent />
        <MetCard label="ATIVIDADES"  value={`${pct(m.avgAtividade)}%`} sub="completaram as atividades"     color="var(--txt-2)" />
      </div>

      <SprintChart data={m.sprintEvolution} total={m.total} />
    </div>
  )
}
