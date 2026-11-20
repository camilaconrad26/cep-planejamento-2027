# Planejamento Estratégico CEP — versão 2 (design)

Data: 2026-11-20 · Status: aguardando aprovação

## 1. Intenção

Transformar o planejamento estratégico do CEP (template do Notion "Planejamento Estratégico | CEP" + planilha "CONRAD - Planejamento Anual") num aplicativo web que conduza a advogada do diagnóstico à execução e à revisão, como um consultor de gestão. O uso é **gratuito, para as alunas do CEP**: não haverá venda, cobrança nem planos.

Sucesso: a aluna cria conta sozinha, entende o que fazer a cada momento ("seu próximo passo"), transforma itens da biblioteca em ações com prazo, acompanha execução e resultados, e revisa cada trimestre com histórico. A mentora acompanha as alunas.

## 2. Objetivos, não objetivos e anti-objetivos

**Objetivos**
- Os 9 módulos do menu (seção 5), todos funcionando de verdade.
- Personalização por perfil (1 Estruturação, 2 Consolidação, 3 Escala).
- Ligação explícita Estratégico → Tático → Operacional → OKR/KR → KPI.
- Separar progresso de execução (tarefas) de progresso de resultado (KRs/KPIs).
- Dados relacionais no Supabase com RLS.
- Migrar os planejamentos já preenchidos no site atual.

**Não objetivos (v2)**
- Cobrança, planos, checkout, integração com Kiwify.
- Equipe com login: o responsável é um nome digitado.
- Avisos por e-mail ou push: avisos só dentro do sistema.
- IA generativa: o "próximo passo" é calculado por regras.
- Aplicativo nativo: é web responsivo.

**Anti-objetivos (falharia mesmo funcionando)**
- Parecer uma planilha ou uma cópia do Notion.
- Trocar o conteúdo original do CEP por sugestões genéricas.
- Marcar resultado como atingido só porque as tarefas foram concluídas.
- Telas carregadas: excesso de cartões, gradientes e gráficos decorativos.
- Uma aluna conseguir ver ou alterar dados de outra.

## 3. Restrições

- **Identidade visual:** a do site cep.protecaofamiliaempresa.com, já aplicada na v1. Fundo #0b0b0d com brilho dourado em faixas de navegação e títulos; área de trabalho em papel #fbf8f1; dourado #e8c766 só sobre escuro e #7a6022 como dourado de texto sobre claro; Georgia/Gelasio 700 em títulos e Calibri/Carlito no corpo; botões em pílula; selo oficial (`cep-selo.webp`). Contraste mínimo AA.
- **Supabase:** projeto existente "Escritório Camila Conrad" (`kerssctooyqryzofbrzd`). A conta gratuita está no limite de projetos e não haverá venda. Todas as tabelas novas usam o prefixo `cep_`. As tabelas do escritório e a trava de e-mails da equipe na função de cadastro devem ser preservadas.
- **Hospedagem:** Vercel, projeto `cep-planejamento-2027` (equipe do escritório).
- **Cadastro:** aberto, sem confirmação de e-mail, pela função `cep2027-conta` (a ser renomeada ou estendida). Ela recusa e-mails de `crm_equipe`, `painel_equipe` e `kyron_admins`. A conta contato@protecaofamiliaempresa.com é a mentora.
- **Repositório:** novo repositório GitHub da usuária, cujo nome está pendente. Todo o código vai para lá.
- **Idioma:** português do Brasil em toda a interface.

## 4. Abordagens consideradas

| Abordagem | Prós | Contras |
|---|---|---|
| **A. Reconstruir em Next.js + TypeScript + Tailwind + Supabase relacional** (escolhida) | Componentes reutilizáveis, tipos, testes; suporta Kanban, calendário, gráficos e biblioteca editável | Mais trabalho no início; exige migração dos dados atuais |
| B. Evoluir o site atual (JavaScript puro, 1 linha JSON por aluna) | Entrega antes | Não sustenta tarefas relacionadas, medições e histórico; manutenção piora com 9 módulos |
| C. Next.js mantendo o JSON único por aluna | Migração trivial | Sem RLS por entidade, sem consultas e indicadores reais; contraria o pedido de modelo relacional |

A usuária escolheu A.

## 5. Navegação e módulos

Menu lateral no desktop; no celular, gaveta com botão de menu. Ordem:

