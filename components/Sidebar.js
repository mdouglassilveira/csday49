import { useState } from 'react'
import { calcHS, daysSince, presencaDone } from '../lib/helpers'
import { autoRiskLevel } from '../lib/metrics'

function hscDark(hs) { return hs>=70?'var(--green)':hs>=40?'var(--amber)':'var(--red)' }
function hsbgDark(hs) { return hs>=70?'var(--green-dim)':hs>=40?'var(--amber-dim)':'var(--red-dim)' }

function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'8px 14px', display:'flex', alignItems:'center', gap:10,
      background: active ? 'var(--orange-dim)' : 'transparent',
      color: active ? 'var(--orange)' : 'var(--txt-3)',
      border:'none', borderRadius:8, cursor:'pointer',
      fontFamily:'var(--font-body)', fontWeight:active?600:500, fontSize:12,
      transition:'all .15s', position:'relative',
    }}
    onMouseEnter={e=>{ if(!active) { e.currentTarget.style.background='var(--bg-3)'; e.currentTarget.style.color='var(--txt-2)' }}}
    onMouseLeave={e=>{ if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--txt-3)' }}}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'var(--red)', fontFamily:'var(--font-mono)' }}>{badge}</span>}
    </button>
  )
}

function StartupItem({ s, cs, selected, onClick }) {
  const hs = calcHS(s, cs)
  const col = hscDark(hs)
  const bg  = hsbgDark(hs)

  return (
    <div onClick={onClick} style={{
      padding:'8px 14px', borderBottom:'1px solid var(--border)',
      cursor:'pointer', display:'flex', gap:8, alignItems:'center',
      background: selected ? 'var(--orange-soft)' : 'transparent',
      borderLeft: selected ? '2px solid var(--orange)' : '2px solid transparent',
      transition:'background .15s',
    }}
    onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background='var(--bg-3)' }}
    onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background='transparent' }}
    >
      <div style={{ width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, flexShrink:0, background:bg, color:col }}>{hs}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: selected?'var(--orange)':'var(--txt)', fontFamily:'var(--font-body)' }}>{s.nome}</div>
        <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.founder_nome}</div>
      </div>
      <div style={{ display:'flex', gap:3, flexShrink:0, alignItems:'center' }}>
        {cs.status!=='ativo' && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:cs.status==='churn'?'var(--red-dim)':cs.status==='risco'?'var(--amber-dim)':'var(--bg-4)', color:cs.status==='churn'?'var(--red)':cs.status==='risco'?'var(--amber)':'var(--txt-3)', fontWeight:600, fontFamily:'var(--font-body)', textTransform:'uppercase' }}>{cs.status}</span>}
        <span style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{daysSince(cs.lastContact)}</span>
      </div>
    </div>
  )
}

