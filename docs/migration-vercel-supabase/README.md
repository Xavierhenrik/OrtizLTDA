# Migração: Vercel + Supabase (PostgreSQL)

Documento de referência para implementação. **Público-alvo:** desenvolvedores e agentes de IA que atuam neste repositório.

> **Estado do repositório:** a stack legada (Express, Mongoose, HTML em `public/`, `server.legacy.js`) foi **removida**. O site é só **Next.js** (`app/`) + **Supabase**. Use este doc como histórico do plano e checklist de operação.

---

## 0. Metadados (contexto fixo)

| Campo | Valor |
|--------|--------|
| Repositório | `ortizltda-site` — Next.js (App Router) + estáticos em `public/` |
| Estado atual | PostgreSQL/Auth/Storage via **Supabase**; deploy alvo **Vercel** |
| Histórico (pré-migração) | MongoDB, sessão `connect-mongo`, uploads em `public/uploads/` |
| Idioma deste doc | PT-BR |

**Invariante:** Não presuma outros microserviços; este repo é o escopo. Se integração externa for necessária, peça contrato explícito ao time.

---

## 1. Inventário do código atual (fonte da verdade)

### 1.1 Stack (dependências)

Arquivo: `package.json`

- `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`

### 1.2 Entrada da aplicação

- Rotas e páginas: `app/` (App Router)
- Cliente Supabase servidor: `lib/supabase/server.ts`; middleware: `middleware.ts` + `lib/supabase/middleware.ts`
- Estáticos globais: `public/` (ex.: `style.css`)

### 1.3 Dados (Supabase)

| Recurso | Onde |
|--------|------|
| Projetos + URLs de imagem (jsonb) | tabela `public.projects` (migration em `supabase/migrations/`) |
| Admin | `public.profiles.is_admin` + Supabase Auth |

### 1.4 Rotas e contratos HTTP (preservar comportamento)

| Método | Caminho | Auth | Corpo / notas |
|--------|---------|------|----------------|
| GET | `/` | — | `app/page.tsx` |
| GET | `/projetos` | — | `app/projetos/page.tsx` |
| GET | `/admin/login` | — | `app/admin/login/page.tsx` |
| POST | `/admin/login` | — | JSON `{ email, password }` → `{ success: true }` ou 401 |
| GET | `/admin/logout` | — | destroy session + redirect `/admin/login` |
| GET | `/admin` | sessão Supabase | `app/admin/page.tsx` |
| GET | `/api/projects` | — | JSON array de projetos |
| POST | `/api/projects` | sessão | multipart: `title`, `description`, `category`, `images[]` |
| PUT | `/api/projects/:id` | sessão | multipart; opcionalmente novas imagens |
| DELETE | `/api/projects/:id` | sessão | — |

Consumidores no front (React/`app/`):

- `app/admin/login/page.tsx` → `fetch('/admin/login', …)` (POST; rewrite interno para handler em `app/api/auth/admin-login/`)
- `app/projetos/page.tsx` → `fetch('/api/projects')`
- `app/admin/page.tsx` → `fetch('/api/projects')`, POST/PUT/DELETE em `/api/projects`

### 1.5 O que não existe em produção serverless

- Persistência de arquivos em disco do container (Vercel: filesystem efêmero).
- `connect-mongo` como store de sessão (substituir por modelo Supabase Auth + cookies/JWT conforme doc oficial Supabase + Next.js se usar Next).

---

## 2. Arquitetura alvo (decisões)

| Tema | Decisão recomendada |
|------|---------------------|
| Hospedagem | **Next.js** (App Router) na Vercel: páginas + Route Handlers substituem Express monolítico. |
| Banco | **Supabase = PostgreSQL**; migrations versionadas (SQL no repositório). |
| Auth | **Supabase Auth** (email/senha) + perfil (`is_admin`). Evitar duplicar bcrypt + sessão manual salvo requisito explícito. |
| Upload | **Supabase Storage**; URLs persistidas no Postgres (tabela de imagens ou `jsonb`). |
| IDs | Preferir **UUID** em tabelas novas; migrar `ObjectId` do Mongo via script com mapeamento ou novos IDs + atualização de referências. |

---

## 3. Schema PostgreSQL (esboço para implementação)

Ajuste nomes com o padrão do time; mantenha RLS alinhado ao auth.

- **`profiles`** (ou equivalente): `id` FK → `auth.users`, `is_admin boolean`, timestamps.
- **`projects`**: `id uuid PK`, `title`, `description`, `category`, `created_at`, `updated_at`.
- **Imagens**: tabela `project_images` (`project_id`, `storage_path` ou `public_url`, `sort_order`) **ou** coluna `image_urls jsonb` em `projects` para migração rápida.

