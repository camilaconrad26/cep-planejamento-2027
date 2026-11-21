import { lerFechamento } from "@/lib/domain/fechamento";

it("dados ausentes viram fechamento vazio", () => {
  const f = lerFechamento(null);
  expect(f.faturamento).toBe(0);
  expect(f.listas.parar).toEqual([]);
});
it("texto livre antigo vira itens, um por linha", () => {
  const f = lerFechamento({ listas: { parar: "Atender sem contrato\n\nResponder à noite" } });
  expect(f.listas.parar.map((i) => i.texto)).toEqual(["Atender sem contrato", "Responder à noite"]);
});
it("ignora lixo nas listas", () => {
  expect(lerFechamento({ listas: { comecar: [{ id: "1", texto: "ok" }, null, { id: 2 }] } }).listas.comecar).toHaveLength(1);
});

it("a ajuda das pendências descreve o que a tela faz", async () => {
  const { LISTAS } = await import("@/lib/domain/fechamento");
  expect(LISTAS.find((l) => l.chave === "pendencias")?.ajuda).toBe(
    "O que ficou em aberto. Escolha o destino; para o que for levado para 2027, escolha o trimestre e clique em Criar tarefa.");
});

it("listas do relatório: as 7, na ordem da tela, só as preenchidas", async () => {
  const { listasPreenchidas } = await import("@/lib/domain/fechamento");
  const item = (texto: string) => ({ id: texto, texto });
  const f = lerFechamento({ listas: {
    deuCerto: [item("A")], naoFuncionou: [item("B")], aprendizados: [item("C")], parar: [item("D")],
    continuar: [], comecar: [item("F")], pendencias: [item("G"), item("H")] } });
  expect(listasPreenchidas(f).map((l) => [l.chave, l.textos])).toEqual([
    ["deuCerto", ["A"]], ["naoFuncionou", ["B"]], ["aprendizados", ["C"]], ["parar", ["D"]], ["comecar", ["F"]], ["pendencias", ["G", "H"]],
  ]);
});
