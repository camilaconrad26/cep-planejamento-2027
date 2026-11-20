-- Teste de isolamento entre alunas (RLS). Roda numa transação e desfaz tudo no fim.
-- Executar inteiro com a ferramenta execute_sql; toda linha deve ter ok = true.
begin;
create temp table r (verificacao text, esperado text, obtido text);
grant all on r to public;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('aaaaaaaa-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.cep', '{}', now(), now()),
 ('bbbbbbbb-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.cep', '{}', now(), now()),
 ('cccccccc-0000-4000-8000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@teste.cep', '{}', now(), now());
select set_config('t.org_a', public.cep_iniciar_conta('aaaaaaaa-0000-4000-8000-00000000000a', 'Aluna A', 'a@teste.cep')::text, true);
select set_config('t.org_b', public.cep_iniciar_conta('bbbbbbbb-0000-4000-8000-00000000000b', 'Aluna B', 'b@teste.cep')::text, true);
insert into r select 'iniciar_conta é idempotente', current_setting('t.org_a'),
  public.cep_iniciar_conta('aaaaaaaa-0000-4000-8000-00000000000a', 'Aluna A', 'a@teste.cep')::text;
insert into public.cep_roles (user_id, papel) values ('cccccccc-0000-4000-8000-00000000000c', 'mentora');
insert into public.cep_categories (id, slug, nome, ordem) values ('dddddddd-0000-4000-8000-00000000000d', 'teste-rls', 'Teste', 99);

-- Aluna A cria dados
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}', true);
insert into public.cep_objectives (org_id, cycle_id, category_id, titulo)
  select org_id, id, 'dddddddd-0000-4000-8000-00000000000d', 'Objetivo de A' from public.cep_cycles where org_id = current_setting('t.org_a')::uuid;
insert into public.cep_tasks (org_id, cycle_id, objective_id, nivel, titulo)
  select o.org_id, o.cycle_id, o.id, 'tatico', 'Tarefa de A' from public.cep_objectives o;
insert into public.cep_diagnostics (org_id, user_id, respostas) values (current_setting('t.org_a')::uuid, 'aaaaaaaa-0000-4000-8000-00000000000a', '{"estagio": 2}');
insert into r select 'A vê o próprio ciclo 2027', '2027', (select ano::text from public.cep_cycles);
insert into r select 'A vê a própria tarefa', '1', count(*)::text from public.cep_tasks;
insert into r select 'histórico registrou a criação', '2', count(*)::text from public.cep_activity where acao = 'insert' and entidade in ('cep_objectives', 'cep_tasks');
reset role;

-- Aluna B tenta ler e alterar os dados de A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-00000000000b","role":"authenticated"}', true);
insert into r select 'B vê ciclos de A', '0', count(*)::text from public.cep_cycles where org_id = current_setting('t.org_a')::uuid;
insert into r select 'B vê objetivos de A', '0', count(*)::text from public.cep_objectives;
insert into r select 'B vê tarefas de A', '0', count(*)::text from public.cep_tasks;
insert into r select 'B vê perfil de A', '0', count(*)::text from public.cep_profiles where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a';
insert into r select 'B vê histórico de A', '0', count(*)::text from public.cep_activity where org_id = current_setting('t.org_a')::uuid;
with u as (update public.cep_tasks set titulo = 'x' returning 1) insert into r select 'B altera tarefa de A', '0', count(*)::text from u;
insert into r select 'B vê diagnóstico de A', '0', count(*)::text from public.cep_diagnostics where org_id = current_setting('t.org_a')::uuid;
with u as (update public.cep_diagnostics set respostas = '{}' where org_id = current_setting('t.org_a')::uuid returning 1) insert into r select 'B altera diagnóstico de A', '0', count(*)::text from u;
with d as (delete from public.cep_diagnostics where org_id = current_setting('t.org_a')::uuid returning 1) insert into r select 'B apaga diagnóstico de A', '0', count(*)::text from d;
with u as (update public.cep_organizations set nome = 'x' where id = current_setting('t.org_a')::uuid returning 1) insert into r select 'B renomeia organização de A', '0', count(*)::text from u;
insert into r select 'B vê filiações de A', '0', count(*)::text from public.cep_organization_members where org_id = current_setting('t.org_a')::uuid;
insert into public.cep_tasks (org_id, cycle_id, nivel, titulo) select org_id, id, 'tatico', 'Tarefa de B' from public.cep_cycles where org_id = current_setting('t.org_b')::uuid;
do $$ begin
  update public.cep_tasks set org_id = current_setting('t.org_a')::uuid where titulo = 'Tarefa de B';
  insert into r values ('B move a própria tarefa para a organização de A', 'negado', 'permitido');
