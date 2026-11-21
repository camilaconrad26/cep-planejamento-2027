// Árvore do planejamento: objetivo estratégico → ações táticas e operacionais, OKRs/KRs e KPIs, por categoria e período.
import type { Status } from "@/lib/domain/ciclo";
import type { Categoria } from "@/lib/domain/biblioteca";

export type Tri = 1 | 2 | 3 | 4;
export type Visao = "ano" | "s1" | "s2" | "t1" | "t2" | "t3" | "t4";
export const VISOES: Visao[] = ["ano", "s1", "s2", "t1", "t2", "t3", "t4"];
export const ROTULO_VISAO: Record<Visao, string> = {
  ano: "Ano todo", s1: "1º semestre", s2: "2º semestre", t1: "1º trimestre", t2: "2º trimestre", t3: "3º trimestre", t4: "4º trimestre",
};
export const lerVisao = (v: unknown, padrao: Visao): Visao => (VISOES.includes(v as Visao) ? (v as Visao) : padrao);
export function trimestresDa(v: Visao): Tri[] {
  if (v === "ano") return [1, 2, 3, 4];
  if (v === "s1") return [1, 2];
  if (v === "s2") return [3, 4];
  return [Number(v[1]) as Tri];
}
export const trimestreDaVisao = (v: Visao): Tri | null => (v.startsWith("t") ? (Number(v[1]) as Tri) : null);

export type ObjetivoP = { id: string; categoryId: string; titulo: string; descricao: string | null; trimestre: Tri | null; libraryItemId: string | null };
export type TarefaP = { id: string; objectiveId: string | null; nivel: "estrategico" | "tatico" | "operacional"; titulo: string; trimestre: Tri | null; status: Status };
export type OkrP = { id: string; objectiveId: string; titulo: string; trimestre: Tri | null };
export type KrP = { id: string; okrId: string; descricao: string; alvo: number | null };
export type KpiP = { id: string; objectiveId: string | null; nome: string };
export type NoObjetivo = ObjetivoP & {
  taticas: TarefaP[]; operacionais: TarefaP[]; semTrimestre: TarefaP[]; okrs: (OkrP & { krs: KrP[] })[]; kpis: KpiP[]; totalAcoes: number; totalKrs: number;
};
export type GrupoCategoria = { categoria: Categoria; prioritaria: boolean; objetivos: NoObjetivo[] };

export function montarArvore(
  d: { categorias: Categoria[]; objetivos: ObjetivoP[]; tarefas: TarefaP[]; okrs: OkrP[]; krs: KrP[]; kpis: KpiP[]; prioridades: string[] },
  v: Visao,
): GrupoCategoria[] {
  const tris = trimestresDa(v);
  const noPeriodo = (t: Tri | null) => t !== null && tris.includes(t);
  const nos: NoObjetivo[] = d.objetivos.flatMap((o) => {
    const todas = d.tarefas.filter((t) => t.objectiveId === o.id);
    const doPeriodo = todas.filter((t) => noPeriodo(t.trimestre));
    const semTrimestre = v === "ano" ? todas.filter((t) => t.trimestre === null) : [];
    if (!(o.trimestre === null || noPeriodo(o.trimestre) || doPeriodo.length > 0)) return [];
    return [{
      ...o,
      taticas: doPeriodo.filter((t) => t.nivel !== "operacional"),
      operacionais: doPeriodo.filter((t) => t.nivel === "operacional"),
      semTrimestre,
      okrs: d.okrs.filter((k) => k.objectiveId === o.id && (k.trimestre === null || noPeriodo(k.trimestre)))
        .map((k) => ({ ...k, krs: d.krs.filter((r) => r.okrId === k.id) })),
      kpis: d.kpis.filter((k) => k.objectiveId === o.id),
      totalAcoes: todas.length,
      totalKrs: d.krs.filter((r) => d.okrs.some((k) => k.id === r.okrId && k.objectiveId === o.id)).length,
    }];
  });
  const ordenadas = [...d.categorias].sort((a, b) => a.ordem - b.ordem);
  const grupo = (c: Categoria): GrupoCategoria => ({ categoria: c, prioritaria: d.prioridades.includes(c.id), objetivos: nos.filter((o) => o.categoryId === c.id) });
  return [
    ...ordenadas.filter((c) => d.prioridades.includes(c.id)).map(grupo),
    ...ordenadas.filter((c) => !d.prioridades.includes(c.id)).map(grupo).filter((g) => g.objetivos.length > 0),
  ];
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
/** Pergunta antes de excluir um objetivo: diz tudo o que vai junto (ações, resultados-chave e indicadores). */
export function perguntaExclusao(acoes: number, krs: number, kpis: number): string {
  if (!acoes && !krs && !kpis) return "Excluir este objetivo?";
  if (!krs && !kpis) return acoes === 1 ? "Excluir este objetivo e a 1 ação ligada a ele?" : `Excluir este objetivo e as ${acoes} ações ligadas a ele?`;
  const partes = [acoes ? plural(acoes, "ação", "ações") : "", krs ? plural(krs, "resultado-chave", "resultados-chave") : "", kpis ? plural(kpis, "indicador", "indicadores") : ""].filter(Boolean);
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}` : partes[0];
  return `Excluir este objetivo e o que está ligado a ele: ${lista}?`;
}
