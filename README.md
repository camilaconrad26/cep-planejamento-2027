# Planejamento Estratégico CEP — v2

Aplicativo do planejamento estratégico 2027 das alunas do CEP · Clube da Estratégia Patrimonial.
Design: `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` · Plano das etapas 0 e 1: `docs/superpowers/plans/`.
A versão 1 (em produção) está em `v1/`.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind 3.4 · Supabase (Auth, Postgres com RLS, Edge Function `cep-conta`) · Vercel.

## Rodar
```bash
cp .env.example .env.local   # preencha NEXT_PUBLIC_SUPABASE_ANON_KEY (chave pública "anon" do projeto)
npm install
npm run dev
```

## Testar
```bash
npm test                     # regras de negócio e componentes (Vitest)
npm run build && npx next start -p 3100 &
npm run test:e2e             # ponta a ponta (Playwright) contra o Supabase real
```
Os testes de ponta a ponta criam contas `e2e-*@example.com`; apague-as depois:
`delete from auth.users where email like 'e2e-%@example.com' and raw_user_meta_data->>'origem' = 'cep';`

Testes do banco (rodar com o SQL editor do Supabase; cada um desfaz o que faz): `supabase/tests/*.sql`.
Teste da função de cadastro: `bash supabase/tests/cep-conta.sh`.

## Banco
Migrações em `supabase/migrations/` (prefixo `cep_`, no projeto do escritório). A biblioteca é gerada a partir dos 105 itens do Notion:
`npx tsx scripts/gerar-seed-biblioteca.ts > supabase/migrations/20261120000400_cep_biblioteca_seed.sql`.

## Publicação
Projeto Vercel `cep-planejamento-v2` (pré-visualização). O projeto `cep-planejamento-2027` continua servindo a v1 até a troca.
