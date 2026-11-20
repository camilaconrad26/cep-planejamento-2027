-- RLS: cada aluna só acessa a própria organização; a mentora lê tudo e não escreve;
-- a biblioteca é lida por todas e escrita só por admin. Nada depende da interface.

create or replace function private.cep_eh_membro(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cep_organization_members m where m.org_id = org and m.user_id = (select auth.uid()))
$$;

create or replace function private.cep_tem_papel(p public.cep_papel) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cep_roles r where r.user_id = (select auth.uid()) and r.papel = p)
$$;

grant usage on schema private to authenticated;
revoke all on function private.cep_eh_membro(uuid) from public, anon;
revoke all on function private.cep_tem_papel(public.cep_papel) from public, anon;
grant execute on function private.cep_eh_membro(uuid) to authenticated;
grant execute on function private.cep_tem_papel(public.cep_papel) to authenticated;

do $$ declare t text; begin
  foreach t in array array['cep_categories','cep_library_items','cep_profiles','cep_roles','cep_organizations','cep_organization_members',
    'cep_diagnostics','cep_cycles','cep_cycle_priorities','cep_objectives','cep_tasks','cep_okrs','cep_key_results','cep_kpis',
    'cep_kpi_measurements','cep_financial_goals','cep_products','cep_sales_actions','cep_quarter_results','cep_reviews','cep_activity'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;

  -- Tabelas de planejamento: membro lê e escreve; mentora só lê.
  foreach t in array array['cep_diagnostics','cep_cycles','cep_cycle_priorities','cep_objectives','cep_tasks','cep_okrs','cep_key_results',
    'cep_kpis','cep_kpi_measurements','cep_financial_goals','cep_products','cep_sales_actions','cep_quarter_results','cep_reviews'] loop
    execute format($p$create policy "%s_ler" on public.%I for select to authenticated
      using ((select private.cep_eh_membro(org_id)) or (select private.cep_tem_papel('mentora')))$p$, t, t);
    execute format($p$create policy "%s_criar" on public.%I for insert to authenticated
      with check ((select private.cep_eh_membro(org_id)))$p$, t, t);
    execute format($p$create policy "%s_alterar" on public.%I for update to authenticated
      using ((select private.cep_eh_membro(org_id))) with check ((select private.cep_eh_membro(org_id)))$p$, t, t);
    execute format($p$create policy "%s_apagar" on public.%I for delete to authenticated
      using ((select private.cep_eh_membro(org_id)))$p$, t, t);
  end loop;

  -- Biblioteca: leitura para autenticadas, escrita para admin.
  foreach t in array array['cep_categories','cep_library_items'] loop
    execute format($p$create policy "%s_ler" on public.%I for select to authenticated using (true)$p$, t, t);
    execute format($p$create policy "%s_admin_criar" on public.%I for insert to authenticated with check ((select private.cep_tem_papel('admin')))$p$, t, t);
    execute format($p$create policy "%s_admin_alterar" on public.%I for update to authenticated
      using ((select private.cep_tem_papel('admin'))) with check ((select private.cep_tem_papel('admin')))$p$, t, t);
    execute format($p$create policy "%s_admin_apagar" on public.%I for delete to authenticated using ((select private.cep_tem_papel('admin')))$p$, t, t);
  end loop;
end $$;

-- Perfis: a própria pessoa lê e altera; a mentora lê. Criação só pelo servidor (cep_iniciar_conta).
create policy "cep_profiles_ler" on public.cep_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.cep_tem_papel('mentora')));
create policy "cep_profiles_alterar" on public.cep_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Papéis: cada uma vê os próprios; ninguém escreve pelo cliente.
create policy "cep_roles_ler" on public.cep_roles for select to authenticated using (user_id = (select auth.uid()));

-- Organizações e filiações: membro lê (e renomeia a organização); mentora lê.
create policy "cep_organizations_ler" on public.cep_organizations for select to authenticated
  using ((select private.cep_eh_membro(id)) or (select private.cep_tem_papel('mentora')));
create policy "cep_organizations_alterar" on public.cep_organizations for update to authenticated
  using ((select private.cep_eh_membro(id))) with check ((select private.cep_eh_membro(id)));
create policy "cep_organization_members_ler" on public.cep_organization_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.cep_tem_papel('mentora')));

-- Histórico: só leitura (escrito por gatilho).
create policy "cep_activity_ler" on public.cep_activity for select to authenticated
  using ((select private.cep_eh_membro(org_id)) or (select private.cep_tem_papel('mentora')));

-- Ciclo ativo do ano, criado se faltar. Só para membro da organização.
create or replace function public.cep_garantir_ciclo(p_org uuid, p_ano int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  if not private.cep_eh_membro(p_org) then
    raise exception 'sem acesso a esta organização' using errcode = '42501';
  end if;
  select c.id into v from public.cep_cycles c where c.org_id = p_org and c.status = 'ativo';
  if v is null then
    insert into public.cep_cycles (org_id, ano) values (p_org, p_ano) returning id into v;
  end if;
  return v;
end $$;
revoke all on function public.cep_garantir_ciclo(uuid, int) from public, anon;
grant execute on function public.cep_garantir_ciclo(uuid, int) to authenticated;
