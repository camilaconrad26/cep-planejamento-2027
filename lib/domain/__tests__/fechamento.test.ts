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
