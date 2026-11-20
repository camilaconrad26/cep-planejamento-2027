# Etapas 0 e 1 — Base, cadastro, diagnóstico e Visão geral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a base da v2 (Next.js com a identidade do CEP, esquema relacional com RLS, biblioteca semeada, cadastro) e a Etapa 1 (login, diagnóstico com fechamento do ano, perfis, Visão geral com "Seu próximo passo", configurações mínimas), publicada num projeto Vercel separado.

**Architecture:** Next.js App Router em TypeScript. Regras de negócio puras em `lib/domain/` (testadas com Vitest), acesso a dados em `lib/data/` (Supabase via `@supabase/ssr`, em Server Components e Server Actions), interface em `components/` e `app/`. O banco é o projeto Supabase do escritório, com tabelas `cep_*`, RLS por organização e migrações versionadas em `supabase/migrations/`, aplicadas pela ferramenta `apply_migration` do Supabase.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 3.4 · @supabase/supabase-js 2 + @supabase/ssr · Vitest 2 · Playwright (o Chromium já instalado no ambiente) · Supabase Edge Functions (Deno) · Vercel.

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md`

## Global Constraints

- Interface inteira em português do Brasil.
- Identidade do CEP:
  - Cores e fontes:
    - `--noite #0b0b0d`, `--noite-2 #16161a`, `--faixa #111114`;
    - `--ouro #e8c766` (só sobre escuro), `--ouro-fio #c9a24b`, `--ouro-texto #7a6022` (dourado de texto sobre claro);
    - `--creme #f6f2e8`, `--cinza-claro #ccc9c2`, `--cinza #a39b86`;
    - `--papel #fbf8f1`, `--papel-2 #f3ede0`, `--tinta #2a2620`, `--texto #3a352b`, `--sec #6b6253`;
    - títulos em `Georgia, Gelasio, serif` 700; corpo em `Calibri, Carlito, "Segoe UI", system-ui, sans-serif` (Gelasio e Carlito via `next/font/google`).
  - Botões em pílula (`border-radius: 999px`); cartões com raio 10px e borda `rgba(122,96,34,.25)`.
  - Faixas escuras para navegação e títulos; papel para a área de trabalho.
  - Selo: `public/cep-selo.webp`, `public/cep-selo-grande.webp`, `public/favicon.png`, `public/apple-touch-icon.png`, copiados de `/home/user/cep-planejamento-2027/`.
- Contraste mínimo WCAG AA; foco visível; alvos de toque ≥ 44px; sem rolagem horizontal a 390px; botão "Texto maior" (fonte base 125%).
- Todas as tabelas novas com prefixo `cep_`. Não alterar tabelas sem esse prefixo, nem a função `cep2027-conta`, nem as tabelas `cep2027_*`.
- Projeto Supabase: `kerssctooyqryzofbrzd` (URL `https://kerssctooyqryzofbrzd.supabase.co`, chave anon pública em `/home/user/cep-planejamento-2027/config.js`).
- Vercel: equipe `team_qGQ5Z5lhiodiBBf6sqmB3Vhq`; projeto novo `cep-planejamento-v2`. **Nunca** publicar no projeto `cep-planejamento-2027`, que serve a v1.
- Fuso de datas: `America/Sao_Paulo`. Ciclo 2027 = 2027-01-01 a 2027-12-31; antes disso, fase de planejamento no 1º trimestre.
- Biblioteca = os 105 itens de `/home/user/cep-planejamento-2027/dados.js` (`SEMENTE`), com texto intacto.
- Sem funcionalidade fictícia: itens de menu de módulos ainda não construídos não aparecem.
- Mentora: contato@protecaofamiliaempresa.com recebe papéis `mentora` e `admin`.

## Review Focus

- **Sessão expirada ou ausente:** abrir qualquer rota interna sem sessão leva a `/entrar` e, depois do login, volta à rota pedida (Task 6, teste e2e `redireciona-sem-sessao`).
- **Diagnóstico interrompido:** sair no meio e voltar retoma na primeira pergunta sem resposta, sem perder as respostas dadas (Task 8, teste `retoma-diagnostico`).
- **Primeiro acesso sem ciclo nem diagnóstico:** a Visão geral abre sem erro, cria o ciclo 2027 e mostra o próximo passo "Comece pelo diagnóstico" (Task 10, teste `primeiro-acesso`).
- **Duas alunas:** uma não lê nem altera linhas da outra em nenhuma tabela `cep_*` (Task 2, `supabase/tests/rls.sql`).
- **Valores monetários em formato brasileiro:** "R$ 200.000,00", "200.000" e "200000" no fechamento do ano são o mesmo número (Task 9, teste `parseMoeda`).

---

## Pré-requisitos (antes da Task 1)

1. **Rede:** o proxy deste ambiente bloqueia `kerssctooyqryzofbrzd.supabase.co` (recusa 403 vista nesta sessão). Pedir à usuária a liberação desse host para o ambiente (ferramenta de ambiente), para rodar o app e os testes e2e contra o Supabase real. Sem isso, as Tasks 6–12 só podem ser verificadas por testes unitários, pelo `execute_sql` e pela pré-visualização na Vercel.
2. **GitHub:** repositório `camilaconrad26/cep-planejamento-2027` criado pela usuária e anexado a esta sessão (`add_repo`, acesso `push`). Até lá, os commits ficam locais em `/home/user/cep-planejamento-v2` (`git init` já feito, branch `main`); o push vem depois.

