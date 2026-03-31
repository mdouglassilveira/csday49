import { useState, useEffect, useMemo } from 'react'

export function useCalendario() {
  const [raw, setRaw] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/calendario')
      .then(r => r.json())
      .then(j => { setRaw(j.data || []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // All individual events (workshops + mentorias), sorted by date
  const events = useMemo(() => {
    return raw.map(e => ({
      id: e.id,
      sprint: e.sprint,
      nome: e.encontro,
      tipo: e.tipo, // "Workshop" or "Mentoria"
      data: new Date(e.data),
      dataStr: e.data,
      capa: e.capa,
      descricao: e.descrição || e.descricao || '',
      linkAula: e.link_aula || '',
      linkGravacao: e.link_gravacao || '',
      linkSlides: e.link_slides || '',
      modalidade: e.modalidade || 'Online',
      marcarPresenca: e.marcar_presenca,
    })).sort((a, b) => a.data - b.data)
  }, [raw])

  // Sprints grouped (compatible with old SPRINTS format + extra data)
  const sprints = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.sprint]) {
        map[e.sprint] = {
          n: e.sprint,
          tema: e.nome,
          events: [],
        }
      }
      map[e.sprint].events.push(e)

      if (e.tipo === 'Workshop') {
        map[e.sprint].workshop = e
        map[e.sprint].wkDate = e.data
        map[e.sprint].wk = e.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }
      if (e.tipo === 'Mentoria') {
        map[e.sprint].mentoria_event = e
        map[e.sprint].mtDate = e.data
        map[e.sprint].mt = e.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }
    })

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return Object.values(map)
      .sort((a, b) => a.n - b.n)
      .map(sp => {
        // Determine status based on dates
        const lastEvent = sp.mtDate || sp.wkDate
        const firstEvent = sp.wkDate || sp.mtDate
        let status = 'fut'
        if (lastEvent && lastEvent < now) status = 'done'
        else if (firstEvent && firstEvent <= now) status = 'now'
        // Also check: if sprint has any event today, it's "now"
        if (sp.events.some(e => e.data.toDateString() === now.toDateString())) status = 'now'

        return { ...sp, status }
      })
  }, [events])

  const doneSprints = useMemo(() => sprints.filter(s => s.status !== 'fut'), [sprints])
  const currentSprint = useMemo(() => sprints.find(s => s.status === 'now') || doneSprints[doneSprints.length - 1] || sprints[0], [sprints, doneSprints])

  // Current or most recent event
  const currentEvent = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Check for event today
    const todayEvent = events.find(e => e.data.toDateString() === today.toDateString())
    if (todayEvent) return todayEvent

    // Most recent past event
    const past = events.filter(e => e.data <= now)
    return past.length > 0 ? past[past.length - 1] : events[0] || null
  }, [events])

  // Next upcoming event
  const nextEvent = useMemo(() => {
    const now = new Date()
    return events.find(e => e.data > now) || null
  }, [events])

  return {
    events,       // All individual events
    sprints,      // Grouped by sprint (SPRINTS-compatible)
    doneSprints,  // Only completed sprints
    currentSprint,
    currentEvent, // Today's or most recent event
    nextEvent,    // Next upcoming event
    loaded,
  }
}
