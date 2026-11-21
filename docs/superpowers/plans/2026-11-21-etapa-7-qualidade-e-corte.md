# Etapa 7 — Testes ponta a ponta, celular, acessibilidade, segurança e corte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provar os critérios de aceitação (§11) com testes, deixar o app correto em celular e acessível, fechar a revisão de segurança e, só com a aprovação da usuária, passar o endereço `cep-planejamento-2027.vercel.app` para a v2.

**Architecture:** Sem funcionalidade nova. Uma jornada ponta a ponta que segue os critérios de aceitação; uma varredura de todas as telas a 390 px (com e sem "Texto maior") e com axe-core; um teste de banco que percorre todas as tabelas `cep_` com duas alunas, a mentora e o anônimo; cabeçalhos de segurança no Next; correção dos ajustes pequenos deixados nas etapas anteriores. O corte é a última tarefa e só roda depois de um "sim" explícito da usuária.

**Tech Stack:** Next.js 15.5, Playwright 1.63 (Chromium pré-instalado), `@axe-core/playwright`, Vitest, SQL no Supabase (projeto kerssctooyqryzofbrzd), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-20-planejamento-cep-v2-design.md` (§7 acesso, §9 migração, §10 corte, §11 critérios de aceitação)

## Global Constraints

- "a aplicação funciona em dispositivos móveis"; "o app funciona a 390 px de largura e com 'Texto maior'" (§11).
- "uma aluna não lê nem altera dados de outra, verificado em teste no banco com duas contas"; "a mentora vê todas as alunas e não altera nada"; "Nenhuma regra de acesso depende da interface" (§7, §11).
- "A v1 fica no ar até a v2 ser aprovada. Depois, o endereço atual passa a servir a v2 e as tabelas `cep2027_*` ficam só como cópia de segurança" (§9). "No corte … o endereço `cep-planejamento-2027.vercel.app` passa para o projeto da v2" (§10).
- Não alterar tabelas fora do prefixo `cep_`/`cep2027_`; nunca publicar a v2 no projeto da v1 sem o corte aprovado.
- Português do Brasil; identidade CEP; contas e2e apagadas ao final; commits com atribuição.

## Review Focus

1. Tela que só quebra a 390 px com "Texto maior" ligado (tabelas, Kanban, calendário, gráficos) → nenhuma rolagem horizontal da página; tabelas largas rolam dentro do próprio contêiner.
2. Tabela `cep_` criada depois da Etapa 0 sem política para a mentora ou para o anônimo → o teste de banco percorre `information_schema` (não uma lista fixa) e falha.
3. Ação de servidor que recebe um id de outra organização (editar tarefa, KR, KPI, medição, ação de venda) → nada muda; o teste usa ids reais da aluna B com a sessão da aluna A.
4. Página aberta dentro de um iframe de outro site (clickjacking no login) → bloqueada por `frame-ancestors 'none'`.
5. Depois do corte, aluna com a v1 aberta ou com o endereço antigo salvo → cai no login da v2; a v1 continua acessível só pelo endereço de deploy dela, para consulta.

---

### Task 1: Jornada de aceitação

**Files:** Create `e2e/aceitacao.spec.ts`, `docs/aceitacao.md`

- `docs/aceitacao.md`: tabela com cada critério do §11 (os 14 da usuária + 4 acrescentados) → teste que o prova (arquivo e nome). Critério sem teste = linha "FALTA" e vira passo nesta tarefa.
- `aceitacao.spec.ts` › `jornada-completa` (uma conta nova, 1280 px): criar conta → diagnóstico até o resumo, confirmar perfil sugerido → Biblioteca mostra itens do perfil e muda ao trocar de perfil → adicionar um item tático → Planejamento mostra objetivo + ação → Plano de ação: editar prazo para ontem → selo "Atrasada" → Kanban: mover para "Concluída" pelo teclado → Metas: faturamento meta → Revisão do 1º tri: responder 1 pergunta, "Concluir revisão" → Histórico lista a conclusão → sair e entrar de novo → tudo continua lá.
- [ ] Escrever a tabela e o teste; rodar (`NODE_USE_ENV_PROXY=1 npx playwright test e2e/aceitacao.spec.ts --trace off`). Esperado: PASS. Se falhar, é defeito do app: corrigir com teste que reproduz.
- [ ] Commit `test: jornada de aceitação e mapa dos critérios`

### Task 2: Celular e "Texto maior"

**Files:** Create `e2e/celular.spec.ts`; Modify componentes que falharem.

- Lista `TELAS` = todas as rotas construídas da aluna (`ROTAS_CONSTRUIDAS` + `/diagnostico/resumo`, `/diagnostico/fechamento`, `/plano-de-acao?visao=kanban|calendario|prioridades`, `/metas?aba=okrs|kpis`, `/historico`, `/imprimir`) e, com a conta mentora, `/alunas` e `/alunas/[id]`.
- Teste `sem-rolagem-horizontal` (viewport 390×844, conta com dados: 1 objetivo, 3 ações, 1 KPI com 2 medições): para cada tela, com "Texto maior" desligado e ligado, `document.documentElement.scrollWidth <= 390`. Mensagem de falha nomeia a tela e o modo.
- Teste `alvos-de-toque`: em cada tela, botões e links visíveis dentro de `main` têm altura ≥ 44 px (exceto links dentro de parágrafo).
- Teste `iphone`: `devices["iPhone 13"]` — login, Visão geral, menu abre e fecha, navega para Plano de ação.
- [ ] Escrever os testes, rodar, ver o que falha (RED), corrigir cada tela, rodar de novo (GREEN).
- [ ] Commit `fix: telas a 390 px e com texto maior`

### Task 3: Acessibilidade

**Files:** `npm i -D @axe-core/playwright`; Create `e2e/acessibilidade.spec.ts`; Modify componentes que falharem.

- Teste `axe-sem-violacoes-graves`: para cada tela de `TELAS` (Task 2; exportar a lista de `e2e/telas.ts`) e para `/entrar` e `/criar-conta`, `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()` → zero violações `serious` ou `critical`. Falha lista regra + seletor.
- Teste `teclado`: em `/visao-geral`, Tab a partir do topo chega ao link "Pular para o conteúdo" (criar se não existir, visível ao receber foco) e depois ao menu; o foco é sempre visível (`outline` ≠ none ou `box-shadow` no elemento focado).
- Inclui o ajuste deixado na Etapa 6: ajuda da senha ligada ao campo por `aria-describedby`.
- [ ] RED → corrigir → GREEN. Commit `fix: acessibilidade (axe e teclado)`

### Task 4: Segurança

**Files:** Create `supabase/tests/seguranca.sql`, `e2e/seguranca.spec.ts`; Modify `next.config.ts`, ações que falharem.

- `seguranca.sql` (transação desfeita, mesmo formato de `etapa6.sql`): duas alunas A e B com uma linha em cada tabela que a interface cria, mentora M. Para **toda** tabela `public.cep_%` e `public.cep2027_%` lida de `information_schema.tables` (laço em `do $$`, SQL dinâmico):
  - B: `select` de linhas da organização de A = 0; `update`/`delete` de linhas de A afeta 0; `insert` com `org_id` de A é recusado.
  - M: lê ≥ 1 linha de A onde A tem linha; `update`/`delete`/`insert` afeta 0 ou é recusado (exceto `cep_profiles` da própria M).
  - anon: `select` = 0 / sem permissão em todas.
  - Funções `security definer` do esquema `public` com prefixo `cep_`: lista esperada fixa no teste; função nova não listada falha o teste.
- `get_advisors` (security): zero avisos sobre objetos `cep_`. Aviso encontrado → corrigir com migração.
- `seguranca.spec.ts`:
  - `acoes-com-id-alheio`: aluna A chama, pelo navegador logado, as ações de servidor de editar tarefa, lançar valor de KR, registrar medição e excluir ação de venda com ids da aluna B (obtidos pela API como B) → B confere pelo REST que nada mudou.
  - `cabecalhos`: resposta de `/entrar` tem `Content-Security-Policy` com `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sem câmera/microfone/geolocalização.
  - `csv-sem-sessao`: `GET /exportar/acoes` sem sessão → 401 com texto, não a página de login (ajuste deixado na Etapa 6).
