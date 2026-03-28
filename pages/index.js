import { useState, useEffect } from 'react'
import Head from 'next/head'
import Sidebar from '../components/Sidebar'
import DetailPanel from '../components/DetailPanel'
import Copilot from '../components/Copilot'
import { useCSData, calcHS } from '../lib/helpers'
import { SPRINTS, CURRENT_SPRINT } from '../lib/constants'

function MetCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: color || 'var(--black)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--gray-4)', marginTop: 5 }}>{sub}</div>
    </div>
  )
}

export default function Home() {
  const [startups, setStartups]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [copilotOpen, setCopilot]   = useState(false)
  const [syncing, setSyncing]       = useState(false)
  const { getCS, patchCS }          = useCSData()

  async function loadData() {
    try {
      const res  = await fetch('/api/startups')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setStartups(json.data || [])
      setError(null)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [])

  async function sync() { setSyncing(true); await loadData(); setSyncing(false) }

  // métricas
  const total    = startups.length
  const semPres  = startups.filter((s) => SPRINTS.filter(x=>x.status!=='fut').every(sp => !s[`sprint_${sp.n}`])).length
  const emRisco  = startups.filter((s) => { const cs = getCS(s.startup_id); return cs.status==='risco'||cs.status==='churn' }).length
  const churns   = startups.filter((s) => getCS(s.startup_id).status === 'churn')

  return (
    <>
      <Head><title>CS Day — START Primeiras Vendas</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 999 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--gray-6)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 600 }}>CS Day</div>
          <div style={{ fontSize: 12, color: 'var(--gray-4)' }}>Carregando startups do Supabase…</div>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar startups={startups} selected={selected} getCS={getCS} onSelect={setSelected} />

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          {/* topbar */}
          <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-6)', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 600, letterSpacing: '-.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selected ? selected.nome : 'START Primeiras Vendas 2026'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-4)', marginTop: 1 }}>
                {selected ? `${selected.founder_nome} · ${selected.founder_email}` : `${total} startups · Sprint ${CURRENT_SPRINT.n}: ${CURRENT_SPRINT.tema}`}
              </div>
            </div>
            <div style={{ width: 1, height: 22, background: 'var(--gray-6)', flexShrink: 0 }} />
            <button onClick={sync} disabled={syncing} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, border: '1px solid var(--gray-5)', borderRadius: 20, cursor: syncing?'not-allowed':'pointer', background: 'var(--white)', fontFamily: 'var(--font-b)', color: 'var(--gray-2)', display: 'flex', alignItems: 'center', gap: 6, opacity: syncing?.6:1, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: syncing?'spin .7s linear infinite':'none' }}><path d="M11 6.5A4.5 4.5 0 116.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M6.5 2L9 4.5M6.5 2L9 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {syncing ? 'Sincronizando…' : 'Sincronizar'}
            </button>
            <button onClick={() => setCopilot(o => !o)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, border: `1px solid ${copilotOpen?'var(--orange)':'var(--gray-5)'}`, borderRadius: 20, cursor: 'pointer', background: copilotOpen?'var(--orange)':'var(--white)', fontFamily: 'var(--font-b)', color: copilotOpen?'var(--white)':'var(--gray-2)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x=".5" y=".5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 11l3-2 3 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Copilot IA
            </button>
          </div>

          {error && <div style={{ margin: '12px 20px 0', background: 'var(--red-soft)', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--red)', flexShrink: 0 }}>⚠ Erro ao carregar dados: {error}</div>}

          {churns.length > 0 && (
            <div style={{ margin: '12px 20px 0', background: 'var(--amber-soft)', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--amber)', whiteSpace: 'nowrap' }}>⚠ Churn crítico:</span>
              {churns.slice(0,4).map((s) => <button key={s.startup_id} onClick={() => setSelected(s)} style={{ fontSize: 10, padding: '2px 8px', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap' }}>{s.nome}</button>)}
              {churns.length > 4 && <span style={{ fontSize: 11, color: 'var(--amber)' }}>+{churns.length-4} outras</span>}
            </div>
          )}

          {/* metrics */}
          <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flexShrink: 0 }}>
            <MetCard label="Total de startups" value={total}                   sub="programa START 2026" />
            <MetCard label="Sprint atual"       value={CURRENT_SPRINT.n}       sub={CURRENT_SPRINT.tema}        color="var(--orange)" />
            <MetCard label="Sem presença"       value={semPres}                sub="nenhum sprint marcado"      color={semPres>10?'var(--red)':'var(--gray-3)'} />
            <MetCard label="Risco / Churn"      value={emRisco}                sub="marcadas por você"          color={emRisco>0?'var(--red)':'var(--gray-3)'} />
          </div>

          {/* content */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '0 20px 16px', display: 'grid', gridTemplateColumns: copilotOpen ? '1fr 340px' : '1fr', gap: 12, minHeight: 0 }}>
            <DetailPanel startup={selected} cs={selected ? getCS(selected.startup_id) : null} patchCS={patchCS} />
            {copilotOpen && <Copilot startup={selected} cs={selected ? getCS(selected.startup_id) : null} getCS={getCS} allStartups={startups} />}
          </div>
        </main>
      </div>
    </>
  )
}
