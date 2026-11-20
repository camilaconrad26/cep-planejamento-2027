# Etapa 2 — Biblioteca de estratégias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A aluna navega pelos 105 itens originais do CEP filtrando por perfil, categoria e nível e adiciona itens ao plano de 2027 escolhendo o trimestre; a admin edita a biblioteca.

**Architecture:** Leitura da biblioteca no servidor (módulo `server-only`), filtros pela URL (`?perfil=&categoria=&nivel=`), regras puras em `lib/domain/biblioteca.ts`. "Adicionar ao meu plano" é uma função SQL `security invoker` (RLS vale) que, numa transação, garante o ciclo, cria o objetivo estratégico da categoria se faltar e cria o registro do nível (objetivo, tarefa, KR sob OKR, KPI), sem duplicar. Edição da admin protegida pelas políticas já existentes (`cep_tem_papel('admin')`).

**Tech Stack:** Next.js 15.5 App Router, React 19, TypeScript strict, Tailwind 3.4.19, @supabase/ssr 0.12.7, Vitest 2, Playwright 1.63, Postgres (Supabase `kerssctooyqryzofbrzd`).

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§5 item 4, §6, §8 "Itens da biblioteca", §10 Etapa 2)

## Global Constraints

- Tudo em português do Brasil; texto dos itens da biblioteca exibido **sem alteração** (§6).
- Objetos de banco novos com prefixo `cep_`; não tocar em tabelas do escritório.
- Identidade CEP: faixa escura com dourado #e8c766 só sobre escuro; área de trabalho papel #fbf8f1; #7a6022 como dourado de texto sobre claro; botões em pílula; contraste AA.
- Nenhuma regra de acesso depende da interface (§7 RLS); papéis só por SQL.
- Sem funcionalidade fictícia: atalhos só para módulos construídos (`ROTAS_CONSTRUIDAS`).
- Funciona a 390 px e com "Texto maior".
- Migrações aplicadas no projeto real; testes SQL rodam numa transação com `rollback`.
- Commits terminam com as linhas de atribuição da sessão; sem identificador de modelo.
- Nunca publicar a v2 no projeto Vercel da v1.

## Review Focus

1. Clique duplo/duas abas em "Adicionar" → um só registro (a função recusa duplicata por `library_item_id` no ciclo e devolve `ja_no_plano`).
2. Filtro na URL com valor inválido (`?perfil=9&nivel=xyz&categoria=nao-existe`) → ignorado, cai no padrão, sem erro 500.
3. Aluna sem perfil confirmado → vê o Perfil 1 com aviso explicando e link para confirmar o perfil.
4. Item desativado pela admin → some para alunas e não pode ser adicionado nem por chamada direta à função.
5. Aluna comum chamando as ações de admin ou abrindo `/configuracoes/biblioteca` → negado (404 na página; RLS recusa a escrita).

---

### Task 1: Regras puras da biblioteca

**Files:**
- Create: `lib/domain/biblioteca.ts`
- Test: `lib/domain/__tests__/biblioteca.test.ts`

**Interfaces:**
- Produces:
  - `type Nivel = "estrategico" | "tatico" | "operacional" | "okr" | "kpi"`
  - `const NIVEIS: { valor: Nivel; nome: string }[]` = Estratégico, Tático, Operacional, OKR, KPI (nessa ordem)
  - `type ItemBiblioteca = { id: string; categoryId: string; perfil: 1|2|3; nivel: Nivel; texto: string; parentId: string | null; ordem: number; ativo: boolean }`
  - `type Categoria = { id: string; slug: string; nome: string; descricao: string; objetivo: string; ordem: number }`
  - `type Filtros = { perfil: 1|2|3; categoria: string | null; nivel: Nivel | null }`
  - `lerFiltros(q: Record<string, string | string[] | undefined>, perfilDaAluna: 1|2|3|null, slugs: string[]): Filtros`
  - `filtrarItens(itens: ItemBiblioteca[], f: Filtros, categorias: Categoria[], incluirInativos?: boolean): ItemBiblioteca[]`
  - `agruparPorCategoria(itens: ItemBiblioteca[], categorias: Categoria[]): { categoria: Categoria; itens: ItemBiblioteca[] }[]` — categorias por `ordem`, só as que têm itens; itens por ordem de `NIVEIS`, depois `ordem`
  - `textoAdicionado(r: { criado: "objetivo"|"tarefa"|"kr"|"kpi"; objetivo_criado: boolean; ja_no_plano: boolean }, trimestre: 1|2|3|4): string`

