-- Etapa 7: revisão de segurança. Percorre TODA tabela public.cep_% e public.cep2027_% (lida do catálogo,
-- não de uma lista fixa) com a aluna B, a mentora M e o anônimo, contra as linhas da aluna A.
-- Roda numa transação e desfaz tudo. Executar inteiro com execute_sql; toda linha deve ter ok = true.
begin;
create temp table r (verificacao text, esperado text, obtido text); grant all on r to public;
create temp table linhas_a (tabela text primary key, catalogo boolean, alheia boolean, predicado text, n int, exemplo jsonb, col text, cols text); grant all on linhas_a to public;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
 ('a7a7a7a7-0000-4000-8000-0000000000a7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a7@teste.cep', '{}', now(), now()),
 ('b7b7b7b7-0000-4000-8000-0000000000b7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b7@teste.cep', '{}', now(), now()),
 ('c7c7c7c7-0000-4000-8000-0000000000c7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c7@teste.cep', '{}', now(), now());
select set_config('t.org_a', public.cep_iniciar_conta('a7a7a7a7-0000-4000-8000-0000000000a7', 'Aluna A', 'a7@teste.cep')::text, true);
select public.cep_iniciar_conta('b7b7b7b7-0000-4000-8000-0000000000b7', 'Aluna B', 'b7@teste.cep');
select public.cep_iniciar_conta('c7c7c7c7-0000-4000-8000-0000000000c7', 'Mentora', 'c7@teste.cep');
insert into public.cep_roles values ('c7c7c7c7-0000-4000-8000-0000000000c7', 'mentora');

-- Uma linha da aluna A em cada tabela que a interface cria.
do $$
declare o uuid := current_setting('t.org_a')::uuid; c uuid; cat uuid; obj uuid; okr uuid; kpi uuid;
begin
  select id into c from public.cep_cycles where org_id = o;
  select id into cat from public.cep_categories order by ordem limit 1;
  insert into public.cep_objectives (org_id, cycle_id, category_id, titulo) values (o, c, cat, 'Objetivo A') returning id into obj;
  insert into public.cep_tasks (org_id, cycle_id, objective_id, nivel, titulo) values (o, c, obj, 'tatico', 'Tarefa A');
  insert into public.cep_okrs (org_id, cycle_id, objective_id, titulo) values (o, c, obj, 'OKR A') returning id into okr;
  insert into public.cep_key_results (org_id, okr_id, descricao) values (o, okr, 'KR A');
  insert into public.cep_kpis (org_id, cycle_id, objective_id, nome) values (o, c, obj, 'KPI A') returning id into kpi;
  insert into public.cep_kpi_measurements (org_id, kpi_id, data, valor) values (o, kpi, '2026-10-01', 1);
  insert into public.cep_financial_goals (org_id, cycle_id, altura, faturamento) values (o, c, 'meta', 1);
  insert into public.cep_products (org_id, cycle_id, tipo, nome) values (o, c, 'entrada', 'Produto A');
  insert into public.cep_quarter_results (org_id, cycle_id, trimestre, faturamento_realizado) values (o, c, 1, 1);
  insert into public.cep_reviews (org_id, cycle_id, trimestre, respostas) values (o, c, 1, '{"executado":"A"}');
  insert into public.cep_sales_actions (org_id, cycle_id, mes, acao) values (o, c, 1, 'Venda A');
  insert into public.cep_cycle_priorities (org_id, cycle_id, trimestre, category_id) values (o, c, 1, cat);
  insert into public.cep_diagnostics (org_id, user_id, respostas) values (o, 'a7a7a7a7-0000-4000-8000-0000000000a7', '{}');
  insert into public.cep2027_planos (user_id, nome, email, dados) values ('a7a7a7a7-0000-4000-8000-0000000000a7', 'Aluna A', 'a7@teste.cep', '{}');
end $$;

