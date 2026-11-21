import { describe, expect, test } from "vitest";
import { atingido, escala, formatarNumero, mediaKRs, medicaoVencida, progressoKR, serieMensal, situacaoKPI, type KPI, type KR, type Medicao } from "@/lib/domain/resultados";

const kr = (inicial: number | null, alvo: number | null, atual: number | null): KR =>
  ({ id: "k", okrId: "o", descricao: "d", unidade: "", inicial, alvo, atual, prazo: null, atualizadoEm: "2027-01-01T00:00:00Z" });
const med = (data: string, valor: number): Medicao => ({ id: data, data, valor, nota: "" });
const kpi = (sentido: "maior" | "menor", meta: number | null): KPI => ({ id: "p", nome: "x", unidade: "", sentido, meta, objetivoId: null, criadoEm: "2027-01-01T00:00:00Z" });

describe("progresso de KR", () => {
  test("crescente", () => expect(progressoKR(kr(0, 100, 40))).toBeCloseTo(0.4));
  test("decrescente (menor é melhor)", () => expect(progressoKR(kr(10, 2, 6))).toBeCloseTo(0.5));
  test("passou do alvo fica em 100%", () => expect(progressoKR(kr(10, 2, 1))).toBe(1));
  test("abaixo do inicial fica em 0", () => expect(progressoKR(kr(0, 100, -5))).toBe(0));
  test("sem alvo = sem meta numérica", () => expect(progressoKR(kr(0, null, 5))).toBeNull());
  test("inicial vazio = sem cálculo (pede o valor inicial)", () => expect(progressoKR(kr(null, 10, 5))).toBeNull());
  test("zerar com inicial vazio não vira 100%", () => { expect(progressoKR(kr(null, 0, 8))).toBeNull(); expect(atingido(kr(null, 0, 8))).toBe(false); });
  test("atual vazio = 0", () => expect(progressoKR(kr(0, 10, null))).toBe(0));
  test("alvo igual ao inicial: 100% só se o atual está no alvo", () => {
    expect(progressoKR(kr(5, 5, 5))).toBe(1); expect(progressoKR(kr(5, 5, null))).toBe(1); expect(progressoKR(kr(10, 10, 3))).toBe(0);
  });
  test("atingido", () => { expect(atingido(kr(0, 10, 10))).toBe(true); expect(atingido(kr(0, 10, 9))).toBe(false); expect(atingido(kr(0, null, 9))).toBe(false); });
  test("média ignora sem meta", () => expect(mediaKRs([kr(0, 10, 5), kr(0, null, 3), kr(0, 10, 10)])).toBeCloseTo(0.75));
  test("média vazia", () => expect(mediaKRs([kr(0, null, 3)])).toBeNull());
});

describe("KPI", () => {
  const ms = [med("2027-02-10", 35), med("2027-01-15", 20)];
  test("maior é melhor: na meta pela última por data", () => expect(situacaoKPI(kpi("maior", 30), ms)).toEqual({ ultima: ms[0], situacao: "na-meta" }));
  test("menor é melhor: fora da meta", () => expect(situacaoKPI(kpi("menor", 30), ms).situacao).toBe("fora-da-meta"));
  test("sem meta", () => expect(situacaoKPI(kpi("maior", null), ms).situacao).toBe("sem-meta"));
  test("sem medição", () => expect(situacaoKPI(kpi("maior", 30), [])).toEqual({ ultima: null, situacao: "sem-medicao" }));
  test("série mensal: última do mês, meses em ordem", () =>
    expect(serieMensal([med("2027-02-20", 5), med("2027-01-15", 20), med("2027-02-03", 9), med("2027-01-31", 22)])).toEqual([{ mes: "2027-01", valor: 22 }, { mes: "2027-02", valor: 5 }]));
  test("medição vencida", () => {
    expect(medicaoVencida("2027-01-01", "2026-12-01T00:00:00Z", "2027-02-01")).toBe(true);
    expect(medicaoVencida("2027-01-02", "2026-12-01T00:00:00Z", "2027-02-01")).toBe(false);
    expect(medicaoVencida(null, "2026-12-01T10:00:00Z", "2027-01-10")).toBe(true);
    expect(medicaoVencida(null, "2027-01-01T10:00:00Z", "2027-01-10")).toBe(false);
  });
});

