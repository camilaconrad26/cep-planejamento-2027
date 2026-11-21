import { describe, expect, test } from "vitest";
import { lerVisao, montarArvore, trimestresDa, type ObjetivoP, type TarefaP } from "@/lib/domain/arvore";
import type { Categoria } from "@/lib/domain/biblioteca";

const cat = (id: string, slug: string, ordem: number): Categoria => ({ id, slug, nome: slug, descricao: "", objetivo: "", ordem });
const categorias = [cat("cm", "comercial", 2), cat("me", "metodo", 4), cat("fi", "financeiro", 6)];
const O1: ObjetivoP = { id: "O1", categoryId: "cm", titulo: "Fechar contratos", descricao: null, trimestre: 2, libraryItemId: null };
const O2: ObjetivoP = { id: "O2", categoryId: "me", titulo: "Método próprio", descricao: null, trimestre: null, libraryItemId: "lib" };
const t = (id: string, nivel: TarefaP["nivel"], trimestre: TarefaP["trimestre"]): TarefaP => ({ id, objectiveId: "O1", nivel, titulo: id, trimestre, status: "nao_iniciado" });
const tarefas = [t("T1", "tatico", 2), t("T2", "operacional", 3), t("T3", "operacional", null)];
const dados = { categorias, objetivos: [O1, O2], tarefas, okrs: [], krs: [], kpis: [], prioridades: ["me"] };
const resumo = (v: Parameters<typeof montarArvore>[1]) => montarArvore(dados, v).map((g) => ({
  cat: g.categoria.slug, prio: g.prioritaria,
  objs: g.objetivos.map((o) => ({ id: o.id, tat: o.taticas.map((x) => x.id), op: o.operacionais.map((x) => x.id), sem: o.semTrimestre.map((x) => x.id), total: o.totalAcoes })),
}));

describe("visões", () => {
  test("trimestres do 2º semestre", () => expect(trimestresDa("s2")).toEqual([3, 4]));
  test("ano todo", () => expect(trimestresDa("ano")).toEqual([1, 2, 3, 4]));
  test("visão inválida cai no padrão", () => expect(lerVisao("x", "t1")).toBe("t1"));
  test("visão válida", () => expect(lerVisao("s1", "t1")).toBe("s1"));
});

describe("montarArvore", () => {
  test("2º trimestre: prioritária primeiro, tarefas do período", () => expect(resumo("t2")).toEqual([
    { cat: "metodo", prio: true, objs: [{ id: "O2", tat: [], op: [], sem: [], total: 0 }] },
    { cat: "comercial", prio: false, objs: [{ id: "O1", tat: ["T1"], op: [], sem: [], total: 3 }] },
  ]));
  test("3º trimestre: objetivo aparece porque tem ação no período", () =>
    expect(resumo("t3")[1]).toEqual({ cat: "comercial", prio: false, objs: [{ id: "O1", tat: [], op: ["T2"], sem: [], total: 3 }] }));
  test("1º trimestre: só a prioridade com objetivo sem trimestre", () => expect(resumo("t1").map((g) => g.cat)).toEqual(["metodo"]));
  test("ano: sem trimestre em grupo próprio", () =>
    expect(resumo("ano")[1].objs[0]).toEqual({ id: "O1", tat: ["T1"], op: ["T2"], sem: ["T3"], total: 3 }));
  test("prioritária sem objetivo aparece vazia; não prioritária vazia não aparece", () => {
    const g = montarArvore({ ...dados, objetivos: [], tarefas: [], prioridades: ["fi"] }, "t1");
    expect(g.map((x) => [x.categoria.slug, x.objetivos.length])).toEqual([["financeiro", 0]]);
  });
  test("OKR filtrado pelo período, KPI sempre", () => {
    const g = montarArvore({ ...dados, okrs: [{ id: "K", objectiveId: "O2", titulo: "okr", trimestre: 3 }], krs: [{ id: "kr", okrId: "K", descricao: "KR: x", alvo: null }],
      kpis: [{ id: "P", objectiveId: "O2", nome: "kpi" }] }, "t1");
    expect(g[0].objetivos[0].okrs).toEqual([]);
    expect(g[0].objetivos[0].kpis.map((k) => k.id)).toEqual(["P"]);
    const g3 = montarArvore({ ...dados, okrs: [{ id: "K", objectiveId: "O2", titulo: "okr", trimestre: 3 }], krs: [{ id: "kr", okrId: "K", descricao: "KR: x", alvo: null }], kpis: [] }, "t3");
    expect(g3[0].objetivos[0].okrs[0].krs.map((k) => k.id)).toEqual(["kr"]);
  });
});

describe("exclusão de objetivo", () => {
  test("conta resultados-chave de todos os OKRs, mesmo fora do período", () => {
    const g = montarArvore({ ...dados, okrs: [{ id: "K", objectiveId: "O2", titulo: "okr", trimestre: 3 }], krs: [{ id: "kr", okrId: "K", descricao: "KR: x", alvo: null }], kpis: [] }, "t1");
    expect(g[0].objetivos[0].totalKrs).toBe(1);
  });
  test("textos da pergunta", async () => {
    const { perguntaExclusao } = await import("@/lib/domain/arvore");
    expect(perguntaExclusao(0, 0, 0)).toBe("Excluir este objetivo?");
    expect(perguntaExclusao(2, 0, 0)).toBe("Excluir este objetivo e as 2 ações ligadas a ele?");
    expect(perguntaExclusao(1, 0, 0)).toBe("Excluir este objetivo e a 1 ação ligada a ele?");
    expect(perguntaExclusao(2, 1, 1)).toBe("Excluir este objetivo e o que está ligado a ele: 2 ações, 1 resultado-chave e 1 indicador?");
    expect(perguntaExclusao(0, 2, 0)).toBe("Excluir este objetivo e o que está ligado a ele: 2 resultados-chave?");
  });
});