---

### Task 1: Esqueleto Next.js com a identidade do CEP

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (redireciona para `/visao-geral`)
- Create: `components/ui/Botao.tsx`, `components/ui/Campo.tsx`, `components/ui/Cartao.tsx`, `components/ui/Selo.tsx`, `components/ui/Olho.tsx`
- Create: `app/(dev)/estilo/page.tsx`: vitrine dos componentes, visível só com `NODE_ENV=development`
- Copy: os 4 arquivos de imagem para `public/`
- Test: `components/ui/__tests__/Botao.test.tsx`

**Interfaces:**
- Produces:
  - `<Botao variante="primario"|"secundario"|"perigo" tamanho="normal"|"mini" sobreEscuro?: boolean>` (repassa as props de `<button>`);
  - `<Campo rotulo: string ajuda?: string erro?: string>` envolvendo um `input`/`select`/`textarea` filho;
  - `<Cartao titulo?: string>`;
  - `<Selo tamanho="normal"|"grande">`;
  - `<Olho>` (rótulo em caixa alta, `letter-spacing .28em`).
  - Classes Tailwind de cor com os nomes dos tokens (`bg-noite`, `text-ouro-texto`, …).

- [ ] **Step 1:** `npx create-next-app@15 . --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm`. Fixar Tailwind em `3.4.x`. Acrescentar `vitest@2`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom` e `jsdom`. Scripts: `test` = `vitest run`, `test:e2e` = `playwright test --trace off`.
- [ ] **Step 2: Teste que falha.**

```tsx
it("botão primário sobre papel usa o dourado de texto e é uma pílula", () => {
  render(<Botao>Salvar</Botao>);
  const b = screen.getByRole("button", { name: "Salvar" });
  expect(b.className).toMatch(/rounded-full/);
  expect(b.className).toMatch(/bg-ouro-texto/);
});
it("botão sobre escuro usa o dourado claro com texto escuro", () => {
  render(<Botao sobreEscuro>Entrar</Botao>);
  expect(screen.getByRole("button").className).toMatch(/bg-ouro .*text-noite|text-noite .*bg-ouro/);
});
```

- [ ] **Step 3:** `npm test` deve FALHAR (componente inexistente).
- [ ] **Step 4:** Implementar os tokens em `tailwind.config.ts`, as fontes em `app/layout.tsx` (`lang="pt-BR"`; ícones apontando para os arquivos do selo) e os componentes. O CSS global inclui:
  - `[hidden]{display:none!important}`;
  - a classe `html.grande` com `font-size:125%`;
  - foco em `outline 3px` (`--ouro-texto` sobre papel, `--ouro` dentro de `.escuro`).
- [ ] **Step 5:** `npm test` e `npm run build` devem PASSAR.
- [ ] **Step 6: Commit:** `feat: esqueleto Next.js com identidade visual do CEP`.

### Task 2: Esquema do banco, RLS e histórico de alterações

**Files:**
- Create: `supabase/migrations/20261120000100_cep_esquema.sql`
- Create: `supabase/migrations/20261120000200_cep_rls.sql`
- Create: `supabase/migrations/20261120000300_cep_historico.sql`
- Create: `supabase/tests/rls.sql`
- Create: `lib/data/tipos.ts` (tipos TypeScript gerados com `generate_typescript_types` e filtrados para `cep_*`)

**Interfaces:**
- Produces: as tabelas da spec §7, exatamente com esses nomes, e mais:
  - **Enums `cep_*`:**
    - `cep_nivel ('estrategico','tatico','operacional','okr','kpi')`;
    - `cep_status ('nao_iniciado','em_andamento','concluido')`;
    - `cep_prioridade ('baixa','media','alta')`;
    - `cep_papel ('mentora','admin')`;
    - `cep_altura ('meta','super','mega')`;
    - `cep_produto_tipo ('entrada','principal','alto_valor')`;
    - `cep_ciclo_status ('ativo','arquivado')`.
  - **Funções** (`security definer`, `set search_path = ''`, no esquema `private`):
    - `private.cep_eh_membro(org uuid) returns boolean`;
    - `private.cep_tem_papel(p cep_papel) returns boolean`.
  - **Funções públicas** (`security definer`, `set search_path = ''`):
    - `public.cep_iniciar_conta(p_nome text, p_email text) returns uuid`: cria `cep_profiles`, a organização pessoal, a filiação e o ciclo 2027 ativo, e devolve o `org_id`. Idempotente. Só executável por `service_role`.
    - `public.cep_garantir_ciclo(p_org uuid, p_ano int) returns uuid`: devolve o ciclo ativo do ano, criando-o se faltar. Executável por `authenticated`, e só para membro da organização.
  - **Restrições:**
    - índice único parcial `cep_cycles(org_id) where status = 'ativo'`;
    - `cep_cycle_priorities` com `unique(cycle_id, trimestre, category_id)`;
    - `trimestre` com `check between 1 and 4`;
    - `cep_library_items.perfil` com `check between 1 and 3`.
  - **Campos de KR:** `valor_inicial`, `alvo` e `unidade` aceitam nulo ("sem meta numérica").

- [ ] **Step 1: Teste que falha.** Escrever `supabase/tests/rls.sql`. É um único bloco `begin; … rollback;` que:
  - cria dois usuários em `auth.users` (`a@teste.cep`, `b@teste.cep`) e chama `cep_iniciar_conta` para cada um;
  - como A (`set local role authenticated` + `request.jwt.claims`), insere um objetivo e uma tarefa;
  - como B, conta as linhas visíveis de A em cada tabela de planejamento e tenta `update` e `delete` nelas;
  - como B, tenta inserir em `cep_library_items`;
  - como a mentora (usuário com papel `mentora`), conta as linhas de A e tenta `update`.

  Termina com `select` de linhas `(verificacao, esperado, obtido)`. Esperado:
  - B vê 0 linhas de A e afeta 0 linhas;
  - a inserção de B na biblioteca é negada;
  - a mentora vê > 0 linhas e afeta 0 linhas.
- [ ] **Step 2:** Rodar `rls.sql` com `execute_sql`. Deve FALHAR (tabelas inexistentes).
- [ ] **Step 3:** Escrever as três migrações:
  - **Esquema:** tabelas, FKs com `on delete cascade` a partir de `org_id` e `cycle_id`, índices em todas as FKs e `updated_at` com gatilho.
  - **RLS:**
    - Tabelas de planejamento: `select` para `cep_eh_membro(org_id) or cep_tem_papel('mentora')`; `insert`, `update` e `delete` só para `cep_eh_membro(org_id)`.
    - `cep_library_items` e `cep_categories`: `select` para `authenticated`; escrita para `cep_tem_papel('admin')`.
    - `cep_roles`: `select` só da própria linha; nenhuma escrita por clientes.
    - `cep_profiles`: o próprio usuário lê e atualiza; a mentora lê.
  - **Histórico:** gatilho `after insert or update or delete` nas tabelas de planejamento, gravando em `cep_activity`.
- [ ] **Step 4:** Aplicar as três com `apply_migration` (nome = nome do arquivo sem extensão). Inserir em `cep_roles` os papéis `mentora` e `admin` para o usuário de contato@protecaofamiliaempresa.com.
- [ ] **Step 5:** Rodar `rls.sql`: todas as linhas com `esperado = obtido`. Rodar `get_advisors` (security): nenhum aviso novo sobre tabelas `cep_*`.
- [ ] **Step 6:** Gerar `lib/data/tipos.ts`.
- [ ] **Step 7: Commit:** `feat(db): esquema cep_, RLS por organização e histórico`.

### Task 3: Biblioteca semeada a partir do Notion

**Files:**
- Create: `scripts/gerar-seed-biblioteca.ts`: lê `SEMENTE`, `CATS` e `NIVEIS` de `/home/user/cep-planejamento-2027/dados.js` (avaliado num contexto `vm` isolado) e escreve o SQL.
- Create: `supabase/migrations/20261120000400_cep_biblioteca_seed.sql` (gerado)
- Create: `lib/domain/categorias.ts`
- Test: `scripts/__tests__/gerar-seed-biblioteca.test.ts`

**Interfaces:**
- Produces:
  - `CATEGORIAS: { slug: string; nome: string; descricao: string; objetivo: string; ordem: number }[]`, com 7 entradas na ordem de `CATS` e slugs:
    - `posicionamento`, `comercial`, `parcerias`, `metodo`, `experiencia`, `financeiro`, `operacao`.
  - Descrição e objetivo são rascunho, marcado `// REVISAR COM A USUÁRIA`.
  - `gerarSeed(semente: string[][][], cats: string[]): string` (o SQL).