- `next.config.ts`: `headers()` para `/(.*)` com os 4 cabeçalhos acima (CSP: `default-src 'self'`; `connect-src 'self'` + URL do Supabase; `img-src 'self' data: blob:`; `style-src 'self' 'unsafe-inline'`; `script-src 'self' 'unsafe-inline'`; `frame-ancestors 'none'`). Conferir que nenhuma tela quebra (suíte inteira).
- Função `cep-conta`: `Access-Control-Allow-Origin` restrito aos dois endereços do app (v2 e o endereço que vai receber a v2) em vez de `*`; testar cadastro e redefinição de senha de novo pela suíte.
- [ ] RED → corrigir → GREEN. Commit `fix: revisão de segurança (RLS em todas as tabelas, cabeçalhos, CORS)`

### Task 5: Ajustes pequenos pendentes

Itens deixados nas Etapas 4–6 que afetam quem usa. Cada um com teste que falha antes:
- `/imprimir` com erro de leitura mostra mensagem própria com "Voltar" (e2e com ciclo inexistente simulado por rota de teste não; usar teste de componente do `error.tsx` de `/imprimir`).
- Relatório impresso: um só `h1`; fechamento de 2026 com as 7 listas (teste de componente `RelatorioPlano`).
- Texto de erro da paginação não fala em "medições" (`paginar.test`).
- "Ver mais" do Histórico some ao chegar a 500 itens (teste de componente).
- Revisão: aba aberta antes de outra gravar o faturamento não regrava o valor antigo — só grava faturamento se ele mudou nesta aba (teste de `FormRevisao`).
- [ ] Commit `fix: ajustes pequenos das etapas anteriores`

