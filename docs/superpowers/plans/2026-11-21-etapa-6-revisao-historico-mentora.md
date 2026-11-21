# Etapa 6 — Revisão, histórico, exportação, painel da mentora e importação da v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A aluna revisa cada trimestre (7 perguntas + faturamento) e, ao concluir, gera um relatório com o retrato dos indicadores e a comparação com a revisão anterior; vê o histórico (revisões, ações concluídas, registro de alterações); exporta o plano (página de impressão → PDF; ações em CSV) e importa o planejamento da versão anterior. A mentora tem o menu "Alunas": lista com progresso, plano de cada aluna só para leitura e senha provisória.

**Architecture:** Regras puras em `lib/domain/revisao.ts`, `lib/domain/csv.ts`, `lib/domain/v1.ts`. Um componente de servidor `RelatorioPlano({ orgId })` monta o plano inteiro só para leitura e é reutilizado em `/imprimir` (a própria aluna) e `/alunas/[id]` (mentora; RLS já dá leitura de tudo à mentora). Revisão em `cep_reviews` (respostas com gravação automática; ao concluir grava `retrato` e `concluida_em`). CSV por Route Handler `/exportar/acoes`. Senha provisória chama a função `cep-conta` (ação `redefinir`) com o token da mentora. Importação da v1 por ação da própria aluna, lendo a sua linha de `cep2027_planos` (RLS já permite), uma vez só (`cep_profiles.importado_v1_em`).

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§5 itens 7, 8, 9 e "Mentora", §8 "Concluídas", "Novo ciclo", "Próximo passo" regra 6, §9 migração, §10 Etapa 6, §11)

## Global Constraints

- Perguntas da revisão (texto exato, §5 item 7): "O que foi executado?", "O que não foi executado?", "Quais resultados foram alcançados?", "O que impediu a execução?", "Quais estratégias funcionaram?", "Quais precisam ser alteradas?", "O que será prioridade no próximo ciclo?" + faturamento realizado.
- Execução e resultado separados também no retrato (§8).
- Mentora: lê tudo, não altera nada do plano das alunas; redefine senha provisória só de contas de aluna (a função já recusa mentora/admin e contas fora do CEP).
- Exportação: PDF pela página de impressão do navegador, sem gerador no servidor; CSV com `;`, UTF-8 com BOM (abre certo no Excel em português) e proteção contra fórmula (`=`, `+`, `-`, `@` no início ganham `'`).
- Importação v1 conforme §9 (itens "Fazer" → biblioteca; itens próprios estratégicos → objetivo, demais sob o objetivo estratégico da categoria; OKR sem números → KR com campos vazios; pendências "levar" → tarefas; listas do fechamento; tarefas avulsas; metas; vendas; realizado; aprendizado/ajustes → revisão; ritual sem destino).
- Português do Brasil, identidade CEP, 390 px, "Texto maior"; commits com atribuição; v2 só no Vercel `cep-planejamento-v2`; contas e2e apagadas.

## Decidido nesta etapa (rulings de escopo)

- **Duplicar ciclo / arquivar** fica para antes de dez/2027: hoje só existe o ciclo 2027 e todo o app usa 2027 fixo; criar 2028 agora exigiria trocar isso em todas as telas sem uso real por 13 meses. O Histórico mostra os ciclos (só 2027, ativo) e explica.
- **Comparação entre ciclos** idem (precisa de um segundo ciclo).
- **CSV** só das ações (a planilha de metas já existe no Drive da usuária; a página de impressão cobre o resto).

## Review Focus

1. Mentora tentando gravar no plano de uma aluna (por qualquer tela) → negado pelo banco; telas da mentora sem botões de edição.
2. Concluir a revisão duas vezes / em duas abas → um relatório só por trimestre (unique cycle_id,trimestre) com o retrato mais recente.
3. CSV com título começando por "=" ou contendo `;`, aspas e quebra de linha → célula intacta e sem fórmula.
4. Importar a v1 duas vezes ou com dados incompletos (campos ausentes, textos antigos) → importa uma vez; nada quebra.
5. Aluna comum abrindo `/alunas` ou `/alunas/<id>` → 404.

---

### Task 1: Regras puras (revisão, CSV, v1)

**Files:** `lib/domain/revisao.ts`, `lib/domain/csv.ts`, `lib/domain/v1.ts`; tests em `lib/domain/__tests__/`.

