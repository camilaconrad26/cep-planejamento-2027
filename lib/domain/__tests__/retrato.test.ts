import { calcularRetrato } from "@/lib/domain/retrato";

const vazio = { ano: 2027, diagnosticoIniciado: false, diagnosticoConcluido: false, prioridades: [], tarefas: [], trimestresRevisados: [] };

it("primeiro acesso: nada iniciado, fase de planejamento", () => {
  const r = calcularRetrato(vazio, "2026-11-20");
  expect(r.retrato).toMatchObject({ diagnosticoIniciado: false, trimestre: 1, fase: "planejamento", categoriasNoTrimestre: 0, atrasadas: 0 });
  expect(r.contagens).toEqual({ total: 0, emAndamento: 0, atrasadas: 0, vencendo7dias: 0, execucaoPct: 0 });
});

it("conta atraso e execução nas tarefas do ciclo", () => {
  const r = calcularRetrato({ ...vazio, diagnosticoIniciado: true, tarefas: [
    { status: "concluido", prazo: "2027-01-20", trimestre: 1, arquivado: false, categoria: null },
    { status: "em_andamento", prazo: "2027-02-01", trimestre: 1, arquivado: false, categoria: null },
    { status: "nao_iniciado", prazo: null, trimestre: 1, arquivado: false, categoria: null },
  ] }, "2027-02-10");
  expect(r.contagens).toEqual({ total: 3, emAndamento: 1, atrasadas: 1, vencendo7dias: 0, execucaoPct: 33 });
  expect(r.retrato.atrasadas).toBe(1);
});

it("vencendo nos próximos 7 dias, inclusive hoje", () => {
  const t = (prazo: string) => ({ status: "nao_iniciado" as const, prazo, trimestre: 1 as const, arquivado: false, categoria: null });
  const r = calcularRetrato({ ...vazio, tarefas: [t("2027-02-10"), t("2027-02-17"), t("2027-02-18")] }, "2027-02-10");
  expect(r.contagens.vencendo7dias).toBe(2);
});

it("tarefas arquivadas ficam fora das contas", () => {
  const r = calcularRetrato({ ...vazio, tarefas: [{ status: "em_andamento", prazo: "2027-01-01", trimestre: 1, arquivado: true, categoria: null }] }, "2027-02-10");
  expect(r.contagens.total).toBe(0);
  expect(r.contagens.atrasadas).toBe(0);
});

it("categoria prioritária sem ação no trimestre", () => {
  const r = calcularRetrato({ ...vazio, diagnosticoIniciado: true,
    prioridades: [{ trimestre: 1, slug: "comercial" }, { trimestre: 1, slug: "financeiro" }, { trimestre: 2, slug: "metodo" }],
    tarefas: [{ status: "nao_iniciado", prazo: null, trimestre: 1, arquivado: false, categoria: "comercial" }] }, "2027-02-10");
  expect(r.retrato.categoriasNoTrimestre).toBe(2);
  expect(r.retrato.categoriasSemAcao).toEqual(["financeiro"]);
  expect(r.prioridades).toEqual(["comercial", "financeiro"]);
});

it("revisão do trimestre anterior pendente só na execução", () => {
  expect(calcularRetrato({ ...vazio, trimestresRevisados: [] }, "2027-05-02").retrato.trimestreAnteriorSemRevisao).toBe(true);
  expect(calcularRetrato({ ...vazio, trimestresRevisados: [1] }, "2027-05-02").retrato.trimestreAnteriorSemRevisao).toBe(false);
  expect(calcularRetrato(vazio, "2027-02-02").retrato.trimestreAnteriorSemRevisao).toBe(false);
});

it("repassa se o diagnóstico foi concluído", () => {
  expect(calcularRetrato({ ...vazio, diagnosticoIniciado: true, diagnosticoConcluido: true }, "2026-11-20").retrato.diagnosticoConcluido).toBe(true);
  expect(calcularRetrato({ ...vazio, diagnosticoIniciado: true }, "2026-11-20").retrato.diagnosticoConcluido).toBe(false);
});
