// Registro de alterações (cep_activity) em linguagem simples.
type J = Record<string, unknown> | null;
export type Atividade = { entidade: string; acao: "insert" | "update" | "delete" | string; antes: J; depois: J };
const t = (o: J, k: string) => (o && typeof o[k] === "string" ? (o[k] as string) : "");

const NOMES: Record<string, [string, string, (o: J) => string]> = {
  cep_objectives: ["Objetivo", "o", (o) => t(o, "titulo")],
  cep_tasks: ["Ação", "a", (o) => t(o, "titulo")],
  cep_okrs: ["OKR", "o", (o) => t(o, "titulo")],
  cep_key_results: ["Resultado-chave", "o", (o) => t(o, "descricao")],
  cep_kpis: ["Indicador", "o", (o) => t(o, "nome")],
  cep_sales_actions: ["Ação de vendas", "a", (o) => t(o, "produto")],
};

export function textoAtividade(a: Atividade): string {
  const { entidade, acao, antes, depois } = a;
  const atual = depois ?? antes;
  if (entidade === "cep_tasks" && acao === "update" && antes?.status !== "concluido" && depois?.status === "concluido") return `Ação concluída: ${t(depois, "titulo")}`;
  if (entidade === "cep_key_results" && acao === "update" && antes?.valor_atual !== depois?.valor_atual) return `Valor lançado: ${t(depois, "descricao")}`;
  if (entidade === "cep_kpi_measurements") return acao === "delete" ? "Medição excluída" : "Medição registrada";
  if (entidade === "cep_reviews") return !antes?.concluida_em && depois?.concluida_em ? `Revisão do ${depois?.trimestre}º trimestre concluída` : `Revisão do ${atual?.trimestre ?? ""}º trimestre salva`;
  if (entidade === "cep_cycle_priorities") return acao === "delete" ? "Prioridade removida" : "Prioridade definida";
  if (entidade === "cep_financial_goals" || entidade === "cep_products") return "Metas financeiras atualizadas";
  if (entidade === "cep_quarter_results") return "Faturamento realizado atualizado";
  if (entidade === "cep_cycles") return "Ciclo atualizado";
  const n = NOMES[entidade];
  if (!n) return "Alteração no plano";
  const [nome, g, titulo] = n;
  const verbo = acao === "insert" ? (g === "a" ? "criada" : "criado") : acao === "delete" ? (g === "a" ? "excluída" : "excluído") : (g === "a" ? "alterada" : "alterado");
  const x = titulo(atual);
  return `${nome} ${verbo}${x ? `: ${x}` : ""}`;
}

/** Junta repetições seguidas do mesmo texto (a gravação automática gera muitas). */
export function agruparAtividades<T extends { texto: string; em: string }>(l: T[]): (T & { vezes: number })[] {
  const r: (T & { vezes: number })[] = [];
  for (const x of l) {
    const u = r[r.length - 1];
    if (u && u.texto === x.texto) u.vezes += 1; else r.push({ ...x, vezes: 1 });
  }
  return r;
}

/** "Ver mais" do histórico: de 50 em 50, no máximo 500 alterações; null = não há link. */
export const MAX_HISTORICO = 500;
export const proximoLimite = (limite: number, temMais: boolean): number | null =>
  temMais && limite < MAX_HISTORICO ? Math.min(MAX_HISTORICO, limite + 50) : null;
