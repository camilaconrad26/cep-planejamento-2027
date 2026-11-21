import { describe, expect, test } from "vitest";
import {
  acoesNoDia, filtrarAcoes, gradeMes, lerFiltrosAcoes, listasPrioridades, normalizar, ordenarAcoes, progresso, semanaDe, somarDias, somarMeses,
  type Acao,
} from "@/lib/domain/acoes";

const base: Acao = { id: "", titulo: "", objetivo: null, categoria: null, nivel: "tatico", responsavel: "", prioridade: "media", status: "nao_iniciado", inicio: null, prazo: null, trimestre: null };
const a = (id: string, p: Partial<Acao> = {}): Acao => ({ ...base, id, titulo: id, ...p });
const com = { slug: "comercial", nome: "Comercial" }, fin = { slug: "financeiro", nome: "Financeiro" };
const lista = [
  a("Reunião com contador", { categoria: com, trimestre: 1, responsavel: "Ana", prazo: "2027-03-09" }),
  a("Gravar vídeo", { categoria: fin, nivel: "operacional", trimestre: 2, objetivo: "Autoridade" }),
  a("Fechar contrato", { categoria: com, status: "concluido", prazo: "2027-01-02" }),
];
const f = (q: Record<string, string> = {}) => lerFiltrosAcoes(q, ["comercial", "financeiro"]);
const ids = (l: Acao[]) => l.map((x) => x.id);
const HOJE = "2027-03-10";

describe("filtros", () => {
  test("padrões e valores inválidos", () => {
    expect(lerFiltrosAcoes({ visao: "x", trimestre: "9", status: "y", ordem: "z", sentido: "w", cal: "q", categoria: "nao", nivel: "kpi" }, ["comercial"])).toEqual({
      visao: "tabela", q: "", categoria: null, nivel: null, trimestre: null, status: null, atrasadas: false, concluidas: false, ordem: "prazo", sentido: "asc", cal: "mes", data: null,
    });
  });
  test("data inválida é ignorada", () => expect(f({ data: "2027-02-31" }).data).toBeNull());
  test("normalizar tira acentos", () => expect(normalizar("Reunião ÁGIL")).toBe("reuniao agil"));
  test("busca sem acento, por título, objetivo e responsável", () => {
    expect(ids(filtrarAcoes(lista, f({ q: "reuniao" }), HOJE))).toEqual(["Reunião com contador"]);
    expect(ids(filtrarAcoes(lista, f({ q: "autoridade" }), HOJE))).toEqual(["Gravar vídeo"]);
    expect(ids(filtrarAcoes(lista, f({ q: "ana" }), HOJE))).toEqual(["Reunião com contador"]);
  });
  test("categoria, nível, trimestre", () => {
    expect(ids(filtrarAcoes(lista, f({ categoria: "financeiro" }), HOJE))).toEqual(["Gravar vídeo"]);
    expect(ids(filtrarAcoes(lista, f({ nivel: "operacional" }), HOJE))).toEqual(["Gravar vídeo"]);
    expect(ids(filtrarAcoes(lista, f({ trimestre: "1" }), HOJE))).toEqual(["Reunião com contador"]);
  });
  test("atrasadas", () => expect(ids(filtrarAcoes(lista, f({ atrasadas: "1" }), HOJE))).toEqual(["Reunião com contador"]));
  test("concluídas ocultas por padrão; visíveis com concluidas=1 ou status=concluido", () => {
    expect(ids(filtrarAcoes(lista, f(), HOJE))).not.toContain("Fechar contrato");
    expect(ids(filtrarAcoes(lista, f({ concluidas: "1" }), HOJE))).toContain("Fechar contrato");
    expect(ids(filtrarAcoes(lista, f({ status: "concluido" }), HOJE))).toEqual(["Fechar contrato"]);
  });
});

