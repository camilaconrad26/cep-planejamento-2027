-- Revisão final da Etapa 2: duplicatas impossíveis mesmo em corrida; KR respeita o trimestre escolhido. Transação desfeita.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('a2a2a2a2-0000-4000-8000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai2@teste.cep', '{}', now(), now());
select set_config('t.org', public.cep_iniciar_conta('a2a2a2a2-0000-4000-8000-0000000000a2', 'Aluna', 'ai2@teste.cep')::text, true);
select set_config('t.' || i.nivel::text, i.id::text, true)
  from public.cep_library_items i join public.cep_categories c on c.id = i.category_id where c.slug = 'comercial' and i.perfil = 1;
grant select on r to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a2a2a2a2-0000-4000-8000-0000000000a2","role":"authenticated"}', true);

-- Backstop da corrida entre abas: o mesmo item da biblioteca não entra duas vezes no ciclo, nem por inserção direta.
select public.cep_adicionar_item(current_setting('t.tatico')::uuid, 1::smallint);
do $$ begin
  insert into public.cep_objectives (org_id, cycle_id, category_id, library_item_id, titulo)
    select org_id, cycle_id, category_id, library_item_id, titulo from public.cep_objectives limit 1;
  insert into r values ('objetivo duplicado no ciclo', 'negado', 'permitido');
exception when unique_violation then insert into r values ('objetivo duplicado no ciclo', 'negado', 'negado'); end $$;
do $$ begin
  insert into public.cep_tasks (org_id, cycle_id, objective_id, library_item_id, nivel, titulo)
    select org_id, cycle_id, objective_id, library_item_id, nivel, titulo from public.cep_tasks limit 1;
  insert into r values ('tarefa duplicada no ciclo', 'negado', 'permitido');
exception when unique_violation then insert into r values ('tarefa duplicada no ciclo', 'negado', 'negado'); end $$;
select public.cep_adicionar_item(current_setting('t.kpi')::uuid, 1::smallint);
do $$ begin
  insert into public.cep_kpis (org_id, cycle_id, objective_id, library_item_id, nome)
    select org_id, cycle_id, objective_id, library_item_id, nome from public.cep_kpis limit 1;
  insert into r values ('KPI duplicado no ciclo', 'negado', 'permitido');
exception when unique_violation then insert into r values ('KPI duplicado no ciclo', 'negado', 'negado'); end $$;
-- A trava é por organização (itens diferentes da mesma categoria também esperam).
insert into r select 'trava por organização', 'true',
  (pg_get_functiondef('public.cep_adicionar_item(uuid,smallint)'::regprocedure) like '%hashtext(''cep_adicionar:'' || v_org::text)%')::text;

-- KR vai para um OKR do trimestre escolhido, mesmo que o objetivo já tenha OKR de outro trimestre.
insert into public.cep_okrs (org_id, cycle_id, objective_id, titulo, trimestre)
  select org_id, cycle_id, id, 'OKR do 1º', 1 from public.cep_objectives limit 1;
select public.cep_adicionar_item(current_setting('t.okr')::uuid, 3::smallint);
insert into r select 'KR no OKR do 3º trimestre', '3',
  (select o.trimestre::text from public.cep_key_results k join public.cep_okrs o on o.id = k.okr_id where k.library_item_id = current_setting('t.okr')::uuid);
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
