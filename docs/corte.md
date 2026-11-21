# Troca de endereço (corte para a v2) — 21/11/2026

- `https://cep-planejamento-2027.vercel.app` (projeto Vercel `cep-planejamento-2027`) agora redireciona (307, temporário)
  qualquer caminho para o mesmo caminho em `https://cep-planejamento-v2.vercel.app` (projeto `cep-planejamento-v2`).
  Deploy do redirecionamento: `dpl_JBC9cYM8KyXfx77tt8kSsXZSixA8` (só `vercel.json` + `index.html` de aviso).
- Por que redirecionar e não mover o domínio: o token disponível não enxerga o projeto da v1 para remover o domínio
  `.vercel.app`, e a Vercel não deixa o mesmo domínio em dois projetos.
- A v1 continua acessível só para consulta em `cep-planejamento-2027-98p8tyaoc-escritorio-camila-conrad.vercel.app`
  (deploy `dpl_HWvym8MStrfHv1GGjZvWeBN18Epk`). As tabelas `cep2027_*` ficam como cópia de segurança.

## Voltar atrás
No painel da Vercel, projeto `cep-planejamento-2027` › Deployments › `dpl_HWvym8MStrfHv1GGjZvWeBN18Epk` › "Promote to Production".

## Para mover o domínio de vez (opcional)
No painel: projeto `cep-planejamento-2027` › Settings › Domains › remover `cep-planejamento-2027.vercel.app`;
depois projeto `cep-planejamento-v2` › Settings › Domains › adicionar o mesmo nome.
