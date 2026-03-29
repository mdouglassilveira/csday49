import { useMemo } from 'react'
import { programMetrics, pct, riskColor, presencaRate, autoRiskLevel, DONE_SPRINTS } from '../lib/metrics'
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
  const criticos = startups.filter(s => autoRiskLevel(s) === 'critico').slice(0, 6)
  const riscos   = startups.filter(s => autoRiskLevel(s) === 'risco').slice(0, 4)
  if (criticos.length === 0 && riscos.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flexShrink: 0 }}>
      {criticos.length > 0 && (
        <div style={{ background: 'var(--red-soft)', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', whiteSpace: 'nowrap', flexShrink: 0 }}>🔴 Sem presença:</span>
          {criticos.map(s => (
            <button key={s.startup_id} onClick={() => onSelect(s)} style={{ fontSize: 10, padding: '2px 9px', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap', fontWeight: 500 }}>{s.nome}</button>
          ))}
          {startups.filter(s => autoRiskLevel(s) === 'critico').length > 6 && (
            <span style={{ fontSize: 11, color: 'var(--red)' }}>+{startups.filter(s => autoRiskLevel(s) === 'critico').length - 6} outras</span>
          )}
        </div>
      )}
      {riscos.length > 0 && (
        <div style={{ background: 'var(--amber-soft)', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap', flexShrink: 0 }}>⚠️ Em risco:</span>
          {riscos.map(s => (
            <button key={s.startup_id} onClick={() => onSelect(s)} style={{ fontSize: 10, padding: '2px 9px', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap', fontWeight: 500 }}>{s.nome}</button>
          ))}
          {startups.filter(s => autoRiskLevel(s) === 'risco').length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--amber)' }}>+{startups.filter(s => autoRiskLevel(s) === 'risco').length - 4} outras</span>
          )}
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
          { color: '#3B82F6', label: 'Workshop (presença)' },
          { color: '#8B5CF6', label: 'Mentoria (presença)'  },
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
                <span style={{ fontSize: 13, fontWeight: 700, color: pct(data.avgPresenca) >= 70 ? 'var(--green)' : pct(data.avgPresenca) >= 45 ? 'var(--amber)' : 'var(--red)', fontFamily: 'var(--font-m)' }}>{pct(data.avgPresenca)}%</span>
              </div>
            </div>
            <Bar value={pct(data.avgPresenca)} max={100} color={pct(data.avgPresenca) >= 70 ? 'var(--green)' : pct(data.avgPresenca) >= 45 ? 'var(--amber)' : 'var(--red)'} height={7} />
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

export default function Dashboard({ startups, onSelectStartup }) {
  const m = useMemo(() => programMetrics(startups), [startups])

  if (!startups.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-4)', fontSize: 13 }}>Carregando…</div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>

      {/* alertas de engajamento */}
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

      {/* gráfico de evolução */}
      <div style={{ marginBottom: 10 }}>
        <SprintChart data={m.sprintEvolution} total={m.total} />
      </div>

      {/* distribuição + GT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <RiskDist riskMap={m.riskMap} total={m.total} />
        <GTCard byGT={m.byGT} />
      </div>

      {/* top engajadas + críticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <TopList title="Top 10 mais engajadas"      startups={m.topEngajadas} type="top"  onSelect={onSelectStartup} />
        <TopList title="Top 10 em situação crítica"  startups={m.topCriticas}  type="risk" onSelect={onSelectStartup} />
      </div>

      {/* segmento + região */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SegmentoChart bySegmento={m.bySegmento} />
        <RegiaoChart   byRegiao={m.byRegiao} />
      </div>
    </div>
  )
}