**RLS:** leitura pública de projetos (site); escrita apenas para usuário com `is_admin` (claim JWT + política testada no Dashboard).

---

## 4. Variáveis de ambiente (checklist)

| Variável | Onde | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + servidor | Chave pública (respeitar RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Somente servidor** (Route Handlers / scripts) | Operações privilegiadas; nunca expor ao browser |

Variáveis Mongo/Express não existem mais neste repositório. Ver `.env.example` na raiz.

---

## 5. Roadmap por fases (ordem de execução)

### Fase A — Supabase fundação

1. Criar projeto Supabase (região adequada).
2. Aplicar migrations: `profiles`, `projects`, imagens (ou `jsonb`).
3. Configurar RLS e testar no SQL Editor com usuário anônimo vs autenticado.
4. Criar bucket Storage; políticas de leitura/escrita alinhadas ao admin.

**Entregável:** migrations no Git + evidência de políticas OK.

### Fase B — App Vercel (substituir Express)

1. Inicializar Next.js (ou integrar em subpasta se o time padronizar monorepo).
2. Servir páginas equivalentes a `public/*.html` (rotas App Router ou migrar HTML para componentes).
3. Implementar `GET /api/projects` lendo Postgres (Supabase client servidor).
4. Remover dependência de `mongoose` / `connect-mongo` no caminho de produção.

**Entregável:** `next build` verde; listagem pública funcional.

### Fase C — Auth e CRUD admin

1. Login com Supabase Auth; proteger rotas admin (middleware Next + sessão Supabase SSR conforme docs).
2. POST/PUT/DELETE de projetos; upload para Storage; persistir metadados.
3. Paridade com fluxos em `public/admin/dashboard.html` (ajustar `fetch` se base path mudar).

**Entregável:** admin cria/edita/remove com imagens persistentes após redeploy.

### Fase D — Migração de dados

1. Export Mongo (users + projects).
2. Criar usuários admin no Supabase Auth + `profiles`.
3. Script: inserir `projects` + migrar imagens antigas para bucket + atualizar URLs.

**Entregável:** script idempotente ou documentado passo a passo + backup do Mongo antes do cutover.

### Fase E — Go-live

1. Variáveis na Vercel (Production + Preview).
2. DNS/domínio apontando para Vercel.
3. Desligar stack antiga após período de observação.

---

## 6. Critérios de aceite (testável)

- [ ] `/` e `/projetos` exibem dados vindos do Supabase.
- [ ] Visitante **não** altera dados (RLS ou checagem servidor comprovada).
- [ ] Admin autenticado CRUD completo; imagens servidas via Storage/URLs corretas.
- [ ] Nenhuma escrita necessária em filesystem local em produção.
- [ ] Logout e expiração de sessão comportam-se como esperado.

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Limite de body em serverless | Upload direto ao Storage com URL assinada (padrão Supabase) se multipart estourar limites. |
| IDs Mongo vs UUID | Tabela de mapeamento na migração ou novos IDs + script de substituição de links. |
| Cookies / CORS | Seguir guia Supabase SSR para Next; testar em domínio real e Preview URL. |

---

## 8. Instruções para agentes de IA (operacional)

1. **Ler antes de editar:** `app/` (rotas), `lib/supabase/`, `middleware.ts`, `app/api/projects/`, páginas em `app/admin/` e `app/projetos/`.
2. **Não expandir escopo:** não refatorar design system nem adicionar features fora deste roadmap salvo ticket explícito.
3. **Preservar contratos:** ao renomear rotas, manter redirects ou atualizar **todos** os `fetch` listados na seção 1.4.
4. **Segredos:** nunca commitar `SERVICE_ROLE_KEY`; usar apenas env e documentação de nome de variável.
5. **Commits:** mensagens claras por fase (ex.: `feat: add supabase schema migration`).

---

## 9. Referência rápida de arquivos

```
app/                     # Páginas e Route Handlers (Next.js)
lib/supabase/            # Cliente Supabase (servidor / middleware)
middleware.ts            # Sessão Supabase + proteção /admin + rewrite POST login
supabase/migrations/     # SQL PostgreSQL + RLS + Storage
public/style.css         # Estilos globais (assets de imagem conforme repo)
```

---

*Última estruturação alinhada ao repositório OrtizLTDA; revisar após grandes mudanças de branch.*