-- Retrato (como superusuário) das linhas de A em cada tabela, com um exemplo para tentar copiar.
do $$
declare t text; tem_org boolean; tem_user boolean; pred text; cat boolean; n int; ex jsonb; c1 text; cs text;
begin
  for t in select table_name from information_schema.tables
           where table_schema = 'public' and table_type = 'BASE TABLE' and (table_name like 'cep\_%' or table_name like 'cep2027\_%') loop
    select bool_or(column_name = 'org_id'), bool_or(column_name = 'user_id') into tem_org, tem_user
      from information_schema.columns where table_schema = 'public' and table_name = t;
    cat := t in ('cep_categories', 'cep_library_items');
    pred := case
      when cat then 'true'
      when t = 'cep_organizations' then format('id = %L', current_setting('t.org_a'))
      when tem_org then format('org_id = %L', current_setting('t.org_a'))
      when tem_user then '(user_id = ''a7a7a7a7-0000-4000-8000-0000000000a7'')'
      else 'true' end; -- tabelas de outros sistemas (ex.: CRM do escritório): nenhuma linha pode vazar
    execute format('select count(*), (select to_jsonb(x) from public.%I x where %s limit 1) from public.%I where %s', t, pred, t, pred) into n, ex;
    if ex ? 'id' and jsonb_typeof(ex->'id') = 'string' and (ex->>'id') ~ '^[0-9a-f-]{36}$' then ex := jsonb_set(ex, '{id}', to_jsonb(gen_random_uuid()::text)); end if;
    -- colunas graváveis (sem identidade): a primeira serve para o "update x = x"; todas, para copiar a linha
    select min(column_name) filter (where ordinal_position = (select min(ordinal_position) from information_schema.columns c2
             where c2.table_schema = 'public' and c2.table_name = t and c2.is_identity = 'NO')),
           string_agg(quote_ident(column_name), ', ' order by ordinal_position)
      into c1, cs from information_schema.columns where table_schema = 'public' and table_name = t and is_identity = 'NO';
    -- tabelas de outros sistemas (CRM do escritório, v1): regras próprias; aqui só se exige que nada vaze para alunas/anônimo
    insert into linhas_a values (t, cat, t in ('cep_alunos', 'cep_interessados', 'cep_cadastro_tentativas', 'cep2027_mentoras', 'cep2027_planos'), pred, n, ex, c1, cs);
  end loop;
end $$;
insert into r select 'aluna A tem linha em toda tabela do app', '0',
  count(*)::text from linhas_a where n = 0 and tabela not in ('cep_alunos', 'cep_interessados', 'cep_cadastro_tentativas', 'cep2027_mentoras', 'cep_roles');

