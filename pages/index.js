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
      if (!res.ok) throw new Error(json.error||`HTTP ${res.status}`)
      setStartups(json.data||[])
      setError(null)
    } catch(e) { setError(e.message) }
  }

  useEffect(()=>{ loadData().finally(()=>setLoading(false)) },[])
  async function sync() { setSyncing(true); await loadData(); setSyncing(false) }
  function selectStartup(s) { setSelected(s); setView('startup') }

  const topTitle = {
    dashboard: 'START Primeiras Vendas 2026',
    analytics: 'Análise Detalhada',
    startup: selected?.nome || 'Startup',
  }
  const topSub = {
    dashboard: `${startups.length} startups · Sprint ${CURRENT_SPRINT.n}: ${CURRENT_SPRINT.tema}`,
    analytics: 'Distribuição · Rankings · Segmentos · Regiões',
    startup: selected ? `${selected.founder_nome} · ${selected.founder_email}` : '',
  }

  return (
    <>
      <Head>
        <title>CS Day — 49 Educação</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>

      {loading && (
        <div style={{ position:'fixed', inset:0, background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, zIndex:999 }}>
          <div style={{ width:44, height:44, border:'2px solid var(--border-2)', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin .7s linear infinite', boxShadow:'0 0 20px var(--orange-glow)' }} />
          <div style={{ fontFamily:'var(--font-title)', fontSize:22, color:'var(--orange)', letterSpacing:'.08em' }}>CS Day</div>
          <div style={{ fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400, letterSpacing:'.06em' }}>Carregando startups…</div>
        </div>
      )}

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
        <Sidebar startups={startups} selected={selected} getCS={getCS} onSelect={selectStartup} activeView={view} onViewChange={setView} />

        <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

          {/* topbar */}
          <div style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--border)', padding:'0 24px', height:52, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-title)', fontSize:16, letterSpacing:'.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--txt)' }}>{topTitle[view]}</div>
              <div style={{ fontSize:10, color:'var(--txt-3)', marginTop:1, fontFamily:'var(--font-body)', fontWeight:400 }}>{topSub[view]}</div>
            </div>

            <div style={{ width:1, height:20, background:'var(--border)', flexShrink:0 }} />

            <button onClick={sync} disabled={syncing} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, border:'1px solid var(--border-2)', borderRadius:6, cursor:syncing?'not-allowed':'pointer', background:'transparent', fontFamily:'var(--font-body)', color:'var(--txt-3)', display:'flex', alignItems:'center', gap:5, opacity:syncing?.6:1, flexShrink:0, transition:'all .15s' }}
              onMouseEnter={e=>{ if(!syncing){e.currentTarget.style.borderColor='var(--orange)';e.currentTarget.style.color='var(--orange)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-2)';e.currentTarget.style.color='var(--txt-3)' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation:syncing?'spin .7s linear infinite':'none' }}>
                <path d="M11 6.5A4.5 4.5 0 116.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6.5 2L9 4.5M6.5 2L9 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {syncing?'Sincronizando…':'Sincronizar'}
            </button>

            <button onClick={()=>setCopilot(o=>!o)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, border:`1px solid ${copilotOpen?'var(--orange)':'var(--border-2)'}`, borderRadius:6, cursor:'pointer', background:copilotOpen?'var(--orange-dim)':'transparent', fontFamily:'var(--font-body)', color:copilotOpen?'var(--orange)':'var(--txt-3)', display:'flex', alignItems:'center', gap:5, transition:'all .15s', flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x=".5" y=".5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 11l3-2 3 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copilot IA
            </button>
          </div>

          {error && <div style={{ margin:'10px 24px 0', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'9px 14px', fontSize:11, color:'var(--red)', flexShrink:0, fontFamily:'var(--font-body)', fontWeight:500 }}>⚠ Erro ao carregar dados: {error}</div>}

          <div style={{ flex:1, overflow:'hidden', padding:'14px 24px 0', display:'flex', gap:12, minHeight:0 }}>
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
