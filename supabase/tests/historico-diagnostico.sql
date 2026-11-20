-- O salvamento automático do diagnóstico/fechamento não deve gerar linhas de histórico. Transação desfeita no fim.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('f5f5f5f5-0000-4000-8000-0000000000f5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f5@teste.cep', '{}', now(), now());
select set_config('t.org', public.cep_iniciar_conta('f5f5f5f5-0000-4000-8000-0000000000f5', 'Aluna', 'f5@teste.cep')::text, true);
insert into public.cep_diagnostics (org_id, respostas) values (current_setting('t.org')::uuid, '{}');
update public.cep_diagnostics set fechamento_ano = '{"faturamento": 1}' where org_id = current_setting('t.org')::uuid;
update public.cep_diagnostics set fechamento_ano = '{"faturamento": 2}' where org_id = current_setting('t.org')::uuid;
select 'histórico do diagnóstico' as verificacao, '0' as esperado,
  (select count(*) from public.cep_activity where entidade = 'cep_diagnostics' and org_id = current_setting('t.org')::uuid)::text as obtido;
rollback;
