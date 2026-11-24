import { primeiroNome, saudacao } from "@/lib/domain/voz";

it("cumprimenta pelo horário de Brasília", () => {
  expect(saudacao(new Date("2027-03-10T09:00:00Z"))).toBe("Bom dia");   // 6h em Brasília
  expect(saudacao(new Date("2027-03-10T14:59:00Z"))).toBe("Bom dia");   // 11h59
  expect(saudacao(new Date("2027-03-10T15:00:00Z"))).toBe("Boa tarde"); // 12h
  expect(saudacao(new Date("2027-03-10T21:00:00Z"))).toBe("Boa noite"); // 18h
  expect(saudacao(new Date("2027-03-11T04:00:00Z"))).toBe("Boa noite"); // 1h da manhã
});

it("primeiro nome, sem sobrenome e com a primeira letra maiúscula", () => {
  expect(primeiroNome("cristina conrad")).toBe("Cristina");
  expect(primeiroNome("  Ana   Souza ")).toBe("Ana");
  expect(primeiroNome("")).toBe("");
});

it("lista em português: vírgulas e 'e' no final", async () => {
  const { listaNatural } = await import("@/lib/domain/voz");
  expect(listaNatural(["Comercial"])).toBe("Comercial");
  expect(listaNatural(["Comercial", "Financeiro"])).toBe("Comercial e Financeiro");
  expect(listaNatural(["Comercial", "Financeiro", "Método"])).toBe("Comercial, Financeiro e Método");
  expect(listaNatural([])).toBe("");
});

it("comemora a ação concluída contando o progresso do ano", async () => {
  const { mensagemConclusao } = await import("@/lib/domain/voz");
  expect(mensagemConclusao(1)).toBe("Primeira ação concluída. Bom começo!");
  expect(mensagemConclusao(2)).toBe("Ação concluída. Já são 2 no ano.");
  expect(mensagemConclusao(10)).toBe("Ação concluída. Já são 10 no ano. Que constância!");
  expect(mensagemConclusao(25)).toBe("Ação concluída. Já são 25 no ano. Que constância!");
  expect(mensagemConclusao(0)).toBe("Ação concluída.");
});