- [ ] **Step 1: Write the failing tests**

```ts
describe("lerFiltros", () => {
  test("padrão é o perfil da aluna, sem categoria e sem nível", () =>
    expect(lerFiltros({}, 2, ["comercial"])).toEqual({ perfil: 2, categoria: null, nivel: null }));
  test("aluna sem perfil vê o Perfil 1", () => expect(lerFiltros({}, null, []).perfil).toBe(1));
  test("valores inválidos são ignorados", () =>
    expect(lerFiltros({ perfil: "9", categoria: "nao-existe", nivel: "xyz" }, 3, ["comercial"])).toEqual({ perfil: 3, categoria: null, nivel: null }));
  test("valores válidos da URL vencem o padrão", () =>
    expect(lerFiltros({ perfil: "1", categoria: "comercial", nivel: "kpi" }, 3, ["comercial"])).toEqual({ perfil: 1, categoria: "comercial", nivel: "kpi" }));
});
// Fixture: categorias c1 (slug "comercial", ordem 2) e c2 (slug "metodo", ordem 1), c3 (slug "financeiro", ordem 3, sem itens).
// Itens: a (c1, perfil 1, kpi), b (c1, perfil 1, estrategico), c (c1, perfil 2, tatico), d (c2, perfil 1, tatico, ativo=false), e (c2, perfil 1, okr).
describe("filtrarItens", () => {
  test("filtra perfil, categoria (por slug) e nível; esconde inativos", () => {
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: null, nivel: null }, cats))).toEqual(["a", "b", "e"]);
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: "comercial", nivel: "kpi" }, cats))).toEqual(["a"]);
  });
  test("incluirInativos mostra os inativos (tela da admin)", () =>
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: "metodo", nivel: null }, cats, true))).toEqual(["d", "e"]));
});
describe("agruparPorCategoria", () => {
  test("ordena categorias por ordem e itens Estratégico → KPI; omite categoria vazia", () =>
    expect(agruparPorCategoria(filtrarItens(itens, { perfil: 1, categoria: null, nivel: null }, cats), cats)
      .map((g) => [g.categoria.slug, ids(g.itens)])).toEqual([["metodo", ["e"]], ["comercial", ["b", "a"]]]));
});
describe("textoAdicionado", () => {
  test("tarefa nova com objetivo criado junto", () =>
    expect(textoAdicionado({ criado: "tarefa", objetivo_criado: true, ja_no_plano: false }, 2))
      .toBe("Adicionado ao 2º trimestre. O objetivo estratégico da categoria entrou junto."));
  test("já estava no plano", () =>
    expect(textoAdicionado({ criado: "tarefa", objetivo_criado: false, ja_no_plano: true }, 1)).toBe("Este item já está no seu plano."));
  test("objetivo", () =>
    expect(textoAdicionado({ criado: "objetivo", objetivo_criado: true, ja_no_plano: false }, 3)).toBe("Objetivo adicionado ao 3º trimestre."));
});
```

- [ ] **Step 2: Run** `npx vitest run lib/domain/__tests__/biblioteca.test.ts` — Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implement** `lib/domain/biblioteca.ts` com as assinaturas acima. `lerFiltros` aceita só o primeiro valor quando vier array.
- [ ] **Step 4: Run** o mesmo comando — Expected: PASS; depois `npm test` — Expected: todos passam.
- [ ] **Step 5: Commit** `feat: regras puras da biblioteca (filtros, agrupamento, mensagens)`

