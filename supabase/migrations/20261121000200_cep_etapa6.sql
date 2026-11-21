-- Etapa 6: marca de importação do planejamento da versão anterior (uma vez por aluna).
alter table public.cep_profiles add column if not exists importado_v1_em timestamptz;