- [ ] **Step 1: Teste que falha.**

```ts
it("gera 105 itens, 5 níveis por perfil e categoria, texto intacto", () => {
  const sql = gerarSeed(SEMENTE, CATS);
  expect(sql.match(/insert into public\.cep_library_items/gi)?.length).toBe(105);
  expect(sql).toContain("Objetivo: transformar conversas iniciais em contratações de diagnóstico");
  expect(sql).toContain("KR: realizar 10 conversas iniciais e fechar 3 diagnósticos em 90 dias");
});
it("táticos, operacionais, OKR e KPI apontam para o estratégico do mesmo perfil e categoria", () => {
  const sql = gerarSeed(SEMENTE, CATS);
  expect(sql).toMatch(/parent_id/);
});
it("escapa aspas simples", () => {
  expect(gerarSeed([[["O'teste","b","c","d","e"]]], ["X"])).toContain("O''teste");
});
```

- [ ] **Step 2:** Rodar `npx vitest run scripts`. Deve FALHAR.
- [ ] **Step 3:** Implementar. Cada item usa UUID fixo derivado de `(perfil, categoria, nível)` (UUID v5 com namespace constante no script), para a migração ser repetível. O `parent_id` dos níveis 2 a 5 é o UUID do nível 1 do mesmo par. O arquivo usa `on conflict (id) do nothing`.
- [ ] **Step 4:** Os testes devem PASSAR. Gerar o arquivo e aplicar com `apply_migration`.
- [ ] **Step 5:** Conferir com `execute_sql`:
  - `select perfil, count(*) from cep_library_items group by 1` deve dar 35, 35, 35;
  - `select count(*) from cep_library_items where nivel <> 'estrategico' and parent_id is null` deve dar 0.
