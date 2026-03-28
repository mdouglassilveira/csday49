import { SPRINTS } from './constants'

// Sprints que já aconteceram
export const DONE_SPRINTS = SPRINTS.filter((s) => s.status !== 'fut')
export const TOTAL_DONE = DONE_SPRINTS.length

// ── por startup ──────────────────────────────────────────────────────
export function sprintRate(s) {
  if (TOTAL_DONE === 0) return 0
  const attended = DONE_SPRINTS.filter((sp) => s[`sprint_${sp.n}`] === true).length
  return attended / TOTAL_DONE
}

export function workshopRate(s) {
  if (TOTAL_DONE === 0) return 0
  const attended = DONE_SPRINTS.filter((sp) => s[`workshop${sp.n}`] === true).length
  return attended / TOTAL_DONE
}

export function mentoriaRate(s) {
  if (TOTAL_DONE === 0) return 0
  const attended = DONE_SPRINTS.filter((sp) => s[`mentoria${sp.n}`] === true).length
  return attended / TOTAL_DONE
}

// Participação completa (sprint + workshop + mentoria na mesma semana)
export function fullWeeks(s) {
  return DONE_SPRINTS.filter(
    (sp) => s[`sprint_${sp.n}`] && s[`workshop${sp.n}`] && s[`mentoria${sp.n}`]
  ).length
}

// Último sprint que participou (número do sprint, ou null)
export function lastSprintAttended(s) {
  const attended = DONE_SPRINTS.filter((sp) => s[`sprint_${sp.n}`] === true)
  if (attended.length === 0) return null
  return attended[attended.length - 1].n
}

// Sequência de ausências recentes (sprints seguidos sem participar, do mais recente)
export function recentAbsences(s) {
  let count = 0
  for (let i = DONE_SPRINTS.length - 1; i >= 0; i--) {
    if (!s[`sprint_${DONE_SPRINTS[i].n}`]) count++
    else break
  }
  return count
}

// Detecta risco automático
export function autoRiskLevel(s) {
  const rate = sprintRate(s)
  const absences = recentAbsences(s)
  const last = lastSprintAttended(s)

  if (last === null) return 'critico'         // nunca participou
  if (absences >= 2) return 'critico'         // 2+ ausências seguidas
  if (rate < 0.4)    return 'risco'           // menos de 40% de presença
  if (absences === 1) return 'atencao'        // 1 ausência recente
  if (rate >= 0.8)   return 'engajado'
  return 'ok'
}

// ── métricas gerais do programa ──────────────────────────────────────
export function programMetrics(startups) {
  const total = startups.length
  if (total === 0) return {}

  // presença média geral
  const avgSprint   = avg(startups.map(sprintRate))
  const avgWorkshop = avg(startups.map(workshopRate))
  const avgMentoria = avg(startups.map(mentoriaRate))

  // distribuição de risco automático
  const riskMap = { critico: 0, risco: 0, atencao: 0, ok: 0, engajado: 0 }
  startups.forEach((s) => { riskMap[autoRiskLevel(s)]++ })

  // evolução de presença sprint a sprint
  const sprintEvolution = DONE_SPRINTS.map((sp) => ({
    n: sp.n,
    tema: sp.tema,
    sprint:   startups.filter((s) => s[`sprint_${sp.n}`]).length,
    workshop: startups.filter((s) => s[`workshop${sp.n}`]).length,
    mentoria: startups.filter((s) => s[`mentoria${sp.n}`]).length,
  }))

  // por grupo
  const byGT = {}
  ;['GT1', 'GT2', 'GT3'].forEach((gt) => {
    const group = startups.filter((s) => s.nome_gt === gt)
    byGT[gt] = {
      total: group.length,
      mentor: group[0]?.nome_mentor || '—',
      avgPresence: avg(group.map(sprintRate)),
      criticos: group.filter((s) => autoRiskLevel(s) === 'critico').length,
      engajados: group.filter((s) => autoRiskLevel(s) === 'engajado').length,
    }
  })

  // por segmento (top 8)
  const segMap = {}
  startups.forEach((s) => {
    const seg = s.segmento || 'Outros'
    if (!segMap[seg]) segMap[seg] = { total: 0, presenceSum: 0 }
    segMap[seg].total++
    segMap[seg].presenceSum += sprintRate(s)
  })
  const bySegmento = Object.entries(segMap)
    .map(([seg, v]) => ({ seg, total: v.total, avgPresence: v.presenceSum / v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // por escritório
  const regMap = {}
  startups.forEach((s) => {
    const reg = s.escritorio_regional || 'Outros'
    if (!regMap[reg]) regMap[reg] = { total: 0, presenceSum: 0 }
    regMap[reg].total++
    regMap[reg].presenceSum += sprintRate(s)
  })
  const byRegiao = Object.entries(regMap)
    .map(([reg, v]) => ({ reg, total: v.total, avgPresence: v.presenceSum / v.total }))
    .sort((a, b) => b.total - a.total)

  // top engajadas e críticas
  const sorted = [...startups].sort((a, b) => sprintRate(b) - sprintRate(a))
  const topEngajadas = sorted.slice(0, 10)
  const topCriticas  = [...startups]
    .sort((a, b) => sprintRate(a) - sprintRate(b))
    .slice(0, 10)

  return {
    total, avgSprint, avgWorkshop, avgMentoria,
    riskMap, sprintEvolution,
    byGT, bySegmento, byRegiao,
    topEngajadas, topCriticas,
  }
}

// ── helpers internos ─────────────────────────────────────────────────
function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function pct(rate) {
  return Math.round(rate * 100)
}

export function riskColor(level) {
  return {
    critico:  'var(--red)',
    risco:    'var(--amber)',
    atencao:  '#D97706',
    ok:       'var(--gray-4)',
    engajado: 'var(--green)',
  }[level] || 'var(--gray-4)'
}

export function riskLabel(level) {
  return {
    critico:  'Crítico',
    risco:    'Risco',
    atencao:  'Atenção',
    ok:       'Ok',
    engajado: 'Engajado',
  }[level] || level
}
