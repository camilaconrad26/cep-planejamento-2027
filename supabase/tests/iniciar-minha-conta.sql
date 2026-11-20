-- Conta antiga sem perfil inicia o próprio perfil no primeiro acesso. Transação desfeita no fim.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('f4f4f4f4-0000-4000-8000-0000000000f4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f4@teste.cep', '{"nome":"Conta Antiga"}', now(), now());
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f4f4f4f4-0000-4000-8000-0000000000f4","role":"authenticated"}', true);
select set_config('t.org', public.cep_iniciar_minha_conta()::text, true);
select 'perfil criado' as verificacao, (select nome from public.cep_profiles) = 'Conta Antiga' as ok
union all select 'idempotente', public.cep_iniciar_minha_conta()::text = current_setting('t.org')
union all select 'ciclo 2027', (select count(*) from public.cep_cycles where ano = 2027) = 1;
rollback;
