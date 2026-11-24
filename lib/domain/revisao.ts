// Revisão estratégica do trimestre (spec §5 item 7): perguntas fixas e retrato dos indicadores ao concluir.
import type { Status } from "@/lib/domain/ciclo";
import { mediaKRs, progressoKR, situacaoKPI, type KR, type KPI, type Medicao } from "@/lib/domain/resultados";

export type ChaveRevisao = "executado" | "naoExecutado" | "resultados" | "impedimentos" | "funcionou" | "alterar" | "proximo";
export const PERGUNTAS_REVISAO: { chave: ChaveRevisao; texto: string }[] = [
  { chave: "executado", texto: "O que foi executado?" },
  { chave: "naoExecutado", texto: "O que não foi executado?" },
  { chave: "resultados", texto: "Quais resultados foram alcançados?" },
  { chave: "impedimentos", texto: "O que impediu a execução?" },
  { chave: "funcionou", texto: "Quais estratégias funcionaram?" },
  { chave: "alterar", texto: "Quais precisam ser alteradas?" },
  { chave: "proximo", texto: "O que será prioridade no próximo ciclo?" },
];
export type RespostasRevisao = Partial<Record<ChaveRevisao, string>>;

export type RetratoRevisao = {
  trimestre: number;
  execucao: { total: number; concluidas: number; pct: number | null };
  krs: { media: number | null; atingidos: number; comMeta: number };
  kpis: { naMeta: number; total: number };
  faturamento: { realizado: number; meta: number; pct: number | null };
};

type Dados = {
  tarefas: { trimestre: number | null; status: Status }[];
  krs: Pick<KR, "inicial" | "alvo" | "atual">[];
  kpis: (Pick<KPI, "sentido" | "meta"> & { medicoes: Medicao[] })[];
  metaTrimestre: number; realizado: number;
};

/** Execução (tarefas do trimestre) e resultado (KRs, KPIs, faturamento) — sempre separados. */
export function montarRetratoRevisao(d: Dados, trimestre: number): RetratoRevisao {
  const t = d.tarefas.filter((x) => x.trimestre === trimestre);
  const concluidas = t.filter((x) => x.status === "concluido").length;
  const comMeta = d.krs.filter((k) => progressoKR(k) !== null);
  return {
    trimestre,
    execucao: { total: t.length, concluidas, pct: t.length ? concluidas / t.length : null },
    krs: { media: mediaKRs(d.krs), atingidos: comMeta.filter((k) => progressoKR(k) === 1).length, comMeta: comMeta.length },
    kpis: { naMeta: d.kpis.filter((k) => situacaoKPI(k, k.medicoes).situacao === "na-meta").length, total: d.kpis.length },
    faturamento: { realizado: d.realizado, meta: d.metaTrimestre, pct: d.realizado && d.metaTrimestre ? d.realizado / d.metaTrimestre : null },
  };
}

export type Comparacao = { campo: string; tipo: "pct" | "moeda" | "numero"; antes: number | null; depois: number | null };
export function compararRetratos(atual: RetratoRevisao, anterior: RetratoRevisao | null): Comparacao[] {
  const a = anterior;
  return [
    { campo: "Execução das ações", tipo: "pct", antes: a ? a.execucao.pct : null, depois: atual.execucao.pct },
    { campo: "Média dos resultados-chave", tipo: "pct", antes: a ? a.krs.media : null, depois: atual.krs.media },
    { campo: "Indicadores na meta", tipo: "numero", antes: a ? a.kpis.naMeta : null, depois: atual.kpis.naMeta },
    { campo: "Faturamento realizado", tipo: "moeda", antes: a ? a.faturamento.realizado : null, depois: atual.faturamento.realizado },
  ];
}
