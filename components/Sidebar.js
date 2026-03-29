import { useState } from 'react'
import { calcHS, hsc, hsbg, daysSince, presencaDone } from '../lib/helpers'
import { autoRiskLevel } from '../lib/metrics'

function hscDark(hs) { return hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)' }
function hsbgDark(hs) { return hs>=70?'var(--green-dim)':hs>=40?'var(--amber-dim)':'var(--red-dim)' }

function NavBtn({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} title={label} style={{
      width: 48, padding: '10px 0',
      background: active ? 'var(--orange-dim)' : 'transparent',
      color: active ? 'var(--orange)' : 'var(--txt-3)',
      border: `1px solid ${active ? 'var(--orange)' : 'transparent'}`,
      borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 8,
      letterSpacing: '.12em', transition: 'all .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      position: 'relative',
      boxShadow: active ? '0 0 14px var(--orange-glow)' : 'none',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.color='var(--txt-2)'; e.currentTarget.style.background='var(--bg-3)' }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.color='var(--txt-3)'; e.currentTarget.style.background='transparent' }}}
    >
      {icon}
      {label}
      {badge > 0 && (
        <div style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--red)', color:'var(--txt)', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-2)', animation:'pulse 2s infinite' }}>{badge>9?'9+':badge}</div>
      )}
    </button>
  )
}

function StartupItem({ s, cs, selected, onClick }) {
  const hs = calcHS(s, cs)
  const col = hscDark(hs)
  const bg  = hsbgDark(hs)
  const { attended, total } = presencaDone(s)
  const risk = autoRiskLevel(s)
  const preview = cs.notes
    ? cs.notes.slice(0,45)+(cs.notes.length>45?'…':'')
    : `${attended}/${total} encontros · ${s.escritorio_regional||'—'}`

  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
      background: selected ? 'var(--orange-soft)' : 'transparent',
      borderLeft: selected ? '2px solid var(--orange)' : '2px solid transparent',
      transition: 'background .12s',
    }}
    onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background='var(--bg-3)' }}
    onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background='transparent' }}
    >
      <div style={{ width:32, height:32, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, flexShrink:0, background:bg, color:col, border:`1px solid ${col}44` }}>{hs}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: selected?'var(--orange)':'var(--txt)', fontFamily:'var(--font-body)', marginBottom:1 }}>{s.nome}</div>
        <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400, marginBottom:2 }}>{s.founder_nome}</div>
        <div style={{ fontSize:10, color:'var(--txt-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:'var(--font-mono)' }}>{preview}</div>
        <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
          {s.nome_gt && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:'var(--blue-dim)', color:'var(--blue)', fontWeight:700, fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>{s.nome_gt}</span>}
          {cs.status!=='ativo' && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--amber-dim)':'var(--bg-4)', color:cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--txt-3)', fontWeight:700, fontFamily:'var(--font-body)', letterSpacing:'.04em', textTransform:'uppercase' }}>{cs.status}</span>}
          {risk==='critico' && cs.status==='ativo' && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:'var(--red-dim)', color:'var(--red)', fontWeight:700, fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>CRÍTICO</span>}
        </div>
      </div>
      <span style={{ fontSize:9, color:'var(--txt-3)', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', marginTop:2 }}>{daysSince(cs.lastContact)}</span>
    </div>
  )
}