- [ ] **Step 6: Commit:** `feat(db): biblioteca do CEP com os 105 itens do Notion`.

### Task 4: Função de cadastro `cep-conta`

**Files:**
- Create: `supabase/functions/cep-conta/index.ts`
- Create: `supabase/tests/cep-conta.sql`: chamadas via `net.http_post` e conferência em `net._http_response`, o mesmo método já usado nesta sessão.

**Interfaces:**
- Consumes: `public.cep_iniciar_conta` (Task 2).
- Produces: `POST {SUPABASE_URL}/functions/v1/cep-conta`:
  - Corpo `{acao:"cadastro", nome, email, senha}`: responde `200 {ok:true}`, `400 {erro}`, `403 {erro}` (e-mail da equipe) ou `409 {erro}` (já cadastrado).
  - Corpo `{acao:"redefinir", userId, novaSenha}`, com o `Authorization: Bearer <jwt>` da mentora: responde `200`, `401`, `403` ou `400`.
  - Mensagens de erro em português, iguais às da `cep2027-conta`.
- `verify_jwt: false`, porque o cadastro é público e o token é validado dentro da função.

- [ ] **Step 1: Teste que falha.** O `cep-conta.sql` dispara:
  1. um cadastro válido com `teste-cep-v2@example.com`;
  2. um cadastro com o primeiro e-mail de `crm_equipe`;
  3. o mesmo cadastro válido de novo;
  4. uma redefinição sem token.

  Na segunda execução, confere os status `200, 403, 409, 401` e que o usuário de teste tem `cep_profiles`, filiação e ciclo 2027 ativo. Termina apagando o usuário de teste (`delete from auth.users where email = 'teste-cep-v2@example.com' and raw_user_meta_data->>'origem' = 'cep'`).
- [ ] **Step 2:** Rodar. Deve FALHAR (função inexistente: 404).
- [ ] **Step 3:** Implementar e publicar com `deploy_edge_function`. Partir do código da `cep2027-conta` (ler a versão publicada com `get_edge_function`):
  - `user_metadata.origem = "cep"`;
  - depois do `createUser`, chamar `cep_iniciar_conta` via RPC com a service role; se falhar, apagar o usuário criado;
  - na redefinição, exigir papel `mentora` em `cep_roles`, recusar alvos com papel em `cep_roles` e aceitar só alvos com origem `cep` ou `cep2027`.
- [ ] **Step 4:** Rodar `cep-conta.sql`. Os quatro status devem conferir e o usuário de teste deve ser removido.
- [ ] **Step 5: Commit:** `feat(auth): função de cadastro cep-conta`.

### Task 5: Regras de domínio (ciclo, atraso, próximo passo, perfil sugerido)

**Files:**
- Create: `lib/domain/ciclo.ts`, `lib/domain/proximoPasso.ts`, `lib/domain/diagnostico.ts`, `lib/domain/moeda.ts`
- Test: `lib/domain/__tests__/ciclo.test.ts`, `proximoPasso.test.ts`, `diagnostico.test.ts`, `moeda.test.ts`

**Interfaces:**
- Produces, em `ciclo.ts`:
  - `hojeSP(agora?: Date): string` (`YYYY-MM-DD` em America/Sao_Paulo);
  - `trimestreAtual(ano: number, hoje: string): { trimestre: 1|2|3|4; fase: "planejamento"|"execucao"|"encerrado" }`;
  - `estaAtrasada(t: { prazo: string|null; status: Status }, hoje: string): boolean`.
- Produces, em `moeda.ts`:
  - `parseMoeda(v: string|number|null): number`;
  - `formatarMoeda(n: number): string` (`R$ 200.000`, sem centavos).
- Produces, em `diagnostico.ts`:
  - `PERGUNTAS: Pergunta[]` com as 10 perguntas da spec §5 e as opções abaixo;
  - `sugerirPerfil(r: Respostas): 1|2|3|null`;
  - `resumirDiagnostico(r: Respostas, notas?: Record<string, number>): { fortes: string[]; atencao: string[]; prioridades: string[] /* slugs de categoria, no máximo 3 */ }`.
- Produces, em `proximoPasso.ts`:
  - `proximoPasso(s: Retrato): { codigo: CodigoPasso; titulo: string; texto: string; href: string }`;
  - `Retrato = { diagnosticoIniciado; trimestre; fase; categoriasNoTrimestre: number; categoriasSemAcao: string[]; atrasadas: number; medicaoVencida: number; trimestreAnteriorSemRevisao: boolean; vencendo7dias: number }`.
- **Opções das perguntas** (a usuária revisa os textos depois):

