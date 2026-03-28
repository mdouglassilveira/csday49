// Sprints do START Primeiras Vendas 2026
export const SPRINTS = [
  { n: 1,  tema: 'Gargalos de Crescimento',   wk: '24/02', mt: '26/02', status: 'done' },
  { n: 2,  tema: 'Definição de Cliente Ideal', wk: '03/03', mt: '05/03', status: 'done' },
  { n: 3,  tema: 'Oferta Irresistível',        wk: '10/03', mt: '12/03', status: 'done' },
  { n: 4,  tema: 'Geração de Leads Pt.1',      wk: '17/03', mt: '19/03', status: 'now'  },
  { n: 5,  tema: 'Geração de Leads Pt.2',      wk: '24/03', mt: '26/03', status: 'fut'  },
  { n: 6,  tema: 'Máquinas de Vendas Pt.1',    wk: '31/03', mt: '02/04', status: 'fut'  },
  { n: 7,  tema: 'Máquinas de Vendas Pt.2',    wk: '07/04', mt: '09/04', status: 'fut'  },
  { n: 8,  tema: 'Técnicas de Vendas',         wk: '14/04', mt: '16/04', status: 'fut'  },
  { n: 9,  tema: 'Growth Hacking',             wk: '28/04', mt: '30/04', status: 'fut'  },
  { n: 10, tema: 'Playbook de Vendas',         wk: '05/05', mt: '07/05', status: 'fut'  },
]

export const CURRENT_SPRINT = SPRINTS.find((s) => s.status === 'now') || SPRINTS[3]

// Campos reais da view_startups_export
// startup_id, nome, cnpj, segmento, site_url, escritorio_regional,
// grupo_id, nome_gt, nome_mentor, link_meet, grupo_wpp,
// founder_nome, founder_email, founder_telefone,
// sprint_1..sprint_10 (boolean),
// workshop1..workshop10 (boolean), mentoria1..mentoria10 (boolean)

export function firstName(s) {
  return (s?.founder_nome || s?.nome || '').split(' ')[0] || 'Olá'
}

// Calcula presença total de sprints realizados (sprint_1..sprint_10)
export function sprintCount(s) {
  return SPRINTS.filter((sp) => s[`sprint_${sp.n}`] === true).length
}

export function workshopCount(s) {
  return SPRINTS.filter((sp) => s[`workshop${sp.n}`] === true).length
}

export function mentoriaCount(s) {
  return SPRINTS.filter((sp) => s[`mentoria${sp.n}`] === true).length
}

export const FUP_TEMPLATES = [
  {
    id: 'ausente',
    name: 'Ausente na última aula',
    situation: 'Faltou',
    color: 'var(--amber)',
    text: (s) =>
      `Oi ${firstName(s)}, tudo bem? 😊\n\nVi que você não conseguiu participar do Workshop do Sprint ${CURRENT_SPRINT.n} — ${CURRENT_SPRINT.tema}. Faz parte, acontece!\n\nA gravação já está disponível no app do programa. Qualquer dúvida sobre o conteúdo, é só me chamar aqui.\n\nConta comigo! 🚀\nTamara | CS 49 Educação`,
  },
  {
    id: 'sumiu',
    name: 'Sem resposta há +7 dias',
    situation: 'Inativa',
    color: 'var(--red)',
    text: (s) =>
      `Oi ${firstName(s)}! Tô passando aqui pra ver como você tá indo 🙂\n\nFaz uns dias que não nos falamos, e queria saber se tá conseguindo acompanhar o programa.\n\nComo tá sendo a experiência até aqui? Tem alguma dificuldade que posso te ajudar a resolver?\n\nEstou aqui!\nTamara | CS 49 Educação`,
  },
  {
    id: 'engajada',
    name: 'Engajada — pedir indicação',
    situation: 'Embaixadora',
    color: 'var(--green)',
    text: (s) =>
      `${firstName(s)}, que alegria acompanhar sua evolução no programa! 🎉\n\nVejo que você tá aproveitando muito bem o conteúdo e engajando ativamente.\n\nSe você conhece algum(a) founder que se beneficiaria do START, fica à vontade pra indicar — nossa próxima turma vai ser incrível!\n\nContinua arrasando!\nTamara | CS 49 Educação`,
  },
  {
    id: 'churn',
    name: 'Risco crítico de churn',
    situation: 'Churn',
    color: 'var(--red)',
    text: (s) =>
      `Oi ${firstName(s)}, tudo bem?\n\nPercebo que você tá com dificuldades em acompanhar o programa ultimamente, e quero muito entender o que está acontecendo.\n\nPode me contar o que tem dificultado? A ideia é encontrar juntos uma forma de você aproveitar ao máximo o que ainda tem pela frente.\n\nMe chama aqui, tô disponível! 💬\nTamara | CS 49 Educação`,
  },
  {
    id: 'reengajamento',
    name: 'Reengajamento — grupo',
    situation: 'Grupo',
    color: 'var(--blue)',
    text: (s) =>
      `Oi ${firstName(s)}!\n\nPassando para lembrar que o seu grupo de trabalho é o ${s.nome_gt || 'GT'} — coordenado pelo mentor ${s.nome_mentor || 'responsável'}.\n\nSe precisar do link da reunião: ${s.link_meet || 'disponível no app'}\n\nQualquer dúvida, estou aqui! 😊\nTamara | CS 49 Educação`,
  },
]
