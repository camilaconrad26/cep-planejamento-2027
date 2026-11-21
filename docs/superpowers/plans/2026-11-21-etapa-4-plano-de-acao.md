# Etapa 4 — Plano de ação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A aluna vê e opera as mesmas ações do ciclo em quatro visões — Tabela, Kanban, Calendário e Prioridades — com busca e filtros, e edita responsável, prioridade, status, datas e trimestre de cada ação.

**Architecture:** Uma rota `/plano-de-acao` com a visão, a busca, os filtros e a ordenação na URL (`?visao=tabela|kanban|calendario|prioridades&q=&categoria=&nivel=&trimestre=&status=&atrasadas=1&concluidas=1&ordem=&sentido=&cal=mes|semana|dia&data=AAAA-MM-DD`). Regras puras em `lib/domain/acoes.ts` (filtro, ordenação, progresso, listas de prioridade, grade do calendário). Leitura `server-only` em `lib/data/acoes.ts`; edição em `atualizarAcao` (`"use server"`). Kanban com arrastar e soltar nativo do navegador e, para teclado e celular, um seletor "Mover para" em cada cartão. Sem biblioteca nova.

**Tech Stack:** Next.js 15.5 App Router, React 19, TypeScript strict, Tailwind 3.4.19, @supabase/ssr 0.12.7, Vitest 2, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§5 item 5, §8 "Atraso", "% de execução", "Concluídas", §10 Etapa 4, §11 critérios "filtros funcionam", "Kanban permite movimentações", "prazos e status são atualizados corretamente")

## Global Constraints

- Português do Brasil; identidade CEP; contraste AA; 390 px sem rolagem horizontal da página; "Texto maior".
- Atraso: prazo < hoje (America/Sao_Paulo) e status ≠ concluído; calculado, nunca gravado; destaque em todas as visões e filtro (§8). Usa `estaAtrasada` existente.
- Concluídas nunca somem: saem das visões ativas por filtro ("Mostrar concluídas") e continuam no banco (§8).
- Kanban em 3 colunas de status (Não iniciada / Em andamento / Concluída); atraso é destaque, não coluna; operável por teclado ou menu (§5, §13).
- Responsável é texto digitado (§12). Avisos só dentro do sistema.
- Status "concluído" grava `concluido_em = now()`; outro status apaga `concluido_em`.
- Datas: `data_inicio <= prazo` (o banco já exige); mensagem amigável se violar.
- Mentora só lê (RLS). Commits com atribuição da sessão; v2 só no projeto Vercel `cep-planejamento-v2`; contas `e2e-*@example.com` apagadas no fim.

## Review Focus

1. Filtros combinados com busca e acentos ("reuniao" acha "Reunião") e valores inválidos na URL → ignorados, sem erro.
2. Arrastar para outra coluna com falha de rede → o cartão volta à coluna de origem e aparece o erro (sem estado falso).
3. Prazo antes do início → mensagem "O prazo não pode ser antes do início." e nada gravado.
4. Calendário: mês que começa no domingo/sábado e virada de ano (dezembro → janeiro) corretos; ação sem prazo não aparece no calendário, aparece na lista "Sem prazo".
5. Ordenação por prazo/prioridade com valores vazios → vazios por último nos dois sentidos.

---

### Task 1: Regras puras das ações

**Files:** Create `lib/domain/acoes.ts`; Test `lib/domain/__tests__/acoes.test.ts`

**Interfaces (Produces):**
- `type Prioridade = "baixa"|"media"|"alta"`; `PRIORIDADES` (Baixa, Média, Alta); `STATUS_LISTA: {valor: Status; nome: string}[]` = Não iniciada, Em andamento, Concluída.
- `type Acao = { id; titulo; objetivo: string|null; categoria: { slug; nome } | null; nivel: "estrategico"|"tatico"|"operacional"; responsavel: string; prioridade: Prioridade; status: Status; inicio: string|null; prazo: string|null; trimestre: 1|2|3|4|null }`.
- `type VisaoAcoes = "tabela"|"kanban"|"calendario"|"prioridades"`; `type FiltrosAcoes = { visao; q: string; categoria: string|null; nivel: "tatico"|"operacional"|null; trimestre: 1|2|3|4|null; status: Status|null; atrasadas: boolean; concluidas: boolean; ordem: "prazo"|"prioridade"|"titulo"|"status"|"inicio"; sentido: "asc"|"desc"; cal: "mes"|"semana"|"dia"; data: string|null }`.
- `lerFiltrosAcoes(q: Record<string, string|string[]|undefined>, slugs: string[]): FiltrosAcoes` (padrões: tabela, prazo asc, mes, concluídas ocultas).
- `normalizar(s): string` (minúsculas, sem acento).
- `filtrarAcoes(a: Acao[], f: FiltrosAcoes, hoje: string): Acao[]` — busca em título, objetivo, responsável; `concluidas=false` esconde concluídas exceto quando `status=concluido`.
- `ordenarAcoes(a, ordem, sentido): Acao[]` — vazios por último nos dois sentidos; prioridade alta > média > baixa; empate por título.
- `progresso(s: Status): 0|50|100`.
- `listasPrioridades(a: Acao[], hoje): { vencidas; vencendo; alta }` — só não concluídas; vencendo = prazo entre hoje e hoje+7 (inclusive); alta exclui as que já estão nas outras duas; cada lista por prazo.
- `gradeMes(ano, mes /*1-12*/): string[][]` (semanas de domingo a sábado, com dias de fora do mês para completar); `semanaDe(data): string[]` (domingo a sábado); `somarDias(data, n): string`; `somarMeses(data, n): string` (dia 1 do mês resultante).
- `acoesNoDia(a, data): Acao[]` (pelo prazo).

