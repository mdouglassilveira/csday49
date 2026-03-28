import { useState, useRef, useEffect } from 'react'
import { calcHS, presencaDone } from '../lib/helpers'
import { SPRINTS, CURRENT_SPRINT, firstName } from '../lib/constants'

export default function Copilot({ startup, cs, getCS, allStartups }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Olá, Tamara! Selecione uma startup e pergunte o que quiser — análise de presença, sugestão de follow-up, risco de churn ou visão geral do programa.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function buildSystem() {
    const riscos  = allStartups.filter((s) => getCS(s.startup_id).status === 'risco').length
    const churns  = allStartups.filter((s) => getCS(s.startup_id).status === 'churn').length
    const semPres = allStartups.filter((s) => SPRINTS.filter(x=>x.status!=='fut').every(sp => !s[`sprint_${sp.n}`])).length

    const base = `Você é o Copilot de CS da 49 Educação, assistindo Tamara Moraes no programa START Primeiras Vendas 2026 (parceria Sebrae/SP). 10 Sprints semanais: Workshop terça 10h + Mentoria coletiva quinta 10h. 150 startups divididas em 3 grupos (GT1, GT2, GT3) de 50 cada, cada um com um mentor.

Sprint atual: Sprint ${CURRENT_SPRINT.n} — ${CURRENT_SPRINT.tema} (Workshop ${CURRENT_SPRINT.wk} · Mentoria ${CURRENT_SPRINT.mt}).

Visão geral do programa: ${allStartups.length} startups · ${riscos} em risco · ${churns} em churn · ${semPres} sem nenhuma presença registrada.

Responda em português, de forma concisa e acionável. Use bullet points quando listar itens.`

    if (!startup) return base + '\n\nNenhuma startup selecionada. Responda perguntas gerais sobre o programa.'

    const { attended, total } = presencaDone(startup)
    const spDetails = SPRINTS.filter(x=>x.status!=='fut').map(sp =>
      `S${sp.n}: sprint=${startup[`sprint_${sp.n}`]?'✓':'✗'} workshop=${startup[`workshop${sp.n}`]?'✓':'✗'} mentoria=${startup[`mentoria${sp.n}`]?'✓':'✗'}`
    ).join(' | ')

    return `${base}

Startup selecionada:
- Nome: ${startup.nome} | Founder: ${startup.founder_nome}
- Email: ${startup.founder_email} | Tel: ${startup.founder_telefone}
- Segmento: ${startup.segmento} | Escritório: ${startup.escritorio_regional}
- Grupo: ${startup.nome_gt} | Mentor: ${startup.nome_mentor}
- Health Score: ${calcHS(startup, cs)}/100 | Status CS: ${cs?.status || 'ativo'}
- Presença: ${attended}/${total} sprints realizados
- Detalhamento: ${spDetails}
- Anotações Tamara: ${cs?.notes || '(nenhuma)'}
- Último contato registrado: ${cs?.lastContact || 'não registrado'}`
  }

  const quickPrompts = startup
    ? [
        `Analisar presença de ${firstName(startup)}`,
        `${firstName(startup)} está em risco?`,
        `Sugerir próxima ação para ${firstName(startup)}`,
        `Quais startups do ${startup.nome_gt} precisam de atenção?`,
      ]
    : [
        'Quais startups têm menor presença?',
        'Visão geral dos grupos GT1, GT2 e GT3',
        'Quem são os maiores riscos de churn?',
      ]

  async function send(text) {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const apiMessages = [...messages, userMsg]
        .filter((m, i) => i > 0 || m.role !== 'assistant')
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: buildSystem(), messages: apiMessages }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || data.error || 'Erro.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Erro de conexão.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-6)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--gray-6)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 600 }}>Copilot CS</span>
        {startup && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--gray-4)', background: 'var(--gray-7)', padding: '2px 8px', borderRadius: 20, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{startup.nome}</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role==='user'?'flex-end':'flex-start', maxWidth: '92%', background: m.role==='user'?'var(--orange)':'var(--gray-7)', color: m.role==='user'?'var(--white)':'var(--black)', padding: '8px 12px', borderRadius: m.role==='user'?'14px 14px 3px 14px':'3px 14px 14px 14px', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.text}</div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', background: 'var(--gray-7)', padding: '8px 14px', borderRadius: '3px 14px 14px 14px', fontSize: 12, color: 'var(--gray-4)' }}>Analisando…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '7px 10px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '1px solid var(--gray-6)', flexShrink: 0 }}>
        {quickPrompts.map((q) => <button key={q} onClick={() => send(q)} disabled={loading} style={{ fontSize: 10, padding: '4px 8px', border: '1px solid var(--gray-5)', borderRadius: 20, cursor: 'pointer', background: 'var(--white)', fontFamily: 'var(--font-b)', color: 'var(--gray-3)' }}>{q}</button>)}
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--gray-6)', display: 'flex', gap: 6, flexShrink: 0 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==='Enter'&&send(input)} placeholder="Pergunte sobre a startup ou o programa…" style={{ flex: 1, padding: '7px 12px', fontSize: 12, border: '1px solid var(--gray-6)', borderRadius: 20, background: 'var(--gray-7)', color: 'var(--black)', fontFamily: 'var(--font-b)', outline: 'none' }} />
        <button onClick={() => send(input)} disabled={loading} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 500, background: 'var(--orange)', color: 'var(--white)', border: 'none', borderRadius: 20, cursor: loading?'not-allowed':'pointer', fontFamily: 'var(--font-b)', opacity: loading?.5:1 }}>Enviar</button>
      </div>
    </div>
  )
}