exception when others then insert into r values ('B move a própria tarefa para a organização de A', 'negado', 'negado'); end $$;
do $$ begin
  insert into public.cep_organization_members (org_id, user_id) values (current_setting('t.org_a')::uuid, 'bbbbbbbb-0000-4000-8000-00000000000b');
  insert into r values ('B se filia à organização de A', 'negado', 'permitido');
exception when others then insert into r values ('B se filia à organização de A', 'negado', 'negado'); end $$;
with d as (delete from public.cep_objectives returning 1) insert into r select 'B apaga objetivo de A', '0', count(*)::text from d;
do $$ begin
  insert into public.cep_tasks (org_id, cycle_id, nivel, titulo)
    select current_setting('t.org_a')::uuid, c.id, 'tatico', 'intrusa' from public.cep_cycles c limit 1;
  insert into r values ('B insere tarefa na organização de A', 'negado', 'permitido');
exception when others then insert into r values ('B insere tarefa na organização de A', 'negado', 'negado'); end $$;
do $$ declare ciclo_a uuid; begin
  reset role; select id into ciclo_a from public.cep_cycles where org_id = current_setting('t.org_a')::uuid; set local role authenticated;
  insert into public.cep_tasks (org_id, cycle_id, nivel, titulo) values (current_setting('t.org_b')::uuid, ciclo_a, 'tatico', 'pendurada');
  insert into r values ('B pendura tarefa no ciclo de A', 'negado', 'permitido');
exception when others then insert into r values ('B pendura tarefa no ciclo de A', 'negado', 'negado'); end $$;
do $$ begin
  insert into public.cep_library_items (category_id, perfil, nivel, texto) values ('dddddddd-0000-4000-8000-00000000000d', 1, 'estrategico', 'x');
  insert into r values ('B escreve na biblioteca', 'negado', 'permitido');
exception when others then insert into r values ('B escreve na biblioteca', 'negado', 'negado'); end $$;
do $$ begin
  insert into public.cep_roles (user_id, papel) values ('bbbbbbbb-0000-4000-8000-00000000000b', 'admin');
  insert into r values ('B se dá papel de admin', 'negado', 'permitido');
exception when others then insert into r values ('B se dá papel de admin', 'negado', 'negado'); end $$;
do $$ begin
  perform public.cep_garantir_ciclo(current_setting('t.org_a')::uuid, 2027);
  insert into r values ('B chama garantir_ciclo na organização de A', 'negado', 'permitido');
exception when others then insert into r values ('B chama garantir_ciclo na organização de A', 'negado', 'negado'); end $$;
do $$ begin
  perform public.cep_iniciar_conta('bbbbbbbb-0000-4000-8000-00000000000b', 'x', 'x');
  insert into r values ('B chama iniciar_conta', 'negado', 'permitido');
exception when others then insert into r values ('B chama iniciar_conta', 'negado', 'negado'); end $$;
insert into r select 'B garante o próprio ciclo', current_setting('t.org_b'),
  (select org_id::text from public.cep_cycles where id = public.cep_garantir_ciclo(current_setting('t.org_b')::uuid, 2027));
reset role;

-- Mentora lê tudo e não altera nada
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000c","role":"authenticated"}', true);
insert into r select 'mentora vê tarefas de A', '1', count(*)::text from public.cep_tasks where org_id = current_setting('t.org_a')::uuid;
insert into r select 'mentora vê perfis', '2', count(*)::text from public.cep_profiles where email like '%@teste.cep';
with u as (update public.cep_tasks set titulo = 'x' returning 1) insert into r select 'mentora altera tarefa', '0', count(*)::text from u;
with d as (delete from public.cep_tasks returning 1) insert into r select 'mentora apaga tarefa', '0', count(*)::text from d;
insert into r select 'mentora vê diagnóstico de A', '1', count(*)::text from public.cep_diagnostics where org_id = current_setting('t.org_a')::uuid;
reset role;

-- Visitante sem login
set local role anon;
do $$ begin
  perform count(*) from public.cep_tasks;
  insert into r values ('anônimo lê tarefas', 'negado', 'permitido');
exception when others then insert into r values ('anônimo lê tarefas', 'negado', 'negado'); end $$;
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
