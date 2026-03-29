import { useMemo } from 'react'
import { programMetrics, pct, presencaRate, autoRiskLevel, DONE_SPRINTS } from '../lib/metrics'
import { ini } from '../lib/helpers'

const card = { background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }
const sTitle = { fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }

function Bar({ value, max, color = 'var(--orange)', height = 6 }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ background: 'var(--gray-6)', borderRadius: 3, height, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
  )
}

function RiskDist({ riskMap, total }) {
  const order = [
    { key: 'critico',  label: 'Crítico',  color: 'var(--red)'    },
    { key: 'risco',    label: 'Risco',    color: 'var(--amber)'  },
    { key: 'atencao',  label: 'Atenção',  color: '#D97706'       },
    { key: 'ok',       label: 'Ok',       color: 'var(--gray-4)' },
    { key: 'engajado', label: 'Engajado', color: 'var(--green)'  },
  ]
  return (
    <div style={card}>
      <div style={sTitle}>Distribuição de engajamento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {order.map(({ key, label, color }) => {
          const count = riskMap[key] || 0
          const w = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 68, fontSize: 11, color, fontWeight: 500, flexShrink: 0 }}>{label}</div>
              <Bar value={count} max={total} color={color} height={8} />
              <div style={{ width: 34, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{w}%</div>
              <div style={{ width: 26, textAlign: 'right', fontSize: 11, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{count}</div>
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
      <div style={sTitle}>Comparativo por grupo</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(byGT).map(([gt, data]) => (
          <div key={gt}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{gt}</span>
                <span style={{ fontSize: 10, color: 'var(--gray-4)', marginLeft: 6 }}>Mentor: {data.mentor}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-m)' }}>{data.engajados} ✓</span>
                <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-m)' }}>{data.criticos} ✕</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-m)', color: pct(data.avgPresenca)>=70?'var(--green)':pct(data.avgPresenca)>=45?'var(--amber)':'var(--red)' }}>{pct(data.avgPresenca)}%</span>
              </div>
            </div>
            <Bar value={pct(data.avgPresenca)} max={100} color={pct(data.avgPresenca)>=70?'var(--green)':pct(data.avgPresenca)>=45?'var(--amber)':'var(--red)'} height={7} />
          </div>
        ))}
      </div>
    </div>
  )
}

function TopList({ title, startups, type, onSelect }) {
  const color = type === 'top' ? 'var(--green)' : 'var(--red)'
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      {startups.map((s, i) => {
        const rate = pct(presencaRate(s))
        return (
          <div key={s.startup_id} onClick={() => onSelect(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--gray-6)', cursor: 'pointer' }}>
            <div style={{ width: 18, fontSize: 10, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: type==='top'?'var(--green-soft)':'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{ini(s.nome)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</div>
              <div style={{ fontSize: 9, color: 'var(--gray-4)' }}>{s.nome_gt} · {s.escritorio_regional}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 50 }}><Bar value={rate} max={100} color={color} height={4} /></div>
              <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-m)', width: 34, textAlign: 'right' }}>{rate}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SegmentoChart({ bySegmento }) {
  return (
    <div style={card}>
      <div style={sTitle}>Presença média por segmento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bySegmento.map(s => (
          <div key={s.seg} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 130, fontSize: 11, color: 'var(--gray-2)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.seg}</div>
            <Bar value={pct(s.avgPresenca)} max={100} color={pct(s.avgPresenca)>=70?'var(--green)':pct(s.avgPresenca)>=45?'var(--amber)':'var(--red)'} height={7} />
            <div style={{ width: 34, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{pct(s.avgPresenca)}%</div>
            <div style={{ width: 18, textAlign: 'right', fontSize: 10, color: 'var(--gray-4)', flexShrink: 0 }}>{s.total}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegiaoChart({ byRegiao }) {
  return (
    <div style={card}>
      <div style={sTitle}>Presença média por escritório regional</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {byRegiao.map(r => (
          <div key={r.reg} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 148, fontSize: 11, color: 'var(--gray-2)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reg}</div>
            <Bar value={pct(r.avgPresenca)} max={100} color={pct(r.avgPresenca)>=70?'var(--green)':pct(r.avgPresenca)>=45?'var(--amber)':'var(--red)'} height={7} />
            <div style={{ width: 34, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{pct(r.avgPresenca)}%</div>
            <div style={{ width: 18, textAlign: 'right', fontSize: 10, color: 'var(--gray-4)', flexShrink: 0 }}>{r.total}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])
  if (!startups.length) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-4)', fontSize: 13 }}>Carregando…</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <RiskDist riskMap={m.riskMap} total={m.total} />
        <GTCard byGT={m.byGT} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <TopList title="Top 10 mais engajadas"      startups={m.topEngajadas} type="top"  onSelect={onSelectStartup} />
        <TopList title="Top 10 em situação crítica"  startups={m.topCriticas}  type="risk" onSelect={onSelectStartup} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SegmentoChart bySegmento={m.bySegmento} />
        <RegiaoChart   byRegiao={m.byRegiao} />
      </div>
    </div>
  )
}
