import { describe, expect, test } from "vitest";
import { agruparPorCategoria, filtrarItens, lerFiltros, textoAdicionado, type Categoria, type ItemBiblioteca } from "@/lib/domain/biblioteca";

const cat = (id: string, slug: string, ordem: number): Categoria => ({ id, slug, nome: slug, descricao: "", objetivo: "", ordem });
const cats = [cat("c1", "comercial", 2), cat("c2", "metodo", 1), cat("c3", "financeiro", 3)];
const it = (id: string, categoryId: string, perfil: 1 | 2 | 3, nivel: ItemBiblioteca["nivel"], ativo = true): ItemBiblioteca =>
  ({ id, categoryId, perfil, nivel, texto: id, parentId: null, ordem: 0, ativo });
const itens = [it("a", "c1", 1, "kpi"), it("b", "c1", 1, "estrategico"), it("c", "c1", 2, "tatico"), it("d", "c2", 1, "tatico", false), it("e", "c2", 1, "okr")];
const ids = (l: ItemBiblioteca[]) => l.map((i) => i.id);

describe("lerFiltros", () => {
  test("padrão é o perfil da aluna, sem categoria e sem nível", () =>
    expect(lerFiltros({}, 2, ["comercial"])).toEqual({ perfil: 2, categoria: null, nivel: null }));
  test("aluna sem perfil vê o Perfil 1", () => expect(lerFiltros({}, null, []).perfil).toBe(1));
  test("valores inválidos são ignorados", () =>
    expect(lerFiltros({ perfil: "9", categoria: "nao-existe", nivel: "xyz" }, 3, ["comercial"])).toEqual({ perfil: 3, categoria: null, nivel: null }));
  test("valores válidos da URL vencem o padrão", () =>
    expect(lerFiltros({ perfil: "1", categoria: "comercial", nivel: "kpi" }, 3, ["comercial"])).toEqual({ perfil: 1, categoria: "comercial", nivel: "kpi" }));
  test("array usa o primeiro valor", () => expect(lerFiltros({ perfil: ["2", "3"] }, 1, []).perfil).toBe(2));
});

describe("filtrarItens", () => {
  test("filtra perfil, categoria (por slug) e nível; esconde inativos", () => {
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: null, nivel: null }, cats))).toEqual(["a", "b", "e"]);
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: "comercial", nivel: "kpi" }, cats))).toEqual(["a"]);
  });
  test("incluirInativos mostra os inativos (tela da admin)", () =>
    expect(ids(filtrarItens(itens, { perfil: 1, categoria: "metodo", nivel: null }, cats, true))).toEqual(["d", "e"]));
});

describe("agruparPorCategoria", () => {
  test("ordena categorias por ordem e itens Estratégico → KPI; omite categoria vazia", () =>
    expect(agruparPorCategoria(filtrarItens(itens, { perfil: 1, categoria: null, nivel: null }, cats), cats)
      .map((g) => [g.categoria.slug, ids(g.itens)])).toEqual([["metodo", ["e"]], ["comercial", ["b", "a"]]]));
});

describe("textoAdicionado", () => {
  test("tarefa nova com objetivo criado junto", () =>
    expect(textoAdicionado({ criado: "tarefa", objetivo_criado: true, ja_no_plano: false }, 2))
      .toBe("Adicionado ao 2º trimestre. O objetivo estratégico da categoria entrou junto."));
  test("já estava no plano", () =>
    expect(textoAdicionado({ criado: "tarefa", objetivo_criado: false, ja_no_plano: true }, 1)).toBe("Este item já está no seu plano."));
  test("objetivo", () =>
    expect(textoAdicionado({ criado: "objetivo", objetivo_criado: true, ja_no_plano: false }, 3)).toBe("Objetivo adicionado ao 3º trimestre."));
  test("KR sem objetivo novo", () =>
    expect(textoAdicionado({ criado: "kr", objetivo_criado: false, ja_no_plano: false }, 4)).toBe("Adicionado ao 4º trimestre."));
  test("KPI não tem trimestre", () =>
    expect(textoAdicionado({ criado: "kpi", objetivo_criado: true, ja_no_plano: false }, 4))
      .toBe("Indicador adicionado ao seu plano. O objetivo estratégico da categoria entrou junto."));
});
