import { useMemo } from 'react'
import { programMetrics, pct, autoRiskLevel, DONE_SPRINTS } from '../lib/metrics'

const card = { background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }
const sTitle = { fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }

function MetCard({ label, value, sub, color }) {
  return (
    <div style={card}>
      <div style={sTitle}>{label}</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: color || 'var(--black)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--gray-4)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function AlertStrip({ startups, onSelect }) {
  const criticos = startups.filter(s => autoRiskLevel(s) === 'critico')
  const riscos   = startups.filter(s => autoRiskLevel(s) === 'risco')
  if (criticos.length === 0 && riscos.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flexShrink: 0 }}>
      {criticos.length > 0 && (
        <div style={{ background: 'var(--red-soft)', border: '1px solid #FCA5A5', borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', whiteSpace: 'nowrap', flexShrink: 0 }}>🔴 Sem presença ({criticos.length})</span>
          {criticos.slice(0, 8).map(s => (
            <button key={s.startup_id} onClick={() => onSelect(s)} style={{ fontSize: 10, padding: '2px 9px', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap', fontWeight: 500 }}>{s.nome}</button>
          ))}
          {criticos.length > 8 && <span style={{ fontSize: 11, color: 'var(--red)' }}>+{criticos.length - 8} outras</span>}
        </div>
      )}
      {riscos.length > 0 && (
        <div style={{ background: 'var(--amber-soft)', border: '1px solid #FDE68A', borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap', flexShrink: 0 }}>⚠️ Em risco ({riscos.length})</span>
          {riscos.slice(0, 8).map(s => (
            <button key={s.startup_id} onClick={() => onSelect(s)} style={{ fontSize: 10, padding: '2px 9px', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap', fontWeight: 500 }}>{s.nome}</button>
          ))}
          {riscos.length > 8 && <span style={{ fontSize: 11, color: 'var(--amber)' }}>+{riscos.length - 8} outras</span>}
        </div>
      )}
    </div>
  )
}

function SprintChart({ data, total }) {
  if (!data || data.length === 0) return null
  return (
    <div style={card}>
      <div style={sTitle}>Presença por sprint — evolução</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130 }}>
        {data.map(sp => {
          const hW = total > 0 ? (sp.workshop  / total) * 100 : 0
          const hM = total > 0 ? (sp.mentoria  / total) * 100 : 0
          const hA = total > 0 ? (sp.atividade / total) * 100 : 0
          return (
            <div key={sp.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-4)', fontFamily: 'var(--font-m)' }}>{sp.workshop}</div>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
                <div title={`Workshop: ${sp.workshop}`}   style={{ flex: 1, height: `${hW}%`, background: '#3B82F6', borderRadius: '2px 2px 0 0', minHeight: 2 }} />
                <div title={`Mentoria: ${sp.mentoria}`}   style={{ flex: 1, height: `${hM}%`, background: '#8B5CF6', borderRadius: '2px 2px 0 0', minHeight: 2 }} />
                <div title={`Atividade: ${sp.atividade}`} style={{ flex: 1, height: `${hA}%`, background: 'var(--orange)', borderRadius: '2px 2px 0 0', minHeight: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray-4)', fontFamily: 'var(--font-m)', fontWeight: 500 }}>S{sp.n}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[
          { color: '#3B82F6',       label: 'Workshop (presença)' },
          { color: '#8B5CF6',       label: 'Mentoria (presença)' },
          { color: 'var(--orange)', label: 'Atividades concluídas' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-3)' }}>
            <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2, flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])
  if (!startups.length) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-4)', fontSize: 13 }}>Carregando…</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
      <AlertStrip startups={startups} onSelect={onSelectStartup} />

      {/* métricas linha 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <MetCard label="Total de startups"    value={m.total}                  sub={`${DONE_SPRINTS.length} sprints realizados`} />
        <MetCard label="Presença média"        value={`${pct(m.avgPresenca)}%`} sub="workshop + mentoria"          color={pct(m.avgPresenca)>=70?'var(--green)':'var(--amber)'} />
        <MetCard label="Sem nenhuma presença"  value={m.riskMap.critico||0}     sub="nunca participaram"            color={(m.riskMap.critico||0)>5?'var(--red)':'var(--gray-3)'} />
        <MetCard label="Engajadas"             value={m.riskMap.engajado||0}    sub="+80% de presença"             color="var(--green)" />
      </div>

      {/* métricas linha 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <MetCard label="Presença workshops"  value={`${pct(m.avgWorkshop)}%`}  sub="média nos workshops"         color="#3B82F6" />
        <MetCard label="Presença mentorias"  value={`${pct(m.avgMentoria)}%`}  sub="média nas mentorias"         color="#8B5CF6" />
        <MetCard label="Atividades"          value={`${pct(m.avgAtividade)}%`} sub="completaram as atividades"   color="var(--orange)" />
      </div>

      {/* gráfico */}
      <SprintChart data={m.sprintEvolution} total={m.total} />
    </div>
  )
}