1. **Visão geral:** saudação, perfil, ciclo e trimestre atuais, categorias prioritárias, ações em andamento, atrasadas e próximas (7 dias), % de execução, resumo de KRs/KPIs e o bloco "Seu próximo passo estratégico" com um atalho.
2. **Meu diagnóstico:** as 10 perguntas abaixo (texto da especificação da usuária), uma por tela, editáveis e com opção de pular. Ao final:
   - perfil sugerido, que a aluna confirma;
   - resumo com pontos fortes, pontos de atenção e prioridades sugeridas;
   - "Fechamento do ano anterior": faturamento, meta, contratos, origem dos clientes, nota 0–10 por categoria, pendências com destino (levar, delegar, encerrar), o que deu certo e o que não deu, parar/continuar/começar.

   O diagnóstico nunca bloqueia o restante do app.

   Perguntas:
   1. Em qual estágio está seu escritório? (início na área patrimonial · autônoma com casos · escritório com equipe e carteira)
   2. Há quanto tempo atua com planejamento patrimonial?
   3. Quantos projetos patrimoniais já conduziu?
   4. Trabalha sozinho ou possui equipe?
   5. Quais são os principais serviços oferecidos?
   6. Como chegam atualmente seus clientes?
   7. Possui processos comerciais estruturados?
   8. Possui controle financeiro?
   9. Possui método próprio de atendimento?
   10. Quais são seus principais desafios atualmente?

   As perguntas 1–4 e 7–9 são de escolha (com opção "outro"); 5, 6 e 10 aceitam várias escolhas mais texto livre. As opções ficam a cargo do builder, em linguagem do CEP.
3. **Planejamento estratégico:** ciclo anual com 4 trimestres e visão semestral agrupando 1–2 e 3–4. Categorias prioritárias por trimestre (até 3; a 4ª pede confirmação). Árvore de objetivos por categoria (Estratégico → Tático → Operacional) com OKR e KPI ligados. Criação de itens próprios.
4. **Biblioteca de estratégias:** 7 categorias com descrição e objetivo; itens filtráveis por perfil (padrão: o da aluna), categoria e nível; "Adicionar ao meu plano" escolhendo o trimestre. Admins editam a biblioteca.
5. **Plano de ação:** quatro visões sobre as mesmas tarefas.
   - Tabela: item, categoria, nível, responsável, prioridade, status, início, prazo, progresso; com ordenação e filtros.
   - Kanban em 3 colunas de status, arrastável e também operável por teclado ou menu; atraso aparece como destaque no cartão e como filtro.
   - Calendário por mês, semana e dia.
   - Prioridades: vencidas, vencendo em até 7 dias, prioridade alta.

   Busca por texto e filtros por categoria, nível, trimestre e status.
6. **Metas e indicadores:**
   - Metas financeiras da planilha: anual e por trimestre em 3 alturas (meta, super meta, mega meta) para faturamento, lucratividade %, investimento em anúncios % e time; produtos estrela (entrada, principal, alto valor) com ticket e quantidade por altura; ações de vendas por mês; realizado por trimestre.
   - OKRs com KRs e lançamento de valor.
   - KPIs com medições datadas.
   - Gráficos simples, mensais e trimestrais, e comparação com o ciclo anterior.
7. **Revisão estratégica:** por trimestre, as perguntas "O que foi executado?", "O que não foi executado?", "Quais resultados foram alcançados?", "O que impediu a execução?", "Quais estratégias funcionaram?", "Quais precisam ser alteradas?" e "O que será prioridade no próximo ciclo?", mais o faturamento realizado. Ao concluir, salva um relatório com um retrato dos indicadores naquele momento e o comparativo com a revisão anterior.
8. **Histórico:** ciclos arquivados, comparação entre ciclos, relatórios de revisão e registro de alterações.
9. **Configurações:** nome, perfil, troca de senha, "Texto maior", exportar (PDF via página de impressão própria e planilha CSV), excluir conta. Admins têm "Editar biblioteca".

Mentora (papel `mentora`): item extra no menu, "Alunas", com a lista, o progresso e a abertura do planejamento de cada uma em modo somente leitura; também redefine senha provisória de alunas. É o comportamento atual da v1.

## 6. Conteúdo da biblioteca

