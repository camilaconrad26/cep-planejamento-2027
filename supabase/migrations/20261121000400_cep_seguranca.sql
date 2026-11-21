-- Etapa 7: funções de gatilho não precisam ser chamadas por ninguém diretamente (o gatilho roda com o dono).
revoke all on function private.cep_registrar() from public, anon, authenticated;
revoke all on function private.cep_apagar_org_vazia() from public, anon, authenticated;

-- Limite de cadastros com limite por chave: o app chega sempre pelo mesmo IP (servidor), então a função de
-- cadastro conta 30 por visitante e 300 pelo servidor do app, em vez de 30 para a turma inteira.
drop function if exists public.cep_registrar_tentativa(text);
create or replace function public.cep_registrar_tentativa(p_ip text, p_limite integer default 30) returns boolean
language plpgsql security definer set search_path = '' as $$
declare chave text := left(coalesce(p_ip, ''), 100);
begin
  delete from public.cep_cadastro_tentativas where em < now() - interval '1 day';
  if (select count(*) from public.cep_cadastro_tentativas t where t.ip = chave and t.em > now() - interval '10 minutes') >= least(greatest(p_limite, 1), 1000) then
    return false;
  end if;
  insert into public.cep_cadastro_tentativas (ip) values (chave);
  return true;
end $$;
revoke all on function public.cep_registrar_tentativa(text, integer) from public, anon, authenticated;
grant execute on function public.cep_registrar_tentativa(text, integer) to service_role;