- [ ] **Step 1: Failing tests** (valores exatos): busca "reuniao" acha "Reunião com contador"; filtro categoria/nível/trimestre/status; `atrasadas` com hoje 2027-03-10 pega prazo 2027-03-09 não concluída; concluídas ocultas por padrão e visíveis com `concluidas` ou `status=concluido`; `lerFiltrosAcoes({visao:"x", trimestre:"9", status:"y", ordem:"z"})` → padrões; ordenar prazo asc/desc com nulo por último; prioridade desc = alta, média, baixa, depois vazios não existem (sempre tem); `progresso`; `listasPrioridades` com hoje 2027-03-10 (vencida 03-01, vencendo 03-17 inclusive e 03-18 fora, alta sem prazo); `gradeMes(2027, 8)` começa em "2027-08-01" (domingo) e tem 5 semanas; `gradeMes(2027, 5)` primeira semana começa "2027-04-25"; `semanaDe("2027-01-01")` = 2026-12-27..2027-01-02; `somarMeses("2027-12-15", 1)` = "2028-01-01".
- [ ] **Step 2: Run** `npx vitest run lib/domain/__tests__/acoes.test.ts` — FAIL.
- [ ] **Step 3: Implement.** Datas como texto `AAAA-MM-DD` com `Date.UTC` (sem fuso).
- [ ] **Step 4: Run** — PASS; `npm test`.
- [ ] **Step 5: Commit** `feat: regras do plano de ação (filtros, ordem, prioridades, calendário)`

### Task 2: Dados e edição

**Files:** Create `lib/data/acoes.ts` (`server-only`), `lib/data/acoesAcoes.ts` (`"use server"`)

**Interfaces:**
- `obterAcoes(orgId): Promise<{ acoes: Acao[]; categorias: Categoria[] }>` — tarefas não arquivadas do ciclo ativo, com objetivo e categoria (`cep_objectives(titulo, cep_categories(slug,nome))`).
- `atualizarAcao(id: string, p: Partial<{ titulo; responsavel; prioridade; status; inicio: string|null; prazo: string|null; trimestre: number|null }>): Promise<{ ok?: string; erro?: string }>` — valida cada campo presente (título 1–1000; responsável ≤ 120; prioridade/status da lista; datas `AAAA-MM-DD` válidas ou null; trimestre 1–4 ou null; início ≤ prazo considerando o valor já gravado → "O prazo não pode ser antes do início."); status concluído grava `concluido_em`; outro apaga; `.eq("org_id")` e confere linha; `revalidatePath("/plano-de-acao")` e `("/visao-geral")`, `("/planejamento")`; sessão vencida → `{erro:"sessao"}`.
- [ ] **Step 1:** Escrever; `npx tsc --noEmit && npm run lint`.
- [ ] **Step 2: Commit** `feat: leitura e edição das ações`

### Task 3: Tela — Tabela, Prioridades, edição, busca e filtros

**Files:** Create `app/(app)/plano-de-acao/page.tsx`, `components/acoes/{BarraAcoes,FiltrosAcoes,Tabela,ListaPrioridades,EditarAcao,SeloAcao}.tsx`; Modify `lib/domain/rotas.ts` (plano-de-acao construída), `app/(app)/visao-geral/page.tsx` (`EM_BREVE`), `components/layout/__tests__/itensMenu.test.ts`, `e2e/navegacao.spec.ts`; Test `e2e/plano-de-acao.spec.ts`, `components/acoes/__tests__/EditarAcao.test.tsx`

