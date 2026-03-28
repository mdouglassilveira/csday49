# CS Day — START Primeiras Vendas

App de Customer Success para a 49 Educação.  
Dados em tempo real via Supabase. Deploy no Vercel.

---

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

---

## Deploy no Vercel (passo a passo)

### 1. Criar conta no Vercel
Acesse vercel.com e crie conta com seu e-mail (ou GitHub).

### 2. Subir o código no GitHub
1. Crie um repositório no github.com (pode ser privado)
2. Faça upload de todos os arquivos desta pasta
3. **Não inclua o arquivo `.env.local`** — ele fica só no seu computador

### 3. Conectar no Vercel
1. No Vercel: **Add New → Project**
2. Selecione o repositório do GitHub
3. Clique em **Deploy** (as configurações detectam Next.js automaticamente)

### 4. Configurar variáveis de ambiente
No Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | `https://vdfukkmysrrvpfdioemr.supabase.co` |
| `SUPABASE_ANON_KEY` | sua anon key do Supabase |
| `ANTHROPIC_API_KEY` | sua chave da Anthropic (para o Copilot IA) |

> Para a chave da Anthropic: acesse console.anthropic.com → API Keys → Create Key

### 5. Fazer redeploy
Após salvar as variáveis, clique em **Redeploy** no Vercel.  
Seu app estará no ar em `seu-projeto.vercel.app`.

---

## Estrutura do projeto

```
cs-day/
├── pages/
│   ├── index.js          # Página principal
│   └── api/
│       ├── startups.js   # Busca dados do Supabase (server-side)
│       └── copilot.js    # Proxy da API Anthropic
├── components/
│   ├── Sidebar.js        # Lista de startups + filtros
│   ├── DetailPanel.js    # Perfil, Presença, Follow-up, Mensagens
│   └── Copilot.js        # Chat com IA
├── lib/
│   ├── supabase.js       # Client do Supabase
│   ├── constants.js      # Sprints + templates de mensagem
│   └── helpers.js        # Health score, formatação, localStorage
├── styles/
│   └── globals.css       # Fontes e reset
├── .env.local            # Credenciais (NÃO subir no GitHub)
└── package.json
```

---

## Funcionalidades

- **Lista das 150 startups** em tempo real do Supabase
- **Health Score automático** por fase + presença registrada
- **Filtros**: Todas · Risco · Churn · Inativas + busca por nome
- **Presença por sprint** — clique para registrar P/A por startup
- **Follow-up**: status (Ativo/Risco/Churn/Inativo), anotações, data do contato
- **5 templates de mensagem WhatsApp** personalizados por startup — 1 clique para copiar
- **Copilot IA** com contexto real da startup selecionada
- Dados de CS salvos localmente no navegador (presença, status, notas)

---

## Dados salvos localmente

As informações de CS que você registra (presença, status, anotações, último contato)  
ficam salvas no `localStorage` do seu navegador com a chave `csday_v1`.  
Os dados do Supabase são somente leitura — o app não escreve de volta nele.
