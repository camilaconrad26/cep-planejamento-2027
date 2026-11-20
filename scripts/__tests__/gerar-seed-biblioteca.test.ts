// @vitest-environment node
import { carregarFonte, gerarSeed, idItem } from "../gerar-seed-biblioteca";

const { SEMENTE, CATS } = carregarFonte();

it("a fonte do Notion tem 3 perfis × 7 categorias × 5 níveis", () => {
  expect(SEMENTE.length).toBe(3);
  expect(SEMENTE.every((p) => p.length === 7 && p.every((c) => c.length === 5))).toBe(true);
  expect(CATS.length).toBe(7);
});

it("gera 105 itens com o texto intacto", () => {
  const sql = gerarSeed(SEMENTE, CATS);
  expect(sql.match(/insert into public\.cep_library_items/gi)?.length).toBe(105);
  expect(sql).toContain("Objetivo: transformar conversas iniciais em contratações de diagnóstico");
  expect(sql).toContain("KR: realizar 10 conversas iniciais e fechar 3 diagnósticos em 90 dias");
});

it("táticos, operacionais, OKR e KPI apontam para o estratégico do mesmo perfil e categoria", () => {
  const sql = gerarSeed(SEMENTE, CATS);
  const linhaTatico = sql.split("\n").find((l) => l.includes(`'${idItem(2, 1, 1)}'`))!;
  expect(linhaTatico).toContain(`'${idItem(2, 1, 0)}'`);
  const linhaEstrategico = sql.split("\n").find((l) => l.includes(`('${idItem(2, 1, 0)}'`))!;
  expect(linhaEstrategico).toMatch(/'estrategico', .*null/);
});

it("ids são estáveis entre execuções", () => {
  expect(idItem(1, 0, 0)).toBe(idItem(1, 0, 0));
  expect(idItem(1, 0, 0)).not.toBe(idItem(1, 0, 1));
  expect(idItem(1, 0, 0)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

it("cadastra as 7 categorias com os slugs do sistema", () => {
  const sql = gerarSeed(SEMENTE, CATS);
  for (const s of ["posicionamento", "comercial", "parcerias", "metodo", "experiencia", "financeiro", "operacao"])
    expect(sql).toContain(`'${s}'`);
});

it("escapa aspas simples", () => {
  expect(gerarSeed([[["O'teste", "b", "c", "d", "e"]]], ["X"])).toContain("O''teste");
});

it("é repetível: não duplica se aplicado de novo", () => {
  expect(gerarSeed(SEMENTE, CATS)).toMatch(/on conflict \(id\) do nothing/);
});
