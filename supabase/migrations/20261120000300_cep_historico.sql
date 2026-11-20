-- Histórico de alterações: um registro por insert/update/delete nas tabelas de planejamento.
create or replace function private.cep_registrar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_novo jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
        v_velho jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
        v_org uuid := coalesce((v_novo ->> 'org_id')::uuid, (v_velho ->> 'org_id')::uuid);
begin
  -- Exclusão em cascata da organização: não há onde registrar.
  if not exists (select 1 from public.cep_organizations o where o.id = v_org) then return null; end if;
  if tg_op = 'UPDATE' and (v_novo - 'updated_at') = (v_velho - 'updated_at') then return null; end if;
  insert into public.cep_activity (org_id, user_id, entidade, entidade_id, acao, antes, depois)
  values (v_org, (select auth.uid()), tg_table_name,
          coalesce((v_novo ->> 'id')::uuid, (v_velho ->> 'id')::uuid), lower(tg_op), v_velho, v_novo);
  return null;
end $$;

do $$ declare t text; begin
  foreach t in array array['cep_diagnostics','cep_cycles','cep_cycle_priorities','cep_objectives','cep_tasks','cep_okrs','cep_key_results',
    'cep_kpis','cep_kpi_measurements','cep_financial_goals','cep_products','cep_sales_actions','cep_quarter_results','cep_reviews'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.cep_registrar()',
      t || '_historico', t);
  end loop;
end $$;
