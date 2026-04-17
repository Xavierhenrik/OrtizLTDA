# Site Institucional Ortiz Ltda

Site com painel administrativo para gerenciar e exibir projetos com múltiplas imagens.

## Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Backend / dados:** Supabase (PostgreSQL, Auth, Storage)
- **Estáticos:** `public/` (CSS global, assets)

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para **`.env`** ou **`.env.local`** (na raiz, ao lado de `package.json`) e preencha:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Depois de editar, reinicie o `npm run dev`. O `.env` já está no `.gitignore` (não commitar segredos).

3. No Supabase, aplique as migrations em `supabase/migrations/` e configure o bucket `project-images`. Crie um usuário em **Authentication** e defina `is_admin = true` em `public.profiles` para o painel.

## Execução local

```bash
npm run dev
```

- Site: `http://localhost:3000`
- Projetos: `http://localhost:3000/projetos`
- Admin: `http://localhost:3000/admin/login`

Produção (ex.: Vercel): `npm run build` e `npm start`; defina as mesmas variáveis no painel do provedor (não use o arquivo `.env` do disco lá).

## Documentação da migração

Detalhes do plano Vercel + Supabase: `docs/migration-vercel-supabase/README.md`.
