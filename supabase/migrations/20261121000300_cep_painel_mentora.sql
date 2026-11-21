-- Painel da mentora: quem tem papel (para não listar mentoras/admins como alunas) e a última atividade de cada organização.
create or replace function public.cep_usuarios_com_papel()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select distinct r.user_id from public.cep_roles r
  where private.cep_tem_papel('mentora') or private.cep_tem_papel('admin')
$$;
revoke all on function public.cep_usuarios_com_papel() from public, anon;
grant execute on function public.cep_usuarios_com_papel() to authenticated;

-- Invoker: o RLS de cep_activity decide o que cada um vê.
create or replace function public.cep_ultima_atividade()
returns table (org_id uuid, em timestamptz) language sql stable security invoker set search_path = '' as $$
  select distinct on (a.org_id) a.org_id, a.em from public.cep_activity a order by a.org_id, a.em desc
$$;
revoke all on function public.cep_ultima_atividade() from public, anon;
grant execute on function public.cep_ultima_atividade() to authenticated;
