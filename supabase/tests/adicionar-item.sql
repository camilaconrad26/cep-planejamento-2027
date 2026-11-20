-- cep_adicionar_item: biblioteca → plano, sem duplicar, só na própria organização. Transação desfeita no fim.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('a1a1a1a1-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai1@teste.cep', '{}', now(), now()),
 ('b1b1b1b1-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bi1@teste.cep', '{}', now(), now());
select set_config('t.org_a', public.cep_iniciar_conta('a1a1a1a1-0000-4000-8000-0000000000a1', 'Aluna A', 'ai1@teste.cep')::text, true);
select set_config('t.org_b', public.cep_iniciar_conta('b1b1b1b1-0000-4000-8000-0000000000b1', 'Aluna B', 'bi1@teste.cep')::text, true);
-- ids da biblioteca: Perfil 1, Comercial
select set_config('t.' || i.nivel::text, i.id::text, true)
  from public.cep_library_items i join public.cep_categories c on c.id = i.category_id
 where c.slug = 'comercial' and i.perfil = 1;
-- um item inativo (Perfil 1, Método, tático)
select set_config('t.inativo', i.id::text, true)
  from public.cep_library_items i join public.cep_categories c on c.id = i.category_id
 where c.slug = 'metodo' and i.perfil = 1 and i.nivel = 'tatico';
update public.cep_library_items set ativo = false where id = current_setting('t.inativo')::uuid;
grant select on r to authenticated, anon;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1a1a1a1-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select set_config('t.r1', public.cep_adicionar_item(current_setting('t.tatico')::uuid, 2::smallint)::text, true);
insert into r values ('A adiciona tático: tarefa criada', 'tarefa', current_setting('t.r1')::jsonb->>'criado');
insert into r values ('objetivo entrou junto', 'true', current_setting('t.r1')::jsonb->>'objetivo_criado');
insert into r select '1 objetivo comercial no plano', '1', count(*)::text from public.cep_objectives where library_item_id = current_setting('t.estrategico')::uuid;
insert into r select 'tarefa no 2º trimestre ligada ao objetivo', '2|true', (select trimestre::text || '|' || (objective_id is not null)::text from public.cep_tasks where library_item_id = current_setting('t.tatico')::uuid);
insert into r values ('A adiciona o mesmo tático de novo', 'true', public.cep_adicionar_item(current_setting('t.tatico')::uuid, 2::smallint)->>'ja_no_plano');
insert into r select 'continua 1 tarefa', '1', count(*)::text from public.cep_tasks where library_item_id = current_setting('t.tatico')::uuid;
insert into r values ('A adiciona operacional: objetivo não duplica', 'false', public.cep_adicionar_item(current_setting('t.operacional')::uuid, 1::smallint)->>'objetivo_criado');
insert into r select 'objetivos', '1', count(*)::text from public.cep_objectives;
insert into r values ('A adiciona OKR', 'kr', public.cep_adicionar_item(current_setting('t.okr')::uuid, 1::smallint)->>'criado');
insert into r select 'A tem 1 okr e 1 kr com alvo vazio', '1|1|null', (select count(*) from public.cep_okrs)::text || '|' || (select count(*) from public.cep_key_results)::text || '|' || coalesce((select alvo::text from public.cep_key_results limit 1), 'null');
insert into r values ('A adiciona OKR de novo', 'true', public.cep_adicionar_item(current_setting('t.okr')::uuid, 1::smallint)->>'ja_no_plano');
insert into r values ('A adiciona KPI', 'kpi', public.cep_adicionar_item(current_setting('t.kpi')::uuid, 1::smallint)->>'criado');
insert into r values ('A adiciona estratégico já presente', 'true', public.cep_adicionar_item(current_setting('t.estrategico')::uuid, 1::smallint)->>'ja_no_plano');
do $$ begin perform public.cep_adicionar_item(current_setting('t.tatico')::uuid, 5::smallint); insert into r values ('trimestre 5', 'negado', 'permitido');
exception when others then insert into r values ('trimestre 5', 'negado', 'negado'); end $$;
do $$ begin perform public.cep_adicionar_item(current_setting('t.inativo')::uuid, 1::smallint); insert into r values ('item inativo', 'negado', 'permitido');
exception when others then insert into r values ('item inativo', 'negado', 'negado'); end $$;

select set_config('request.jwt.claims', '{"sub":"b1b1b1b1-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select set_config('t.rb', public.cep_adicionar_item(current_setting('t.tatico')::uuid, 3::smallint)::text, true);
insert into r values ('B adiciona: cria na organização de B', current_setting('t.org_b'),
  (select org_id::text from public.cep_tasks where id = (current_setting('t.rb')::jsonb->>'id')::uuid));
insert into r values ('B não viu o item como já no plano', 'false', current_setting('t.rb')::jsonb->>'ja_no_plano');
insert into r select 'B vê tarefas de A', '0', count(*)::text from public.cep_tasks where org_id = current_setting('t.org_a')::uuid;
reset role;

set local role anon;
do $$ begin perform public.cep_adicionar_item(current_setting('t.tatico')::uuid, 1::smallint); insert into r values ('anon chama a função', 'negado', 'permitido');
exception when others then insert into r values ('anon chama a função', 'negado', 'negado'); end $$;
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
