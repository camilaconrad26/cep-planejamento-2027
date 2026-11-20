-- Quando a última pessoa sai de uma organização (ex.: conta excluída), a organização e todo o planejamento
-- dela são apagados em cascata. Sem isso, os dados de uma conta excluída ficariam órfãos no banco.
create or replace function private.cep_apagar_org_vazia() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.cep_organization_members m where m.org_id = old.org_id) then
    delete from public.cep_organizations o where o.id = old.org_id;
  end if;
  return null;
end $$;

create trigger cep_organization_members_apagar_org_vazia
  after delete on public.cep_organization_members
  for each row execute function private.cep_apagar_org_vazia();

-- Remove organizações que já ficaram sem membros (contas de teste apagadas antes desta migração).
delete from public.cep_organizations o
where not exists (select 1 from public.cep_organization_members m where m.org_id = o.id);
