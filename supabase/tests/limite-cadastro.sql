-- Limite de cadastros por IP: 30 em 10 minutos. Transação desfeita no fim.
begin;
select 'tentativas 1 a 30 permitidas' as verificacao,
  bool_and(public.cep_registrar_tentativa('203.0.113.9')) as ok from generate_series(1, 30);
select 'tentativa 31 bloqueada' as verificacao, not public.cep_registrar_tentativa('203.0.113.9') as ok;
select 'outro IP segue livre' as verificacao, public.cep_registrar_tentativa('203.0.113.10') as ok;
rollback;
