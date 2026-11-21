-- Etapa 3: prioridades do trimestre com limite garantido no banco (spec §8) e "Por que essa meta?" no ciclo.
alter table public.cep_cycles add column if not exists meta_porque text check (length(meta_porque) <= 2000);

create or replace function public.cep_definir_prioridade(p_trimestre smallint, p_categoria uuid, p_confirmar boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_org uuid; v_ciclo uuid; v_qtd int;
begin
  if auth.uid() is null then raise exception 'sessão ausente'; end if;
  if p_trimestre is null or p_trimestre not between 1 and 4 then raise exception 'trimestre inválido'; end if;
  select org_id into v_org from public.cep_organization_members where user_id = auth.uid() order by org_id limit 1;
  if v_org is null then raise exception 'conta sem organização'; end if;
  perform pg_advisory_xact_lock(hashtext('cep_prioridade:' || v_org::text));
  v_ciclo := public.cep_garantir_ciclo(v_org, 2027);
  if exists (select 1 from public.cep_cycle_priorities where cycle_id = v_ciclo and trimestre = p_trimestre and category_id = p_categoria) then
    return jsonb_build_object('situacao', 'ja_existe', 'excedente', false);
  end if;
  select count(*) into v_qtd from public.cep_cycle_priorities where cycle_id = v_ciclo and trimestre = p_trimestre;
  if v_qtd >= 3 and not coalesce(p_confirmar, false) then
    return jsonb_build_object('situacao', 'confirmar', 'excedente', true);
  end if;
  insert into public.cep_cycle_priorities (org_id, cycle_id, trimestre, category_id, excedente)
  values (v_org, v_ciclo, p_trimestre, p_categoria, v_qtd >= 3);
  return jsonb_build_object('situacao', 'ok', 'excedente', v_qtd >= 3);
end $$;

create or replace function public.cep_remover_prioridade(p_trimestre smallint, p_categoria uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'sessão ausente'; end if;
  select org_id into v_org from public.cep_organization_members where user_id = auth.uid() order by org_id limit 1;
  if v_org is null then raise exception 'conta sem organização'; end if;
  perform pg_advisory_xact_lock(hashtext('cep_prioridade:' || v_org::text));
  delete from public.cep_cycle_priorities p using public.cep_cycles c
   where c.id = p.cycle_id and c.org_id = v_org and c.status = 'ativo' and p.trimestre = p_trimestre and p.category_id = p_categoria;
end $$;

revoke all on function public.cep_definir_prioridade(smallint, uuid, boolean) from public, anon;
revoke all on function public.cep_remover_prioridade(smallint, uuid) from public, anon;
grant execute on function public.cep_definir_prioridade(smallint, uuid, boolean) to authenticated;
grant execute on function public.cep_remover_prioridade(smallint, uuid) to authenticated;