---

### Task 2: Função SQL "adicionar ao meu plano"

**Files:**
- Create: `supabase/migrations/20261120000900_cep_adicionar_item.sql`
- Test: `supabase/tests/adicionar-item.sql`
- Modify: `lib/data/tipos.ts` (regerar com `generate_typescript_types`)

**Interfaces:**
- Consumes: `public.cep_garantir_ciclo(p_org uuid, p_ano int) returns uuid`, `private.cep_eh_membro(org uuid)`.
- Produces: `public.cep_adicionar_item(p_item uuid, p_trimestre smallint) returns jsonb` → `{ "criado": "objetivo"|"tarefa"|"kr"|"kpi", "objetivo_criado": bool, "ja_no_plano": bool, "id": uuid }`. `security invoker`, `search_path = ''`, `grant execute` só a `authenticated`.

Regras (spec §8):
- Organização = a da pessoa logada (`cep_organization_members` de `auth.uid()`, menor `org_id`); sem sessão → erro.
- `p_trimestre` fora de 1–4 → erro `trimestre inválido`. Item inexistente ou `ativo = false` → erro `item indisponível`.
- Ciclo = `cep_garantir_ciclo(org, 2027)`.
- Estratégico da categoria = o próprio item (nível estratégico) ou `parent_id`. Objetivo = `cep_objectives` do ciclo com `library_item_id` = estratégico; se não existir, cria (titulo = texto do estratégico, `category_id`, `trimestre = p_trimestre`) e marca `objetivo_criado`.
- Por nível, com checagem de duplicata pelo `library_item_id` no ciclo (`ja_no_plano = true`, nada criado):
  - estratégico → só o objetivo (se já existia: `ja_no_plano`);
  - tático/operacional → `cep_tasks` (objective_id, library_item_id, nivel, titulo = texto, trimestre);
  - okr → OKR do objetivo (cria um com titulo = titulo do objetivo e `trimestre` se não houver) e `cep_key_results` (descricao = texto, números vazios);
  - kpi → `cep_kpis` (cycle_id, objective_id, library_item_id, nome = texto).
- `pg_advisory_xact_lock(hashtext(org_id::text || p_item::text))` antes da checagem, para dois cliques simultâneos.

- [ ] **Step 1: Write the failing test** `supabase/tests/adicionar-item.sql` no padrão de `rls.sql` (tabela `r`, `rollback` no fim). Duas alunas A e B criadas com `cep_iniciar_conta`; pegar ids da biblioteca por `(perfil 1, categoria 'comercial', nivel)`. Verificações (esperado):
  - `A adiciona tático: tarefa criada` = `tarefa`; `objetivo entrou junto` = `true`; `1 objetivo comercial no plano` = `1`
  - `A adiciona o mesmo tático de novo` → `ja_no_plano` = `true`; `continua 1 tarefa` = `1`
  - `A adiciona operacional: objetivo não duplica` → `objetivo_criado` = `false`; `objetivos` = `1`
  - `A adiciona OKR: 1 okr e 1 kr com alvo vazio` = `1|1|null`
  - `A adiciona OKR de novo` → `ja_no_plano` = `true`
  - `A adiciona KPI` = `kpi`; `A adiciona estratégico já presente` → `ja_no_plano` = `true`
  - `trimestre 5` → `negado`; `item inativo` (marcar `ativo=false` como postgres antes) → `negado`
  - `B adiciona: cria na organização de B` → `org_id` da tarefa = org de B; `B vê tarefas de A` = `0`
  - `anon chama a função` → `negado`
