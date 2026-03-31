import { useState } from 'react'

export default function QueueIndicator({ batch, onCancel, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  if (!batch) return null

  const { total, sent, failed, status, log } = batch
  const processed = sent + failed
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  const isActive = status === 'processing'
  const isDone = status === 'completed' || status === 'cancelled'

  const color = status === 'cancelled' ? 'var(--amber)' : failed > 0 ? 'var(--amber)' : 'var(--green)'
  const statusLabel = isActive ? `Enviando ${processed}/${total}…` : status === 'completed' ? `Concluído: ${sent} enviadas` : 'Cancelado'

  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      {/* Compact indicator */}
      <button onClick={() => setExpanded(e => !e)} style={{
        padding:'5px 12px', fontSize:11, fontWeight:600, border:'none', borderRadius:8, cursor:'pointer',
        background: isActive ? 'var(--orange-dim)' : isDone && failed === 0 ? 'var(--green-dim)' : 'var(--amber-dim)',
        color: isActive ? 'var(--orange)' : isDone && failed === 0 ? 'var(--green)' : 'var(--amber)',
        fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6, transition:'all .15s',
      }}>
        {isActive && (
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--orange)', animation:'pulse 1.5s infinite' }} />
        )}
        <span>{statusLabel}</span>
        {isActive && (
          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', opacity:0.7 }}>{pct}%</span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform:expanded?'rotate(180deg)':'none', transition:'transform .15s' }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded dropdown */}
      {expanded && (
        <div style={{ position:'absolute', top:'100%', right:0, marginTop:6, width:360, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', zIndex:100, boxShadow:'0 8px 30px rgba(0,0,0,0.3)' }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--txt)', fontFamily:'var(--font-body)' }}>Envio em massa</div>
              <div style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:2 }}>{statusLabel}</div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {isActive && (
                <button onClick={onCancel} style={{ fontSize:10, padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer', background:'var(--red-dim)', color:'var(--red)', fontFamily:'var(--font-body)', fontWeight:600 }}>Cancelar</button>
              )}
              {isDone && (
                <button onClick={() => { setExpanded(false); onDismiss() }} style={{ fontSize:10, padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer', background:'var(--bg-3)', color:'var(--txt-3)', fontFamily:'var(--font-body)', fontWeight:500 }}>Fechar</button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-mono)' }}>{processed}/{total}</span>
              <span style={{ fontSize:10, fontFamily:'var(--font-mono)' }}>
                <span style={{ color:'var(--green)' }}>{sent}</span>
                {failed > 0 && <span style={{ color:'var(--red)', marginLeft:6 }}>{failed} falhas</span>}
              </span>
            </div>
            <div style={{ height:4, borderRadius:99, background:'var(--bg-4)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .5s' }} />
            </div>
            {isActive && <div style={{ fontSize:9, color:'var(--txt-3)', fontFamily:'var(--font-body)', marginTop:4 }}>Intervalo de 15s entre envios</div>}
          </div>

          {/* Log */}
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {log.slice(-20).map((l, i) => (
              <div key={i} style={{ padding:'5px 16px', fontSize:10, fontFamily:'var(--font-body)', color: l.type === 'success' ? 'var(--green)' : 'var(--red)', borderBottom:'1px solid var(--border)' }}>
                {l.text}
              </div>
            ))}
            {log.length === 0 && <div style={{ padding:12, fontSize:10, color:'var(--txt-3)', fontFamily:'var(--font-body)', textAlign:'center' }}>Aguardando primeiro envio…</div>}
          </div>
        </div>
      )}
    </div>
  )
}