export default function Sidebar({ startups, selected, getCS, onSelect, activeView, onViewChange }) {
  const [filter, setFilter]     = useState('todas')
  const [gtFilter, setGtFilter] = useState('todos')
  const [query, setQuery]       = useState('')

  const churns   = startups.filter(s=>getCS(s.startup_id).status==='churn').length
  const riscos   = startups.filter(s=>getCS(s.startup_id).status==='risco').length
  const criticos = startups.filter(s=>autoRiskLevel(s)==='critico').length

  const filtered = startups.filter(s => {
    const cs = getCS(s.startup_id)
    if (query) { const q=query.toLowerCase(); if(!s.nome?.toLowerCase().includes(q)&&!s.founder_nome?.toLowerCase().includes(q)) return false }
    if (gtFilter!=='todos'&&s.nome_gt!==gtFilter) return false
    if (filter==='risco')   return cs.status==='risco'
    if (filter==='churn')   return cs.status==='churn'
    if (filter==='critico') return autoRiskLevel(s)==='critico'
    return true
  }).sort((a,b)=>calcHS(a,getCS(a.startup_id))-calcHS(b,getCS(b.startup_id)))

  const iconSize = { width:16, height:16, flexShrink:0 }

  return (
    <aside style={{ width:240, background:'var(--bg-2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', flexShrink:0 }}>

      {/* Logo */}
      <div style={{ padding:'16px 16px 12px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ width:32, height:32, background:'var(--orange)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>49</div>
        <div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:700, color:'var(--txt)', letterSpacing:'-0.2px' }}>CS Day</div>
          <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:400 }}>Tamara · {startups.length} startups</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding:'4px 10px 12px', display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
        <NavItem
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
          label="Hoje" active={activeView==='hoje'}
          onClick={()=>onViewChange('hoje')}
        />
        <NavItem
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M5.5 2v2M10.5 2v2M2 6.5h12M2 4.5a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
          label="Encontros" active={activeView==='encontros'}
          onClick={()=>onViewChange('encontros')}
        />
        <NavItem
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
          label="Startups" active={activeView==='startups-table'}
          badge={criticos > 0 ? criticos : 0}
          onClick={()=>onViewChange('startups-table')}
        />

        <div style={{ height:1, background:'var(--border)', margin:'6px 4px' }} />

        <NavItem
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>}
          label="Dashboard" active={activeView==='dashboard'}
          onClick={()=>onViewChange('dashboard')}
        />
        <NavItem
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M1 13l4-5 3 3 3-5 4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Análise" active={activeView==='analytics'}
          onClick={()=>onViewChange('analytics')}
        />
      </div>

      <div style={{ height:1, background:'var(--border)', margin:'0 14px', flexShrink:0 }} />

      {/* Startup filters */}
      <div style={{ padding:'12px 14px 8px', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--txt-3)', letterSpacing:'.06em', fontFamily:'var(--font-body)' }}>STARTUPS</span>
          <span style={{ fontSize:10, color:'var(--orange)', fontFamily:'var(--font-mono)', fontWeight:500 }}>{filtered.length}</span>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:8 }}>
          <svg style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="12" height="12" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--txt-3)" strokeWidth="1.2"/>
            <path d="M9.5 9.5L12 12" stroke="var(--txt-3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input style={{ width:'100%', padding:'6px 8px 6px 26px', fontSize:11, fontFamily:'var(--font-body)', fontWeight:400, border:'1px solid var(--border)', borderRadius:6, background:'var(--bg-3)', color:'var(--txt)', outline:'none' }}
            placeholder="Buscar…" value={query} onChange={e=>setQuery(e.target.value)}
            onFocus={e=>e.target.style.borderColor='var(--orange)'}
            onBlur={e=>e.target.style.borderColor='var(--border)'}
          />
        </div>

        {/* GT filter */}
        <div style={{ display:'flex', gap:3, marginBottom:6 }}>
          {['todos','GT1','GT2','GT3'].map(gt=>(
            <button key={gt} onClick={()=>setGtFilter(gt)} style={{ flex:1, padding:'4px 0', fontSize:9, fontWeight:600, border:'none', borderRadius:4, cursor:'pointer', background:gtFilter===gt?'var(--orange-dim)':'var(--bg-3)', color:gtFilter===gt?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{gt==='todos'?'Todos':gt}</button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
          {[
            { key:'todas',   label:'Todas' },
            { key:'critico', label:`Crítico` },
            { key:'risco',   label:`Risco` },
            { key:'churn',   label:`Churn` },
          ].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{ padding:'3px 8px', fontSize:9, fontWeight:500, border:'none', borderRadius:12, cursor:'pointer', background:filter===f.key?'var(--orange-dim)':'var(--bg-3)', color:filter===f.key?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Startup list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length===0 && <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Nenhuma startup</div>}
        {filtered.map(s=>(
          <StartupItem key={s.startup_id} s={s} cs={getCS(s.startup_id)} selected={selected?.startup_id===s.startup_id} onClick={()=>{ onSelect(s); onViewChange('startup') }} />
        ))}
      </div>
    </aside>
  )
}
