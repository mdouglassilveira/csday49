import { useMemo } from 'react'
import { programMetrics, pct, autoRiskLevel, DONE_SPRINTS } from '../lib/metrics'

const card = { background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
const sTitle = { fontSize: 9, fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14, fontFamily: 'var(--font-m)' }

function MetCard({ label, value, sub, color, glow }) {
  return (
    <div style={{ ...card, borderColor: glow ? `${color}44` : 'var(--border)', boxShadow: glow ? `0 0 20px ${color}22` : 'none', transition: 'all .3s' }}>
      <div style={sTitle}>{label}</div>
      <div style={{ fontFamily: 'var(--font-m)', fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, color: color || 'var(--txt)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 6, fontFamily: 'var(--font-m)' }}>{sub}</div>}
    </div>
  )
}

function AlertStrip({ startups, onSelect }) {
  const criticos = startups.filter(s => autoRiskLevel(s) === 'critico')
  const riscos   = startups.filter(s => autoRiskLevel(s) === 'risco')
  if (!criticos.length && !riscos.length) return null

  const stripStyle = (bg, border, color) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: 8,
    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  })
  const tagStyle = (bg, color) => ({
    fontSize: 9, padding: '2px 9px', background: bg, color,
    border: 'none', borderRadius: 4, cursor: 'pointer',
    fontFamily: 'var(--font-m)', fontWeight: 700, letterSpacing: '.06em',
    whiteSpace: 'nowrap', transition: 'all .15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flexShrink: 0 }}>
      {criticos.length > 0 && (
        <div style={stripStyle('var(--red-dim)', 'var(--red)', 'var(--red)')}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>⬤ SEM PRESENÇA ({criticos.length})</span>
          {criticos.slice(0, 8).map(s => <button key={s.startup_id} onClick={() => onSelect(s)} style={tagStyle('var(--red-dim)', 'var(--red)')}>{s.nome}</button>)}
          {criticos.length > 8 && <span style={{ fontSize: 9, color: 'var(--red)', fontFamily: 'var(--font-m)' }}>+{criticos.length - 8}</span>}
        </div>
      )}
      {riscos.length > 0 && (
        <div style={stripStyle('var(--magenta-dim)', 'var(--magenta)', 'var(--magenta)')}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--magenta)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>◈ EM RISCO ({riscos.length})</span>
          {riscos.slice(0, 8).map(s => <button key={s.startup_id} onClick={() => onSelect(s)} style={tagStyle('var(--magenta-dim)', 'var(--magenta)')}>{s.nome}</button>)}
          {riscos.length > 8 && <span style={{ fontSize: 9, color: 'var(--magenta)', fontFamily: 'var(--font-m)' }}>+{riscos.length - 8}</span>}
        </div>
      )}
    </div>
  )
}

function SprintChart({ data, total }) {
  if (!data || !data.length) return null
  return (
    <div style={card}>
      <div style={sTitle}>presença por sprint — evolução</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
        {data.map(sp => {
          const hW = total > 0 ? (sp.workshop  / total) * 100 : 0
          const hM = total > 0 ? (sp.mentoria  / total) * 100 : 0
          const hA = total > 0 ? (sp.atividade / total) * 100 : 0
          return (
            <div key={sp.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)' }}>{sp.workshop}</div>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 110 }}>
                <div title={`Workshop: ${sp.workshop}`}   style={{ flex: 1, height: `${hW}%`, background: 'var(--orange)', borderRadius: '2px 2px 0 0', minHeight: 2, boxShadow: '0 0 8px var(--orange-glow)' }} />
                <div title={`Mentoria: ${sp.mentoria}`}   style={{ flex: 1, height: `${hM}%`, background: 'var(--magenta)', borderRadius: '2px 2px 0 0', minHeight: 2, boxShadow: '0 0 8px var(--magenta-glow)' }} />
                <div title={`Atividade: ${sp.atividade}`} style={{ flex: 1, height: `${hA}%`, background: 'var(--bg-5)', borderRadius: '2px 2px 0 0', minHeight: 2, border: '1px solid var(--border-3)' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt-2)', fontFamily: 'var(--font-m)', fontWeight: 600 }}>S{sp.n}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
        {[
          { color: 'var(--orange)',  label: 'WORKSHOP' },
          { color: 'var(--magenta)', label: 'MENTORIA' },
          { color: 'var(--bg-5)',    label: 'ATIVIDADES', border: '1px solid var(--border-3)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>
            <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2, flexShrink: 0, border: l.border || 'none', boxShadow: l.color !== 'var(--bg-5)' ? `0 0 6px ${l.color}88` : 'none' }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])
  if (!startups.length) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-3)', fontSize: 12, fontFamily: 'var(--font-m)' }}>carregando…</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
      <AlertStrip startups={startups} onSelect={onSelectStartup} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <MetCard label="TOTAL DE STARTUPS"   value={m.total}                  sub={`${DONE_SPRINTS.length} sprints realizados`} />
        <MetCard label="PRESENÇA MÉDIA"       value={`${pct(m.avgPresenca)}%`} sub="workshop + mentoria" color={pct(m.avgPresenca)>=70?'var(--green)':'var(--amber)'} glow />
        <MetCard label="SEM PRESENÇA"         value={m.riskMap.critico||0}     sub="nunca participaram"  color={(m.riskMap.critico||0)>5?'var(--red)':'var(--txt-2)'} glow={(m.riskMap.critico||0)>5} />
        <MetCard label="ENGAJADAS"            value={m.riskMap.engajado||0}    sub="+80% de presença"    color="var(--green)" glow />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <MetCard label="WORKSHOPS"   value={`${pct(m.avgWorkshop)}%`}  sub="presença média"   color="var(--orange)"  glow />
        <MetCard label="MENTORIAS"   value={`${pct(m.avgMentoria)}%`}  sub="presença média"   color="var(--magenta)" glow />
        <MetCard label="ATIVIDADES"  value={`${pct(m.avgAtividade)}%`} sub="completaram"      color="var(--txt-2)" />
      </div>

      <SprintChart data={m.sprintEvolution} total={m.total} />
    </div>
  )
}
