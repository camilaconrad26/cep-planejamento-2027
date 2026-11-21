-- Revisão final da Etapa 2: trava por organização (itens diferentes da mesma categoria não duplicam o objetivo),
-- índices únicos como garantia final e KR no OKR do trimestre escolhido.
create unique index if not exists cep_objectives_item_no_ciclo on public.cep_objectives (cycle_id, library_item_id) where library_item_id is not null;
create unique index if not exists cep_tasks_item_no_ciclo on public.cep_tasks (cycle_id, library_item_id) where library_item_id is not null;
create unique index if not exists cep_kpis_item_no_ciclo on public.cep_kpis (cycle_id, library_item_id) where library_item_id is not null;

create or replace function public.cep_adicionar_item(p_item uuid, p_trimestre smallint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_org uuid; v_ciclo uuid; v_item public.cep_library_items; v_estr public.cep_library_items;
  v_obj uuid; v_obj_criado boolean := false; v_okr uuid; v_id uuid; v_criado text;
begin
  if auth.uid() is null then raise exception 'sessão ausente'; end if;
  if p_trimestre is null or p_trimestre not between 1 and 4 then raise exception 'trimestre inválido'; end if;
  select org_id into v_org from public.cep_organization_members where user_id = auth.uid() order by org_id limit 1;
  if v_org is null then raise exception 'conta sem organização'; end if;
  select * into v_item from public.cep_library_items where id = p_item and ativo;
  if not found then raise exception 'item indisponível'; end if;
  if v_item.nivel = 'estrategico' then v_estr := v_item;
  else select * into v_estr from public.cep_library_items where id = v_item.parent_id; end if;
  if v_estr.id is null then raise exception 'item sem objetivo estratégico'; end if;

  perform pg_advisory_xact_lock(hashtext('cep_adicionar:' || v_org::text));
  v_ciclo := public.cep_garantir_ciclo(v_org, 2027);

  select id into v_obj from public.cep_objectives where cycle_id = v_ciclo and library_item_id = v_estr.id order by created_at limit 1;
  if v_obj is null then
    insert into public.cep_objectives (org_id, cycle_id, category_id, library_item_id, titulo, trimestre)
    values (v_org, v_ciclo, v_estr.category_id, v_estr.id, v_estr.texto, p_trimestre) returning id into v_obj;
    v_obj_criado := true;
  end if;

  if v_item.nivel = 'estrategico' then
    return jsonb_build_object('criado', 'objetivo', 'objetivo_criado', v_obj_criado, 'ja_no_plano', not v_obj_criado, 'id', v_obj);
  elsif v_item.nivel in ('tatico', 'operacional') then
    v_criado := 'tarefa';
    select id into v_id from public.cep_tasks where cycle_id = v_ciclo and library_item_id = v_item.id limit 1;
    if v_id is null then
      insert into public.cep_tasks (org_id, cycle_id, objective_id, library_item_id, nivel, titulo, trimestre)
      values (v_org, v_ciclo, v_obj, v_item.id, v_item.nivel, v_item.texto, p_trimestre) returning id into v_id;
      return jsonb_build_object('criado', v_criado, 'objetivo_criado', v_obj_criado, 'ja_no_plano', false, 'id', v_id);
    end if;
  elsif v_item.nivel = 'okr' then
    v_criado := 'kr';
    select k.id into v_id from public.cep_key_results k join public.cep_okrs o on o.id = k.okr_id
     where o.cycle_id = v_ciclo and k.library_item_id = v_item.id limit 1;
    if v_id is null then
      select id into v_okr from public.cep_okrs where objective_id = v_obj and trimestre = p_trimestre order by created_at limit 1;
      if v_okr is null then
        insert into public.cep_okrs (org_id, cycle_id, objective_id, titulo, trimestre)
        select v_org, v_ciclo, v_obj, titulo, p_trimestre from public.cep_objectives where id = v_obj returning id into v_okr;
      end if;
      insert into public.cep_key_results (org_id, okr_id, library_item_id, descricao)
      values (v_org, v_okr, v_item.id, v_item.texto) returning id into v_id;
      return jsonb_build_object('criado', v_criado, 'objetivo_criado', v_obj_criado, 'ja_no_plano', false, 'id', v_id);
    end if;
  else
    v_criado := 'kpi';
    select id into v_id from public.cep_kpis where cycle_id = v_ciclo and library_item_id = v_item.id limit 1;
    if v_id is null then
      insert into public.cep_kpis (org_id, cycle_id, objective_id, library_item_id, nome)
      values (v_org, v_ciclo, v_obj, v_item.id, v_item.texto) returning id into v_id;
      return jsonb_build_object('criado', v_criado, 'objetivo_criado', v_obj_criado, 'ja_no_plano', false, 'id', v_id);
    end if;
  end if;
  return jsonb_build_object('criado', v_criado, 'objetivo_criado', v_obj_criado, 'ja_no_plano', true, 'id', v_id);
end $$;

revoke all on function public.cep_adicionar_item(uuid, smallint) from public, anon;
grant execute on function public.cep_adicionar_item(uuid, smallint) to authenticated;
