import { useState, useEffect } from 'react'
import { SPRINTS } from './constants'
import { calcHS as calcHSFromMetrics } from './metrics'

const LS_KEY = 'csday_v2'

export function useCSData() {
  const [data, setData] = useState({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setData(JSON.parse(stored))
    } catch {}
  }, [])

  const save = (next) => {
    setData(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
  }

  const getCS = (id) =>
    data[id] || { status: 'ativo', notes: '', lastContact: null }

  const patchCS = (id, patch) => {
    const next = { ...data, [id]: { ...getCS(id), ...patch } }
    save(next)
  }

  return { getCS, patchCS }
}

// Re-exporta calcHS do metrics para manter compatibilidade
export { calcHSFromMetrics as calcHS }

export function hsc(hs) {
  return hs >= 70 ? 'var(--green)' : hs >= 40 ? 'var(--amber)' : 'var(--red)'
}
export function hsbg(hs) {
  return hs >= 70 ? 'var(--green-soft)' : hs >= 40 ? 'var(--amber-soft)' : 'var(--red-soft)'
}

export function ini(name = '') {
  const w = (name || '').split(' ').filter(Boolean)
  return w.length >= 2
    ? w[0][0].toUpperCase() + w[1][0].toUpperCase()
    : (name || '?')[0].toUpperCase()
}

export function daysSince(iso) {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `há ${d}d`
}

export function presencaDone(s) {
  const done = SPRINTS.filter((x) => x.status !== 'fut')
  // Presença = esteve em pelo menos 1 encontro na semana (workshop OU mentoria)
  const attended = done.filter(
    (sp) => s[`workshop${sp.n}`] === true || s[`mentoria${sp.n}`] === true
  ).length
  return { attended, total: done.length }
}
