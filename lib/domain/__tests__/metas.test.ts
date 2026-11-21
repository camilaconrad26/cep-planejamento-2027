import { describe, expect, test } from "vitest";
import {
  anunciosEmReais, cenarioProdutos, comparar, crescimento, dividirEmQuatro, formatarPct, lucroProjetado, mediaMensal,
  metasVazias, pctRealizado, previstoMes, previstoTrimestre, somaTrimestres, type AcaoVenda,
} from "@/lib/domain/metas";

describe("meta anual", () => {
  test("lucro projetado", () => expect(lucroProjetado(1_000_000, 30)).toBe(300000));
  test("anúncios em reais", () => expect(anunciosEmReais(1_000_000, 5)).toBe(50000));
  test("média mensal", () => expect(mediaMensal(1_200_000)).toBe(100000));
  test("crescimento", () => expect(crescimento(1_200_000, 1_000_000)).toBeCloseTo(0.2));
  test("crescimento sem base", () => expect(crescimento(1, 0)).toBeNull());
  test("crescimento sem meta", () => expect(crescimento(0, 1000)).toBeNull());
});

describe("comparar", () => {
  test("falta", () => expect(comparar(990_000, 1_000_000)).toEqual({ tipo: "falta", valor: 10000 }));
  test("fecha", () => expect(comparar(1_000_000.4, 1_000_000).tipo).toBe("fecha"));
  test("acima", () => expect(comparar(1_100_000, 1_000_000)).toEqual({ tipo: "acima", valor: 100000 }));
  test("sem meta", () => expect(comparar(5, 0).tipo).toBe("sem-meta"));
});

test("dividir em quatro com soma exata", () => expect(dividirEmQuatro(1_000_001)).toEqual([250000, 250000, 250000, 250001]));

test("cenário de produtos e soma dos trimestres", () => {
  const m = metasVazias();
  m.produtos.entrada = { nome: "Sessão", ticket: 500, vendas: { meta: 100, super: 0, mega: 0 } };
  m.produtos.alto_valor = { nome: "Holding", ticket: 30000, vendas: { meta: 20, super: 0, mega: 0 } };
  expect(cenarioProdutos(m, "meta")).toBe(650000);
  m.trimestres[1].meta = 100; m.trimestres[4].meta = 50;
  expect(somaTrimestres(m, "meta")).toBe(150);
  expect(somaTrimestres(m, "mega")).toBe(0);
});

test("realizado", () => {
  expect(pctRealizado(150_000, 300_000)).toBe(0.5);
  expect(pctRealizado(0, 300_000)).toBeNull();
  expect(pctRealizado(10, 0)).toBeNull();
});

test("ações de vendas por mês e trimestre", () => {
  const a = (mes: number, ticket: number, quantidade: number): AcaoVenda => ({ id: String(mes) + ticket, mes, produto: "", acao: "", ticket, quantidade, responsavel: "" });
  const acoes = [a(3, 1000, 2), a(4, 30000, 2), a(6, 500, 4), a(7, 9, 9)];
  expect(previstoMes(acoes, 4)).toBe(60000);
  expect(previstoTrimestre(acoes, 2)).toBe(62000);
});

test("formatar percentual", () => {
  expect(formatarPct(0.2)).toBe("+20%");
  expect(formatarPct(-0.125)).toBe("−12,5%");
  expect(formatarPct(null)).toBe("—");
});
