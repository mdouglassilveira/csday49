import { useState, useEffect } from 'react'
import Head from 'next/head'
import Sidebar from '../components/Sidebar'
import DetailPanel from '../components/DetailPanel'
import Copilot from '../components/Copilot'
import Dashboard from '../components/Dashboard'
import Analytics from '../components/Analytics'
import HojeView from '../components/HojeView'
import EncountersView from '../components/EncountersView'
import StartupsView from '../components/StartupsView'
import QueueIndicator from '../components/QueueIndicator'
import { useCSData } from '../lib/helpers'
import { useQueue } from '../lib/useQueue'
import { CURRENT_SPRINT } from '../lib/constants'

export default function Home() {
  const [startups, setStartups]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [view, setView]           = useState('hoje')
  const [prevView, setPrevView]   = useState('hoje')
  const [copilotOpen, setCopilot] = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const { getCS, patchCS }        = useCSData()
  const { activeBatch, startBatch, cancelBatch, dismissBatch } = useQueue()

  async function loadData() {
    try {
      const res = await fetch('/api/startups')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error||`HTTP ${res.status}`)
      setStartups(json.data||[])
      setError(null)
    } catch(e) { setError(e.message) }
  }

  useEffect(()=>{ loadData().finally(()=>setLoading(false)) },[])
  async function sync() { setSyncing(true); await loadData(); setSyncing(false) }
  function selectStartup(s) { setSelected(s); setPrevView(view); setView('startup') }
  function goBack() { setView(prevView) }

  const titles = {
    hoje: 'Hoje',
    encontros: 'Encontros',
    'startups-table': 'Startups',
    dashboard: 'Dashboard',
    analytics: 'Análise Detalhada',
    startup: selected?.nome || 'Startup',
  }
  const subtitles = {
    hoje: `Sprint ${CURRENT_SPRINT.n}: ${CURRENT_SPRINT.tema}`,
    encontros: 'Presença por evento',
    'startups-table': `${startups.length} startups · Sprint ${CURRENT_SPRINT.n}`,
    dashboard: `${startups.length} startups · Métricas gerais`,
    analytics: 'Distribuição · Rankings · Segmentos',
    startup: selected ? `${selected.founder_nome} · ${selected.nome_gt||''}` : '',
  }

  return (
    <>
      <Head>
        <title>CS Day — 49 Educação</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>

      {loading && (
        <div style={{ position:'fixed', inset:0, background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, zIndex:999 }}>
          <div style={{ width:40, height:40, border:'2px solid var(--border-2)', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
          <div style={{ fontFamily:'var(--font-body)', fontSize:16, fontWeight:700, color:'var(--txt)', letterSpacing:'-0.2px' }}>CS Day</div>
          <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>Carregando startups…</div>
        </div>
      )}

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
        <Sidebar startups={startups} selected={selected} getCS={getCS} onSelect={selectStartup} activeView={view} onViewChange={setView} />

        <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

          {/* topbar */}
          <div style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--border)', padding:'0 24px', height:52, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {view === 'startup' ? (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={goBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:'var(--txt-3)', padding:0, transition:'color .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--orange)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--txt-3)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {titles[prevView]}
                  </button>
                  <span style={{ color:'var(--txt-3)', fontSize:12 }}>/</span>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, color:'var(--txt)', letterSpacing:'-0.2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected?.nome}</span>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, letterSpacing:'-0.2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--txt)' }}>{titles[view]}</div>
                  <div style={{ fontSize:11, color:'var(--txt-3)', marginTop:1, fontFamily:'var(--font-body)', fontWeight:400 }}>{subtitles[view]}</div>
                </>
              )}
            </div>

            <button onClick={sync} disabled={syncing} style={{ padding:'7px 14px', fontSize:11, fontWeight:500, border:'none', borderRadius:8, cursor:syncing?'not-allowed':'pointer', background:'var(--bg-3)', fontFamily:'var(--font-body)', color:'var(--txt-3)', display:'flex', alignItems:'center', gap:6, opacity:syncing?.6:1, flexShrink:0, transition:'all .15s' }}
              onMouseEnter={e=>{ if(!syncing){e.currentTarget.style.background='var(--bg-4)';e.currentTarget.style.color='var(--orange)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.background='var(--bg-3)';e.currentTarget.style.color='var(--txt-3)' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation:syncing?'spin .7s linear infinite':'none' }}>
                <path d="M11 6.5A4.5 4.5 0 116.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6.5 2L9 4.5M6.5 2L9 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {syncing?'Sincronizando…':'Sincronizar'}
            </button>

            <QueueIndicator batch={activeBatch} onCancel={cancelBatch} onDismiss={dismissBatch} />

            <button onClick={()=>setCopilot(o=>!o)} style={{ padding:'7px 14px', fontSize:11, fontWeight:500, border:'none', borderRadius:8, cursor:'pointer', background:copilotOpen?'var(--orange-dim)':'var(--bg-3)', fontFamily:'var(--font-body)', color:copilotOpen?'var(--orange)':'var(--txt-3)', display:'flex', alignItems:'center', gap:6, transition:'all .15s', flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x=".5" y=".5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 11l3-2 3 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copilot IA
            </button>
          </div>

          {error && <div style={{ margin:'10px 24px 0', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:10, padding:'10px 16px', fontSize:11, color:'var(--red)', flexShrink:0, fontFamily:'var(--font-body)', fontWeight:500 }}>Erro ao carregar dados: {error}</div>}

          <div style={{ flex:1, overflow:'hidden', padding:'14px 24px 0', display:'flex', gap:12, minHeight:0 }}>

            {view==='hoje' && (
              <>
                <HojeView startups={startups} getCS={getCS} onSelectStartup={selectStartup} />
                {copilotOpen && <div style={{ width:300, flexShrink:0, paddingBottom:14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}

            {view==='encontros' && (
              <>
                <EncountersView startups={startups} getCS={getCS} onSelectStartup={selectStartup} onStartBatch={startBatch} />
                {copilotOpen && <div style={{ width:300, flexShrink:0, paddingBottom:14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}

            {view==='startups-table' && (
              <>
                <StartupsView startups={startups} getCS={getCS} onSelectStartup={selectStartup} onStartBatch={startBatch} />
                {copilotOpen && <div style={{ width:300, flexShrink:0, paddingBottom:14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}

            {view==='dashboard' && (
              <>
                <Dashboard startups={startups} onSelectStartup={selectStartup} />
                {copilotOpen && <div style={{ width:300, flexShrink:0, paddingBottom:14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}

            {view==='analytics' && (
              <>
                <Analytics startups={startups} onSelectStartup={selectStartup} />
                {copilotOpen && <div style={{ width:300, flexShrink:0, paddingBottom:14 }}><Copilot startup={selected} cs={selected?getCS(selected.startup_id):null} getCS={getCS} allStartups={startups} /></div>}
              </>
            )}

            {view==='startup' && (
              <div style={{ flex:1, display:'grid', gridTemplateColumns:copilotOpen?'1fr 300px':'1fr', gap:12, minHeight:0, overflow:'hidden', paddingBottom:14 }}>
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
