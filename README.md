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
- ⛔ **Cancelamento** — interrompa uma tradução em andamento a qualquer momento
- 📝 **Prompt editável** — personalize o texto enviado à IA na tela de Configurações, com um padrão definido no `.env`
- 🌐 **Interface multilíngue** — troque entre 🇧🇷 português e 🇺🇸 inglês pelas bandeiras no header
- 🌓 **Interface dark/futurista** em Angular, standalone components, sem dependências pesadas
- 🔐 **Login obrigatório** — cookie de sessão `HttpOnly`, com tela **Conta** para trocar usuário e senha sem perder a sessão

---

## 🧱 Arquitetura

```
ia-translate/
├── src/                          # Backend (Node.js + Express)
│   ├── app.js                    # Entry point
│   ├── config/
│   │   ├── providers.js          # Catálogo de provedores e modelos suportados
│   │   ├── settings.store.js     # Persistência de configurações (data/settings.json)
│   │   └── auth.store.js         # Usuário/senha (hash+salt) em data/auth.json
│   ├── middleware/
│   │   └── auth.middleware.js    # requireAuth — valida o cookie de sessão
│   ├── routes/
│   │   ├── subtitle.routes.js    # Upload, progresso (SSE) e download
│   │   ├── settings.routes.js    # GET/PUT de configurações
│   │   └── auth.routes.js        # Login/logout, troca de usuário/senha
│   ├── services/
│   │   ├── translator.service.js # Orquestra tradução em lotes
│   │   ├── job-store.js          # Jobs assíncronos em memória
│   │   ├── session.store.js      # Sessões de login em memória (token -> usuário)
│   │   └── providers/            # Implementações por provedor (Anthropic/OpenAI/Google)
│   └── utils/srt-parser.js       # Parse e serialização de .srt
│
└── frontend/                     # Angular (standalone, sem Router)
    └── src/app/
        ├── translate/            # Tela de tradução + barra de progresso + cancelamento
        ├── settings/             # Tela de configuração de provedor/modelo/chave/prompt
        ├── login/                # Tela de login
        ├── account/              # Tela de conta (trocar usuário/senha)
        └── services/
            ├── settings.service.ts # Cliente HTTP das configurações
            ├── auth.service.ts     # Cliente HTTP de login/conta
            └── i18n.service.ts     # Traduções da interface (pt/en) e idioma ativo
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

### Docker

```bash
docker compose up -d --build
```

A pasta `./data` (na raiz do projeto) é montada como volume dentro do container (`/app/data`). É lá que ficam `settings.json` (chaves de API e prompt) e `auth.json` (usuário/senha de login) — como é uma pasta do host montada por bind mount, ela **nunca é apagada** por um `docker compose up --build`/atualização de imagem. Configure as chaves de API pela tela **Configurações** em vez do `.env`: assim elas sobrevivem a qualquer rebuild.

---

## 🔐 Login

O app fica protegido por tela de login. Usuário e senha padrão na primeira execução:

```
usuário: admin
senha:   admin
```

As credenciais ficam salvas (hash + salt, nunca em texto puro) em `data/auth.json`, na mesma pasta persistente usada pelas configurações — troque a senha assim que possível.

Pela tela **Conta** (aba ao lado de Configurações), com login já feito, dá para:

- Trocar o **usuário**, informando a senha atual
- Trocar a **senha**, informando a senha atual e confirmando a nova

Nenhuma das duas operações derruba a sessão atual — não é necessário logar de novo depois de alterar usuário ou senha.

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

## 📝 Personalizando o prompt de tradução

O texto enviado à IA a cada lote de legendas pode ser ajustado sem tocar em código:

- **Padrão**: definido pela variável `TRANSLATION_PROMPT_TEMPLATE` no `.env` (veja [`.env.example`](.env.example)). Se não for definida, o backend usa um prompt embutido no código.
- **Personalização**: na tela **Configurações**, o campo **Prompt de tradução** mostra o texto atual (padrão ou já customizado) e permite editar e salvar. O ajuste feito pela UI tem prioridade sobre o `.env` e fica salvo em `data/settings.json`.
- **Restaurar padrão**: o botão **Restaurar padrão** remove a customização salva e volta a usar o valor do `.env`.

Dois placeholders são substituídos automaticamente antes de cada requisição ao modelo:

| Placeholder | Conteúdo |
| --- | --- |
| `{{targetLanguage}}` | Idioma de destino escolhido no upload |
| `{{items}}` | JSON com os blocos de legenda daquele lote |

> O prompt precisa conter obrigatoriamente `{{items}}` — sem ele a requisição não tem como enviar as legendas ao modelo, e o backend recusa salvar.

---

## 🌐 Idioma da interface

O header tem duas bandeiras (🇧🇷 / 🇺🇸) para alternar o idioma dos textos da interface entre português e inglês. A escolha fica salva no navegador (`localStorage`) e não afeta o **idioma de destino da tradução**, que é selecionado separadamente na tela de Tradução.

---

## 🔒 Segurança

- Todas as rotas `/api/subtitles`, `/api/settings` e `/api/docs` exigem login (cookie de sessão `HttpOnly`); só `/api/auth/login` fica aberta.
- Senha do login é guardada com hash `scrypt` + salt aleatório, nunca em texto puro.
- Chaves de API **nunca** são enviadas ao frontend em texto completo — apenas mascaradas.
- `data/settings.json`, `data/auth.json` e `.env` estão no `.gitignore` e **não devem ser commitados**.
- Uploads são limitados a 5 MB e validados por extensão, MIME type e estrutura interna do `.srt`.

> **Antes de publicar este repositório**, confira se `.env`, `data/settings.json` e `data/auth.json` não estão sendo versionados (`git status` não deve listá-los) e se o `.env.example` contém apenas placeholders vazios.

---

## 🛣️ Possíveis próximos passos

- Persistir jobs em Redis/banco para sobreviver a restarts
- Suporte a outros formatos de legenda (`.vtt`, `.ass`)
- Múltiplos usuários (hoje o login é de um único usuário/senha compartilhado)

---

<div align="center">

Feito com Node.js, Express e Angular.

</div>
