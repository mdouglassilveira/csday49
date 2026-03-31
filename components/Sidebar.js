import { autoRiskLevel } from '../lib/metrics'

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

export default function Sidebar({ startups, getCS, activeView, onViewChange }) {
  const criticos = startups.filter(s=>autoRiskLevel(s)==='critico').length

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
          icon={<svg style={iconSize} viewBox="0 0 16 16" fill="none"><path d="M14 10.5a5.5 5.5 0 01-5.5 3.5 5.5 5.5 0 01-2.5-.6L2 15l1.2-3.8A5.5 5.5 0 012 8.5 5.5 5.5 0 017.5 3h.5A5.5 5.5 0 0114 8v2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Conversas" active={activeView==='conversas'}
          onClick={()=>onViewChange('conversas')}
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

    </aside>
  )
}
