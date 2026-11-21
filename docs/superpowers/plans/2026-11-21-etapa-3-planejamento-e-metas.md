# Etapa 3 — Planejamento estratégico e metas financeiras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A aluna escolhe as prioridades de cada trimestre, monta a árvore Estratégico → Tático → Operacional (com OKRs/KRs e KPIs já ligados) por categoria, e preenche as metas financeiras da planilha (meta, super, mega; produtos estrela; trimestres; realizado; ações de vendas).

**Architecture:** Duas telas novas: `/planejamento` (ciclo 2027 com visões Ano / Semestre / Trimestre, prioridades e árvore) e `/metas` (parte financeira de "Metas e indicadores"; OKR/KPI com medições ficam na Etapa 5). Regras puras em `lib/domain/arvore.ts`, `lib/domain/prioridades.ts` e `lib/domain/metas.ts`; leitura `server-only` em `lib/data/planejamento.ts` e `lib/data/metas.ts`; escritas em `"use server"`. Limite de 3 prioridades garantido no banco pela função `cep_definir_prioridade` (`security invoker`). Metas salvas com gravação automática (mesmo padrão do fechamento: versão, nova tentativa, erro de sessão).

**Tech Stack:** Next.js 15.5 App Router, React 19, TypeScript strict, Tailwind 3.4.19, @supabase/ssr 0.12.7, Vitest 2, Playwright 1.63, Postgres (Supabase `kerssctooyqryzofbrzd`).

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§5 itens 3 e 6, §7, §8 "Prioridades" e "Itens da biblioteca", §10 Etapa 3)

## Global Constraints

