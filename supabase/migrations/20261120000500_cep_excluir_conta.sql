-- A própria aluna exclui a conta: apaga o usuário; perfil, filiação, organização e planejamento vão em cascata.
-- Contas com papel (mentora/admin) não podem se excluir por aqui.
create or replace function public.cep_excluir_minha_conta() returns void
language plpgsql security definer set search_path = '' as $$
declare v uuid := (select auth.uid());
begin
  if v is null then raise exception 'sem sessão' using errcode = '42501'; end if;
  if exists (select 1 from public.cep_roles r where r.user_id = v) then
    raise exception 'conta com papel de mentora ou admin não pode ser excluída por aqui' using errcode = '42501';
  end if;
  if coalesce((select u.raw_user_meta_data ->> 'origem' from auth.users u where u.id = v), '') not in ('cep', 'cep2027') then
    raise exception 'esta conta não foi criada pelo planejamento do CEP' using errcode = '42501';
  end if;
  delete from auth.users where id = v;
end $$;
revoke all on function public.cep_excluir_minha_conta() from public, anon;
grant execute on function public.cep_excluir_minha_conta() to authenticated;
