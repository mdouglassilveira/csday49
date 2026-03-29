import { useMemo } from 'react'
import { programMetrics, pct, presencaRate, autoRiskLevel } from '../lib/metrics'
import { ini } from '../lib/helpers'

const card = { background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
const sTitle = { fontSize: 9, fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14, fontFamily: 'var(--font-m)' }

function Bar({ value, max, color, height = 6 }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ background: 'var(--bg-4)', borderRadius: 2, height, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 2, transition: 'width .5s ease', boxShadow: `0 0 6px ${color}66` }} />
    </div>
  )
}

function presColor(p) { return p >= 70 ? 'var(--green)' : p >= 45 ? 'var(--amber)' : 'var(--red)' }

function RiskDist({ riskMap, total }) {
  const rows = [
    { key: 'critico',  label: 'CRÍTICO',  color: 'var(--red)'     },
    { key: 'risco',    label: 'RISCO',    color: 'var(--magenta)' },
    { key: 'atencao',  label: 'ATENÇÃO',  color: 'var(--amber)'   },
    { key: 'ok',       label: 'OK',       color: 'var(--txt-3)'   },
    { key: 'engajado', label: 'ENGAJADO', color: 'var(--green)'   },
  ]
  return (
    <div style={card}>
      <div style={sTitle}>distribuição de engajamento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(({ key, label, color }) => {
          const count = riskMap[key] || 0
          const w = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 64, fontSize: 9, color, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>{label}</div>
              <Bar value={count} max={total} color={color} height={7} />
              <div style={{ width: 32, textAlign: 'right', fontSize: 10, color: 'var(--txt-2)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{w}%</div>
              <div style={{ width: 24, textAlign: 'right', fontSize: 10, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{count}</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(byGT).map(([gt, data]) => {
          const p = pct(data.avgPresenca)
          const col = presColor(p)
          return (
            <div key={gt}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', fontFamily: 'var(--font-m)' }}>{gt}</span>
                  <span style={{ fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>{data.mentor}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: 'var(--font-m)' }}>{data.engajados} ✓</span>
                  <span style={{ fontSize: 9, color: 'var(--red)', fontFamily: 'var(--font-m)' }}>{data.criticos} ✕</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-m)', color: col, textShadow: `0 0 10px ${col}` }}>{p}%</span>
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
  const color = type === 'top' ? 'var(--green)' : 'var(--red)'
  const magColor = type === 'top' ? 'var(--green-dim)' : 'var(--red-dim)'
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      {startups.map((s, i) => {
        const rate = pct(presencaRate(s))
        return (
          <div key={s.startup_id} onClick={() => onSelect(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid var(--border)`, cursor: 'pointer', transition: 'opacity .15s' }}>
            <div style={{ width: 18, fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</div>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: magColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color, flexShrink: 0, fontFamily: 'var(--font-m)', border: `1px solid ${color}44` }}>{ini(s.nome)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--txt)' }}>{s.nome}</div>
              <div style={{ fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>{s.nome_gt} · {s.escritorio_regional}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 48 }}><Bar value={rate} max={100} color={color} height={4} /></div>
              <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-m)', width: 34, textAlign: 'right' }}>{rate}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HorzChart({ title, rows, keyLabel, valueKey }) {
  const max = Math.max(...rows.map(r => pct(r[valueKey])), 1)
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => {
          const p = pct(r[valueKey])
          const col = presColor(p)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 130, fontSize: 10, color: 'var(--txt-2)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-m)' }}>{r[keyLabel]}</div>
              <Bar value={p} max={100} color={col} height={6} />
              <div style={{ width: 34, textAlign: 'right', fontSize: 10, color: col, fontFamily: 'var(--font-m)', fontWeight: 600, flexShrink: 0 }}>{p}%</div>
              <div style={{ width: 18, textAlign: 'right', fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{r.total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])
  if (!startups.length) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-3)', fontSize: 12, fontFamily: 'var(--font-m)' }}>carregando…</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <RiskDist riskMap={m.riskMap} total={m.total} />
        <GTCard byGT={m.byGT} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <TopList title="top 10 mais engajadas"     startups={m.topEngajadas} type="top"  onSelect={onSelectStartup} />
        <TopList title="top 10 em situação crítica" startups={m.topCriticas}  type="risk" onSelect={onSelectStartup} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <HorzChart title="presença por segmento"          rows={m.bySegmento} keyLabel="seg" valueKey="avgPresenca" />
        <HorzChart title="presença por escritório regional" rows={m.byRegiao}   keyLabel="reg" valueKey="avgPresenca" />
      </div>
    </div>
  )
}