| Pergunta | Opções |
|---|---|
| 1. Estágio | "Estou começando na área patrimonial" (→1) · "Atuo de forma autônoma e já conduzo casos" (→2) · "Tenho escritório com equipe e carteira de famílias" (→3) |
| 2. Tempo de atuação | "Menos de 1 ano" · "1 a 3 anos" · "3 a 5 anos" · "Mais de 5 anos" |
| 3. Projetos patrimoniais | "Nenhum" · "1 a 3" · "4 a 10" · "11 a 30" · "Mais de 30" |
| 4. Equipe | "Trabalho sozinha(o)" · "Tenho apoio pontual (estagiário, parceiro)" · "Tenho equipe fixa" |
| 5. Serviços (vários) | "Diagnóstico patrimonial" · "Holding familiar" · "Planejamento sucessório" · "Testamento e pacto antenupcial" · "Acordo de sócios" · "Inventário" · "Outro" |
| 6. Origem dos clientes (vários) | "Indicação de clientes" · "Parceiros (contador, corretor, assessor)" · "Conteúdo e redes sociais" · "Eventos e palestras" · "Anúncios" · "Outro" |
| 7. Comercial estruturado | "Sim" · "Em parte" · "Não" (categoria `comercial`) |
| 8. Controle financeiro | "Sim" · "Em parte" · "Não" (categoria `financeiro`) |
| 9. Método próprio | "Sim" · "Em parte" · "Não" (categoria `metodo`) |
| 10. Desafios (vários + texto) | "Conseguir clientes" (`comercial`) · "Precificar" (`financeiro`) · "Ser reconhecida(o) como especialista" (`posicionamento`) · "Organizar a rotina" (`operacao`) · "Padronizar entregas" (`metodo`) · "Conduzir a família" (`experiencia`) · "Construir parcerias" (`parcerias`) |

- **`sugerirPerfil`:**
  - a pergunta 1 respondida manda;
  - sem ela: equipe fixa **e** projetos em {"11 a 30", "Mais de 30"} → 3;
  - projetos em {"Nenhum", "1 a 3"} → 1;
  - qualquer outra resposta à pergunta 3 → 2;
  - sem as perguntas 1 e 3 → `null`.
- **`resumirDiagnostico`:**
  - para as perguntas 7–9: "Sim" vai para `fortes`; "Em parte" e "Não" vão para `atencao`;
  - os textos são fixos, por exemplo "Processo comercial estruturado" e "Processo comercial ainda não estruturado";
  - prioridades: categorias com pontuação — "Não" = 2, "Em parte" = 1, cada desafio marcado na pergunta 10 = 2, nota do fechamento ≤ 4 = 2, nota 5–6 = 1;
  - ordem decrescente de pontuação, empate pela ordem de `CATEGORIAS`, no máximo 3, só com pontuação > 0.
- **`proximoPasso`:** a primeira regra verdadeira, nesta ordem e com estes códigos:

| Código | Condição |
|---|---|
| `diagnostico` | `!diagnosticoIniciado` |
| `prioridades` | `categoriasNoTrimestre === 0` |
| `categoria-sem-acao` | `categoriasSemAcao.length > 0` |
| `atrasadas` | `fase === "execucao" && atrasadas > 0` |
| `medir` | `medicaoVencida > 0` |
| `revisao` | `fase === "execucao" && trimestreAnteriorSemRevisao` |
| `vencendo` | `vencendo7dias > 0` |
| `em-dia` | sempre |

  `href` aponta para a rota do módulo. Módulos ainda não construídos usam `/visao-geral#em-breve`.

- [ ] **Step 1: Testes que falham** (valores exatos):
  - `trimestreAtual(2027, "2026-11-20")` → `{ trimestre: 1, fase: "planejamento" }`;
  - `trimestreAtual(2027, "2027-05-02")` → `{ 2, "execucao" }`;
  - `trimestreAtual(2027, "2028-01-03")` → `{ 4, "encerrado" }`;
  - `estaAtrasada({ prazo: "2027-03-01", status: "em_andamento" }, "2027-03-02")` → `true`;
  - o mesmo com `status: "concluido"` → `false`;
  - com `prazo: null` → `false`;
  - `hojeSP(new Date("2027-01-01T02:00:00Z"))` → `"2026-12-31"`;
  - `parseMoeda("R$ 200.000,00")`, `parseMoeda("200.000")` e `parseMoeda("200000")` → `200000`;
  - `parseMoeda("1.234,5")` → `1234.5`;
  - `parseMoeda("")` → `0`;
  - `formatarMoeda(87500)` → `"R$ 87.500"`;
  - `sugerirPerfil({ estagio: 3 })` → `3`;
  - `sugerirPerfil({ projetos: "Nenhum" })` → `1`;
  - `sugerirPerfil({ projetos: "Mais de 30", equipe: "Tenho equipe fixa" })` → `3`;
  - `sugerirPerfil({ projetos: "4 a 10" })` → `2`;
  - `sugerirPerfil({})` → `null`;
  - `resumirDiagnostico({ comercial: "Não", financeiro: "Sim", metodo: "Em parte", desafios: ["Precificar"] })`:
    - `.prioridades` → `["comercial", "financeiro", "metodo"]`;
    - `.fortes` contém "Controle financeiro estruturado";
  - `proximoPasso` com o retrato vazio do primeiro acesso → `codigo: "diagnostico"`;
  - com diagnóstico iniciado e 0 categorias → `"prioridades"`;
  - com `fase: "planejamento"` e 5 atrasadas → não retorna `"atrasadas"`.
