-- Excluir a conta apaga a organização pessoal e todo o planejamento. Roda em transação e desfaz.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('eeeeeeee-0000-4000-8000-00000000000e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e@teste.cep', '{}', now(), now());
select set_config('t.org', public.cep_iniciar_conta('eeeeeeee-0000-4000-8000-00000000000e', 'Aluna E', 'e@teste.cep')::text, true);
delete from auth.users where id = 'eeeeeeee-0000-4000-8000-00000000000e';
select 'organização apagada junto com a conta' as verificacao, '0' as esperado,
  (select count(*) from public.cep_organizations where id = current_setting('t.org')::uuid)::text as obtido,
  '0' = (select count(*) from public.cep_organizations where id = current_setting('t.org')::uuid)::text as ok
union all select 'ciclo apagado junto', '0', (select count(*) from public.cep_cycles where org_id = current_setting('t.org')::uuid)::text,
  '0' = (select count(*) from public.cep_cycles where org_id = current_setting('t.org')::uuid)::text;
rollback;
