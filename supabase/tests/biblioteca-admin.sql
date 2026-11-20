-- Biblioteca: só a admin escreve. Transação desfeita no fim.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('e1e1e1e1-0000-4000-8000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@teste.cep', '{}', now(), now()),
 ('e2e2e2e2-0000-4000-8000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alu@teste.cep', '{}', now(), now());
select public.cep_iniciar_conta('e1e1e1e1-0000-4000-8000-0000000000e1', 'Admin', 'adm@teste.cep');
select public.cep_iniciar_conta('e2e2e2e2-0000-4000-8000-0000000000e2', 'Aluna', 'alu@teste.cep');
insert into public.cep_roles values ('e1e1e1e1-0000-4000-8000-0000000000e1', 'admin');
select set_config('t.cat', id::text, true) from public.cep_categories where slug = 'comercial';
select set_config('t.estr', i.id::text, true) from public.cep_library_items i where i.category_id = current_setting('t.cat')::uuid and i.perfil = 1 and i.nivel = 'estrategico';
select set_config('t.tat', i.id::text, true) from public.cep_library_items i where i.category_id = current_setting('t.cat')::uuid and i.perfil = 1 and i.nivel = 'tatico';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e2e2e2e2-0000-4000-8000-0000000000e2","role":"authenticated"}', true);
with u as (update public.cep_library_items set texto = 'x' where id = current_setting('t.tat')::uuid returning 1) insert into r select 'aluna altera item', '0', count(*)::text from u;
do $$ begin
  insert into public.cep_library_items (category_id, perfil, nivel, texto, parent_id) values (current_setting('t.cat')::uuid, 1, 'kpi', 'x', current_setting('t.estr')::uuid);
  insert into r values ('aluna cria item', 'negado', 'permitido');
exception when others then insert into r values ('aluna cria item', 'negado', 'negado'); end $$;
with u as (update public.cep_categories set descricao = 'x' where id = current_setting('t.cat')::uuid returning 1) insert into r select 'aluna altera categoria', '0', count(*)::text from u;
with d as (delete from public.cep_library_items where id = current_setting('t.tat')::uuid returning 1) insert into r select 'aluna apaga item', '0', count(*)::text from d;

select set_config('request.jwt.claims', '{"sub":"e1e1e1e1-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
with u as (update public.cep_library_items set texto = texto || ' (teste)' where id = current_setting('t.tat')::uuid returning 1) insert into r select 'admin altera texto de item', '1', count(*)::text from u;
with u as (update public.cep_library_items set ativo = false where id = current_setting('t.tat')::uuid returning 1) insert into r select 'admin desativa item', '1', count(*)::text from u;
do $$ begin
  insert into public.cep_library_items (category_id, perfil, nivel, texto, parent_id) values (current_setting('t.cat')::uuid, 1, 'tatico', 'novo', current_setting('t.estr')::uuid);
  insert into r values ('admin cria item tático com parent', 'ok', 'ok');
exception when others then insert into r values ('admin cria item tático com parent', 'ok', 'erro'); end $$;
with u as (update public.cep_categories set descricao = descricao || '.' where id = current_setting('t.cat')::uuid returning 1) insert into r select 'admin altera descrição de categoria', '1', count(*)::text from u;
do $$ begin
  insert into public.cep_library_items (category_id, perfil, nivel, texto) values (current_setting('t.cat')::uuid, 1, 'tatico', 'sem pai');
  insert into r values ('item tático sem parent', 'negado', 'permitido');
exception when others then insert into r values ('item tático sem parent', 'negado', 'negado'); end $$;
reset role;

select verificacao, esperado, obtido, esperado = obtido as ok from r;
rollback;
