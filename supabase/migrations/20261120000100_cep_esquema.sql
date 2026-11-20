-- CEP · Planejamento Estratégico v2 — esquema relacional (prefixo cep_).
-- Convivência: tabelas do escritório e cep2027_* (v1) não são tocadas.

create type public.cep_nivel as enum ('estrategico', 'tatico', 'operacional', 'okr', 'kpi');
create type public.cep_status as enum ('nao_iniciado', 'em_andamento', 'concluido');
create type public.cep_prioridade as enum ('baixa', 'media', 'alta');
create type public.cep_papel as enum ('mentora', 'admin');
create type public.cep_altura as enum ('meta', 'super', 'mega');
create type public.cep_produto_tipo as enum ('entrada', 'principal', 'alto_valor');
create type public.cep_ciclo_status as enum ('ativo', 'arquivado');

create schema if not exists private;

create or replace function private.cep_tocar() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- Biblioteca (global) ---------------------------------------------------------
create table public.cep_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text not null default '',
  objetivo text not null default '',
  ordem smallint not null default 0
);

create table public.cep_library_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.cep_categories (id) on delete restrict,
  perfil smallint not null check (perfil between 1 and 3),
  nivel public.cep_nivel not null,
  texto text not null check (length(texto) between 1 and 1000),
  parent_id uuid references public.cep_library_items (id) on delete set null,
  ordem smallint not null default 0,
  ativo boolean not null default true,
  updated_at timestamptz not null default now(),
  check (nivel = 'estrategico' or parent_id is not null)
);
create index on public.cep_library_items (category_id, perfil);
create index on public.cep_library_items (parent_id);

-- Pessoas, papéis e organizações -----------------------------------------------
create table public.cep_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(nome) between 1 and 120),
  email text not null,
  perfil smallint check (perfil between 1 and 3),
  texto_maior boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cep_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  papel public.cep_papel not null,
  primary key (user_id, papel)
);

create table public.cep_organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cep_organization_members (
  org_id uuid not null references public.cep_organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel text not null default 'dona',
  primary key (org_id, user_id)
);
create index on public.cep_organization_members (user_id);

-- Diagnóstico ------------------------------------------------------------------
create table public.cep_diagnostics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cep_organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  respostas jsonb not null default '{}'::jsonb,
  perfil_sugerido smallint check (perfil_sugerido between 1 and 3),
  resumo jsonb,
  fechamento_ano jsonb not null default '{}'::jsonb,
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pg_column_size(respostas) + pg_column_size(fechamento_ano) < 200000)
);
create index on public.cep_diagnostics (org_id, created_at desc);

-- Ciclos -----------------------------------------------------------------------
create table public.cep_cycles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cep_organizations (id) on delete cascade,
  ano smallint not null check (ano between 2024 and 2100),
  status public.cep_ciclo_status not null default 'ativo',
  duplicado_de uuid references public.cep_cycles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id)
);
create unique index cep_cycles_um_ativo on public.cep_cycles (org_id) where status = 'ativo';

-- As linhas filhas referenciam (cycle_id, org_id): impede pendurar dados num ciclo de outra organização.
create table public.cep_cycle_priorities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  trimestre smallint not null check (trimestre between 1 and 4),
  category_id uuid not null references public.cep_categories (id),
  excedente boolean not null default false,
  unique (cycle_id, trimestre, category_id),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_cycle_priorities (org_id);

create table public.cep_objectives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  category_id uuid not null references public.cep_categories (id),
  library_item_id uuid references public.cep_library_items (id) on delete set null,
  titulo text not null check (length(titulo) between 1 and 1000),
  descricao text,
  trimestre smallint check (trimestre between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_objectives (org_id); create index on public.cep_objectives (cycle_id);

create table public.cep_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  objective_id uuid,
  library_item_id uuid references public.cep_library_items (id) on delete set null,
  nivel public.cep_nivel not null check (nivel in ('estrategico', 'tatico', 'operacional')),
  titulo text not null check (length(titulo) between 1 and 1000),
  responsavel text check (length(responsavel) <= 120),
  prioridade public.cep_prioridade not null default 'media',
  status public.cep_status not null default 'nao_iniciado',
  data_inicio date,
  prazo date,
  concluido_em timestamptz,
  trimestre smallint check (trimestre between 1 and 4),
  arquivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_inicio is null or prazo is null or data_inicio <= prazo),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade,
  foreign key (objective_id, org_id) references public.cep_objectives (id, org_id) on delete cascade
);
create index on public.cep_tasks (org_id); create index on public.cep_tasks (cycle_id); create index on public.cep_tasks (objective_id);

create table public.cep_okrs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  objective_id uuid not null,
  titulo text not null check (length(titulo) between 1 and 1000),
  trimestre smallint check (trimestre between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade,
  foreign key (objective_id, org_id) references public.cep_objectives (id, org_id) on delete cascade
);
create index on public.cep_okrs (org_id); create index on public.cep_okrs (objective_id); create index on public.cep_okrs (cycle_id);

