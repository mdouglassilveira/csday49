import { useState, useEffect } from 'react'
import { SPRINTS } from './constants'

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

// Health score baseado em presença real do banco (sprint_1..sprint_10)
export function calcHS(s, cs) {
  const done = SPRINTS.filter((x) => x.status !== 'fut')
  const total = done.length
  if (total === 0) return 50

  const attended = done.filter((sp) => s[`sprint_${sp.n}`] === true).length
  const rate = attended / total

  // base = taxa de presença × 100, com floor de 10
  let score = Math.round(rate * 100)

  // ajustes por status CS
  if (cs?.status === 'churn')   score = Math.min(score, 25)
  if (cs?.status === 'risco')   score = Math.min(score, 55)
  if (cs?.status === 'inativo') score = Math.min(score, 45)

  // boost se nunca teve nenhum sprint ainda (turma nova)
  if (total === 0) score = 50

  return Math.max(5, Math.min(99, score))
}

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

// Retorna quantos sprints a startup participou (campo real do banco)
export function presencaTotal(s) {
  return SPRINTS.filter((sp) => s[`sprint_${sp.n}`] === true).length
}

export function presencaDone(s) {
  const done = SPRINTS.filter((x) => x.status !== 'fut')
  const attended = done.filter((sp) => s[`sprint_${sp.n}`] === true).length
  return { attended, total: done.length }
}