Fonte canônica: os **105 itens da base "Itens de Planejamento | CEP" do Notion** (`collection://c9badc1f-a647-4f4d-92bf-eaa16c508e59`), já transcritos em `dados.js` da v1. São 3 perfis × 7 categorias × 5 níveis, e o texto é cadastrado sem alteração. O resumo da seção 4 da especificação é só referência; quando diverge, vale o Notion.

Relação entre níveis: em cada (perfil, categoria), o item Estratégico é o objetivo; Tático, Operacional, OKR e KPI apontam para ele (`parent_id`). O item de nível OKR já é escrito como KR ("KR: ..."). No plano da aluna, ele vira um KR ligado ao objetivo estratégico, sem criar um texto de objetivo novo.

Descrições das 7 categorias: rascunho do builder em linguagem do CEP, marcado para revisão da usuária.

## 7. Modelo de dados (prefixo `cep_`)

**Biblioteca (global, leitura para autenticados, escrita para admin)**
- `cep_categories`: id, slug, nome, descricao, objetivo, ordem.
- `cep_library_items`: id, category_id, perfil (1–3), nivel (1 estratégico … 5 kpi), texto, parent_id, ordem, ativo.

**Pessoas e acesso**
- `cep_profiles`: user_id (PK → auth.users), nome, email, perfil, texto_maior.
- `cep_roles`: user_id, papel (`mentora` | `admin`). Uma pessoa pode ter os dois papéis; sem linha, é aluna. `mentora` lê todas as alunas e redefine senha provisória; `admin` edita a biblioteca. Papéis são atribuídos só por SQL ou migração, nunca pela interface. Na migração, quem está em `cep2027_mentoras` (hoje só contato@protecaofamiliaempresa.com) recebe `mentora` e `admin`.
- `cep_organizations` e `cep_organization_members` (org_id, user_id, papel): na v2 cada aluna tem uma organização pessoal, criada no cadastro. Isso deixa pronto o caminho para equipes, sem expor nada na interface.

**Planejamento (todas com org_id)**
- `cep_diagnostics`: respostas jsonb, perfil_sugerido, resumo jsonb, fechamento_ano jsonb, concluido_em; guarda versões.
- `cep_cycles`: ano, status (`ativo` | `arquivado`), duplicado_de.
- `cep_cycle_priorities`: cycle_id, trimestre, category_id, excedente (bool).
- `cep_objectives`: cycle_id, category_id, library_item_id null, titulo, descricao, trimestre.
- `cep_tasks`: cycle_id, objective_id, library_item_id null, nivel (tático | operacional | estratégico avulso), titulo, responsavel (texto), prioridade (baixa | média | alta), status (`nao_iniciado` | `em_andamento` | `concluido`), data_inicio, prazo, concluido_em, trimestre, arquivado.
- `cep_okrs`: objective_id, titulo, trimestre.
- `cep_key_results`: okr_id, library_item_id null, descricao, unidade, valor_inicial, alvo, valor_atual, prazo.
- `cep_kpis`: cycle_id, objective_id null, library_item_id null, nome, unidade, sentido (maior | menor é melhor), meta.
- `cep_kpi_measurements`: kpi_id, data, valor, nota.
- `cep_financial_goals`: cycle_id, trimestre null (= anual), altura (meta | super | mega), faturamento, lucratividade, anuncios, time.
- `cep_products`: cycle_id, tipo (entrada | principal | alto_valor), nome, ticket, vendas_meta, vendas_super, vendas_mega.
- `cep_sales_actions`: cycle_id, mes, produto, acao, ticket, quantidade, responsavel.
- `cep_quarter_results`: cycle_id, trimestre, faturamento_realizado.
- `cep_reviews`: cycle_id, trimestre, respostas jsonb, retrato jsonb, concluida_em.
- `cep_activity`: org_id, user_id, entidade, entidade_id, acao, antes jsonb, depois jsonb, em. Preenchida por gatilhos no banco.

A especificação listava `users`, `user_selected_items`, `action_plans` e `task_assignments`. Saíram porque `auth.users` já existe, a origem fica em `library_item_id` e o responsável é texto.

**Cadastro**
Nova função `cep-conta`, separada da `cep2027-conta`, que a v1 continua usando sem alteração. Ela tem o mesmo comportamento:
- cria o usuário já confirmado, com `user_metadata.origem = "cep"`;
- recusa e-mails presentes em `crm_equipe`, `painel_equipe` ou `kyron_admins`;
- cria o perfil e a organização pessoal;
- na ação "redefinir", aceita só quem tem papel `mentora` e só para contas com origem `cep` ou `cep2027`.