export default function Sidebar({ startups, selected, getCS, onSelect, activeView, onViewChange }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [filter, setFilter]       = useState('todas')
  const [gtFilter, setGtFilter]   = useState('todos')
  const [query, setQuery]         = useState('')

  const churns   = startups.filter(s=>getCS(s.startup_id).status==='churn').length
  const riscos   = startups.filter(s=>getCS(s.startup_id).status==='risco').length
  const criticos = startups.filter(s=>autoRiskLevel(s)==='critico').length
  const alertTotal = criticos + churns

  const filtered = startups.filter(s => {
    const cs = getCS(s.startup_id)
    if (query) { const q=query.toLowerCase(); if(!s.nome?.toLowerCase().includes(q)&&!s.founder_nome?.toLowerCase().includes(q)) return false }
    if (gtFilter!=='todos'&&s.nome_gt!==gtFilter) return false
    if (filter==='risco')   return cs.status==='risco'
    if (filter==='churn')   return cs.status==='churn'
    if (filter==='critico') return autoRiskLevel(s)==='critico'
    return true
  }).sort((a,b)=>calcHS(a,getCS(a.startup_id))-calcHS(b,getCS(b.startup_id)))

  function handleNav(v) { onViewChange(v); setPanelOpen(false) }

  const iconSize = { width:16, height:16 }

  return (
    <aside style={{ display:'flex', height:'100vh', flexShrink:0 }}>

      {/* nav strip */}
      <div style={{ width:64, background:'var(--bg-2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0', gap:6, flexShrink:0 }}>

        {/* logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:14 }}>
          <div style={{ width:40, height:40, background:'var(--orange)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-title)', fontSize:18, color:'var(--bg)', letterSpacing:-1, fontWeight:400, boxShadow:'0 0 20px var(--orange-glow)', marginBottom:5 }}>49</div>
          <div style={{ fontSize:7, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.18em', fontFamily:'var(--font-body)' }}>CS DAY</div>
        </div>

        <NavBtn
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="START" active={panelOpen} badge={alertTotal}
          onClick={() => setPanelOpen(o=>!o)}
        />

        <div style={{ height:1, width:32, background:'var(--border)', margin:'4px 0' }} />

        <NavBtn
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>}
          label="DASH" active={!panelOpen&&activeView==='dashboard'}
          onClick={() => handleNav('dashboard')}
        />

        <NavBtn
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M1 13l4-5 3 3 3-5 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="ANÁLISE" active={!panelOpen&&activeView==='analytics'}
          onClick={() => handleNav('analytics')}
        />
      </div>

      {/* startup panel */}
      {panelOpen && (
        <div style={{ width:272, background:'var(--bg-2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-title)', fontSize:16, color:'var(--orange)', letterSpacing:'.04em', marginBottom:2 }}>START Primeiras Vendas</div>
            <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400, marginBottom:14 }}>150 startups · Tamara Moraes</div>

            {/* GT filter */}
            <div style={{ display:'flex', gap:4, marginBottom:8 }}>
              {['todos','GT1','GT2','GT3'].map(gt=>(
                <button key={gt} onClick={()=>setGtFilter(gt)} style={{ flex:1, padding:'5px 0', fontSize:10, fontWeight:600, border:`1px solid ${gtFilter===gt?'var(--orange)':'var(--border-2)'}`, borderRadius:4, cursor:'pointer', background:gtFilter===gt?'var(--orange-dim)':'transparent', color:gtFilter===gt?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{gt}</button>
              ))}
            </div>

            {/* status filter */}
            <div style={{ display:'flex', gap:4, marginBottom:12, flexWrap:'wrap' }}>
              {[
                { key:'todas',   label:'Todas' },
                { key:'critico', label:`Crítico (${criticos})` },
                { key:'risco',   label:`Risco (${riscos})` },
                { key:'churn',   label:`Churn (${churns})` },
              ].map(f=>(
                <button key={f.key} onClick={()=>setFilter(f.key)} style={{ padding:'4px 9px', fontSize:10, fontWeight:600, border:`1px solid ${filter===f.key?'var(--orange)':'var(--border-2)'}`, borderRadius:20, cursor:'pointer', background:filter===f.key?'var(--orange-dim)':'transparent', color:filter===f.key?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', transition:'all .15s' }}>{f.label}</button>
              ))}
            </div>

            {/* search */}
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="var(--txt-3)" strokeWidth="1.2"/>
                <path d="M9.5 9.5L12 12" stroke="var(--txt-3)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input style={{ width:'100%', padding:'8px 10px 8px 30px', fontSize:12, fontFamily:'var(--font-body)', fontWeight:400, border:'1px solid var(--border-2)', borderRadius:6, background:'var(--bg-3)', color:'var(--txt)', outline:'none', transition:'border-color .15s' }}
                placeholder="Buscar startup ou founder…" value={query} onChange={e=>setQuery(e.target.value)}
                onFocus={e=>e.target.style.borderColor='var(--orange)'}
                onBlur={e=>e.target.style.borderColor='var(--border-2)'}
              />
            </div>
          </div>

          <div style={{ padding:'8px 14px 4px', display:'flex', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--txt-3)', letterSpacing:'.1em', fontFamily:'var(--font-body)' }}>STARTUPS</span>
            <span style={{ fontSize:10, color:'var(--orange)', fontFamily:'var(--font-mono)', fontWeight:500 }}>{filtered.length}</span>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length===0 && <div style={{ padding:20, textAlign:'center', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Nenhuma startup encontrada</div>}
            {filtered.map(s=>(
              <StartupItem key={s.startup_id} s={s} cs={getCS(s.startup_id)} selected={selected?.startup_id===s.startup_id} onClick={()=>{ onSelect(s); onViewChange('startup') }} />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
