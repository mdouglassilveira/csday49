import { useMemo } from 'react'
import { programMetrics, pct, preseazncaRate, autoRiskLevel } from '../lib/metrics'
import { ini } from '../lib/helpers'

const card = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }
const sTitle = { fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:14 }

function Bar({ value, max, color, height=6 }) {
  const w = max>0?Math.round((value/max)*100):0
  return (
    <div style={{ background:'var(--bg-4)', borderRadius:2, height, overflow:'hidden', flex:1 }}>
      <div style={{ width:`${w}%`, height:'100%', background:color, borderRadius:2, transition:'width .5s ease' }} />
    </div>
  )
}

function presColor(p) { return p>=70?'var(--green)':p>=45?'var(--amber)':'var(--red)' }

function RiskDist({ riskMap, total }) {
  const rows = [
    { key:'critico',  label:'Crítico',  color:'var(--red)'    },
    { key:'risco',    label:'Risco',    color:'var(--amber)'  },
    { key:'atencao',  label:'Atenção',  color:'var(--orange)' },
    { key:'ok',       label:'Ok',       color:'var(--txt-3)'  },
    { key:'engajado', label:'Engajado', color:'var(--green)'  },
  ]
  return (
    <div style={card}>
      <div style={sTitle}>distribuição de engajamento</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {rows.map(({ key,label,color })=>{
          const count = riskMap[key]||0
          const w = total>0?Math.round((count/total)*100):0
          return (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:68, fontSize:11, color, fontWeight:600, flexShrink:0, fontFamily:'var(--font-body)' }}>{label}</div>
              <Bar value={count} max={total} color={color} height={7} />
              <div style={{ width:34, textAlign:'right', fontSize:11, color:'var(--txt-2)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{w}%</div>
              <div style={{ width:24, textAlign:'right', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GTCard({ byGT }) {
  return (
    <div style={card}>
      <div style={sTitle}>comparativo por grupo</div>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {Object.entries(byGT).map(([gt,data])=>{
          const p = pct(data.avgPresenca)
          const col = presColor(p)
          return (
            <div key={gt}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'var(--font-title)', fontSize:20, color:'var(--orange)' }}>{gt}</span>
                  <span style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>{data.mentor}</span>
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:10, color:'var(--green)', fontFamily:'var(--font-mono)' }}>{data.engajados} ✓</span>
                  <span style={{ fontSize:10, color:'var(--red)', fontFamily:'var(--font-mono)' }}>{data.criticos} ✕</span>
                  <span style={{ fontFamily:'var(--font-title)', fontSize:22, color:col }}>{p}%</span>
                </div>
              </div>
              <Bar value={p} max={100} color={col} height={6} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopList({ title, startups, type, onSelect }) {
  const color = type==='top'?'var(--green)':'var(--red)'
  const dimColor = type==='top'?'var(--green-dim)':'var(--red-dim)'
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      {startups.map((s,i)=>{
        const rate = pct(presencaRate(s))
        return (
          <div key={s.startup_id} onClick={()=>onSelect(s)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'opacity .15s' }}
            onMouseEnter={e=>e.currentTarget.style.opacity='.75'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            <div style={{ width:20, fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{String(i+1).padStart(2,'0')}</div>
            <div style={{ width:30, height:30, borderRadius:6, background:dimColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color, flexShrink:0, fontFamily:'var(--font-body)', border:`1px solid ${color}44` }}>{ini(s.nome)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--txt)', fontFamily:'var(--font-body)' }}>{s.nome}</div>
              <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>{s.nome_gt} · {s.escritorio_regional}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
              <div style={{ width:50 }}><Bar value={rate} max={100} color={color} height={4} /></div>
              <span style={{ fontSize:12, fontWeight:700, color, fontFamily:'var(--font-title)', width:36, textAlign:'right' }}>{rate}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HorzChart({ title, rows, keyLabel, valueKey }) {
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {rows.map((r,i)=>{
          const p = pct(r[valueKey])
          const col = presColor(p)
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:130, fontSize:11, color:'var(--txt-2)', flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:'var(--font-body)', fontWeight:400 }}>{r[keyLabel]}</div>
              <Bar value={p} max={100} color={col} height={6} />
              <div style={{ width:36, textAlign:'right', fontSize:11, color:col, fontFamily:'var(--font-title)', fontWeight:400, flexShrink:0 }}>{p}%</div>
              <div style={{ width:18, textAlign:'right', fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{r.total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics({ startups, onSelectStartup }) {
  const m = useMemo(()=>programMetrics(startups),[startups])
  if (!startups.length) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:12, fontFamily:'var(--font-body)' }}>Carregando…</div>

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:24 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <RiskDist riskMap={m.riskMap} total={m.total} />
        <GTCard byGT={m.byGT} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <TopList title="top 10 mais engajadas"      startups={m.topEngajadas} type="top"  onSelect={onSelectStartup} />
        <TopList title="top 10 em situação crítica"  startups={m.topCriticas}  type="risk" onSelect={onSelectStartup} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <HorzChart title="presença por segmento"           rows={m.bySegmento} keyLabel="seg" valueKey="avgPresenca" />
        <HorzChart title="presença por escritório regional" rows={m.byRegiao}   keyLabel="reg" valueKey="avgPresenca" />
      </div>
    </div>
  )
}