- Topo: `FaixaTitulo` olho "Ciclo 2027", título "Plano de ação", descrição "As mesmas ações em quatro visões. Atualize status, prazos e responsáveis à medida que o trimestre anda."; abas de visão como links (`nav aria-label="Visão"`, `aria-current`).
- Barra: busca (`label` "Buscar ações"), filtros Categoria, Nível, Trimestre, Status, caixas "Só atrasadas" e "Mostrar concluídas", botão "Filtrar", link "Limpar filtros" (GET, sem envio automático). Contagem "N ações".
- Tabela (`overflow-x-auto` com `role=region`): colunas Ação (título + objetivo), Categoria, Nível, Responsável, Prioridade, Status, Início, Prazo, Progresso; cabeçalhos ordenáveis como links com `aria-sort`; selo "Atrasada" (texto + cor). Cada linha tem "Editar" que abre `EditarAcao` logo abaixo.
- `EditarAcao` (client): título, responsável, prioridade, status, início, prazo (`type=date`), trimestre; "Salvar ação"/"Cancelar"; erro junto (`role=alert`).
- Prioridades: três listas ("Vencidas", "Vencem em até 7 dias", "Prioridade alta") com contagem e vazio "Nada aqui.".
- Vazio geral: "Nenhuma ação com esses filtros." / sem ações: "Você ainda não tem ações. Crie no Planejamento estratégico ou adicione pela Biblioteca." com os dois links.
- [ ] **Step 1: Failing tests.** `EditarAcao.test.tsx`: `prazo-antes-do-inicio` (não chama a ação; mostra "O prazo não pode ser antes do início."), `salva-campos` (chama `atualizarAcao` com responsável, prioridade, status, datas). e2e `plano-de-acao.spec.ts`:
  - `abre-pelo-menu-tabela`: conta nova → cria 2 ações pelo Planejamento ("Reunião com contador" tática 1º tri; "Gravar vídeo" operacional 2º tri) → menu "Plano de ação" → tabela com 2 linhas.
  - `busca-e-filtros`: busca "reuniao" → 1 linha; limpar; Trimestre 2 → só "Gravar vídeo"; URL com `trimestre=2`.
  - `editar-e-ordenar`: edita "Gravar vídeo" (responsável "Ana", prioridade Alta, prazo 2027-02-10, status Em andamento) → linha mostra "Ana", "Alta", "10/02/2027", "50%"; ordenar por prazo → "Gravar vídeo" primeiro (o outro sem prazo).
  - `prioridades`: ação com prioridade alta aparece em "Prioridade alta".
  - `concluida-some-e-volta`: status Concluída → some da tabela; "Mostrar concluídas" → volta com "100%".
- [ ] **Step 2–4:** Run (FAIL) → implementar → PASS; suíte.
- [ ] **Step 5: Commit** `feat: plano de ação — tabela, prioridades, busca e filtros`

### Task 4: Kanban

**Files:** Create `components/acoes/Kanban.tsx` (client); Test `components/acoes/__tests__/Kanban.test.tsx`, cenários em `e2e/plano-de-acao.spec.ts`

- 3 colunas (`section` com `h2` e contagem); cartões com título, categoria, responsável, prazo, selo "Atrasada" e prioridade; `draggable`, `onDragStart/onDrop` movem com atualização otimista e chamam `atualizarAcao(id, {status})`; falha → volta e erro `role=alert`; cada cartão tem `select` "Mover para" (rótulo "Mover \"<título>\" para") e "Editar".
- No celular as colunas empilham.
- [ ] **Step 1: Failing tests.** `Kanban.test.tsx`: `mover-pelo-menu` (seleciona "Em andamento" → chama com `{status:"em_andamento"}` e o cartão aparece na coluna); `falha-volta` (ação devolve erro → cartão volta à coluna original e alerta). e2e: `kanban-arrastar` (arrasta "Reunião com contador" para "Em andamento" com `dragTo` → recarrega → continua lá); `kanban-teclado` (Mover para "Concluída" → coluna Concluída).
- [ ] **Step 2–5:** FAIL → implementar → PASS → commit `feat: kanban do plano de ação`

### Task 5: Calendário

**Files:** Create `components/acoes/Calendario.tsx`; Test e2e

- Mês (padrão), Semana, Dia (`cal`), com "Anterior"/"Próximo"/"Hoje" (links com `data`); título "Janeiro de 2027" / "Semana de 03/01 a 09/01/2027" / "Sexta, 08/01/2027".
- Mês: grade 7 colunas (Dom–Sáb) a partir de `sm`; no celular, agenda só com os dias que têm ações. Dia de outro mês esmaecido; hoje destacado; ações pelo prazo com selo de atraso; cada ação é link para a tabela filtrada pela busca do título? Não — botão "Editar" abre `EditarAcao` num painel abaixo do calendário.
- Lista "Sem prazo" abaixo, com as ações filtradas que não têm prazo.
- Padrão de `data`: hoje (se antes de 2027, 1º de janeiro de 2027 quando a aluna ainda não tem prazos? — decidido: hoje; a aluna navega).
- [ ] **Step 1: Failing e2e** `calendario`: ação com prazo 2027-02-10 → `?visao=calendario&data=2027-02-01` mostra "Fevereiro de 2027" e a ação no dia 10; "Próximo" → "Março de 2027"; `cal=semana&data=2027-02-10` mostra a ação; ação sem prazo aparece em "Sem prazo"; 390 px sem rolagem horizontal.
- [ ] **Step 2–5:** FAIL → implementar → PASS → commit `feat: calendário do plano de ação`

### Task 6: Revisão, publicação

- [ ] Suíte completa (unit + e2e com conta admin temporária); revisão final do branch (subagente); correções com teste; publicar no Vercel `cep-planejamento-v2`; apagar contas e2e; `etapa-4` no `main`.
