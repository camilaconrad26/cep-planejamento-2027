-- cep_excluir_minha_conta: aluna exclui a si mesma; mentora e contas de outros sistemas não. Transação desfeita no fim.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('f1f1f1f1-0000-4000-8000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f1@teste.cep', '{"origem":"cep"}', now(), now()),
 ('f2f2f2f2-0000-4000-8000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f2@teste.cep', '{"origem":"cep"}', now(), now()),
 ('f3f3f3f3-0000-4000-8000-0000000000f3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f3@teste.cep', '{}', now(), now());
select public.cep_iniciar_conta('f1f1f1f1-0000-4000-8000-0000000000f1', 'Aluna', 'f1@teste.cep');
select public.cep_iniciar_conta('f2f2f2f2-0000-4000-8000-0000000000f2', 'Mentora', 'f2@teste.cep');
insert into public.cep_roles values ('f2f2f2f2-0000-4000-8000-0000000000f2', 'mentora');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f2f2f2f2-0000-4000-8000-0000000000f2","role":"authenticated"}', true);
do $$ begin perform public.cep_excluir_minha_conta(); insert into r values ('mentora se exclui', 'negado', 'permitido');
exception when others then insert into r values ('mentora se exclui', 'negado', 'negado'); end $$;
select set_config('request.jwt.claims', '{"sub":"f3f3f3f3-0000-4000-8000-0000000000f3","role":"authenticated"}', true);
do $$ begin perform public.cep_excluir_minha_conta(); insert into r values ('conta de outro sistema se exclui', 'negado', 'permitido');
exception when others then insert into r values ('conta de outro sistema se exclui', 'negado', 'negado'); end $$;
select set_config('request.jwt.claims', '{"sub":"f1f1f1f1-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
select public.cep_excluir_minha_conta();
reset role;
insert into r select 'aluna excluída', '0', count(*)::text from auth.users where id = 'f1f1f1f1-0000-4000-8000-0000000000f1';
insert into r select 'perfil da aluna apagado', '0', count(*)::text from public.cep_profiles where user_id = 'f1f1f1f1-0000-4000-8000-0000000000f1';
insert into r select 'mentora continua', '1', count(*)::text from auth.users where id = 'f2f2f2f2-0000-4000-8000-0000000000f2';
select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