**Produces:**
- `PERGUNTAS_REVISAO: { chave: "executado"|"naoExecutado"|"resultados"|"impedimentos"|"funcionou"|"alterar"|"proximo"; texto: string }[]` (texto exato da spec).
- `type RetratoRevisao = { trimestre; execucao: { total; concluidas; pct: number|null }; krs: { media: number|null; atingidos; comMeta }; kpis: { naMeta; total }; faturamento: { realizado: number; meta: number; pct: number|null } }`; `montarRetratoRevisao(d, trimestre): RetratoRevisao` (tarefas do trimestre; KRs/KPIs do ciclo); `compararRetratos(atual, anterior|null): { campo; antes; depois; variacao }[]` (execução %, média KRs, KPIs na meta, faturamento).
- `linhasCsv(cabecalho: string[], linhas: (string|number|null)[][]): string` — `;`, `\r\n`, BOM, aspas duplicadas, proteção de fórmula; números com vírgula decimal.
- `mapearV1(dados: unknown): ImportacaoV1` — `{ perfil; fechamento: Fechamento; itens: { perfil; cat; nivel; tri; prazo; status }[]; proprios: { cat; nivel; texto; tri; prazo; status }[]; tarefas: { texto; tri; feito }[]; pendencias: { texto; tri; feito }[]; metas: MetasForm; vendas: Omit<AcaoVenda,"id">[]; realizado: Record<1|2|3|4, number>; revisoes: { trimestre; aprendizado: string; ajustes: string[] }[] }`; tolera ausências e textos antigos (usa `lerFechamento` e o mesmo "texto vira lista").
- [ ] Testes: perguntas exatas; retrato (3 tarefas do 2º tri, 1 concluída → 33%; KRs 0,5 e 1 → 0,75; faturamento 150k/300k → 0,5); comparação com anterior nulo → antes null; CSV `=SOMA(A1)` → `'=SOMA(A1)`, `a;b` e `"x"` entre aspas, BOM no início, 12.5 → "12,5"; v1 com `metas.anual.fat.0 = "R$ 1.200.000,00"` → `anual.meta.faturamento = 1200000`, item `p2c1n1 {fazer:true, tri:"2", prazo:"2027-03-01", status:"Concluído"}` → `{perfil:2,cat:1,nivel:1,tri:2,status:"concluido"}`, `custom` nível 0 vira próprio estratégico, `retro.pend` "levar" vira pendência, dados `{}` não quebram.
- [ ] Commit `feat: regras da revisão, CSV e importação da v1`

### Task 2: Banco

**Files:** `supabase/migrations/20261121000200_cep_etapa6.sql`; `supabase/tests/etapa6.sql`; tipos.
- `alter table cep_profiles add column importado_v1_em timestamptz`.
- Teste SQL: aluna A grava revisão; B não lê; mentora lê e não grava (insert/update negados); `importado_v1_em` gravável pela própria aluna; mentora lê `cep_activity` de A; A lê a própria `cep2027_planos`, B não.
- [ ] FAIL → aplicar → PASS → commit `feat: banco da etapa 6`

### Task 3: Revisão estratégica

**Files:** `lib/data/revisao.ts`, `lib/data/revisaoAcoes.ts`, `app/(app)/revisao/page.tsx`, `components/revisao/{FormRevisao,RelatorioRevisao}.tsx`; rotas (`revisao` construída), `EM_BREVE`.
- Trimestres como abas (`?t=1..4`, padrão o atual); formulário com as 7 perguntas (textareas) + "Faturamento realizado no trimestre" (grava também em `cep_quarter_results`), gravação automática; "Concluir revisão" → servidor calcula o retrato e grava; relatório: retrato (execução separada de resultado), respostas e "Comparado à revisão anterior"; "Atualizar o retrato" refaz o retrato; respostas continuam editáveis.
- [ ] Testes: `RelatorioRevisao.test` (comparação mostra "+17 p.p." etc.); e2e `revisao`: responde 2 perguntas, concluir → relatório com "Execução das ações" e as respostas; recarrega e mantém; Visão geral deixa de sugerir revisão do trimestre (fase de execução não testável hoje — coberto pelo teste de domínio existente).
- [ ] Commit `feat: revisão estratégica com relatório`

### Task 4: Histórico e exportação