-- Tenta ler, alterar, apagar e copiar as linhas de A. Registra uma linha por tabela e por operação.
create function pg_temp.atacar(quem text, le_tudo boolean) returns void language plpgsql as $$
declare l record; n int; res text; esperado text;
begin
  for l in select * from linhas_a order by tabela loop
    -- ler: catálogo é público para quem entrou; a mentora lê tudo do app; os demais, nada de A
    esperado := case when l.catalogo and quem <> 'anônimo' then 'ok' when le_tudo and l.n > 0 and not l.alheia and not l.catalogo then 'lê' else '0' end;
    begin
      execute format('select count(*) from public.%I where %s', l.tabela, l.predicado) into n;
      res := case when esperado = 'ok' then 'ok' when esperado = 'lê' then (case when n = l.n then 'lê' else 'lê ' || n || ' de ' || l.n end) else n::text end;
    exception when insufficient_privilege then res := '0'; end;
    insert into r values (quem || ' lê ' || l.tabela, esperado, res);
    -- alterar (coluna qualquer = ela mesma)
    begin
      execute format('update public.%I set %I = %I where %s', l.tabela, l.col, l.col, l.predicado); get diagnostics n = row_count; res := n::text;
    exception when insufficient_privilege then res := '0'; when others then res := 'erro ' || sqlstate; end;
    insert into r values (quem || ' altera ' || l.tabela, '0', res);
    -- apagar
    begin
      execute format('delete from public.%I where %s', l.tabela, l.predicado); get diagnostics n = row_count; res := n::text;
    exception when insufficient_privilege then res := '0'; when others then res := 'erro ' || sqlstate; end;
    insert into r values (quem || ' apaga ' || l.tabela, '0', res);
    -- copiar uma linha de A (inserir em nome de A)
    if l.exemplo is not null then
      begin
        execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)', l.tabela, l.cols, l.cols, l.tabela) using l.exemplo;
        res := 'permitido';
      exception when insufficient_privilege then res := 'negado'; when others then res := 'erro ' || sqlstate; end;
      insert into r values (quem || ' insere em nome de A em ' || l.tabela, 'negado', res);
      -- a mesma linha, mas em nome de quem ataca (ex.: B se filia à organização de A)
      if l.exemplo ? 'user_id' and l.exemplo ? 'org_id' and nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '') is not null then
        begin
          execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)', l.tabela, l.cols, l.cols, l.tabela)
            using jsonb_set(l.exemplo, '{user_id}', to_jsonb(current_setting('request.jwt.claims', true)::jsonb->>'sub'));
          res := 'permitido';
        exception when insufficient_privilege then res := 'negado'; when others then res := 'erro ' || sqlstate; end;
        insert into r values (quem || ' insere em seu nome em ' || l.tabela || ' (dados de A)', 'negado', res);
      end if;
    end if;
  end loop;
  -- dar-se um papel (cep_roles não tem linha de A para copiar)
  if nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '') is not null then
    begin
      insert into public.cep_roles (user_id, papel) values ((current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid, 'mentora'); res := 'permitido';
    exception when insufficient_privilege then res := 'negado'; when others then res := 'erro ' || sqlstate; end;
    insert into r values (quem || ' se dá o papel de mentora', 'negado', res);
    begin
      insert into public.cep_roles (user_id, papel) values ((current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid, 'admin'); res := 'permitido';
    exception when insufficient_privilege then res := 'negado'; when others then res := 'erro ' || sqlstate; end;
    insert into r values (quem || ' se dá o papel de admin', 'negado', res);
  end if;
end $$;
grant execute on function pg_temp.atacar(text, boolean) to public;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b7b7b7b7-0000-4000-8000-0000000000b7","role":"authenticated"}', true);
select pg_temp.atacar('aluna B', false);
select set_config('request.jwt.claims', '{"sub":"c7c7c7c7-0000-4000-8000-0000000000c7","role":"authenticated"}', true);
select pg_temp.atacar('mentora', true);
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select pg_temp.atacar('anônimo', false);
reset role;

-- Funções que ignoram o RLS (security definer): lista fechada. Uma nova precisa ser revista e entrar aqui.
insert into r select 'funções security definer conhecidas',
  'private.cep2027_is_mentora() | private.cep_apagar_org_vazia() | private.cep_eh_membro(org uuid) | private.cep_registrar() | private.cep_tem_papel(p cep_papel) | public.cep_excluir_minha_conta() | public.cep_garantir_ciclo(p_org uuid, p_ano integer) | public.cep_iniciar_conta(p_user uuid, p_nome text, p_email text) | public.cep_iniciar_minha_conta() | public.cep_registrar_tentativa(p_ip text, p_limite integer) | public.cep_usuarios_com_papel()',
  string_agg(n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ' | ' order by n.nspname || '.' || p.proname)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.prosecdef and n.nspname in ('public', 'private') and p.proname like 'cep%';
-- Nenhuma delas pode ser chamada pelo anônimo (as de gatilho só rodam como gatilho).
insert into r select 'security definer executável pelo anônimo', '', coalesce(string_agg(p.proname, ', '), '')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef and n.nspname in ('public', 'private') and p.proname like 'cep%' and has_function_privilege('anon', p.oid, 'execute')
;
insert into r select 'cep_iniciar_conta (cria conta para qualquer id) só pelo servidor', 'false',
  has_function_privilege('authenticated', 'public.cep_iniciar_conta(uuid, text, text)', 'execute')::text;
insert into r select 'gatilho de histórico continua gravando', 'true', (count(*) > 5)::text from public.cep_activity where org_id = current_setting('t.org_a')::uuid;

select verificacao, esperado, obtido, esperado is not distinct from obtido as ok from r order by ok, verificacao;
-- Falha alta se qualquer verificação não bater (não depende de alguém ler as 300+ linhas).
do $$ begin
  if exists (select 1 from r where esperado is distinct from obtido) then
    raise exception 'seguranca.sql: % verificação(ões) falharam', (select count(*) from r where esperado is distinct from obtido);
  end if;
end $$;
rollback;
