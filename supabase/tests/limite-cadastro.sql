-- Limite de cadastros: 30 em 10 minutos por chave (padrão), ou o limite pedido. Transação desfeita no fim.
begin;
select 'tentativas 1 a 30 permitidas' as verificacao,
  bool_and(public.cep_registrar_tentativa('203.0.113.9')) as ok from generate_series(1, 30)
union all select 'tentativa 31 bloqueada', not public.cep_registrar_tentativa('203.0.113.9')
union all select 'outro IP segue livre', public.cep_registrar_tentativa('203.0.113.10')
-- limite maior para o servidor do app (todas as alunas chegam pelo mesmo IP): 300
union all select 'servidor do app: 31ª permitida com limite 300',
  (select bool_and(public.cep_registrar_tentativa('servidor:198.51.100.1', 300)) from generate_series(1, 31))
union all select 'servidor do app: limite ainda vale',
  (select count(*) filter (where not public.cep_registrar_tentativa('servidor:198.51.100.2', 300)) = 1 from generate_series(1, 301))
union all select 'anônimo não chama', not has_function_privilege('anon', 'public.cep_registrar_tentativa(text, integer)', 'execute');
rollback;
