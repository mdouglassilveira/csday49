import { useState, useEffect, useCallback, useRef } from 'react'
import { SPRINTS } from './constants'
import { calcHS as calcHSFromMetrics } from './metrics'

export function useCSData() {
  const [data, setData] = useState({})
  const [loaded, setLoaded] = useState(false)
  const debounceTimers = useRef({})

  // Load from Supabase on mount
  useEffect(() => {
    fetch('/api/cs-data')
      .then(r => r.json())
      .then(json => {
        const map = {}
        ;(json.data || []).forEach(row => {
          map[row.startup_id] = {
            status: row.status || 'ativo',
            notes: row.notes || '',
            lastContact: row.last_contact || null,
          }
        })
        setData(map)
        setLoaded(true)
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('csday_v2')
          if (stored) setData(JSON.parse(stored))
        } catch {}
        setLoaded(true)
      })
  }, [])

  const getCS = useCallback((id) =>
    data[id] || { status: 'ativo', notes: '', lastContact: null },
  [data])

  const patchCS = useCallback((id, patch) => {
    setData(prev => {
      const current = prev[id] || { status: 'ativo', notes: '', lastContact: null }
      const next = { ...prev, [id]: { ...current, ...patch } }
      // Also save to localStorage as backup
      try { localStorage.setItem('csday_v2', JSON.stringify(next)) } catch {}
      return next
    })

    // Debounce the API call (300ms) to avoid hammering on every keystroke
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    debounceTimers.current[id] = setTimeout(() => {
      const body = { startup_id: id }
      if (patch.status !== undefined) body.status = patch.status
      if (patch.notes !== undefined) body.notes = patch.notes
      if (patch.lastContact !== undefined) body.last_contact = patch.lastContact

      fetch('/api/cs-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {})
    }, 300)
  }, [])

  return { getCS, patchCS, csLoaded: loaded }
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
