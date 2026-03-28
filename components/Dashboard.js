import { useMemo } from 'react'
import { programMetrics, pct, riskColor, riskLabel, presencaRate, autoRiskLevel } from '../lib/metrics'
import { ini } from '../lib/helpers'
import { DONE_SPRINTS } from '../lib/metrics'

// ── shared styles ─────────────────────────────────────────────────────
const card = {
  background: 'var(--white)',
  border: '1px solid var(--gray-6)',
  borderRadius: 10,
  padding: '16px 18px',
  boxShadow: '0 1px 3px rgba(0,0,0,.07)',
}
const sTitle = {
  fontSize: 10, fontWeight: 500, color: 'var(--gray-4)',
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12,
}

// ── mini bar ─────────────────────────────────────────────────────────
function Bar({ value, max, color = 'var(--orange)', height = 6 }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ background: 'var(--gray-6)', borderRadius: 3, height, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pctVal}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
  )
}

// ── metric card ───────────────────────────────────────────────────────
function MetCard({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ ...card, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={sTitle}>{label}</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: color || 'var(--black)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--gray-4)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ── sprint evolution chart ────────────────────────────────────────────
function SprintChart({ data, total }) {
  if (!data || data.length === 0) return null
  const maxVal = total

  return (
    <div style={{ ...card, gridColumn: '1 / -1' }}>
      <div style={sTitle}>Presença por sprint — evolução</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {data.map((sp) => {
          const hWorkshop  = maxVal > 0 ? (sp.workshop  / maxVal) * 100 : 0
          const hMentoria  = maxVal > 0 ? (sp.mentoria  / maxVal) * 100 : 0
          const hAtividade = maxVal > 0 ? (sp.atividade / maxVal) * 100 : 0
          return (
            <div key={sp.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', marginBottom: 2 }}>{sp.workshop}</div>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
                <div title={`Workshop: ${sp.workshop}`}   style={{ flex: 1, height: `${hWorkshop}%`,  background: 'var(--blue)',    borderRadius: '2px 2px 0 0', minHeight: 2 }} />
                <div title={`Mentoria: ${sp.mentoria}`}   style={{ flex: 1, height: `${hMentoria}%`,  background: '#7C3AED',        borderRadius: '2px 2px 0 0', minHeight: 2, opacity: .8 }} />
                <div title={`Atividade: ${sp.atividade}`} style={{ flex: 1, height: `${hAtividade}%`, background: 'var(--orange)',  borderRadius: '2px 2px 0 0', minHeight: 2, opacity: .7 }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--gray-4)', fontFamily: 'var(--font-m)' }}>S{sp.n}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        {[
          { color: 'var(--blue)',   label: 'Workshop (presença)' },
          { color: '#7C3AED',       label: 'Mentoria (presença)' },
          { color: 'var(--orange)', label: 'Atividades concluídas' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-3)' }}>
            <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── risk distribution ─────────────────────────────────────────────────
function RiskDist({ riskMap, total }) {
  const order = ['critico', 'risco', 'atencao', 'ok', 'engajado']
  const labels = { critico: 'Crítico', risco: 'Risco', atencao: 'Atenção', ok: 'Ok', engajado: 'Engajado' }
  return (
    <div style={card}>
      <div style={sTitle}>Distribuição de engajamento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.map((k) => {
          const count = riskMap[k] || 0
          const pctVal = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 70, fontSize: 11, color: riskColor(k), fontWeight: 500, flexShrink: 0 }}>{labels[k]}</div>
              <Bar value={count} max={total} color={riskColor(k)} height={8} />
              <div style={{ width: 36, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{pctVal}%</div>
              <div style={{ width: 28, textAlign: 'right', fontSize: 11, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── GT comparison ─────────────────────────────────────────────────────
function GTCard({ byGT }) {
  return (
    <div style={card}>
      <div style={sTitle}>Comparativo por grupo</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(byGT).map(([gt, data]) => (
          <div key={gt}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{gt}</span>
                <span style={{ fontSize: 10, color: 'var(--gray-4)', marginLeft: 6 }}>Mentor: {data.mentor}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-m)' }}>{data.engajados} ✓</span>
                <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-m)' }}>{data.criticos} ✕</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: pct(data.avgPresenca) >= 60 ? 'var(--green)' : pct(data.avgPresenca) >= 40 ? 'var(--amber)' : 'var(--red)', fontFamily: 'var(--font-m)' }}>{pct(data.avgPresenca)}%</span>
              </div>
            </div>
            <Bar value={pct(data.avgPresenca)} max={100} color={pct(data.avgPresenca) >= 60 ? 'var(--green)' : pct(data.avgPresenca) >= 40 ? 'var(--amber)' : 'var(--red)'} height={6} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── top list ──────────────────────────────────────────────────────────
function TopList({ title, startups, type, onSelect }) {
  const color = type === 'top' ? 'var(--green)' : 'var(--red)'
  return (
    <div style={card}>
      <div style={sTitle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {startups.map((s, i) => {
          const rate = pct(presencaRate(s))
          const risk = autoRiskLevel(s)
          return (
            <div key={s.startup_id} onClick={() => onSelect(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--gray-6)', cursor: 'pointer' }}>
              <div style={{ width: 18, fontSize: 10, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: type === 'top' ? 'var(--green-soft)' : 'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: color, flexShrink: 0 }}>{ini(s.nome)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</div>
                <div style={{ fontSize: 9, color: 'var(--gray-4)' }}>{s.nome_gt} · {s.escritorio_regional}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ width: 50 }}><Bar value={rate} max={100} color={color} height={4} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'var(--font-m)', width: 32, textAlign: 'right' }}>{rate}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── segmento chart ────────────────────────────────────────────────────
function SegmentoChart({ bySegmento }) {
  const maxTotal = Math.max(...bySegmento.map((s) => s.total))
  return (
    <div style={card}>
      <div style={sTitle}>Presença média por segmento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {bySegmento.map((s) => (
          <div key={s.seg} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 140, fontSize: 11, color: 'var(--gray-2)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.seg}</div>
            <Bar value={pct(s.avgPresenca)} max={100} color={pct(s.avgPresenca) >= 60 ? 'var(--green)' : pct(s.avgPresenca) >= 40 ? 'var(--amber)' : 'var(--red)'} height={7} />
            <div style={{ width: 32, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{pct(s.avgPresenca)}%</div>
            <div style={{ width: 20, textAlign: 'right', fontSize: 10, color: 'var(--gray-4)', flexShrink: 0 }}>{s.total}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── regiao chart ──────────────────────────────────────────────────────
function RegiaoChart({ byRegiao }) {
  return (
    <div style={card}>
      <div style={sTitle}>Presença média por escritório regional</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {byRegiao.map((r) => (
          <div key={r.reg} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 160, fontSize: 11, color: 'var(--gray-2)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reg}</div>
            <Bar value={pct(r.avgPresenca)} max={100} color={pct(r.avgPresenca) >= 60 ? 'var(--green)' : pct(r.avgPresenca) >= 40 ? 'var(--amber)' : 'var(--red)'} height={7} />
            <div style={{ width: 32, textAlign: 'right', fontSize: 11, color: 'var(--gray-3)', fontFamily: 'var(--font-m)', flexShrink: 0 }}>{pct(r.avgPresenca)}%</div>
            <div style={{ width: 20, textAlign: 'right', fontSize: 10, color: 'var(--gray-4)', flexShrink: 0 }}>{r.total}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function Dashboard({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])

  if (!startups.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-4)', fontSize: 13 }}>
        Carregando dados…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

      {/* métricas topo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <MetCard label="Total de startups"    value={m.total}                   sub={`${DONE_SPRINTS.length} sprints realizados`} />
        <MetCard label="Presença média"       value={`${pct(m.avgPresenca)}%`}    sub="workshop + mentoria"           color={pct(m.avgPresenca) >= 60 ? 'var(--green)' : 'var(--amber)'} />
        <MetCard label="Sem nenhuma presença" value={m.riskMap.critico || 0}    sub="nunca participaram"             color={m.riskMap.critico > 5 ? 'var(--red)' : 'var(--gray-3)'} />
        <MetCard label="Engajadas"            value={m.riskMap.engajado || 0}   sub="+80% de presença"              color="var(--green)" />
      </div>

      {/* segunda linha de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <MetCard label="Presença workshops"  value={`${pct(m.avgWorkshop)}%`}   sub="média nos workshops"     color="var(--blue)" />
        <MetCard label="Presença mentorias"  value={`${pct(m.avgMentoria)}%`}   sub="média nas mentorias"     color="#7C3AED" />
        <MetCard label="Atividades"          value={`${pct(m.avgAtividade)}%`}  sub="completaram as atividades" color="var(--orange)" />
      </div>

      {/* evolução de presença */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 14 }}>
        <SprintChart data={m.sprintEvolution} total={m.total} />
      </div>

      {/* risco + GT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <RiskDist riskMap={m.riskMap} total={m.total} />
        <GTCard byGT={m.byGT} />
      </div>

      {/* top engajadas + críticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <TopList title="Top 10 mais engajadas"     startups={m.topEngajadas} type="top"  onSelect={onSelectStartup} />
        <TopList title="Top 10 em situação crítica" startups={m.topCriticas}  type="risk" onSelect={onSelectStartup} />
      </div>

      {/* segmento + região */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SegmentoChart bySegmento={m.bySegmento} />
        <RegiaoChart   byRegiao={m.byRegiao} />
      </div>
    </div>
  )
}
