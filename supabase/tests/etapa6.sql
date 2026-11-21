-- Etapa 6: revisões isoladas por aluna, mentora só lê, importação v1 lê só o próprio plano. Transação desfeita.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('a6a6a6a6-0000-4000-8000-0000000000a6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a6@teste.cep', '{}', now(), now()),
 ('b6b6b6b6-0000-4000-8000-0000000000b6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b6@teste.cep', '{}', now(), now()),
 ('c6c6c6c6-0000-4000-8000-0000000000c6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c6@teste.cep', '{}', now(), now());
select set_config('t.org_a', public.cep_iniciar_conta('a6a6a6a6-0000-4000-8000-0000000000a6', 'Aluna A', 'a6@teste.cep')::text, true);
select public.cep_iniciar_conta('b6b6b6b6-0000-4000-8000-0000000000b6', 'Aluna B', 'b6@teste.cep');
select public.cep_iniciar_conta('c6c6c6c6-0000-4000-8000-0000000000c6', 'Mentora', 'c6@teste.cep');
insert into public.cep_roles values ('c6c6c6c6-0000-4000-8000-0000000000c6', 'mentora');
insert into public.cep2027_planos (user_id, nome, email, dados) values ('a6a6a6a6-0000-4000-8000-0000000000a6', 'Aluna A', 'a6@teste.cep', '{"perfil": 2}');
grant select on r to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a6a6a6a6-0000-4000-8000-0000000000a6","role":"authenticated"}', true);
insert into public.cep_reviews (org_id, cycle_id, trimestre, respostas)
  select org_id, id, 1, '{"executado": "Tudo"}' from public.cep_cycles where org_id = current_setting('t.org_a')::uuid;
insert into r select 'A grava a própria revisão', '1', count(*)::text from public.cep_reviews;
do $$ begin
  insert into public.cep_reviews (org_id, cycle_id, trimestre) select org_id, cycle_id, 1 from public.cep_reviews limit 1;
  insert into r values ('segunda revisão do mesmo trimestre', 'negado', 'permitido');
exception when unique_violation then insert into r values ('segunda revisão do mesmo trimestre', 'negado', 'negado'); end $$;
with u as (update public.cep_profiles set importado_v1_em = now() where user_id = 'a6a6a6a6-0000-4000-8000-0000000000a6' returning 1)
  insert into r select 'A marca a importação', '1', count(*)::text from u;
insert into r select 'A lê o próprio plano da v1', '1', count(*)::text from public.cep2027_planos;

select set_config('request.jwt.claims', '{"sub":"b6b6b6b6-0000-4000-8000-0000000000b6","role":"authenticated"}', true);
insert into r select 'B vê revisões de A', '0', count(*)::text from public.cep_reviews;
insert into r select 'B lê plano v1 de A', '0', count(*)::text from public.cep2027_planos where user_id = 'a6a6a6a6-0000-4000-8000-0000000000a6';
with u as (update public.cep_profiles set importado_v1_em = null where user_id = 'a6a6a6a6-0000-4000-8000-0000000000a6' returning 1)
  insert into r select 'B altera marca de A', '0', count(*)::text from u;

select set_config('request.jwt.claims', '{"sub":"c6c6c6c6-0000-4000-8000-0000000000c6","role":"authenticated"}', true);
insert into r select 'mentora lê revisão de A', '1', count(*)::text from public.cep_reviews where org_id = current_setting('t.org_a')::uuid;
with u as (update public.cep_reviews set respostas = '{}' where org_id = current_setting('t.org_a')::uuid returning 1)
  insert into r select 'mentora altera revisão de A', '0', count(*)::text from u;
insert into r select 'mentora lê histórico de A', 'true', (count(*) > 0)::text from public.cep_activity where org_id = current_setting('t.org_a')::uuid;
insert into r select 'mentora lê perfil de A com a marca', 'true', (importado_v1_em is not null)::text from public.cep_profiles where user_id = 'a6a6a6a6-0000-4000-8000-0000000000a6';
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
