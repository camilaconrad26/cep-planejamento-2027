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
  test("inicial vazio conta 0", () => expect(progressoKR(kr(null, 10, 5))).toBeCloseTo(0.5));
  test("atual vazio = 0", () => expect(progressoKR(kr(0, 10, null))).toBe(0));
  test("alvo igual ao inicial", () => { expect(progressoKR(kr(5, 5, 5))).toBe(1); expect(progressoKR(kr(5, 5, null))).toBe(1); });
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