describe("ordenação", () => {
  const l = [a("b", { prazo: "2027-02-01", prioridade: "baixa" }), a("a", { prazo: null, prioridade: "alta" }), a("c", { prazo: "2027-01-01" })];
  test("prazo asc com vazio por último", () => expect(ids(ordenarAcoes(l, "prazo", "asc"))).toEqual(["c", "b", "a"]));
  test("prazo desc com vazio por último", () => expect(ids(ordenarAcoes(l, "prazo", "desc"))).toEqual(["b", "c", "a"]));
  test("prioridade desc: alta, média, baixa", () => expect(ids(ordenarAcoes(l, "prioridade", "desc"))).toEqual(["a", "c", "b"]));
  test("título", () => expect(ids(ordenarAcoes(l, "titulo", "asc"))).toEqual(["a", "b", "c"]));
});

test("progresso pelo status", () => {
  expect(progresso("nao_iniciado")).toBe(0); expect(progresso("em_andamento")).toBe(50); expect(progresso("concluido")).toBe(100);
});

test("listas de prioridade", () => {
  const l = [
    a("vencida", { prazo: "2027-03-01" }), a("hoje", { prazo: "2027-03-10" }), a("limite", { prazo: "2027-03-17" }), a("fora", { prazo: "2027-03-18" }),
    a("alta", { prioridade: "alta" }), a("alta-vencida", { prioridade: "alta", prazo: "2027-02-01" }), a("feita", { prazo: "2027-03-01", status: "concluido" }),
  ];
  const r = listasPrioridades(l, HOJE);
  expect(ids(r.vencidas)).toEqual(["alta-vencida", "vencida"]);
  expect(ids(r.vencendo)).toEqual(["hoje", "limite"]);
  expect(ids(r.alta)).toEqual(["alta"]);
});

describe("calendário", () => {
  test("agosto de 2027 começa num domingo e tem 5 semanas", () => {
    const g = gradeMes(2027, 8);
    expect(g[0][0]).toBe("2027-08-01"); expect(g).toHaveLength(5); expect(g[4][6]).toBe("2027-09-04");
  });
  test("maio de 2027 começa num sábado", () => { const g = gradeMes(2027, 5); expect(g[0][0]).toBe("2027-04-25"); expect(g[0][6]).toBe("2027-05-01"); });
  test("semana na virada do ano", () => expect(semanaDe("2027-01-01")).toEqual(["2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]));
  test("somar dias e meses", () => {
    expect(somarDias("2027-12-31", 1)).toBe("2028-01-01");
    expect(somarMeses("2027-12-15", 1)).toBe("2028-01-01");
    expect(somarMeses("2027-01-31", -1)).toBe("2026-12-01");
  });
  test("ações do dia pelo prazo", () => expect(ids(acoesNoDia(lista, "2027-03-09"))).toEqual(["Reunião com contador"]));
});

describe("revisão final", () => {
  test("data de conclusão só muda quando o status muda", async () => {
    const { conclusao } = await import("@/lib/domain/acoes");
    expect(conclusao("concluido", "concluido", "2027-05-01T00:00:00Z")).toEqual({});
    expect(conclusao("em_andamento", "concluido", "2027-05-01T00:00:00Z")).toEqual({ concluido_em: "2027-05-01T00:00:00Z" });
    expect(conclusao("concluido", "em_andamento", "2027-05-01T00:00:00Z")).toEqual({ concluido_em: null });
    expect(conclusao("nao_iniciado", "em_andamento", "x")).toEqual({});
  });
  test("cabeçalho alterna o sentido, inclusive prioridade", async () => {
    const { proximoSentido } = await import("@/lib/domain/acoes");
    expect(proximoSentido({ ...f(), ordem: "prioridade", sentido: "desc" }, "prioridade")).toBe("asc");
    expect(proximoSentido({ ...f(), ordem: "prioridade", sentido: "asc" }, "prioridade")).toBe("desc");
    expect(proximoSentido({ ...f(), ordem: "prazo", sentido: "asc" }, "prioridade")).toBe("desc");
    expect(proximoSentido({ ...f(), ordem: "prazo", sentido: "asc" }, "prazo")).toBe("desc");
    expect(proximoSentido({ ...f(), ordem: "prioridade", sentido: "asc" }, "titulo")).toBe("asc");
  });
  test("datas fora de 2000–2100 são ignoradas", () => expect(f({ data: "0001-01-01" }).data).toBeNull());
});