### Task 6: Suíte, revisão final, publicação

- [ ] Suíte completa (unitários, `supabase/tests/*.sql`, e2e com contas admin e mentora temporárias). Revisão final do ramo por subagente; correções com teste; publicar em `cep-planejamento-v2`; apagar contas e2e; `etapa-7` no `main`.
- [ ] Mensagem para a usuária pedindo a aprovação da v2 e explicando o corte (Task 7). **Parar aqui até ela responder.**

### Task 7: Corte (só depois do "sim" da usuária)

- [ ] Antes: anotar o deploy atual de produção do projeto `cep-planejamento-2027` (para voltar atrás); conferir que `cep2027_planos` tem o mesmo número de linhas e `md5` dos dados de antes (cópia de segurança intocada).
- [ ] Passar o domínio `cep-planejamento-2027.vercel.app` do projeto da v1 para o `cep-planejamento-v2` (remover do projeto v1, adicionar no v2). Se a Vercel não permitir mover um domínio `.vercel.app`, plano B: publicar no projeto da v1 um site mínimo que redireciona (308) qualquer caminho para `https://cep-planejamento-v2.vercel.app` com o mesmo caminho — e registrar a decisão.
- [ ] Depois: `https://cep-planejamento-2027.vercel.app/entrar` mostra o login da v2; login com conta temporária funciona; uma conta criada pela v1 (origem `cep2027`, temporária) entra na v2 e ganha organização e ciclo no primeiro acesso; cadastro (`cep-conta`) funciona a partir do endereço novo (CORS); a v1 continua abrindo pelo endereço do deploy dela.
- [ ] Mensagem final: como voltar atrás (promover o deploy anotado), o que a mentora deve avisar às alunas (entrar com o mesmo e-mail e senha; quem preencheu na versão anterior clica "Importar meu planejamento" em Configurações).
