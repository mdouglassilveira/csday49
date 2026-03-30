import { SPRINTS } from './constants'

// Sprints que já aconteceram
export const DONE_SPRINTS = SPRINTS.filter((s) => s.status !== 'fut')
export const TOTAL_DONE = DONE_SPRINTS.length

// ── presença nos encontros ao vivo ────────────────────────────────────
// workshop_N = presente no Workshop (terça 10h)
// mentoria_N = presente na Mentoria (quinta 10h)
// sprint_N   = completou as atividades da semana (não é presença)

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

export function atividadeRate(s) {
  if (TOTAL_DONE === 0) return 0
  const done = DONE_SPRINTS.filter((sp) => s[`sprint_${sp.n}`] === true).length
  return done / TOTAL_DONE
}

// Presença geral = média de workshop + mentoria (os encontros ao vivo)
export function presencaRate(s) {
  return (workshopRate(s) + mentoriaRate(s)) / 2
}

// Quantos sprints participou de pelo menos 1 encontro (workshop OU mentoria)
export function encontrosPresente(s) {
  return DONE_SPRINTS.filter(
    (sp) => s[`workshop${sp.n}`] === true || s[`mentoria${sp.n}`] === true
  ).length
}

// Semana completa: workshop + mentoria + atividade
export function semanasCompletas(s) {
  return DONE_SPRINTS.filter(
    (sp) => s[`workshop${sp.n}`] && s[`mentoria${sp.n}`] && s[`sprint_${sp.n}`]
  ).length
}

// Ausências recentes — quantos sprints seguidos sem nenhum encontro (do mais recente)
export function recentAbsences(s) {
  let count = 0
  for (let i = DONE_SPRINTS.length - 1; i >= 0; i--) {
    const sp = DONE_SPRINTS[i]
    const presente = s[`workshop${sp.n}`] || s[`mentoria${sp.n}`]
    if (!presente) count++
    else break
  }
  return count
}

// Nível de risco automático — baseado em presença nos encontros
export function autoRiskLevel(s) {
  const rate    = presencaRate(s)
  const absences = recentAbsences(s)
  const esteve   = encontrosPresente(s)

  if (esteve === 0)      return 'critico'   // nunca apareceu em nenhum encontro
  if (absences >= 2)     return 'critico'   // sumiu nos últimos 2+ sprints
  if (rate < 0.4)        return 'risco'     // menos de 40% de presença
  if (absences === 1)    return 'atencao'   // faltou só o último
  if (rate >= 0.8)       return 'engajado'  // 80%+ de presença
  return 'ok'
}

// ── Health Score (0–99) ───────────────────────────────────────────────
// 50% workshop + 50% mentoria + bônus de atividades
export function calcHS(s, cs) {
  const wRate = workshopRate(s)
  const mRate = mentoriaRate(s)
  const aRate = atividadeRate(s)

  // base: média dos dois encontros ao vivo
  let score = Math.round(((wRate + mRate) / 2) * 100)

  // bônus de até 10 pontos por atividades completadas
  score += Math.round(aRate * 10)

  // ajuste por status manual do CS
  if (cs?.status === 'churn')   score = Math.min(score, 25)
  if (cs?.status === 'risco')   score = Math.min(score, 55)
  if (cs?.status === 'inativo') score = Math.min(score, 45)

  return Math.max(5, Math.min(99, score))
}

// ── métricas gerais do programa ───────────────────────────────────────
export function programMetrics(startups) {
  const total = startups.length
  if (total === 0) return {}

  const avgWorkshop  = avg(startups.map(workshopRate))
  const avgMentoria  = avg(startups.map(mentoriaRate))
  const avgPresenca  = avg(startups.map(presencaRate))
  const avgAtividade = avg(startups.map(atividadeRate))

  // distribuição de risco
  const riskMap = { critico: 0, risco: 0, atencao: 0, ok: 0, engajado: 0 }
  startups.forEach((s) => { riskMap[autoRiskLevel(s)]++ })

  // evolução por sprint
  const sprintEvolution = DONE_SPRINTS.map((sp) => ({
    n:        sp.n,
    tema:     sp.tema,
    workshop: startups.filter((s) => s[`workshop${sp.n}`]).length,
    mentoria: startups.filter((s) => s[`mentoria${sp.n}`]).length,
    atividade:startups.filter((s) => s[`sprint_${sp.n}`]).length,
  }))

  // por grupo
  const byGT = {}
  ;['GT1', 'GT2', 'GT3'].forEach((gt) => {
    const group = startups.filter((s) => s.nome_gt === gt)
    byGT[gt] = {
      total:       group.length,
      mentor:      group[0]?.nome_mentor || '—',
      avgPresenca: avg(group.map(presencaRate)),
      criticos:    group.filter((s) => autoRiskLevel(s) === 'critico').length,
      engajados:   group.filter((s) => autoRiskLevel(s) === 'engajado').length,
    }
  })

  // por segmento (top 8)
  const segMap = {}
  startups.forEach((s) => {
    const seg = s.segmento || 'Outros'
    if (!segMap[seg]) segMap[seg] = { total: 0, sum: 0 }
    segMap[seg].total++
    segMap[seg].sum += presencaRate(s)
  })
  const bySegmento = Object.entries(segMap)
    .map(([seg, v]) => ({ seg, total: v.total, avgPresenca: v.sum / v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // por escritório
  const regMap = {}
  startups.forEach((s) => {
    const reg = s.escritorio_regional || 'Outros'
    if (!regMap[reg]) regMap[reg] = { total: 0, sum: 0 }
    regMap[reg].total++
    regMap[reg].sum += presencaRate(s)
  })
  const byRegiao = Object.entries(regMap)
    .map(([reg, v]) => ({ reg, total: v.total, avgPresenca: v.sum / v.total }))
    .sort((a, b) => b.total - a.total)

  // rankings
  const sortedDesc = [...startups].sort((a, b) => presencaRate(b) - presencaRate(a))
  const topEngajadas = sortedDesc.slice(0, 10)
  const topCriticas  = [...startups]
    .sort((a, b) => presencaRate(a) - presencaRate(b))
    .slice(0, 10)

  return {
    total, avgWorkshop, avgMentoria, avgPresenca, avgAtividade,
    riskMap, sprintEvolution,
    byGT, bySegmento, byRegiao,
    topEngajadas, topCriticas,
  }
}

// ── helpers ───────────────────────────────────────────────────────────
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

// ── helpers para novas views ─────────────────────────────────────────

// Retorna presentes e ausentes para um evento específico
export function getEventAttendance(startups, sprintN, eventType) {
  const field = eventType === 'workshop' ? `workshop${sprintN}` :
                eventType === 'mentoria' ? `mentoria${sprintN}` :
                `sprint_${sprintN}`
  const present = startups.filter(s => s[field] === true)
  const absent  = startups.filter(s => s[field] !== true)
  const rate = startups.length > 0 ? present.length / startups.length : 0
  return { present, absent, rate, total: startups.length }
}

// Retorna startups que precisam de follow-up (sem contato há X dias)
export function getStartupsNeedingFollowup(startups, getCS, dayThreshold = 7) {
  return startups.filter(s => {
    const cs = getCS(s.startup_id)
    if (!cs.lastContact) return true
    const days = Math.floor((Date.now() - new Date(cs.lastContact).getTime()) / 86400000)
    return days >= dayThreshold
  })
}