**Files:** `app/(app)/historico/page.tsx`, `lib/data/historico.ts`, `lib/domain/atividade.ts` (texto amigável de cada registro), `components/relatorio/RelatorioPlano.tsx`, `app/imprimir/page.tsx` (fora do layout com menu; estilos de impressão), `app/exportar/acoes/route.ts`; cartão "Exportar" em Configurações.
- Histórico: Ciclos (2027 · ativo + nota), Relatórios de revisão (links), Ações concluídas (título, categoria, concluída em), Registro de alterações (últimos 50, "Ver mais" por `?ate=`), texto amigável: "Ação criada: Mapear funil", "Objetivo excluído: …", "Medição registrada", etc.
- `RelatorioPlano`: cabeçalho (nome, perfil, data), diagnóstico (perfil e fechamento de 2026), prioridades por trimestre, árvore por categoria, metas (anual e trimestres), OKRs/KRs com progresso, KPIs com última medição, ações (tabela), revisões concluídas.
- `/imprimir`: `RelatorioPlano` da própria aluna + botão "Imprimir ou salvar em PDF" (`window.print`), CSS `@media print` sem menu/botões.
- `/exportar/acoes`: CSV com Ação, Objetivo, Categoria, Nível, Responsável, Prioridade, Status, Início, Prazo, Trimestre; `Content-Disposition: attachment; filename="plano-de-acao-2027.csv"`.
- [ ] Testes: `atividade.test`; e2e `historico-e-exportacao` (criar e concluir ação → aparece em "Ações concluídas" e no registro; `/imprimir` mostra o nome e a ação; download do CSV contém o cabeçalho e a ação).
- [ ] Commit `feat: histórico e exportação`

### Task 5: Painel da mentora

**Files:** `app/(app)/alunas/page.tsx`, `app/(app)/alunas/[id]/page.tsx`, `lib/data/alunas.ts`, `lib/data/alunasAcoes.ts` (`redefinirSenha(userId, senha)` → função `cep-conta` com o token da sessão), `components/alunas/RedefinirSenha.tsx`; rotas (`alunas` construída; o menu já filtra por papel).
- Lista: nome, e-mail, perfil, diagnóstico (concluído/iniciado/não iniciado), ações (concluídas/total), média dos KRs, última alteração; só alunas (sem papel); vazio: "Nenhuma aluna cadastrada ainda.".
- Detalhe: `RelatorioPlano` da organização da aluna + "Senha provisória" (campo, mínimo 8, "Definir senha provisória"; aviso para comunicar a aluna).
- Não-mentora → `notFound()`.
- [ ] Testes: e2e com conta mentora temporária (`E2E_MENTORA_*`, papel dado por SQL): lista mostra a aluna criada no teste; detalhe mostra a ação dela; senha provisória → a aluna entra com a nova senha; aluna comum em `/alunas` → "Página não encontrada".
- [ ] Commit `feat: painel da mentora`

### Task 6: Importação da v1

**Files:** `lib/data/importarV1.ts` (`"use server"`), cartão em Configurações ("Importar da versão anterior": aparece se existir linha em `cep2027_planos` da aluna e `importado_v1_em` nulo).
- Ordem: perfil (se vazio) → fechamento (se o diagnóstico não tiver fechamento) → itens da biblioteca via `cep_adicionar_item` + ajuste de prazo/status pela `library_item_id` → próprios → tarefas e pendências avulsas (`cep_tasks` operacional, sem objetivo) → metas (`salvarMetas` com todas as linhas) → vendas → revisões (respostas `executado` = aprendizado, `alterar` = ajustes) → marca `importado_v1_em`. Erro no meio → mensagem e não marca (pode tentar de novo; itens já criados não duplicam pela regra da biblioteca).
- [ ] Testes: unidade do mapeador (Task 1); e2e `importar-v1`: conta nova cria linha v1 via REST (a própria aluna pode inserir a sua) com 1 item "Fazer", 1 tarefa e meta anual → "Importar" → item no Planejamento, tarefa no Plano de ação, meta em Metas; cartão some.
- [ ] Commit `feat: importação da versão anterior`

### Task 7: Revisão final e publicação
- [ ] Suíte completa (unit + e2e com contas admin e mentora temporárias), revisão final (subagente), correções com teste, publicar, apagar contas, `etapa-6` no `main`.