- Português do Brasil; identidade CEP (faixa escura, papel #fbf8f1, #7a6022 como dourado de texto, pílulas, AA).
- Prioridades: até 3 categorias por trimestre; a 4ª e seguintes só com confirmação, gravadas com `excedente = true` (§8).
- Execução e resultado separados; atraso calculado, nunca gravado (§8).
- Ciclo 2027 único e ativo; antes de 1/jan/2027 = fase de planejamento no 1º trimestre (§10).
- Mentora só lê: nenhuma escrita depende só da interface (RLS).
- Funciona a 390 px (tabelas rolam dentro do cartão; a página não rola na horizontal) e com "Texto maior".
- Objetos novos de banco com prefixo `cep_`; migrações aplicadas no projeto real; testes SQL em transação com `rollback`.
- Commits com as linhas de atribuição da sessão; sem identificador de modelo. v2 só no projeto Vercel `cep-planejamento-v2`.
- Testes e2e criam contas `e2e-*@example.com` e são apagados no fim.

## Review Focus

1. Duas abas marcando a 4ª prioridade ao mesmo tempo → no máximo 3 sem `excedente`; nenhuma 4ª sem confirmação (a função conta sob trava).
2. Valores digitados em formato brasileiro ("R$ 1.200.000,00", "12,5" %) e campos vazios → cálculos não viram NaN; vazio aparece "—".
3. Excluir objetivo com ações ligadas → a aluna vê quantas ações somem e confirma; nada some com um toque só.
4. Gravação automática das metas com queda de conexão ou sessão expirada → aviso e nova tentativa, sem perder o que foi digitado (padrão do fechamento).
5. Visão semestral/trimestral → objetivo sem trimestre aparece em todas as visões; tarefa sem trimestre aparece só na visão "Ano" e num grupo "Sem trimestre" do objetivo.

---

### Task 1: Regras puras — árvore, prioridades e metas

**Files:**
- Create: `lib/domain/arvore.ts`, `lib/domain/prioridades.ts`, `lib/domain/metas.ts`
- Test: `lib/domain/__tests__/arvore.test.ts`, `lib/domain/__tests__/prioridades.test.ts`, `lib/domain/__tests__/metas.test.ts`

**Interfaces (Produces):**
- `arvore.ts`
  - `type Visao = "ano" | "s1" | "s2" | "t1" | "t2" | "t3" | "t4"`; `lerVisao(v: unknown, padrao: Visao): Visao`; `trimestresDa(v: Visao): (1|2|3|4)[]` (ano → [1,2,3,4], s1 → [1,2], t3 → [3]); `ROTULO_VISAO: Record<Visao,string>` ("Ano todo", "1º semestre", "2º semestre", "1º trimestre"…).
  - Tipos `ObjetivoP = { id; categoryId; titulo; descricao: string|null; trimestre: 1|2|3|4|null; libraryItemId: string|null }`, `TarefaP = { id; objectiveId: string|null; nivel: "estrategico"|"tatico"|"operacional"; titulo; trimestre: 1|2|3|4|null; status: Status }`, `KrP = { id; okrId; descricao; alvo: number|null }`, `OkrP = { id; objectiveId; titulo; trimestre: 1|2|3|4|null }`, `KpiP = { id; objectiveId: string|null; nome }`.
  - `montarArvore(d: { categorias: Categoria[]; objetivos: ObjetivoP[]; tarefas: TarefaP[]; okrs: OkrP[]; krs: KrP[]; kpis: KpiP[]; prioridades: string[] /* ids de categoria */ }, v: Visao): GrupoCategoria[]` onde `GrupoCategoria = { categoria: Categoria; prioritaria: boolean; objetivos: NoObjetivo[] }` e `NoObjetivo = ObjetivoP & { taticas: TarefaP[]; operacionais: TarefaP[]; semTrimestre: TarefaP[]; okrs: (OkrP & { krs: KrP[] })[]; kpis: KpiP[]; totalAcoes: number }`.
  - Regras: objetivo entra na visão se `trimestre` nulo ou dentro de `trimestresDa(v)`, ou se tem tarefa no período; tarefas filtradas pelo período; tarefa sem trimestre só em "ano" (no grupo `semTrimestre`); OKR filtrado como objetivo; KPI sempre (vale o ciclo); `totalAcoes` = todas as tarefas do objetivo (sem filtro, para o aviso de exclusão). Grupos: prioritárias primeiro (na ordem da categoria), depois as demais que têm objetivo na visão; categoria sem objetivo e não prioritária não aparece.
  - Tarefas avulsas (`objectiveId` nulo) não entram na árvore (vão ao Plano de ação na Etapa 4).
- `prioridades.ts`
  - `LIMITE_PRIORIDADES = 3`; `precisaConfirmar(jaEscolhidas: number): boolean` (true a partir da 4ª).
- `metas.ts`
  - `type Altura = "meta"|"super"|"mega"`; `ALTURAS: { valor: Altura; nome: string }[]` = Meta, Super meta, Mega meta.
  - `type MetasForm = { anual: Record<Altura, { faturamento: number; lucratividade: number; anuncios: number; time: number }>; trimestres: Record<1|2|3|4, Record<Altura, number>>; produtos: Record<"entrada"|"principal"|"alto_valor", { nome: string; ticket: number; vendas: Record<Altura, number> }>; realizado: Record<1|2|3|4, number>; porque: string }`; `metasVazias(): MetasForm`.
  - `lucroProjetado(fat, pct)`, `anunciosEmReais(fat, pct)`, `mediaMensal(fat)` → number; `crescimento(fat, base): number|null` (null se base ou fat = 0; fração, 0.25 = 25%).
  - `cenarioProdutos(m: MetasForm, a: Altura): number` = Σ ticket × vendas[a]; `somaTrimestres(m, a): number`.
  - `comparar(tem: number, alvo: number): { tipo: "sem-meta"|"fecha"|"falta"|"acima"; valor: number }` — `|tem−alvo| < 1` → fecha; alvo 0 → sem-meta.
  - `dividirEmQuatro(total: number): [number,number,number,number]` — inteiros em reais, soma exata (resto no 4º).
  - `pctRealizado(realizado, meta): number|null` (null sem meta ou sem realizado).
  - `type AcaoVenda = { id: string; mes: number; produto: string; acao: string; ticket: number; quantidade: number; responsavel: string }`; `faturamentoAcao(a)`, `previstoMes(acoes, mes)`, `previstoTrimestre(acoes, t)`.
  - `formatarPct(f: number|null): string` ("—" para null; "+25%" / "−10%" com uma casa só se necessário).

- [ ] **Step 1: Write the failing tests** (valores exatos):
  - `trimestresDa("s2")` = [3,4]; `lerVisao("x","t1")` = "t1".
  - `montarArvore`: objetivo O1 (Comercial, trimestre 2) com tarefa tática T1 (tri 2), operacional T2 (tri 3) e T3 sem trimestre; O2 (Método, sem trimestre) sem tarefas; prioridade = [Método]. Visão `t2` → grupos `[Método(prioritária, [O2]), Comercial([O1 com taticas [T1], operacionais [], semTrimestre []])]`. Visão `t3` → O1 aparece (tem T2) com operacionais [T2]. Visão `t1` → só Método. Visão `ano` → O1 com `semTrimestre` [T3], `totalAcoes` 3 em todas as visões.
  - `precisaConfirmar(2)` false; `precisaConfirmar(3)` true.
  - `lucroProjetado(1_000_000, 30)` = 300000; `crescimento(1_200_000, 1_000_000)` = 0.2; `crescimento(1, 0)` = null.
  - `dividirEmQuatro(1_000_001)` = [250000,250000,250000,250001].
  - `comparar(990_000, 1_000_000)` = `{tipo:"falta", valor:10000}`; `comparar(1_000_000.4, 1_000_000).tipo` = "fecha"; `comparar(5, 0).tipo` = "sem-meta".
  - `cenarioProdutos` com entrada 500×100 (meta) + alto_valor 30000×20 = 650000.
  - `previstoTrimestre` soma só meses 4–6 para t=2.
  - `formatarPct(0.2)` = "+20%"; `formatarPct(-0.125)` = "−12,5%"; `formatarPct(null)` = "—".
- [ ] **Step 2: Run** `npx vitest run lib/domain/__tests__/arvore.test.ts lib/domain/__tests__/prioridades.test.ts lib/domain/__tests__/metas.test.ts` — Expected: FAIL (módulos não existem).
- [ ] **Step 3: Implement** os três módulos.
- [ ] **Step 4: Run** — Expected: PASS; `npm test` — todos passam.
- [ ] **Step 5: Commit** `feat: regras da árvore do plano, prioridades e metas financeiras`

---

### Task 2: Banco — prioridades com limite e "por que essa meta"

**Files:**
- Create: `supabase/migrations/20261121000100_cep_prioridades_metas.sql`
- Test: `supabase/tests/prioridades.sql`
- Modify: `lib/data/tipos.ts` (acréscimo manual no formato do gerador, como na Etapa 2)

**Interfaces (Produces):**
- `alter table public.cep_cycles add column meta_porque text check (length(meta_porque) <= 2000)`.
- `public.cep_definir_prioridade(p_trimestre smallint, p_categoria uuid, p_confirmar boolean) returns jsonb` → `{ "situacao": "ok" | "ja_existe" | "confirmar", "excedente": bool }`. `security invoker`, `search_path = ''`, `pg_advisory_xact_lock(hashtext('cep_prioridade:' || org))`; conta as prioridades do trimestre no ciclo ativo (via `cep_garantir_ciclo(org, 2027)`); se ≥ 3 e não `p_confirmar` → `confirmar` sem gravar; senão insere com `excedente = (contagem >= 3)`. Trimestre fora de 1–4 → erro. Execute só para `authenticated`.
- `public.cep_remover_prioridade(p_trimestre smallint, p_categoria uuid) returns void` (mesmo padrão; apaga do ciclo ativo da própria organização).

- [ ] **Step 1: Test** (esperado): A escolhe 3 → `ok`,`ok`,`ok` (excedente false); 4ª sem confirmar → `confirmar` e continuam 3 linhas; 4ª confirmada → `ok`, `excedente = true`; repetir uma → `ja_existe`; remover → 3 linhas; trimestre 0 → negado; B não vê nem remove prioridades de A (0 linhas); anon → negado; mentora (papel) não grava na organização de A por insert direto → negado; `meta_porque` aceita texto e recusa > 2000.
- [ ] **Step 2: Run** com `execute_sql` — Expected: erro "function … does not exist".
- [ ] **Step 3: Apply** a migração (`apply_migration` nome `cep_prioridades_metas`).
- [ ] **Step 4: Run** — Expected: todas `ok`; `rls.sql` 31/31.
- [ ] **Step 5:** Tipos (`cep_definir_prioridade`, `cep_remover_prioridade`, coluna `meta_porque` em Row/Insert/Update de `cep_cycles`); `npx tsc --noEmit`.
- [ ] **Step 6: Commit** `feat: prioridades com limite garantido no banco e campo "por que essa meta"`

---

### Task 3: Acesso a dados do planejamento e das metas

**Files:**
- Create: `lib/data/planejamento.ts` (`server-only`), `lib/data/planejamentoAcoes.ts` (`"use server"`), `lib/data/metas.ts` (`server-only`), `lib/data/metasAcoes.ts` (`"use server"`)

**Interfaces:**
- Consumes: Task 1 tipos; Task 2 RPCs; `exigirSessao`, `obterBiblioteca` (categorias).
- Produces:
  - `obterPlano(orgId): Promise<{ cicloId: string; ano: number; categorias: Categoria[]; prioridades: { trimestre: number; categoryId: string; excedente: boolean }[]; objetivos: ObjetivoP[]; tarefas: TarefaP[]; okrs: OkrP[]; krs: KrP[]; kpis: KpiP[] }>` (tarefas não arquivadas).
  - Ações (todas `Promise<{ ok?: string; erro?: string; confirmar?: boolean }>`; `revalidatePath("/planejamento")` e `("/visao-geral")`):
    - `definirPrioridade(trimestre, categoryId, confirmar)`; `removerPrioridade(trimestre, categoryId)`;
    - `criarObjetivo({ categoryId, titulo, trimestre: number|null })`; `editarObjetivo(id, { titulo, trimestre })`; `excluirObjetivo(id)`;
    - `criarAcao({ objectiveId, nivel: "tatico"|"operacional", titulo, trimestre: number|null })`; `editarAcao(id, { titulo, trimestre })`; excluir usa `excluirTarefa` existente.
    - Texto 1–1000 após `trim`; trimestre 1–4 ou null; erro amigável "Não foi possível salvar. Tente de novo."; sessão vencida → `{ erro: "sessao" }` (padrão do fechamento).
  - `obterMetas(orgId): Promise<{ cicloId: string; form: MetasForm; acoes: AcaoVenda[]; base2026: number }>` (`base2026` = faturamento do fechamento do diagnóstico mais recente, 0 se não houver).
  - `salvarMetas(form: MetasForm): Promise<{ ok?: true; erro?: string }>` — upsert de 15 linhas de `cep_financial_goals` (`onConflict: "cycle_id,trimestre,altura"`), 3 de `cep_products` (`onConflict: "cycle_id,tipo"`), 4 de `cep_quarter_results` (`onConflict: "cycle_id,trimestre"`) e `meta_porque`; números negativos ou não finitos → 0.
  - `criarAcaoVenda(mes): Promise<{ id?: string; erro?: string }>`, `salvarAcaoVenda(a: AcaoVenda)`, `excluirAcaoVenda(id)`.

- [ ] **Step 1:** Escrever os arquivos.
- [ ] **Step 2: Run** `npx tsc --noEmit && npm run lint` — Expected: sem erros. (Comportamento coberto pelos e2e das Tasks 4 e 5.)
- [ ] **Step 3: Commit** `feat: leitura e ações do planejamento e das metas`

---

### Task 4: Tela "Planejamento estratégico"

**Files:**
- Create: `app/(app)/planejamento/page.tsx`, `components/planejamento/Visoes.tsx`, `components/planejamento/Prioridades.tsx` (client), `components/planejamento/ObjetivoCartao.tsx` (client), `components/planejamento/NovoObjetivo.tsx` (client), `components/planejamento/NovaAcao.tsx` (client)
- Modify: `lib/domain/rotas.ts` (`planejamento` construída), `app/(app)/visao-geral/page.tsx` (tirar de `EM_BREVE`), `components/layout/__tests__/itensMenu.test.ts`, `e2e/navegacao.spec.ts` se necessário
- Test: `e2e/planejamento.spec.ts`, `components/planejamento/__tests__/Prioridades.test.tsx`

Tela (`FaixaTitulo` olho "Ciclo 2027", título "Planejamento estratégico", descrição "Escolha as prioridades de cada trimestre e desdobre cada objetivo em ações táticas e operacionais."; selo "Fase de planejamento" antes de 2027):
- Visões como links em lista (`nav aria-label="Período"`, `aria-current="page"`): Ano todo · 1º sem · 2º sem · 1º–4º tri; padrão = trimestre atual.
- Trimestre: cartão "Prioridades do Nº trimestre" com as 7 categorias como botões de alternância (`aria-pressed`), contador "N de 3"; ao escolher a 4ª, pergunta inline (`role="alertdialog"`): "Mais de três prioridades dispersam o esforço do trimestre. Adicionar mesmo assim?" [Adicionar mesmo assim] [Cancelar]. Semestre/ano: prioridades de cada trimestre só para leitura.
- Árvore por categoria (`h2` nome + selo "Prioridade" quando for): cada objetivo com título, trimestre, origem ("Da biblioteca" quando `libraryItemId`), listas "Tático" e "Operacional" (cada ação com nível, título, trimestre, status e botões Editar/Excluir), "Sem trimestre" (só no ano), OKRs com KRs ("sem meta numérica" quando `alvo` nulo) e KPIs, mais "Nova ação" (título, nível, trimestre). "Editar" do objetivo troca título/trimestre no lugar; "Excluir objetivo" pede confirmação inline com o número de ações: "Excluir este objetivo e as N ações ligadas a ele?".
- Por categoria: "Novo objetivo" (título + trimestre) e link "Buscar na biblioteca" (`/biblioteca?categoria=<slug>`).
- Vazio: "Nenhum objetivo neste período. Comece pelas prioridades ou busque ideias na biblioteca."

- [ ] **Step 1: Write failing tests.**
  - `Prioridades.test.tsx`: `quarta-pede-confirmacao` (3 escolhidas; clicar na 4ª chama a ação com `confirmar=false`; ação devolve `{confirmar:true}` → aparece o alertdialog; "Adicionar mesmo assim" chama com `confirmar=true`); `cancelar-nao-grava`.
  - `e2e/planejamento.spec.ts`:
    - `abre-pelo-menu-no-trimestre-atual`: conta nova → menu "Planejamento estratégico" → `h1`, link "1º trimestre" com `aria-current="page"`, "0 de 3".
    - `prioridades-limite-e-confirmacao`: escolhe Comercial, Método, Financeiro → "3 de 3"; escolhe Operação → alertdialog → Cancelar → continua 3; de novo → "Adicionar mesmo assim" → "4 de 3" e selo "Acima do recomendado". Visão geral: próximo passo deixa de ser "Escolha as prioridades".
    - `objetivo-e-acoes`: em Comercial cria objetivo "Fechar 10 contratos" (1º tri) → cria ação tática "Mapear funil" (1º tri) e operacional "Ligar para 5 indicações" (2º tri) → na visão 1º tri só a tática; na 2º tri o objetivo aparece com a operacional; edita título do objetivo; exclui o objetivo → pergunta "… as 2 ações …" → confirma → some; Visão geral "Ações no plano" = 0.
    - `item-da-biblioteca-aparece-na-arvore`: adiciona pela biblioteca o tático de Comercial (2º tri) → em `/planejamento?visao=t2` o objetivo estratégico da biblioteca aparece com a ação e "Da biblioteca".
    - `celular-390`: `/planejamento` sem rolagem horizontal.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS; suíte completa passa.
- [ ] **Step 5: Commit** `feat: tela de planejamento estratégico (prioridades e árvore)`

---

### Task 5: Tela "Metas e indicadores" (parte financeira)

**Files:**
- Create: `app/(app)/metas/page.tsx`, `components/metas/MetasFinanceiras.tsx` (client, gravação automática), `components/metas/AcoesVenda.tsx` (client), `components/metas/Comparacao.tsx`
- Modify: `lib/domain/rotas.ts` (`metas` construída), `app/(app)/visao-geral/page.tsx` (`EM_BREVE`: "Metas e indicadores" → "OKRs, KRs e KPIs com medições e gráficos")
- Test: `e2e/metas.spec.ts`, `components/metas/__tests__/MetasFinanceiras.test.tsx`

Tela (`FaixaTitulo` olho "Ciclo 2027", título "Metas e indicadores", descrição "Três alturas para o mesmo ano: a meta com que você se compromete, a super meta que exige esforço extra e a mega meta de um ano excepcional."):
- Cartão "Como planejar as metas": os 5 passos da v1 (texto intacto: "Parta do realizado.", "Defina as três alturas.", "Traduza em vendas.", "Divida por trimestre.", "Cheque a conta.").
- Base 2026: "Base de 2026: faturamento de R$ X." ou "Você ainda não informou o faturamento de 2026…" + link "Preencher no fechamento de 2026" (`/diagnostico/fechamento`).
- "Meta anual": tabela (linhas Faturamento, Lucratividade %, Investimento em anúncios %, Time (pessoas); colunas Meta/Super/Mega) + linhas calculadas Lucro projetado, Investimento em anúncios (R$), Média mensal, Crescimento sobre 2026; campo "Por que essa meta?".
- "Produtos estrela e cenário de vendas": Entrada/Principal/Alto valor (nome, ticket, vendas por altura) + "Faturamento do cenário" e "Comparado à meta anual" (`Comparacao`: "fecha com a meta" / "faltam R$ X" / "R$ X acima").
- "Meta de faturamento por trimestre": 4 × 3 + soma + comparação + botão "Dividir a meta anual em quatro partes iguais".
- "Realizado por trimestre": faturamento realizado e "% da meta".
- "Ações de vendas por mês": escolha do trimestre (botões 1º–4º), para cada mês as linhas (produto, ação, ticket, vendas, faturamento calculado, responsável, remover) + "Adicionar ação de vendas" + "Previsto no mês" e "Previsto no trimestre" comparado à meta do trimestre.
- Status de gravação como no fechamento ("Salvando…", "Salvo às HH:MM", falha com nova tentativa, sessão expirada).
- Nota: "OKRs, resultados-chave e indicadores com medições chegam na próxima etapa."
- Tabelas em `overflow-x-auto` com `role="region"` e `aria-label`, `tabIndex=0`.

- [ ] **Step 1: Write failing tests.**
  - `MetasFinanceiras.test.tsx`: `dividir-em-quatro` (faturamento meta 1.000.001 → botão → trimestres 250.000/250.000/250.000/250.001 e "fecha com a meta"); `cenario-compara` (ticket 500 × 100 + 30.000 × 20 → "Faturamento do cenário" R$ 650.000 e "faltam R$ 350.000" para meta 1.000.000).
  - `e2e/metas.spec.ts`:
    - `abre-e-calcula`: menu "Metas e indicadores" → preenche faturamento meta "R$ 1.200.000,00", lucratividade "30" → "Lucro projetado" R$ 360.000 e "Média mensal" R$ 100.000 → "Salvo às" → recarrega → valores continuam.
    - `trimestres-e-realizado`: dividir → soma "fecha com a meta"; realizado 1º tri R$ 150.000 → "50% da meta".
    - `acao-de-vendas`: 2º trimestre → abril → "Adicionar ação de vendas" → produto "Holding", ticket 30.000, vendas 2 → faturamento R$ 60.000 e "Previsto no trimestre" R$ 60.000 → recarrega → continua; remove → some.
    - `base-2026`: preenche faturamento no fechamento (R$ 1.000.000) → em Metas "Base de 2026: faturamento de R$ 1.000.000" e crescimento "+20%" para meta 1.200.000.
    - `celular-390`: sem rolagem horizontal na página.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS; suíte completa passa.
- [ ] **Step 5: Commit** `feat: metas financeiras (anual, produtos, trimestres, realizado, ações de vendas)`

---

### Task 6: Publicar e conferir

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` — sem erro.
- [ ] **Step 2:** Revisão final do branch (subagente), correções com teste.
- [ ] **Step 3:** Publicar no projeto Vercel `cep-planejamento-v2` (`READY`; `/planejamento` e `/metas` sem sessão → `/entrar`).
- [ ] **Step 4:** Apagar contas `e2e-%@example.com`; 0 organizações órfãs; branch `etapa-3` enviada e incorporada ao `main`.

**Fora desta etapa (decidido):** duplicar ciclo / arquivar (Etapa 6, junto do Histórico — hoje só existe o ciclo 2027); valores e medições de KRs/KPIs e gráficos (Etapa 5); tabela/Kanban/calendário das ações (Etapa 4).
