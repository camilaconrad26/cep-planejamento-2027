# Etapa 5 — OKRs, KRs, KPIs, medições e gráficos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dentro de "Metas e indicadores", a aluna cria OKRs com resultados-chave numéricos e lança valores; cria KPIs e registra medições datadas; vê gráficos simples (KPI mês a mês com a meta; faturamento realizado × meta por trimestre); a Visão geral passa a resumir resultados e o próximo passo avisa quando falta medição há 30 dias.

**Architecture:** `/metas` ganha abas na URL (`?aba=financeiro|okrs|kpis`, padrão financeiro). Regras puras em `lib/domain/resultados.ts` (progresso de KR, situação do KPI, série mensal, medição vencida). Leitura `server-only` em `lib/data/resultados.ts`; escrita em `lib/data/resultadosAcoes.ts` (`"use server"`, sessão → `{erro:"sessao"}`). Gráficos em SVG próprio (sem biblioteca), cores validadas pelo validador do skill dataviz: dourado `#9a6b00` (série principal/realizado) e azul `#2f6fb0` (meta), legenda sempre que houver 2 séries, rótulo direto seletivo, tabela alternativa ("Ver em tabela"), dica ao passar o mouse/foco (`<title>` + foco por teclado). Tabelas do banco já existem (Etapa 0) com RLS; sem migração nova.

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§5 itens 1 e 6, §8 "Progresso de KR", "KPI", "Execução e resultado", "Próximo passo" regra 5, §9 KR sem números, §10 Etapa 5)

## Global Constraints

- Progresso de KR = (atual − inicial) ÷ (alvo − inicial), limitado a 0–100%; atingido em 100%. KR sem alvo = "sem meta numérica", fora do cálculo (§8, §9). Inicial vazio conta como 0; atual vazio conta como inicial.
- KPI: última medição comparada com a meta conforme o sentido ("maior é melhor" / "menor é melhor") (§8).
- Execução (tarefas) e resultado (KRs/KPIs) sempre separados na tela (§2, §8).
- Próximo passo regra 5: KR com meta numérica ou KPI sem medição há mais de 30 dias (§8).
- Comparação com o ciclo anterior: só existe o ciclo 2027; a tela diz "A comparação com o ciclo anterior aparece a partir do segundo ciclo." (decidido).
- Português do Brasil; identidade CEP; 390 px sem rolagem horizontal; "Texto maior"; números em formato brasileiro.
- Mentora só lê (RLS). Commits com atribuição; v2 só no Vercel `cep-planejamento-v2`; contas e2e apagadas.

## Review Focus

1. KR "menor é melhor" (alvo < inicial, ex.: inadimplência de 10 para 2) → progresso correto; alvo = inicial → 100% se atual já alcançou, senão 0.
2. Valores com vírgula ("12,5", "R$ 1.000") e vazios → sem NaN; vazio aparece "—".
3. Excluir KPI com medições → confirmação dizendo quantas medições somem.
4. Várias medições no mesmo mês → gráfico usa a última do mês; medições fora de ordem de data → ordenadas.
5. Gráfico com 1 só ponto ou sem dados → mensagem, sem SVG quebrado.

---

### Task 1: Regras puras dos resultados

**Files:** `lib/domain/resultados.ts`; Test `lib/domain/__tests__/resultados.test.ts`