- [ ] **Step 2:** `npm test`. Deve FALHAR.
- [ ] **Step 3:** Implementar. O fuso usa `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })`.
- [ ] **Step 4:** `npm test` deve PASSAR.
- [ ] **Step 5: Commit:** `feat(domain): ciclo, atraso, moeda, diagnóstico e próximo passo`.

### Task 6: Supabase no app, proteção de rotas, entrar e criar conta

**Files:**
- Create: `lib/data/supabase/servidor.ts`, `lib/data/supabase/navegador.ts`, `middleware.ts`
- Create: `app/(publico)/entrar/page.tsx`, `app/(publico)/criar-conta/page.tsx`, `app/(publico)/layout.tsx` (tela escura com selo grande, título "Planejamento Estratégico 2027" e a citação "Antes do litígio, existe decisão.", como na v1)
- Create: `lib/data/conta.ts` (Server Actions)
- Test: `e2e/autenticacao.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Consumes: a função `cep-conta` (Task 4).
- Produces:
  - `criarClienteServidor(): SupabaseClient<Database>`;
  - `criarClienteNavegador()`;
  - Server Actions:
    - `entrar(form: FormData): Promise<{ erro?: string }>`;
    - `criarConta(form: FormData): Promise<{ erro?: string }>`;
    - `sair(): Promise<void>`;
  - `exigirSessao(): Promise<{ userId: string; orgId: string; perfil: 1|2|3|null; papeis: Papel[]; nome: string }>`, usado por todas as páginas internas.
- **Regras:**
  - O `middleware` renova a sessão.
  - Rotas fora de `(publico)` sem sessão redirecionam para `/entrar?volta=<rota>`.
  - Com sessão, `/entrar` vai para `/visao-geral`.
  - Mensagens:
    - "E-mail ou senha incorretos.";
    - "Informe um e-mail válido.";
    - "A senha precisa de pelo menos 8 caracteres.";
    - "Informe o seu nome completo.".
  - Esqueci a senha: o texto "Esqueceu a senha? Peça uma senha provisória à mentora do CEP.".

- [ ] **Step 1: Testes e2e que falham:**
  - `redireciona-sem-sessao`: abrir `/visao-geral` cai em `/entrar?volta=%2Fvisao-geral`;
  - `login-invalido`: e-mail com senha errada mostra o erro com `role="alert"`;
  - `cadastro-e-login`: criar conta com `e2e-<timestamp>@example.com` chega em `/visao-geral` com a saudação.

  A limpeza do usuário criado é feita depois via `execute_sql`, com o mesmo filtro de origem da Task 4.
- [ ] **Step 2:** `npm run test:e2e`. Deve FALHAR.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm run test:e2e` deve PASSAR (requer o pré-requisito de rede). `npm test` também deve PASSAR.
- [ ] **Step 5: Commit:** `feat(auth): entrar, criar conta e rotas protegidas`.

### Task 7: Casca do app (menu lateral, topo, gaveta no celular)

**Files:**
- Create: `app/(app)/layout.tsx`, `components/layout/MenuLateral.tsx`, `components/layout/Topo.tsx`, `components/layout/FaixaTitulo.tsx`, `components/layout/itensMenu.ts`
- Test: `components/layout/__tests__/itensMenu.test.ts`, `e2e/navegacao.spec.ts`

**Interfaces:**
- Consumes: `exigirSessao()` (Task 6).
- Produces:
  - `itensMenu(papeis: Papel[], construidos: Set<Rota>): ItemMenu[]`, com a ordem da spec §5:
    - `/visao-geral`, `/diagnostico`, `/planejamento`, `/biblioteca`, `/plano-de-acao`, `/metas`, `/revisao`, `/historico`, `/configuracoes`;
    - mais `/alunas` para a mentora.
  - Só entram as rotas em `construidos`. Nesta etapa: `/visao-geral`, `/diagnostico` e `/configuracoes`.
  - `<FaixaTitulo olho titulo descricao>`: faixa escura de título da página, com o `h1`.
- **Comportamento:**
  - Menu escuro fixo à esquerda a partir de 1024px; abaixo disso, botão "Menu" no topo abre uma gaveta (`dialog` modal) que fecha com Esc e devolve o foco ao botão.
  - Item atual com `aria-current="page"`.
  - Topo com o nome da aluna, o status de salvamento (`role="status"`), "Texto maior" (`aria-pressed`, guardado em cookie `cep-fonte`) e "Sair".
  - Link "Pular para o conteúdo".

- [ ] **Step 1: Testes que falham:**
  - `itensMenu(["mentora"], new Set(["/visao-geral"]))` → só Visão geral;
  - com o papel `mentora` e `/alunas` em `construidos`, inclui Alunas;
  - sem o papel, não inclui;
  - e2e `gaveta-celular` (viewport 390×800): abre a gaveta, navega para Diagnóstico e confirma que o foco foi para o `h1`;
  - e2e `sem-rolagem-lateral`: `scrollWidth - innerWidth === 0` em todas as rotas construídas, com e sem "Texto maior".
