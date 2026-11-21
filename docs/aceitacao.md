# Critérios de aceitação → testes

Cada critério da especificação (§11) e o teste que o prova. `e2e/` roda no navegador (Playwright); `supabase/tests/` roda no banco, numa transação desfeita; `lib/domain/__tests__/` são as regras puras.

## Da especificação da usuária

| Critério | Teste |
|---|---|
| O usuário consegue criar uma conta e acessar o sistema | `e2e/autenticacao.spec.ts` › cadastro-e-login; `e2e/aceitacao.spec.ts` › jornada-completa |
| O diagnóstico funciona | `e2e/diagnostico.spec.ts` › resumo-e-perfil, retoma-diagnostico; `lib/domain/__tests__/diagnostico.test.ts` |
| O perfil influencia o conteúdo apresentado | `e2e/biblioteca.spec.ts` › abre-pelo-menu-no-perfil-1-com-aviso; `lib/domain/__tests__/biblioteca.test.ts` (padrão é o perfil da aluna); jornada-completa (Perfil 3 confirmado → Biblioteca no Perfil 3) |
| A biblioteca apresenta os conteúdos originais | `e2e/biblioteca-admin.spec.ts` › nao-deixa-rastro-na-biblioteca; conferência de 105 itens e `md5` dos textos depois de cada suíte |
| O usuário consegue selecionar e editar ações | `e2e/biblioteca.spec.ts` › adiciona-tarefa-e-objetivo-entra-junto; `e2e/plano-de-acao.spec.ts` › editar-e-ordenar |
| O planejamento é salvo no Supabase | jornada-completa (sai, entra de novo e confere ação, metas e revisão) |
| As ações selecionadas aparecem na execução | `e2e/planejamento.spec.ts` › item-da-biblioteca-aparece-na-arvore; jornada-completa |
| Os filtros funcionam | `e2e/plano-de-acao.spec.ts` › busca-e-filtros; `e2e/biblioteca.spec.ts` › filtra-por-categoria-e-nivel; `lib/domain/__tests__/acoes.test.ts` |
| O Kanban permite movimentações | `e2e/plano-de-acao.spec.ts` › kanban-arrastar, kanban-teclado |
| Prazos e status são atualizados corretamente | `e2e/plano-de-acao.spec.ts` › editar-e-ordenar, editar-concluida-mantem-data; `lib/domain/__tests__/ciclo.test.ts` (atraso) |
| Os indicadores refletem dados reais | `e2e/visao-geral.spec.ts` › depois-do-diagnostico-e-tarefa; `e2e/resultados.spec.ts` › okr-e-kr, kpi-e-medicoes; jornada-completa (Execução 100%) |
| A revisão trimestral gera histórico | `e2e/revisao.spec.ts` › revisao; `e2e/historico.spec.ts` › historico-e-exportacao; jornada-completa |
| A aplicação funciona em dispositivos móveis | `e2e/celular.spec.ts`; `e2e/navegacao.spec.ts` › gaveta-celular |
| Os dados estão protegidos por políticas de acesso | `supabase/tests/rls.sql`, `supabase/tests/seguranca.sql`; `e2e/seguranca.spec.ts` |

## Acrescentados

| Critério | Teste |
|---|---|
| Os dados da v1 migrados | `e2e/importar-v1.spec.ts` › importar-v1; `lib/domain/__tests__/v1.test.ts` |
| A mentora vê todas as alunas e não altera nada | `e2e/mentora.spec.ts` › lista-detalhe-e-senha; `supabase/tests/etapa6.sql`; `supabase/tests/seguranca.sql` |
| Uma aluna não lê nem altera dados de outra (banco, duas contas) | `supabase/tests/rls.sql`; `supabase/tests/seguranca.sql` (todas as tabelas) |
| O app funciona a 390 px e com "Texto maior" | `e2e/celular.spec.ts` › sem-rolagem-horizontal; `e2e/navegacao.spec.ts` › texto-maior-e-pular |

## Fora dos testes automáticos

- Atraso na jornada: até 31/12/2026 o app está em fase de planejamento e o atraso não dispara (spec §10); a regra é provada em `lib/domain/__tests__/ciclo.test.ts`.