**Produces:**
- `type KR = { id; okrId; descricao; unidade: string; inicial: number|null; alvo: number|null; atual: number|null; prazo: string|null; atualizadoEm: string }`
- `progressoKR(k): number|null` (0–1); `atingido(k): boolean`; `mediaKRs(krs): number|null`.
- `type Medicao = { id; data: string; valor: number; nota: string }`; `type KPI = { id; nome; unidade: string; sentido: "maior"|"menor"; meta: number|null; objetivoId: string|null; criadoEm: string }`.
- `situacaoKPI(k, medicoes): { ultima: Medicao|null; situacao: "sem-medicao"|"sem-meta"|"na-meta"|"fora-da-meta" }`.
- `serieMensal(medicoes): { mes: string /*AAAA-MM*/; valor: number }[]` — última do mês, meses em ordem.
- `medicaoVencida(ultimaData: string|null, criadoEm: string, hoje): boolean` (> 30 dias da última, ou da criação se nunca medido).
- `formatarNumero(n: number|null, unidade?: string): string` ("—" para null; "12,5 %"; "R$ 1.200" quando unidade "R$").
- `escala(min, max, passos=4): number[]` (ticks redondos).

- [ ] Failing tests: progressoKR {0,100,40}=0.4; {10,2,6}=0.5; {10,2,1}=1; {0,100,-5}=0; alvo null → null; inicial null conta 0; atual null → 0; alvo=inicial e atual≥alvo → 1. `mediaKRs` ignora null. `situacaoKPI` maior/menor, sem meta, sem medição, última por data (não por ordem). `serieMensal` com duas no mesmo mês → última. `medicaoVencida` 31 dias true, 30 false, nunca medido criado há 40 dias true. `formatarNumero(12.5,"%")` = "12,5 %"; `formatarNumero(1200,"R$")` = "R$ 1.200"; `escala(0, 97)` = [0,25,50,75,100].
- [ ] FAIL → implementar → PASS → commit `feat: regras de OKRs, KRs e KPIs`

### Task 2: Dados e ações

**Files:** `lib/data/resultados.ts` (`server-only`), `lib/data/resultadosAcoes.ts` (`"use server"`); Modify `lib/data/retrato.ts` + `lib/domain/retrato.ts` (preencher `medicaoVencida`).

**Produces:**
- `obterResultados(orgId): Promise<{ cicloId; objetivos: {id; titulo; categoria: string}[]; okrs: {id; objetivoId; titulo; trimestre}[]; krs: KR[]; kpis: KPI[]; medicoes: Record<string, Medicao[]>; execucaoPorObjetivo: Record<string, number|null> }>`.
- Ações (todas `{ok?; erro?}`; `revalidatePath("/metas")`, `("/visao-geral")`, `("/planejamento")`): `criarOkr({objetivoId, titulo, trimestre})`, `editarOkr(id,{titulo,trimestre})`, `excluirOkr(id)`; `criarKr({okrId, descricao, unidade, inicial, alvo, atual, prazo})`, `editarKr(id, mesmos)`, `lancarValorKr(id, atual)`, `excluirKr(id)`; `criarKpi({nome, unidade, sentido, meta, objetivoId})`, `editarKpi(id, mesmos)`, `excluirKpi(id)`; `registrarMedicao({kpiId, data, valor, nota})`, `excluirMedicao(id)`. Validação: textos 1–1000 (unidade ≤ 40, nota ≤ 500), números finitos ou null, data válida 2000–2100, trimestre 1–4/null, objetivo/OKR/KPI da própria organização (`.eq("org_id")`).
- `montarRetrato`: busca KRs com alvo e KPIs com última medição e conta `medicaoVencida` (regra 5 do próximo passo).
- [ ] Test: `retrato.test` ganha caso `medicaoVencida` → próximo passo "Atualize seus indicadores" (FAIL → PASS); `tsc`, lint.
- [ ] Commit `feat: dados e ações de OKRs, KRs, KPIs e medições`

### Task 3: Aba OKRs e KRs

**Files:** `components/resultados/{AbasMetas,Okrs,KrLinha,FormKr,BarraProgresso}.tsx`; Modify `app/(app)/metas/page.tsx`; Test `components/resultados/__tests__/KrLinha.test.tsx`, `e2e/resultados.spec.ts`