- [ ] **Step 2:** Rodar. Deve FALHAR.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Os testes devem PASSAR.
- [ ] **Step 5: Commit:** `feat(ui): casca do app com menu lateral e gaveta`.

### Task 8: Meu diagnóstico (perguntas e resumo)

**Files:**
- Create: `app/(app)/diagnostico/page.tsx`, `app/(app)/diagnostico/[passo]/page.tsx`, `app/(app)/diagnostico/resumo/page.tsx`
- Create: `components/diagnostico/Pergunta.tsx`, `components/diagnostico/Progresso.tsx`
- Create: `lib/data/diagnostico.ts`
- Test: `e2e/diagnostico.spec.ts`

**Interfaces:**
- Consumes: `PERGUNTAS`, `sugerirPerfil` e `resumirDiagnostico` (Task 5); `exigirSessao` (Task 6); `FaixaTitulo` (Task 7).
- Produces:
  - `obterDiagnostico(orgId): Promise<Diagnostico|null>`, que retorna o mais recente;
  - Server Actions:
    - `salvarResposta(orgId, chave, valor)`: atualiza `respostas` do diagnóstico em aberto, criando-o se faltar;
    - `concluirDiagnostico(orgId)`: grava `perfil_sugerido`, `resumo` e `concluido_em`;
    - `confirmarPerfil(perfil: 1|2|3)`: atualiza `cep_profiles.perfil`;
    - `refazerDiagnostico(orgId)`: cria uma nova versão, copiando as respostas.
- **Comportamento:**
  - Uma pergunta por tela, com "Voltar", "Pular" e "Continuar"; a resposta é salva ao avançar.
  - Indicador "Pergunta 3 de 10".
  - `/diagnostico` abre na primeira pergunta sem resposta, ou no resumo se concluído.
  - O resumo mostra pontos fortes, pontos de atenção e até 3 prioridades (nome da categoria).
  - O perfil sugerido vem com "Confirmar Perfil N" e a alternativa "Escolher outro perfil" (os 3 cartões de perfil com os textos da v1).
  - Botão "Refazer diagnóstico".

- [ ] **Step 1: Testes e2e que falham:**
  - `retoma-diagnostico`: responder as perguntas 1–3, recarregar e confirmar que abre na pergunta 4 com as anteriores preservadas ao voltar;
  - `resumo-e-perfil`: responder tudo com estágio = "Tenho escritório com equipe e carteira de famílias"; o resumo sugere Perfil 3; confirmar e conferir que a Visão geral mostra "Perfil 3";
  - `pular`: pular todas leva ao resumo sem erro, com o texto "Responda ao menos o estágio ou a quantidade de projetos para sugerirmos um perfil."
- [ ] **Step 2:** Rodar. Deve FALHAR.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Os testes devem PASSAR.
- [ ] **Step 5: Commit:** `feat(diagnostico): perguntas em etapas, resumo e perfil sugerido`.

### Task 9: Fechamento do ano anterior (dentro do diagnóstico)

**Files:**
- Create: `app/(app)/diagnostico/fechamento/page.tsx`, `components/diagnostico/Fechamento.tsx`, `components/ui/CampoMoeda.tsx`
- Modify: `lib/data/diagnostico.ts`: adicionar `salvarFechamento(orgId, f: Fechamento)`
- Test: `components/ui/__tests__/CampoMoeda.test.tsx`, `e2e/fechamento.spec.ts`

**Interfaces:**
- Consumes: `parseMoeda` e `formatarMoeda` (Task 5).
- Produces:
  - `Fechamento = { faturamento: number; meta: number; contratos: number; origem: string; notas: Record<slugCategoria, 0..10>; deuCerto: string; naoFuncionou: string; aprendizados: string; parar: string; continuar: string; comecar: string; pendencias: { id: string; texto: string; destino: "levar"|"delegar"|"encerrar"|null; trimestre: 1|2|3|4|null; feito: boolean }[] }`;
  - salvo em `cep_diagnostics.fechamento_ano`.
- **Comportamento:**
  - Mesmos campos e textos de ajuda da aba "Olhar para 2026" da v1, exibindo ticket médio e meta atingida calculados.
  - Salvamento automático 900 ms depois da última digitação, com o status "Salvando…" / "Salvo às HH:MM" / "Não foi possível salvar. Verifique a conexão." no topo.
  - Remover pendência mostra "Pendência removida." com "Desfazer" por 10 s.
  - As notas passam a alimentar `resumirDiagnostico`.

- [ ] **Step 1: Testes que falham:**
  - `CampoMoeda`: digitar "200000" e sair do campo mostra "R$ 200.000" e entrega `200000` ao `onChange`;
  - e2e: preencher faturamento 200000, meta "250.000,00" e contratos 10 mostra "R$ 20.000" e "80%";
  - recarregar mantém os valores;
  - adicionar, remover e desfazer uma pendência a restaura.