test("formatar número", () => {
  expect(formatarNumero(12.5, "%")).toBe("12,5 %");
  expect(formatarNumero(1200, "R$")).toBe("R$ 1.200");
  expect(formatarNumero(3, "contratos")).toBe("3 contratos");
  expect(formatarNumero(null)).toBe("—");
});
test("escala com números redondos", () => {
  expect(escala(0, 97)).toEqual([0, 25, 50, 75, 100]);
  expect(escala(20, 35)).toEqual([20, 25, 30, 35]);
  expect(escala(5, 5)).toEqual([0, 5, 10]);
});

test("conta KRs com meta e KPIs sem medição há mais de 30 dias", async () => {
  const { contarMedicoesVencidas } = await import("@/lib/domain/resultados");
  const krs = [
    { ...kr(0, 10, 2), atualizadoEm: "2026-12-01T00:00:00Z" }, // vencido
    { ...kr(0, null, 2), atualizadoEm: "2026-12-01T00:00:00Z" }, // sem meta numérica: não conta
    { ...kr(0, 10, 2), atualizadoEm: "2027-01-20T00:00:00Z" },
  ];
  const kpis = [{ ...kpi("maior", 1), id: "a" }, { ...kpi("maior", 1), id: "b", criadoEm: "2027-01-25T00:00:00Z" }];
  expect(contarMedicoesVencidas(krs, kpis, { a: "2026-12-20" }, "2027-02-01")).toBe(2);
});

describe("revisão final", () => {
  test("número estrito: texto não vira 0", async () => {
    const { lerNumeroEstrito } = await import("@/lib/domain/resultados");
    expect(lerNumeroEstrito("")).toBeNull();
    expect(lerNumeroEstrito("12,5")).toBe(12.5);
    expect(lerNumeroEstrito("R$ 1.000")).toBe(1000);
    expect(lerNumeroEstrito("30%")).toBe(30);
    expect(lerNumeroEstrito("-2")).toBe(-2);
    expect(lerNumeroEstrito("abc")).toBeUndefined();
    expect(lerNumeroEstrito("dez")).toBeUndefined();
    expect(lerNumeroEstrito("10 a 12")).toBeUndefined();
    expect(lerNumeroEstrito("1/2")).toBeUndefined();
  });
  test("data da medição: não aceita futuro nem ano absurdo", async () => {
    const { dataMedicaoValida } = await import("@/lib/domain/resultados");
    expect(dataMedicaoValida("2027-02-10", "2027-03-01")).toBe(true);
    expect(dataMedicaoValida("2027-03-01", "2027-03-01")).toBe(true);
    expect(dataMedicaoValida("2027-03-02", "2027-03-01")).toBe(false);
    expect(dataMedicaoValida("2072-01-01", "2027-03-01")).toBe(false);
    expect(dataMedicaoValida("2019-12-31", "2027-03-01")).toBe(false);
    expect(dataMedicaoValida("2027-02-31", "2027-03-01")).toBe(false);
  });
  test("mesma data: vale a medição registrada por último", () => {
    const a = { id: "a", data: "2027-02-10", valor: 10, nota: "", criadoEm: "2027-02-10T10:00:00Z" };
    const b = { id: "b", data: "2027-02-10", valor: 12, nota: "", criadoEm: "2027-02-10T15:00:00Z" };
    expect(situacaoKPI(kpi("maior", 11), [b, a]).ultima?.id).toBe("b");
    expect(serieMensal([b, a])).toEqual([{ mes: "2027-02", valor: 12 }]);
  });
});
