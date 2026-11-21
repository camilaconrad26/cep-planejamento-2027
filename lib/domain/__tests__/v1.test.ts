import { expect, test } from "vitest";
import { mapearV1 } from "@/lib/domain/v1";

test("dados vazios não quebram", () => {
  const r = mapearV1({});
  expect(r.perfil).toBeNull();
  expect(r.itens).toEqual([]);
  expect(r.metas.anual.meta.faturamento).toBe(0);
});

test("mapeia o planejamento da versão anterior", () => {
  const r = mapearV1({
    perfil: 2,
    retro: { fat: "R$ 1.000.000,00", meta: "1.200.000", contratos: "20", origem: "Indicação", notas: { 1: 7 }, conquistas: "Fechei holdings\nParceria com contador",
      pend: [{ texto: "Site novo", destino: "levar", tri: "2", feito: true }, { texto: "Curso", destino: "encerrar" }] },
    metas: { anual: { fat: { 0: "R$ 1.200.000,00", 1: "1.500.000" }, lucro: { 0: "30" }, time: { 0: "3" } }, tri: { 1: { 0: "300.000" } },
      prod: { 2: { nome: "Holding", ticket: "30.000", v0: "20" } }, porque: "Sede própria" },
    itens: { p2c1n1: { fazer: true, tri: "2", prazo: "2027-03-01", status: "Concluído" }, p2c1n0: { fazer: false } },
    custom: [{ cat: 3, nivel: 0, texto: "Método próprio", fazer: true, tri: "1" }, { cat: 3, nivel: 2, texto: "Checklist", fazer: true }, { cat: 0, nivel: 1, texto: "", fazer: true }],
    tarefas: [{ texto: "Ligar para o contador", tri: "1", feito: false }],
    vendas: { 3: [{ produto: "Holding", acao: "Live", ticket: "30.000", qtd: "2", resp: "Eu" }] },
    tri: { 1: { realizado: "150.000", aprendizado: "Começar cedo", ajustes: [{ id: "x", texto: "Mais lives" }] } },
  });
  expect(r.perfil).toBe(2);
  expect(r.fechamento.faturamento).toBe(1000000);
  expect(r.fechamento.notas.comercial).toBe(7);
  expect(r.fechamento.listas.deuCerto.map((i) => i.texto)).toEqual(["Fechei holdings", "Parceria com contador"]);
  expect(r.itens).toEqual([{ perfil: 2, cat: 1, nivel: 1, tri: 2, prazo: "2027-03-01", status: "concluido" }]);
  expect(r.proprios).toEqual([
    { cat: 3, nivel: 0, texto: "Método próprio", tri: 1, prazo: null, status: "nao_iniciado" },
    { cat: 3, nivel: 2, texto: "Checklist", tri: null, prazo: null, status: "nao_iniciado" },
  ]);
  expect(r.tarefas).toEqual([{ texto: "Ligar para o contador", tri: 1, feito: false }]);
  expect(r.pendencias).toEqual([{ texto: "Site novo", tri: 2, feito: true }]);
  expect(r.metas.anual.meta).toEqual({ faturamento: 1200000, lucratividade: 30, anuncios: 0, time: 3 });
  expect(r.metas.anual.super.faturamento).toBe(1500000);
  expect(r.metas.trimestres[1].meta).toBe(300000);
  expect(r.metas.produtos.alto_valor).toEqual({ nome: "Holding", ticket: 30000, vendas: { meta: 20, super: 0, mega: 0 } });
  expect(r.metas.porque).toBe("Sede própria");
  expect(r.metas.realizado[1]).toBe(150000);
  expect(r.vendas).toEqual([{ mes: 4, produto: "Holding", acao: "Live", ticket: 30000, quantidade: 2, responsavel: "Eu" }]);
  expect(r.revisoes).toEqual([{ trimestre: 1, aprendizado: "Começar cedo", ajustes: ["Mais lives"] }]);
});