- [ ] **Step 2: Run** o arquivo inteiro com `execute_sql` — Expected: erro "function public.cep_adicionar_item does not exist".
- [ ] **Step 3: Write and apply** a migração (`apply_migration`, nome `cep_adicionar_item`).
- [ ] **Step 4: Run** o teste — Expected: toda linha `ok = true`. Rodar também `rls.sql` — Expected: 31/31.
- [ ] **Step 5:** Regerar `lib/data/tipos.ts` (manter o `/* eslint-disable */` no topo); `npx tsc --noEmit` — Expected: sem erros.
- [ ] **Step 6: Commit** `feat: função cep_adicionar_item (biblioteca → plano, sem duplicar)`

---

### Task 3: Teste de escrita da admin na biblioteca

**Files:**
- Test: `supabase/tests/biblioteca-admin.sql`

**Interfaces:**
- Consumes: políticas `cep_categories_admin_*` e `cep_library_items_admin_*` existentes (migração 000200).

- [ ] **Step 1: Write the test** (transação desfeita): conta X com papel `admin`, conta Y aluna. Esperado:
  - `admin altera texto de item` = `1` linha; `admin desativa item` = `1`; `admin cria item tático com parent` = `ok`; `admin altera descrição de categoria` = `1`
  - `aluna altera item` = `0`; `aluna cria item` = `negado`; `aluna altera categoria` = `0`; `aluna apaga item` = `0`
  - `item tático sem parent` = `negado` (check do esquema)
- [ ] **Step 2: Run** com `execute_sql` — Expected: todas `ok = true` (as políticas já existem; este teste fixa o comportamento antes da tela). Se alguma falhar, é defeito de esquema: ledger + correção em migração `20261120000950_cep_biblioteca_admin.sql`.
- [ ] **Step 3: Commit** `test: escrita da biblioteca só para admin`

---

### Task 4: Acesso a dados da biblioteca

**Files:**
- Create: `lib/data/biblioteca.ts` (`import "server-only"`, leituras)
- Create: `lib/data/bibliotecaAcoes.ts` (`"use server"`, escritas)

**Interfaces:**
- Consumes: Task 1 tipos; Task 2 `cep_adicionar_item`; `exigirSessao()`.
- Produces:
  - `obterBiblioteca(): Promise<{ categorias: Categoria[]; itens: ItemBiblioteca[] }>` (todos, inclusive inativos; quem filtra é `filtrarItens`)
  - `idsNoPlano(orgId: string): Promise<Set<string>>` — `library_item_id` de objetivos, tarefas, KRs e KPIs do ciclo ativo (KRs via `cep_okrs.cycle_id`)
  - `adicionarAoPlano(itemId: string, trimestre: number): Promise<{ ok?: string; erro?: string }>` — chama a RPC, devolve `textoAdicionado(...)`; erro → "Não foi possível adicionar. Tente de novo."; `revalidatePath("/biblioteca")` e `revalidatePath("/visao-geral")`
  - `salvarItem(id: string, texto: string)`, `alternarAtivo(id: string, ativo: boolean)`, `criarItem(d: { categoryId: string; perfil: 1|2|3; nivel: "tatico"|"operacional"|"okr"|"kpi"; texto: string })`, `salvarCategoria(id: string, d: { descricao: string; objetivo: string })` — todas `Promise<{ ok?: string; erro?: string }>`; recusam com "Só a administração pode editar a biblioteca." se `!s.papeis.includes("admin")`; texto 1–1000 caracteres após `trim`; `criarItem` define `parent_id` = item estratégico de (categoria, perfil) e `ordem` = maior + 1; `revalidatePath("/biblioteca")` e `("/configuracoes/biblioteca")`.

- [ ] **Step 1:** Escrever os dois arquivos. (Sem teste unitário próprio: lógica de regra está na Task 1 e no SQL; o comportamento é coberto pelo e2e das Tasks 5 e 6.)
- [ ] **Step 2: Run** `npx tsc --noEmit && npm run lint` — Expected: sem erros.
- [ ] **Step 3: Commit** `feat: leitura e ações da biblioteca`

