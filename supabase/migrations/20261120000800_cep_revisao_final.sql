-- Correções da revisão final (etapas 0 e 1).

-- 1) O diagnóstico é salvo automaticamente a cada edição: não registrar no histórico (cópias inteiras a cada 900 ms).
drop trigger if exists cep_diagnostics_historico on public.cep_diagnostics;
delete from public.cep_activity where entidade = 'cep_diagnostics';

-- 2) Origem da conta em app_metadata (a pessoa não consegue editar; user_metadata ela consegue).
--    Contas criadas até aqui pelas funções de cadastro (v1 e v2) recebem a origem que já tinham.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('origem', raw_user_meta_data ->> 'origem')
where raw_user_meta_data ->> 'origem' in ('cep', 'cep2027') and coalesce(raw_app_meta_data ->> 'origem', '') = '';

create or replace function public.cep_excluir_minha_conta() returns void
language plpgsql security definer set search_path = '' as $$
declare v uuid := (select auth.uid());
begin
  if v is null then raise exception 'sem sessão' using errcode = '42501'; end if;
  if exists (select 1 from public.cep_roles r where r.user_id = v) then
    raise exception 'conta com papel de mentora ou admin não pode ser excluída por aqui' using errcode = '42501';
  end if;
  if coalesce((select u.raw_app_meta_data ->> 'origem' from auth.users u where u.id = v), '') not in ('cep', 'cep2027') then
    raise exception 'esta conta não foi criada pelo planejamento do CEP' using errcode = '42501';
  end if;
  delete from auth.users where id = v;
end $$;

-- 3) Limite de cadastros por IP (30 a cada 10 minutos), usado pela função cep-conta.
create table if not exists public.cep_cadastro_tentativas (
  id bigint generated always as identity primary key,
  ip text not null,
  em timestamptz not null default now()
);
create index if not exists cep_cadastro_tentativas_ip_em_idx on public.cep_cadastro_tentativas (ip, em);
alter table public.cep_cadastro_tentativas enable row level security;
revoke all on public.cep_cadastro_tentativas from anon, authenticated;

create or replace function public.cep_registrar_tentativa(p_ip text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.cep_cadastro_tentativas where em < now() - interval '1 day';
  if (select count(*) from public.cep_cadastro_tentativas t where t.ip = p_ip and t.em > now() - interval '10 minutes') >= 30 then
    return false;
  end if;
  insert into public.cep_cadastro_tentativas (ip) values (left(coalesce(p_ip, ''), 100));
  return true;
end $$;
revoke all on function public.cep_registrar_tentativa(text) from public, anon, authenticated;
grant execute on function public.cep_registrar_tentativa(text) to service_role;
