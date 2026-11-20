import { diasEntre, estaAtrasada, trimestreAtual, type Status } from "@/lib/domain/ciclo";
import type { Retrato } from "@/lib/domain/proximoPasso";

export type TarefaResumo = { status: Status; prazo: string | null; trimestre: 1 | 2 | 3 | 4 | null; arquivado: boolean; categoria: string | null };
export type DadosRetrato = {
  ano: number; diagnosticoIniciado: boolean;
  prioridades: { trimestre: number; slug: string }[];
  tarefas: TarefaResumo[];
  trimestresRevisados: number[];
  medicaoVencida?: number;
};

/** Retrato do momento da aluna: alimenta o próximo passo e os números da Visão geral. */
export function calcularRetrato(d: DadosRetrato, hoje: string) {
  const { trimestre, fase } = trimestreAtual(d.ano, hoje);
  const ativas = d.tarefas.filter((t) => !t.arquivado);
  const prioridades = d.prioridades.filter((p) => p.trimestre === trimestre).map((p) => p.slug);
  const comAcao = new Set(ativas.filter((t) => t.trimestre === trimestre && t.categoria).map((t) => t.categoria));
  const atrasadas = ativas.filter((t) => estaAtrasada(t, hoje)).length;
  const vencendo7dias = ativas.filter((t) => t.status !== "concluido" && t.prazo && t.prazo >= hoje && diasEntre(hoje, t.prazo) <= 7).length;
  const concluidas = ativas.filter((t) => t.status === "concluido").length;
  const retrato: Retrato = {
    diagnosticoIniciado: d.diagnosticoIniciado, trimestre, fase,
    categoriasNoTrimestre: prioridades.length,
    categoriasSemAcao: prioridades.filter((s) => !comAcao.has(s)),
    atrasadas, medicaoVencida: d.medicaoVencida ?? 0,
    trimestreAnteriorSemRevisao: fase === "execucao" && trimestre > 1 && !d.trimestresRevisados.includes(trimestre - 1),
    vencendo7dias,
  };
  return {
    retrato, prioridades,
    contagens: { total: ativas.length, emAndamento: ativas.filter((t) => t.status === "em_andamento").length, atrasadas, vencendo7dias,
      execucaoPct: ativas.length ? Math.round((concluidas / ativas.length) * 100) : 0 },
  };
}