- [ ] **Step 2:** Rodar. Deve FALHAR.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Os testes devem PASSAR.
- [ ] **Step 5: Commit:** `feat(diagnostico): fechamento do ano anterior`.

### Task 10: Visão geral

**Files:**
- Create: `app/(app)/visao-geral/page.tsx`, `components/visao-geral/ProximoPasso.tsx`, `components/visao-geral/Resumo.tsx`
- Create: `lib/data/retrato.ts`
- Test: `lib/data/__tests__/retrato.test.ts` (com um cliente Supabase falso), `e2e/visao-geral.spec.ts`

**Interfaces:**
- Consumes: `exigirSessao`, `cep_garantir_ciclo` (RPC), `trimestreAtual`, `proximoPasso`, `estaAtrasada` e `obterDiagnostico`.
- Produces: `montarRetrato(cliente, orgId, hoje: string): Promise<{ retrato: Retrato; ciclo: { id: string; ano: number }; contagens: { emAndamento: number; atrasadas: number; vencendo7dias: number; execucaoPct: number }; prioridades: { slug: string; nome: string }[] }>`.
- **Comportamento:**
  - Faixa escura com "Olá, {primeiro nome}", perfil, "Ciclo 2027 · {N}º trimestre" e, na fase de planejamento, o selo "Fase de planejamento".
  - Bloco "Seu próximo passo estratégico" em destaque, com título, texto e botão.
  - Números: ações em andamento, atrasadas, vencendo em 7 dias e % de execução. Com zero tarefas, mostram "—" e a frase "As ações aparecem aqui quando você montar o plano (etapa em construção)."
  - Categorias prioritárias do trimestre, ou o estado vazio.
  - Nenhum gráfico nesta etapa.

- [ ] **Step 1: Testes que falham:**
  - `montarRetrato` com o banco vazio para a organização → `retrato.diagnosticoIniciado === false` e `ciclo.ano === 2027`;
  - com 3 tarefas (1 concluída, 1 atrasada em execução, 1 sem prazo) e `hoje = "2027-02-10"` → `atrasadas: 1`, `execucaoPct: 33`;
  - e2e `primeiro-acesso`: uma conta nova vê "Comece pelo diagnóstico", e o botão leva a `/diagnostico`.
- [ ] **Step 2:** Rodar. Deve FALHAR.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Os testes devem PASSAR.
- [ ] **Step 5: Commit:** `feat(visao-geral): resumo e próximo passo estratégico`.

### Task 11: Configurações mínimas

**Files:**
- Create: `app/(app)/configuracoes/page.tsx`, `lib/data/perfil.ts`
- Test: `e2e/configuracoes.spec.ts`

**Interfaces:**
- Produces Server Actions:
  - `atualizarNome(nome: string)`;
  - `atualizarPerfil(perfil: 1|2|3)`;
  - `trocarSenha(nova: string)`: mínimo 8 caracteres, via `supabase.auth.updateUser`;
  - `excluirConta()`: só depois de digitar "EXCLUIR" na própria tela, sem `confirm()`. Apaga a organização pessoal (cascata) e o usuário, via um RPC `security definer` `public.cep_excluir_minha_conta()` acrescentado numa migração `20261120000500_cep_excluir_conta.sql`. Recusa contas com papel em `cep_roles`.
- **Comportamento:** cada ação mostra um aviso de sucesso ou erro, anunciado com `role="status"`.

- [ ] **Step 1: Testes e2e que falham:**
  - trocar o perfil para 2 reflete na Visão geral;
  - trocar a senha e entrar de novo com a nova funciona;
  - excluir conta sem digitar "EXCLUIR" mantém o botão desabilitado;
  - excluir com a palavra leva a `/entrar`, e o login antigo falha.
- [ ] **Step 2:** Rodar. Deve FALHAR.
- [ ] **Step 3:** Implementar e aplicar a migração.
- [ ] **Step 4:** Os testes devem PASSAR.
- [ ] **Step 5: Commit:** `feat(configuracoes): nome, perfil, senha e exclusão de conta`.

### Task 12: Publicação da pré-visualização

**Files:**
- Create: `README.md` (como rodar, testar e publicar; variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

- [ ] **Step 1:** Criar o projeto Vercel `cep-planejamento-v2` (`create_project`, `framework: "nextjs"`) e remover a proteção de login da Vercel (`ssoProtection: null`). Cadastrar as duas variáveis públicas (`create_project_env`, `target` production e preview).
- [ ] **Step 2:** Publicar:
  - com o repositório conectado, via Git (push na `main`);
  - sem ele, enviando os arquivos com `npm run build` local + upload dos fontes por `/v2/files` e `create_deployment`, o mesmo método já usado nesta sessão.
- [ ] **Step 3:** `get_deployment` deve mostrar `READY`. `web_fetch_vercel_url` em `/entrar` deve responder 200 com "Planejamento Estratégico".
- [ ] **Step 4:** Rodar `get_advisors` (security e performance) e corrigir avisos novos em objetos `cep_*`.
- [ ] **Step 5: Commit:** `docs: README e publicação da pré-visualização`, e push quando o repositório existir.
