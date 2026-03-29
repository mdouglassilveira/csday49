import { useState, useEffect } from 'react'
import Head from 'next/head'
import Sidebar from '../components/Sidebar'
import DetailPanel from '../components/DetailPanel'
import Copilot from '../components/Copilot'
import Dashboard from '../components/Dashboard'
import Analytics from '../components/Analytics'
import { useCSData } from '../lib/helpers'
import { CURRENT_SPRINT } from '../lib/constants'

export default function Home() {
  const [startups, setStartups]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [view, setView]           = useState('dashboard')
  const [copilotOpen, setCopilot] = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const { getCS, patchCS }        = useCSData()

  async function loadData() {
    try {
      const res = await fetch('/api/startups')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setStartups(json.data || [])
      setError(null)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [])
  async function sync() { setSyncing(true); await loadData(); setSyncing(false) }
  function selectStartup(s) { setSelected(s); setView('startup') }

  const viewTitle = {
    dashboard: 'START PRIMEIRAS VENDAS 2026',
    analytics: 'ANÁLISE DETALHADA',
    startup:   selected?.nome?.toUpperCase() || 'STARTUP',
  }
  const viewSub = {
    dashboard: `${startups.length} startups · sprint ${CURRENT_SPRINT.n}: ${CURRENT_SPRINT.tema}`,
    analytics: 'distribuição · rankings · segmentos · regiões',
    startup:   selected ? `${selected.founder_nome} · ${selected.founder_email}` : '',
  }

  return (
    <>
      <Head>
        <title>CS Day</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 999 }}>
          <div style={{ width: 40, height: 40, border: '2px solid var(--border-2)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin .7s linear infinite', boxShadow: '0 0 20px var(--orange-glow)' }} />
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 16, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.1em' }}>CS DAY</div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)', fontFamily: 'var(--font-m)', letterSpacing: '.08em' }}>CARREGANDO STARTUPS…</div>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        <Sidebar startups={startups} selected={selected} getCS={getCS} onSelect={selectStartup} activeView={view} onViewChange={setView} />

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          {/* topbar */}
          <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 13, fontWeight: 700, letterSpacing: '.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--txt)' }}>{viewTitle[view]}</div>
              <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>{viewSub[view]}</div>
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

            <button onClick={sync} disabled={syncing} style={{ padding: '6px 14px', fontSize: 9, fontWeight: 700, border: '1px solid var(--border-2)', borderRadius: 6, cursor: syncing?'not-allowed':'pointer', background: 'transparent', fontFamily: 'var(--font-m)', color: 'var(--txt-2)', display: 'flex', alignItems: 'center', gap: 5, opacity: syncing?.6:1, letterSpacing: '.08em', transition: 'all .15s', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: syncing?'spin .7s linear infinite':'none' }}>
                <path d="M11 6.5A4.5 4.5 0 116.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6.5 2L9 4.5M6.5 2L9 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {syncing ? 'SYNC…' : 'SYNC'}
            </button>

            <button onClick={() => setCopilot(o => !o)} style={{ padding: '6px 14px', fontSize: 9, fontWeight: 700, border: `1px solid ${copilotOpen?'var(--magenta)':'var(--border-2)'}`, borderRadius: 6, cursor: 'pointer', background: copilotOpen?'var(--magenta-dim)':'transparent', fontFamily: 'var(--font-m)', color: copilotOpen?'var(--magenta)':'var(--txt-2)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s', letterSpacing: '.08em', flexShrink: 0, boxShadow: copilotOpen?'0 0 10px var(--magenta-glow)':'none' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x=".5" y=".5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 11l3-2 3 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              COPILOT IA
            </button>
          </div>

          {error && <div style={{ margin: '10px 24px 0', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 8, padding: '8px 14px', fontSize: 10, color: 'var(--red)', flexShrink: 0, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>ERR: {error}</div>}

          <div style={{ flex: 1, overflow: 'hidden', padding: '14px 24px 0', display: 'flex', gap: 12, minHeight: 0 }}>
            {view === 'dashboard' && (
              <>
                <Dashboard startups={startups} onSelectStartup={selectStartup} />
                {copilotOpen && <div style={{ width: 300, flexShrink: 0, paddingBottom: 14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}
            {view === 'analytics' && (
              <>
                <Analytics startups={startups} onSelectStartup={selectStartup} />
                {copilotOpen && <div style={{ width: 300, flexShrink: 0, paddingBottom: 14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}
            {view === 'startup' && (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: copilotOpen?'1fr 300px':'1fr', gap: 12, minHeight: 0, overflow: 'hidden', paddingBottom: 14 }}>
                <DetailPanel startup={selected} cs={selected?getCS(selected.startup_id):null} patchCS={patchCS} />
                {copilotOpen && <Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
