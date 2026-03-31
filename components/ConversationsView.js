import { useState, useEffect } from 'react'
import { ini } from '../lib/helpers'
import { firstName } from '../lib/constants'
import ChatView from './ChatView'

function formatLastTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (today - msgDay) / 86400000

  if (diff === 0) return d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  if (diff === 1) return 'Ontem'
  if (diff < 7) return d.toLocaleDateString('pt-BR', { weekday:'short' })
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
}

function ConversationItem({ conv, startup, active, onClick, onMarkUnread }) {
  const [showMenu, setShowMenu] = useState(false)
  const last = conv.lastMessage
  const isOut = last?.direction === 'outgoing'
  const preview = last?.message_text?.replace(/\n/g, ' ').slice(0, 50) || ''
  const hasUnread = conv.unread > 0

  return (
    <div onClick={onClick} onContextMenu={e=>{ e.preventDefault(); setShowMenu(true) }} style={{
      padding:'12px 14px', borderBottom:'1px solid var(--border)',
      cursor:'pointer', display:'flex', gap:10, alignItems:'center',
      background: active ? 'var(--orange-soft)' : 'transparent',
      transition:'background .12s', position:'relative',
    }}
    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='var(--bg-3)' }}
    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; setShowMenu(false) }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:hasUnread?'var(--orange)':'var(--orange-dim)', color:hasUnread?'#fff':'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontWeight:700, fontSize:12, flexShrink:0 }}>
        {ini(startup?.nome || conv.startup_id)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          <span style={{ fontSize:12, fontWeight:hasUnread?700:600, color:active?'var(--orange)':'var(--txt)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {startup?.nome || conv.startup_id}
          </span>
          <span style={{ fontSize:9, color:hasUnread?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-mono)', flexShrink:0, marginLeft:8 }}>
            {formatLastTime(last?.sent_at)}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {isOut && <span style={{ fontSize:10, color:'var(--txt-3)' }}>✓</span>}
          <span style={{ fontSize:11, color:hasUnread?'var(--txt-2)':'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:hasUnread?500:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {preview}{preview.length >= 50 ? '…' : ''}
          </span>
        </div>
      </div>
      {hasUnread && (
        <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--orange)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{conv.unread > 9 ? '9+' : conv.unread}</div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', zIndex:50, boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}
          onClick={e=>e.stopPropagation()}
        >
          {!hasUnread ? (
            <button onClick={()=>{ onMarkUnread(conv.startup_id); setShowMenu(false) }} style={{ padding:'8px 14px', fontSize:11, border:'none', background:'transparent', cursor:'pointer', color:'var(--txt-2)', fontFamily:'var(--font-body)', fontWeight:500, whiteSpace:'nowrap', display:'block', width:'100%', textAlign:'left' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >Marcar como não lida</button>
          ) : (
            <button onClick={()=>{ onClick(); setShowMenu(false) }} style={{ padding:'8px 14px', fontSize:11, border:'none', background:'transparent', cursor:'pointer', color:'var(--txt-2)', fontFamily:'var(--font-body)', fontWeight:500, whiteSpace:'nowrap', display:'block', width:'100%', textAlign:'left' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >Marcar como lida</button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConversationsView({ startups }) {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)

  // Load conversations
  function loadConversations() {
    fetch('/api/messages/conversations')
      .then(r => r.json())
      .then(j => setConversations(j.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 15000)
    return () => clearInterval(interval)
  }, [])

  // Load messages for active conversation
  function loadMessages(startupId) {
    fetch(`/api/messages?startup_id=${startupId}&limit=200`)
      .then(r => r.json())
      .then(j => setMessages(j.data || []))
      .catch(() => {})
  }

  // Mark messages as read + send read receipts to WhatsApp
  function markAsRead(startupId) {
    fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startup_id: startupId }),
    })
      .then(() => loadConversations()) // refresh badges
      .catch(() => {})
  }

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId)
    markAsRead(activeId)
    const interval = setInterval(() => {
      loadMessages(activeId)
      markAsRead(activeId)
    }, 10000)
    return () => clearInterval(interval)
  }, [activeId])

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].startup_id)
    }
  }, [conversations])

  function markAsUnread(startupId) {
    fetch('/api/messages/read', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startup_id: startupId }),
    }).then(() => loadConversations()).catch(() => {})
    // Immediate UI feedback
    setConversations(prev => prev.map(c => c.startup_id === startupId ? { ...c, unread: Math.max(c.unread, 1) } : c))
  }

  function getStartup(id) {
    return startups.find(s => String(s.startup_id) === String(id))
  }

  const activeStartup = activeId ? getStartup(activeId) : null

  const unreadCount = conversations.filter(c => c.unread > 0).length

  const filtered = conversations.filter(c => {
    if (filterUnread && c.unread === 0) return false
    if (query) {
      const s = getStartup(c.startup_id)
      const q = query.toLowerCase()
      if (!s?.nome?.toLowerCase().includes(q) && !s?.founder_nome?.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden', margin:'-14px -24px 0', borderTop:'none' }}>

      {/* Conversation list */}
      <div style={{ width:320, borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', background:'var(--bg-2)', flexShrink:0 }}>
        {/* Search + filter */}
        <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ position:'relative', marginBottom:8 }}>
            <svg style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--txt-3)" strokeWidth="1.2"/>
              <path d="M9.5 9.5L12 12" stroke="var(--txt-3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input style={{ width:'100%', padding:'7px 8px 7px 26px', fontSize:11, fontFamily:'var(--font-body)', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', color:'var(--txt)', outline:'none' }}
              placeholder="Buscar conversa…" value={query} onChange={e=>setQuery(e.target.value)}
              onFocus={e=>e.target.style.borderColor='var(--orange)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <button onClick={()=>setFilterUnread(false)} style={{ padding:'4px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:12, cursor:'pointer', background:!filterUnread?'var(--orange-dim)':'var(--bg-3)', color:!filterUnread?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s' }}>Todas</button>
            <button onClick={()=>setFilterUnread(true)} style={{ padding:'4px 10px', fontSize:10, fontWeight:500, border:'none', borderRadius:12, cursor:'pointer', background:filterUnread?'var(--orange-dim)':'var(--bg-3)', color:filterUnread?'var(--orange)':'var(--txt-3)', fontFamily:'var(--font-body)', transition:'all .15s', display:'flex', alignItems:'center', gap:4 }}>
              Não lidas
              {unreadCount > 0 && <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700 }}>{unreadCount}</span>}
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding:24, textAlign:'center', fontSize:11, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>
              {conversations.length === 0 ? 'Nenhuma conversa ainda' : 'Nenhuma conversa encontrada'}
            </div>
          )}
          {filtered.map(conv => (
            <ConversationItem
              key={conv.startup_id}
              conv={conv}
              startup={getStartup(conv.startup_id)}
              active={activeId === conv.startup_id}
              onMarkUnread={markAsUnread}
              onClick={() => {
                setActiveId(conv.startup_id)
                setConversations(prev => prev.map(c => c.startup_id === conv.startup_id ? { ...c, unread: 0 } : c))
              }}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {activeStartup ? (
          <>
            {/* Chat header */}
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'var(--bg-2)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'var(--orange-dim)', color:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontWeight:700, fontSize:11, flexShrink:0 }}>
                {ini(activeStartup.nome)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)' }}>{activeStartup.nome}</div>
                <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>{activeStartup.founder_nome} · {activeStartup.founder_telefone||'sem telefone'}</div>
              </div>
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                {activeStartup.nome_gt && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:'var(--blue-dim)', color:'var(--blue)', fontWeight:600, fontFamily:'var(--font-body)' }}>{activeStartup.nome_gt}</span>}
              </div>
            </div>

            {/* Chat body */}
            <div style={{ flex:1, minHeight:0 }}>
              <ChatView
                s={activeStartup}
                messages={messages}
                onRefresh={() => { loadMessages(activeId); loadConversations() }}
                standalone
              />
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="var(--border-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize:12, color:'var(--txt-3)', fontFamily:'var(--font-body)' }}>Selecione uma conversa</div>
          </div>
        )}
      </div>
    </div>
  )
}