create table public.cep_key_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  okr_id uuid not null,
  library_item_id uuid references public.cep_library_items (id) on delete set null,
  descricao text not null check (length(descricao) between 1 and 1000),
  unidade text check (length(unidade) <= 40),
  valor_inicial numeric,
  alvo numeric,
  valor_atual numeric,
  prazo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (okr_id, org_id) references public.cep_okrs (id, org_id) on delete cascade
);
create index on public.cep_key_results (org_id); create index on public.cep_key_results (okr_id);

create table public.cep_kpis (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  objective_id uuid,
  library_item_id uuid references public.cep_library_items (id) on delete set null,
  nome text not null check (length(nome) between 1 and 1000),
  unidade text check (length(unidade) <= 40),
  sentido text not null default 'maior' check (sentido in ('maior', 'menor')),
  meta numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade,
  foreign key (objective_id, org_id) references public.cep_objectives (id, org_id) on delete set null (objective_id)
);
create index on public.cep_kpis (org_id); create index on public.cep_kpis (cycle_id); create index on public.cep_kpis (objective_id);

create table public.cep_kpi_measurements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  kpi_id uuid not null,
  data date not null,
  valor numeric not null,
  nota text check (length(nota) <= 500),
  created_at timestamptz not null default now(),
  foreign key (kpi_id, org_id) references public.cep_kpis (id, org_id) on delete cascade
);
create index on public.cep_kpi_measurements (org_id); create index on public.cep_kpi_measurements (kpi_id, data);

-- Metas financeiras (planilha "CONRAD - Planejamento Anual") ----------------------
create table public.cep_financial_goals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  trimestre smallint check (trimestre between 1 and 4), -- nulo = meta anual
  altura public.cep_altura not null,
  faturamento numeric, lucratividade numeric, anuncios numeric, time smallint,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (cycle_id, trimestre, altura),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_financial_goals (org_id);

create table public.cep_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  tipo public.cep_produto_tipo not null,
  nome text check (length(nome) <= 200),
  ticket numeric, vendas_meta numeric, vendas_super numeric, vendas_mega numeric,
  updated_at timestamptz not null default now(),
  unique (cycle_id, tipo),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_products (org_id);

create table public.cep_sales_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  mes smallint not null check (mes between 1 and 12),
  produto text check (length(produto) <= 200),
  acao text check (length(acao) <= 500),
  ticket numeric, quantidade numeric,
  responsavel text check (length(responsavel) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_sales_actions (org_id); create index on public.cep_sales_actions (cycle_id, mes);

create table public.cep_quarter_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  trimestre smallint not null check (trimestre between 1 and 4),
  faturamento_realizado numeric,
  updated_at timestamptz not null default now(),
  unique (cycle_id, trimestre),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_quarter_results (org_id);

-- Revisão e histórico ----------------------------------------------------------
create table public.cep_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  cycle_id uuid not null,
  trimestre smallint not null check (trimestre between 1 and 4),
  respostas jsonb not null default '{}'::jsonb,
  retrato jsonb,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, trimestre),
  foreign key (cycle_id, org_id) references public.cep_cycles (id, org_id) on delete cascade
);
create index on public.cep_reviews (org_id);

create table public.cep_activity (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.cep_organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  entidade text not null,
  entidade_id uuid,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  antes jsonb,
  depois jsonb,
  em timestamptz not null default now()
);
create index on public.cep_activity (org_id, em desc);
create index on public.cep_activity (user_id);

-- updated_at automático
do $$ declare t text; begin
  foreach t in array array['cep_library_items','cep_profiles','cep_diagnostics','cep_cycles','cep_objectives','cep_tasks','cep_okrs',
    'cep_key_results','cep_kpis','cep_financial_goals','cep_products','cep_sales_actions','cep_quarter_results','cep_reviews'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.cep_tocar()', t || '_tocar', t);
  end loop;
end $$;

-- Início de conta: perfil + organização pessoal + filiação + ciclo 2027 ativo. Idempotente.
create or replace function public.cep_iniciar_conta(p_user uuid, p_nome text, p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
  insert into public.cep_profiles (user_id, nome, email) values (p_user, p_nome, lower(p_email))
    on conflict (user_id) do nothing;
  select m.org_id into v_org from public.cep_organization_members m where m.user_id = p_user order by m.org_id limit 1;
  if v_org is null then
    insert into public.cep_organizations (nome, criado_por) values (p_nome, p_user) returning id into v_org;
    insert into public.cep_organization_members (org_id, user_id) values (v_org, p_user);
  end if;
  if not exists (select 1 from public.cep_cycles c where c.org_id = v_org and c.status = 'ativo') then
    insert into public.cep_cycles (org_id, ano) values (v_org, 2027);
  end if;
  return v_org;
end $$;
revoke all on function public.cep_iniciar_conta(uuid, text, text) from public, anon, authenticated;
grant execute on function public.cep_iniciar_conta(uuid, text, text) to service_role;
