// Rotas de cada módulo e quais já estão construídas. Módulo não construído não aparece no menu
// e não é destino de atalho ("sem funcionalidade fictícia").
export const ROTAS = {
  visaoGeral: "/visao-geral", diagnostico: "/diagnostico", planejamento: "/planejamento", biblioteca: "/biblioteca",
  planoDeAcao: "/plano-de-acao", metas: "/metas", revisao: "/revisao", historico: "/historico", configuracoes: "/configuracoes", alunas: "/alunas",
} as const;
export type Rota = (typeof ROTAS)[keyof typeof ROTAS];
export const ROTAS_CONSTRUIDAS: ReadonlySet<Rota> = new Set<Rota>([ROTAS.visaoGeral, ROTAS.diagnostico, ROTAS.biblioteca, ROTAS.configuracoes]);
export const EM_BREVE = "/visao-geral#em-breve";
export const destino = (r: Rota, construidas: ReadonlySet<Rota> = ROTAS_CONSTRUIDAS) => (construidas.has(r) ? r : EM_BREVE);
