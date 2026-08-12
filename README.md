<div align="center">

# 🌐 AI · Neural Translation

**Tradução de legendas `.srt` para português (ou qualquer idioma) usando IA**

Envie uma legenda em outro idioma, escolha o provedor de IA e receba o `.srt` traduzido — com progresso em tempo real.

</div>

---

## ✨ Funcionalidades

- 📤 **Upload de `.srt`** com validação de extensão, MIME type e estrutura do arquivo
- 🤖 **Múltiplos provedores de IA** — troque entre Anthropic (Claude), OpenAI e Google (Gemini) direto pela tela de Configurações
- 🔑 **Gerenciamento de credenciais** — chaves de API nunca são expostas por completo, apenas mascaradas (`sk-ant••••qQAA`)
- 📊 **Progresso em tempo real** — barra de progresso via Server-Sent Events acompanhando a tradução lote a lote
- 🌓 **Interface dark/futurista** em Angular, standalone components, sem dependências pesadas

---

## 🧱 Arquitetura

```
ia-translate/
├── src/                          # Backend (Node.js + Express)
│   ├── app.js                    # Entry point
│   ├── config/
│   │   ├── providers.js          # Catálogo de provedores e modelos suportados
│   │   └── settings.store.js     # Persistência de configurações (data/settings.json)
│   ├── routes/
│   │   ├── subtitle.routes.js    # Upload, progresso (SSE) e download
│   │   └── settings.routes.js    # GET/PUT de configurações
│   ├── services/
│   │   ├── translator.service.js # Orquestra tradução em lotes
│   │   ├── job-store.js          # Jobs assíncronos em memória
│   │   └── providers/            # Implementações por provedor (Anthropic/OpenAI/Google)
│   └── utils/srt-parser.js       # Parse e serialização de .srt
│
└── frontend/                     # Angular (standalone, sem Router)
    └── src/app/
        ├── translate/            # Tela de tradução + barra de progresso
        ├── settings/             # Tela de configuração de provedor/modelo/chave
        └── services/             # Clientes HTTP
```

### Como a tradução funciona

1. O frontend envia o `.srt` via `multipart/form-data` para `POST /api/subtitles/translate`.
2. O backend valida o arquivo, cria um **job assíncrono** e retorna um `jobId` imediatamente.
3. O frontend abre uma conexão **SSE** (`GET /api/subtitles/translate/:jobId/events`) e recebe atualizações de progresso lote a lote.
4. Ao concluir, o arquivo fica disponível em `GET /api/subtitles/translate/:jobId/download`.

A tradução é feita em lotes de até 40 blocos por requisição ao modelo, preservando timestamps, formatação e ordem das falas.

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18+
- Uma chave de API de pelo menos um provedor: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/) ou [Google AI Studio](https://aistudio.google.com/)

### Backend

```bash
npm install
cp .env.example .env
```

Edite o `.env` e preencha a chave do provedor que for usar (ou configure depois direto pela interface, na tela **Configurações**).

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npx ng serve
```

Acesse `http://localhost:4200`. As requisições para `/api` são automaticamente encaminhadas para o backend via [`proxy.conf.json`](frontend/proxy.conf.json).

---

## ⚙️ Configuração de provedores

Pela tela **Configurações** você pode, a qualquer momento:

- Trocar o provedor de IA (Anthropic, OpenAI, Google)
- Escolher o modelo dentro do provedor selecionado
- Colar uma nova chave de API — a chave anterior nunca é exibida por completo, apenas mascarada

Se nenhuma chave for salva pela interface, o backend usa como fallback as variáveis de ambiente:

| Variável            | Provedor  |
| ------------------- | --------- |
| `ANTHROPIC_API_KEY` | Anthropic |
| `OPENAI_API_KEY`    | OpenAI    |
| `GOOGLE_API_KEY`    | Google    |

---

## 🔒 Segurança

- Chaves de API **nunca** são enviadas ao frontend em texto completo — apenas mascaradas.
- `data/settings.json` (onde as chaves configuradas pela UI ficam salvas) e `.env` estão no `.gitignore` e **não devem ser commitados**.
- Uploads são limitados a 5 MB e validados por extensão, MIME type e estrutura interna do `.srt`.

> **Antes de publicar este repositório**, confira se `.env` e `data/settings.json` não estão sendo versionados (`git status` não deve listá-los) e se o `.env.example` contém apenas placeholders vazios.

---

## 🛣️ Possíveis próximos passos

- Persistir jobs em Redis/banco para sobreviver a restarts
- Suporte a outros formatos de legenda (`.vtt`, `.ass`)
- Autenticação para uso multiusuário

---

<div align="center">

Feito com Node.js, Express e Angular.

</div>
