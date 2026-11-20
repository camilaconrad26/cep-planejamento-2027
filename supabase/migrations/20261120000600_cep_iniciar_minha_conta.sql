-- Contas que já existiam no projeto (ex.: a mentora, ou alunas da v1) entram sem perfil do CEP.
-- No primeiro acesso, a própria pessoa inicia o perfil, a organização pessoal e o ciclo 2027. Idempotente.
create or replace function public.cep_iniciar_minha_conta() returns uuid
language plpgsql security definer set search_path = '' as $$
declare v uuid := (select auth.uid()); v_email text; v_nome text;
begin
  if v is null then raise exception 'sem sessão' using errcode = '42501'; end if;
  select u.email, coalesce(nullif(u.raw_user_meta_data ->> 'nome', ''), split_part(u.email, '@', 1))
    into v_email, v_nome from auth.users u where u.id = v;
  return public.cep_iniciar_conta(v, left(v_nome, 120), v_email);
end $$;
revoke all on function public.cep_iniciar_minha_conta() from public, anon;
grant execute on function public.cep_iniciar_minha_conta() to authenticated;