O código da `cep2027-conta` está publicado no Supabase (Edge Functions) e serve de referência.

**RLS**
- Tabelas de planejamento: leitura e escrita só para membros da organização, via função `security definer` com `search_path` vazio.
- Mentora: leitura de todas as organizações, sem escrita.
- Biblioteca: leitura para autenticados; escrita só para `papel = admin`.
- `cep_activity`: só leitura para membros.
- Nenhuma regra de acesso depende da interface.

## 8. Regras de negócio

- **Atraso:** prazo < hoje (fuso America/Sao_Paulo) e status ≠ concluído. É calculado, nunca gravado. Destaque visual em todas as visões.
- **% de execução** do trimestre ou ciclo: tarefas concluídas ÷ tarefas não arquivadas.
- **Progresso de KR:** (atual − inicial) ÷ (alvo − inicial), limitado a 0–100%. Atingido em 100%.
- **KPI:** a última medição comparada com a meta, conforme o sentido.
- **Execução e resultado** são mostrados sempre separados.
- **Prioridades:** até 3 categorias por trimestre; a 4ª e as seguintes só com confirmação, gravadas com `excedente = true`.
- **Itens da biblioteca:**
  - Adicionar um item cria o registro correspondente no ciclo ativo:
    - Estratégico → objetivo;
    - Tático ou Operacional → tarefa;
    - OKR → KR, sob um OKR do objetivo;
    - KPI → KPI.
  - Se o objetivo estratégico da categoria ainda não estiver no plano, ele entra junto.
  - Tudo continua editável.
- **Concluídas:** nunca somem; saem das visões ativas por filtro e ficam no histórico.
- **Novo ciclo:** duplicar copia objetivos, tarefas (sem status e sem datas), OKRs/KRs (sem valor atual), KPIs (sem medições) e metas; o ciclo antigo fica `arquivado`. Só um ciclo `ativo` por organização.
- **Próximo passo estratégico:** a primeira regra verdadeira, em ordem:
  1. diagnóstico não iniciado;
  2. trimestre atual sem categorias;
  3. categoria prioritária sem nenhuma ação;
  4. existem ações atrasadas;
  5. KR ou KPI sem medição há 30 dias;
  6. trimestre anterior sem revisão;
  7. ações vencendo em 7 dias;
  8. tudo em dia.

  Cada regra traz um texto e um atalho.
- **Diagnóstico → perfil sugerido:** regra determinística sobre as respostas 1, 3 e 4 (estágio, projetos conduzidos, equipe). Fica a cargo do builder, documentada em teste. A aluna sempre confirma.

## 9. Migração da v1

Script único executado no corte para a v2, antes de abrir o endereço para as alunas. Como a v2 só fica pública depois disso, não há mesclagem com dados criados na v2. Casos que o mapeamento abaixo não cobre:
- **Itens próprios (`custom`):** os de nível Estratégico viram objetivos. Os demais ficam sob o objetivo estratégico da categoria no perfil da aluna; se ele não estiver no plano, é criado a partir da biblioteca.
- **Itens OKR marcados:** viram KR com valor inicial, alvo e unidade vazios. O KR sem números aparece como "sem meta numérica" e fica fora do cálculo de progresso até ser preenchido. Por isso esses campos aceitam vazio.
- **Pendências "Levar para 2027":** viram tarefas no trimestre escolhido, com status concluído se marcadas como feitas e não iniciado caso contrário.
- **Itens de um perfil que a aluna deixou:** são migrados normalmente, apontando para o item daquele perfil na biblioteca.

As linhas de `cep2027_planos.dados` viram registros da v2 no primeiro login, ou por um script único. O mapeamento é:

| Campo da v1 | Destino na v2 |
|---|---|
| perfil | perfil |
| retro.* | `fechamento_ano` do diagnóstico |
| itens marcados "Fazer" e itens próprios | objetivos, tarefas, KRs e KPIs no ciclo 2027, com trimestre, prazo e status |
| metas.* | metas financeiras e produtos |
| vendas | ações de vendas |
| tri[q].realizado | `cep_quarter_results` |
| tri[q] (aprendizado e ajustes) | revisão daquele trimestre, se houver texto |
| tri[q].ritual | sem destino, porque a conferência vira o fluxo de revisão |

