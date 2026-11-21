-- Prioridades do trimestre: até 3; a 4ª só com confirmação (excedente). Transação desfeita no fim.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('a3a3a3a3-0000-4000-8000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ap3@teste.cep', '{}', now(), now()),
 ('b3b3b3b3-0000-4000-8000-0000000000b3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bp3@teste.cep', '{}', now(), now()),
 ('c3c3c3c3-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cp3@teste.cep', '{}', now(), now());
select set_config('t.org_a', public.cep_iniciar_conta('a3a3a3a3-0000-4000-8000-0000000000a3', 'Aluna A', 'ap3@teste.cep')::text, true);
select public.cep_iniciar_conta('b3b3b3b3-0000-4000-8000-0000000000b3', 'Aluna B', 'bp3@teste.cep');
select public.cep_iniciar_conta('c3c3c3c3-0000-4000-8000-0000000000c3', 'Mentora', 'cp3@teste.cep');
insert into public.cep_roles values ('c3c3c3c3-0000-4000-8000-0000000000c3', 'mentora');
select set_config('t.' || slug, id::text, true) from public.cep_categories;
grant select on r to authenticated, anon;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a3a3a3a3-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
insert into r values ('1ª', 'ok', public.cep_definir_prioridade(1::smallint, current_setting('t.comercial')::uuid, false)->>'situacao');
insert into r values ('2ª', 'ok', public.cep_definir_prioridade(1::smallint, current_setting('t.metodo')::uuid, false)->>'situacao');
insert into r values ('3ª', 'ok', public.cep_definir_prioridade(1::smallint, current_setting('t.financeiro')::uuid, false)->>'situacao');
insert into r select 'três sem excedente', '3|0', count(*)::text || '|' || count(*) filter (where excedente)::text from public.cep_cycle_priorities where trimestre = 1;
insert into r values ('4ª sem confirmar pede confirmação', 'confirmar', public.cep_definir_prioridade(1::smallint, current_setting('t.operacao')::uuid, false)->>'situacao');
insert into r select 'continuam 3', '3', count(*)::text from public.cep_cycle_priorities where trimestre = 1;
select set_config('t.r4', public.cep_definir_prioridade(1::smallint, current_setting('t.operacao')::uuid, true)::text, true);
insert into r values ('4ª confirmada', 'ok|true', (current_setting('t.r4')::jsonb->>'situacao') || '|' || (current_setting('t.r4')::jsonb->>'excedente'));
insert into r select '4ª gravada como excedente', 'true', excedente::text from public.cep_cycle_priorities where category_id = current_setting('t.operacao')::uuid;
insert into r values ('repetir', 'ja_existe', public.cep_definir_prioridade(1::smallint, current_setting('t.comercial')::uuid, false)->>'situacao');
insert into r values ('outro trimestre começa do zero', 'ok|false', (select (x->>'situacao') || '|' || (x->>'excedente') from (select public.cep_definir_prioridade(2::smallint, current_setting('t.comercial')::uuid, false) x) s));
select public.cep_remover_prioridade(1::smallint, current_setting('t.operacao')::uuid);
insert into r select 'remover', '3', count(*)::text from public.cep_cycle_priorities where trimestre = 1;
do $$ begin perform public.cep_definir_prioridade(0::smallint, current_setting('t.comercial')::uuid, false); insert into r values ('trimestre 0', 'negado', 'permitido');
exception when others then insert into r values ('trimestre 0', 'negado', 'negado'); end $$;
update public.cep_cycles set meta_porque = 'Comprar a sede própria';
insert into r select 'meta_porque gravado', 'Comprar a sede própria', meta_porque from public.cep_cycles;
do $$ begin update public.cep_cycles set meta_porque = repeat('x', 2001); insert into r values ('meta_porque > 2000', 'negado', 'permitido');
exception when others then insert into r values ('meta_porque > 2000', 'negado', 'negado'); end $$;

select set_config('request.jwt.claims', '{"sub":"b3b3b3b3-0000-4000-8000-0000000000b3","role":"authenticated"}', true);
insert into r select 'B vê prioridades de A', '0', count(*)::text from public.cep_cycle_priorities where org_id = current_setting('t.org_a')::uuid;
select public.cep_remover_prioridade(1::smallint, current_setting('t.comercial')::uuid);
insert into r values ('B definiu na própria organização', 'ok', public.cep_definir_prioridade(1::smallint, current_setting('t.comercial')::uuid, false)->>'situacao');

select set_config('request.jwt.claims', '{"sub":"c3c3c3c3-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
insert into r select 'mentora vê prioridades de A', '4', count(*)::text from public.cep_cycle_priorities where org_id = current_setting('t.org_a')::uuid;
do $$ begin
  insert into public.cep_cycle_priorities (org_id, cycle_id, trimestre, category_id)
    select org_id, cycle_id, 3, category_id from public.cep_cycle_priorities where org_id = current_setting('t.org_a')::uuid limit 1;
  insert into r values ('mentora grava na organização de A', 'negado', 'permitido');
exception when others then insert into r values ('mentora grava na organização de A', 'negado', 'negado'); end $$;
reset role;
insert into r select 'A continua com 3 no 1º tri depois de B', '3', count(*)::text from public.cep_cycle_priorities where org_id = current_setting('t.org_a')::uuid and trimestre = 1;

set local role anon;
do $$ begin perform public.cep_definir_prioridade(1::smallint, current_setting('t.comercial')::uuid, false); insert into r values ('anon', 'negado', 'permitido');
exception when others then insert into r values ('anon', 'negado', 'negado'); end $$;
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