---

### Task 5: Tela da Biblioteca e menu

**Files:**
- Create: `app/(app)/biblioteca/page.tsx`, `components/biblioteca/Filtros.tsx` (client), `components/biblioteca/ItemCartao.tsx`, `components/biblioteca/Adicionar.tsx` (client)
- Modify: `lib/domain/rotas.ts` (biblioteca em `ROTAS_CONSTRUIDAS`), `components/layout/__tests__/itensMenu.test.ts`, `app/(app)/visao-geral/page.tsx` (tirar a Biblioteca de `EM_BREVE`)
- Test: `e2e/biblioteca.spec.ts`, `components/biblioteca/__tests__/Adicionar.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`lerFiltros`, `filtrarItens`, `agruparPorCategoria`, `NIVEIS`), Task 4 (`obterBiblioteca`, `idsNoPlano`, `adicionarAoPlano`), `trimestreAtual(hojeSP())`.

Tela (`FaixaTitulo` olho "Método CEP", título "Biblioteca de estratégias", descrição "Os itens originais do método, por perfil, categoria e nível. Escolha o que entra no seu plano de 2027."):
- Filtros num `<form method="get">` com três `<select>` rotulados ("Perfil", "Categoria" com "Todas", "Nível" com "Todos") que enviam ao mudar e botão "Filtrar" visível; link "Limpar filtros".
- Aviso quando `filtros.perfil !== s.perfil`: sem perfil → "Você ainda não confirmou o seu perfil. Mostrando o Perfil 1." + link "Confirmar no diagnóstico" (`/diagnostico/resumo`); com perfil → "Você está vendo o Perfil N. O seu é o Perfil M."
- Por categoria: `h2` nome, descrição, "Objetivo: …"; lista de itens com selo do nível e texto intacto.
- Item no plano: selo "No seu plano" e sem botão. Senão `Adicionar`: `<select>` "Trimestre" (1º–4º, padrão o atual) + botão "Adicionar ao meu plano"; enquanto envia, botão desabilitado com "Adicionando…"; resultado no `useAviso`; erro em `role="alert"` junto ao item.
- Nenhum item: "Nenhum item com esses filtros." + "Limpar filtros".

- [ ] **Step 1: Write failing tests.**
  - `Adicionar.test.tsx`: `clique-duplo-chama-uma-vez` (dois cliques rápidos → ação chamada 1 vez); `mostra-erro-no-item` (ação devolve `{erro}` → texto em `role=alert`).
  - `itensMenu.test.ts`: `ROTAS_CONSTRUIDAS` inclui `/biblioteca` e o menu mostra "Biblioteca de estratégias" na 3ª posição para aluna.
  - `e2e/biblioteca.spec.ts`:
    - `abre-pelo-menu-no-perfil-1-com-aviso`: conta nova → menu "Biblioteca de estratégias" → vê "Mostrando o Perfil 1" e 7 títulos de categoria.
    - `filtra-por-categoria-e-nivel`: escolhe Categoria "Comercial" e Nível "Tático" → URL contém `categoria=comercial&nivel=tatico`, 1 item visível.
    - `filtro-invalido-nao-quebra`: `goto("/biblioteca?perfil=9&nivel=xyz")` → status 200 e 7 categorias.
    - `adiciona-tarefa-e-objetivo-entra-junto`: Comercial/Tático → trimestre "2º" → "Adicionar ao meu plano" → aviso "Adicionado ao 2º trimestre. O objetivo estratégico da categoria entrou junto." → item mostra "No seu plano"; filtro Nível "Estratégico" → também "No seu plano"; Visão geral mostra 1 tarefa.
    - `celular-390`: viewport 390×844, sem rolagem horizontal (`scrollWidth <= 390`), botão de adicionar visível.
- [ ] **Step 2: Run** `npx vitest run components` e `npm run build && NODE_USE_ENV_PROXY=1 PORT=3100 npm start` + `npx playwright test e2e/biblioteca.spec.ts --trace off` — Expected: FAIL (rota inexistente / não construída).
- [ ] **Step 3: Implement** a tela, os componentes e a mudança de rotas.
- [ ] **Step 4: Run** os mesmos comandos — Expected: PASS; depois suíte completa (`npm test`, `npx playwright test --trace off`) — Expected: tudo passa (atualizar `navegacao.spec.ts` se contar itens de menu, com ledger).
- [ ] **Step 5: Commit** `feat: tela da biblioteca com filtros e adicionar ao plano`

---

### Task 6: Edição da biblioteca pela admin

**Files:**
- Create: `app/(app)/configuracoes/biblioteca/page.tsx`, `components/biblioteca/EdicaoAdmin.tsx` (client)
- Modify: `app/(app)/configuracoes/page.tsx` (cartão "Biblioteca" com link "Editar biblioteca", só para admin)
- Test: `e2e/biblioteca-admin.spec.ts`

**Interfaces:**
- Consumes: Task 4 ações de admin; Task 1 filtros com `incluirInativos = true`.

Tela (só `admin`; os demais recebem `notFound()`): mesmos filtros de perfil e categoria; por categoria, formulário "Descrição" e "Objetivo" com "Salvar categoria"; por item, `textarea` com o texto, "Salvar" e "Desativar"/"Reativar" (inativo com selo "Inativo"); formulário "Novo item" (categoria, perfil, nível Tático/Operacional/OKR/KPI, texto). Nota no topo: "Mudanças valem para as próximas adições. O que as alunas já colocaram no plano não muda."

- [ ] **Step 1: Write failing e2e.** O teste lê `E2E_ADMIN_EMAIL` e `E2E_ADMIN_SENHA` e é pulado sem eles (`test.skip`). Antes de rodar, o executor cria uma conta `e2e-admin-<n>@example.com` pela tela de cadastro e dá o papel por SQL (`insert into cep_roles values (<id>, 'admin')`); depois do teste, apaga a conta.
  - `aluna-nao-ve-edicao`: conta nova → `/configuracoes` sem "Editar biblioteca"; `goto("/configuracoes/biblioteca")` → "Página não encontrada".
  - `admin-edita-desativa-e-reativa`: entra como admin → Configurações → "Editar biblioteca" → filtra Perfil 1/Comercial → altera um item tático (acrescenta " (teste)") → "Salvar" → aviso "Item salvo." → desativa → em `/biblioteca` (Perfil 1, Comercial, Tático) o item some → reativa e restaura o texto original → volta a aparecer.
  - `admin-cria-item`: cria item KPI "KPI teste e2e" em Perfil 1/Comercial → aparece em `/biblioteca` → desativa (limpeza: depois apagar por SQL o item criado).
- [ ] **Step 2: Run** `npx playwright test e2e/biblioteca-admin.spec.ts --trace off` com as variáveis — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS; suíte completa — Expected: tudo passa. Conferir por SQL que nenhum texto da biblioteca ficou alterado: `select count(*) from cep_library_items where texto like '%(teste)%' or texto like 'KPI teste e2e%'` = 0 após a limpeza.
- [ ] **Step 5: Commit** `feat: edição da biblioteca pela administração`

---

### Task 7: Publicar e conferir

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` — Expected: tudo sem erro.
- [ ] **Step 2:** Publicar no projeto Vercel `cep-planejamento-v2` (upload dos arquivos versionados + `create_deployment` com `target: production`) — Expected: `READY`; `web_fetch_vercel_url` em `/biblioteca` sem sessão → redireciona para `/entrar`.
- [ ] **Step 3:** Apagar contas `e2e-%@example.com` criadas nos testes e conferir 0 organizações órfãs.
- [ ] **Step 4: Commit/push** do ledger e da branch `etapa-2`.