A v1 fica no ar até a v2 ser aprovada. Depois, o endereço atual passa a servir a v2 e as tabelas `cep2027_*` ficam só como cópia de segurança.

## 10. Etapas

| Etapa | Entrega |
|---|---|
| 0 | Repositório, Next.js com a identidade do CEP, esquema, RLS e biblioteca semeada |
| 1 | Cadastro e login, diagnóstico, perfis, Visão geral |
| 2 | Biblioteca com filtros e edição pela admin |
| 3 | Ciclos, prioridades, objetivos, árvore dos níveis, metas financeiras |
| 4 | Tabela, Kanban, calendário, prioridades, busca |
| 5 | OKRs, KRs, KPIs, medições, gráficos |
| 6 | Revisão, relatório, histórico, comparação, exportação, migração da v1, painel da mentora |
| 7 | Testes ponta a ponta, celular, acessibilidade, revisão de segurança |

Cada etapa é publicada num projeto Vercel separado, `cep-planejamento-v2`, ligado ao novo repositório. O projeto `cep-planejamento-2027` continua servindo a v1 sem mudança. No corte, depois da migração, o endereço `cep-planejamento-2027.vercel.app` passa para o projeto da v2.

**Ciclo e trimestre atual:** o ciclo 2027 vai de 1/jan a 31/dez/2027. Antes de 1/jan, o app está em "fase de planejamento": o trimestre atual é o 1º; as regras de atraso e de "trimestre anterior sem revisão" não disparam; o próximo passo prioriza diagnóstico, prioridades e ações do 1º trimestre. Não existe ciclo 2026; o ano de 2026 aparece só como fechamento do ano anterior, dentro do diagnóstico.

## 11. Critérios de aceitação

Da especificação da usuária:
- o usuário consegue criar uma conta e acessar o sistema;
- o diagnóstico funciona;
- o perfil influencia o conteúdo apresentado;
- a biblioteca apresenta os conteúdos originais;
- o usuário consegue selecionar e editar ações;
- o planejamento é salvo no Supabase;
- as ações selecionadas aparecem na execução;
- os filtros funcionam;
- o Kanban permite movimentações;
- prazos e status são atualizados corretamente;
- os indicadores refletem dados reais;
- a revisão trimestral gera histórico;
- a aplicação funciona em dispositivos móveis;
- os dados estão protegidos por políticas de acesso.

Acrescentados:

- os dados da v1 migrados;
- a mentora vê todas as alunas e não altera nada;
- uma aluna não lê nem altera dados de outra, verificado em teste no banco com duas contas;
- o app funciona a 390 px de largura e com "Texto maior".

## 12. Decidido pela usuária
- Reconstruir em Next.js (abordagem A).
- Cadastro aberto, sem venda.
- Código num repositório novo do GitHub (nome pendente).
- Responsável é um nome digitado.
- Avisos só dentro do sistema.

## 13. Decisões minhas (podem ser revistas)
- Ficar no projeto Supabase do escritório, com prefixo `cep_`, já que não haverá venda.
- Kanban com 3 colunas de status; "atrasado" é destaque e filtro, não coluna.
- Biblioteca = 105 itens do Notion, texto intacto.
- Item OKR do Notion = KR ligado ao objetivo estratégico.
- Retrospectiva de 2026 dentro de "Meu diagnóstico"; metas financeiras dentro de "Metas e indicadores".
- Painel da mentora mantido.
- Organização pessoal por aluna, sem interface de equipe.
- PDF pela página de impressão do navegador, sem gerador no servidor.
- Papéis em tabela própria (`cep_roles`); a mentora atual também é admin da biblioteca.
- Função de cadastro nova (`cep-conta`) ao lado da atual, sem mexer na v1.
- Regras de migração para itens próprios, OKRs sem números e pendências (seção 9).
- Projeto Vercel separado para a v2 até o corte.
- Antes de 1/jan/2027, o app fica em fase de planejamento no 1º trimestre, sem ciclo 2026.

## 14. Deixado ao builder
- Biblioteca de componentes de interface, de gráficos e de arrastar e soltar (com alternativa por teclado).
- Estrutura interna das pastas, respeitando: rotas em `app/`, componentes em `components/`, regras puras em `lib/domain/` com testes, acesso a dados em `lib/data/`, migrações em `supabase/migrations/`.
- Textos de microcopy e descrições das categorias, para revisão da usuária.
- Regra de sugestão de perfil a partir do diagnóstico.