- Abas (`nav aria-label="Seções de metas"`, links com `aria-current`): Financeiro · OKRs e resultados-chave · Indicadores (KPIs).
- Por objetivo do ciclo (agrupado por categoria): cartão com "Execução das ações: X%" (tarefas) e, separado, "Resultado dos KRs: Y%"; OKRs com título e trimestre; cada KR com descrição, "inicial → atual → alvo unidade", barra de progresso (texto do % + `role="progressbar"`), selo "Atingido" ou "sem meta numérica"; "Lançar valor" (campo + botão) e "Editar"/"Excluir". "Novo OKR" (objetivo, título, trimestre) e "Novo resultado-chave" em cada OKR. Sem objetivos: aviso com link para o Planejamento.
- [ ] Failing tests: `KrLinha.test`: `lanca-valor` (campo "Valor atual de <descrição>" "60" → chama `lancarValorKr(id, 60)`), `sem-meta-numerica` (alvo null → texto "sem meta numérica", sem barra). e2e `okr-e-kr`: conta nova → cria objetivo no Planejamento → Metas › OKRs → "Novo OKR" → "Novo resultado-chave" (inicial 0, alvo 10, unidade "contratos") → lança 4 → "40%" → lança 10 → "Atingido" → recarrega → mantém; Visão geral mostra "Resultado dos KRs" 100%.
- [ ] FAIL → implementar → PASS → commit `feat: OKRs e resultados-chave`

### Task 4: Aba KPIs, medições e gráfico mensal

**Files:** `components/resultados/{Kpis,KpiCartao,FormKpi,Medicoes,GraficoLinha}.tsx`; Test `components/resultados/__tests__/GraficoLinha.test.tsx`, e2e

- Lista de KPIs: nome, sentido, meta, última medição e situação ("Na meta" / "Fora da meta" / "Sem medição" / "Sem meta"; texto + ícone, nunca só cor); selo "Sem medição há mais de 30 dias". "Registrar medição" (data padrão hoje, valor, nota); histórico com excluir; "Novo KPI"; editar; excluir com confirmação "Excluir este indicador e as N medições?".
- `GraficoLinha` (SVG): série mensal (dourado, linha 2px, pontos r=4 com anel branco 2px, `<title>` em cada ponto "Mês: valor"), linha de meta (azul, 1px, rótulo "Meta X" à direita), eixo Y com `escala`, grade 1px recessiva, último valor rotulado; < 2 meses → "Registre medições em meses diferentes para ver o gráfico."; `<details>` "Ver em tabela" com mês/valor.
- [ ] Failing tests: `GraficoLinha.test` (2 meses → 2 pontos com títulos "jan/2027: 10"; 1 mês → mensagem). e2e `kpi-e-medicoes`: cria KPI "Taxa de conversão" (%, maior, meta 30) → registra 20 em 2027-01-15 e 35 em 2027-02-10 → "Na meta" → gráfico com 2 pontos → exclui KPI pede "2 medições".
- [ ] FAIL → implementar → PASS → commit `feat: KPIs, medições e gráfico mensal`

### Task 5: Gráfico trimestral, Visão geral, publicação

**Files:** `components/resultados/GraficoTrimestres.tsx` (aba Financeiro, abaixo de "Realizado por trimestre"); Modify `app/(app)/visao-geral/page.tsx` (cartão "Resultados": média dos KRs e KPIs na meta, separado de "Execução do ciclo"); `EM_BREVE` sem "OKRs e indicadores".
- `GraficoTrimestres`: barras agrupadas por trimestre, realizado (dourado) × meta (azul, contorno + preenchimento claro como codificação secundária), legenda, valor no topo só do realizado, tabela alternativa, "A comparação com o ciclo anterior aparece a partir do segundo ciclo.".
- [ ] e2e: `grafico-trimestral` (meta 1º tri 300.000, realizado 150.000 → barras com títulos "1º tri — realizado: R$ 150.000"); `visao-geral-resultados`; 390 px.
- [ ] Suíte completa, revisão final (subagente), correções com teste, publicar, limpar contas, `etapa-5` no `main`.
