import { expect, test } from "vitest";
import { PERGUNTAS_REVISAO, compararRetratos, montarRetratoRevisao } from "@/lib/domain/revisao";

test("perguntas exatas da especificação", () => expect(PERGUNTAS_REVISAO.map((p) => p.texto)).toEqual([
  "O que foi executado?", "O que não foi executado?", "Quais resultados foram alcançados?", "O que impediu a execução?",
  "Quais estratégias funcionaram?", "Quais precisam ser alteradas?", "O que será prioridade no próximo ciclo?",
]));

const dados = {
  tarefas: [{ trimestre: 2, status: "concluido" }, { trimestre: 2, status: "em_andamento" }, { trimestre: 2, status: "nao_iniciado" }, { trimestre: 1, status: "concluido" }] as const,
  krs: [{ inicial: 0, alvo: 10, atual: 5 }, { inicial: 0, alvo: 10, atual: 10 }, { inicial: null, alvo: null, atual: 3 }],
  kpis: [{ sentido: "maior" as const, meta: 30, medicoes: [{ id: "a", data: "2027-05-01", valor: 35, nota: "" }] }, { sentido: "maior" as const, meta: 30, medicoes: [] }],
  metaTrimestre: 300000, realizado: 150000,
};

test("retrato do trimestre", () => expect(montarRetratoRevisao({ ...dados, tarefas: [...dados.tarefas] }, 2)).toEqual({
  trimestre: 2,
  execucao: { total: 3, concluidas: 1, pct: 1 / 3 },
  krs: { media: 0.75, atingidos: 1, comMeta: 2 },
  kpis: { naMeta: 1, total: 2 },
  faturamento: { realizado: 150000, meta: 300000, pct: 0.5 },
}));

test("comparação com a revisão anterior", () => {
  const atual = montarRetratoRevisao({ ...dados, tarefas: [...dados.tarefas] }, 2);
  const anterior = { ...atual, trimestre: 1, execucao: { total: 2, concluidas: 1, pct: 0.5 }, faturamento: { realizado: 100000, meta: 300000, pct: 1 / 3 } };
  const c = compararRetratos(atual, anterior);
  expect(c.find((x) => x.campo === "Execução das ações")).toMatchObject({ antes: 0.5, depois: 1 / 3 });
  expect(c.find((x) => x.campo === "Faturamento realizado")).toMatchObject({ antes: 100000, depois: 150000 });
  expect(compararRetratos(atual, null).every((x) => x.antes === null)).toBe(true);
});
