import { proximoPasso, type Retrato } from "@/lib/domain/proximoPasso";

const base: Retrato = {
  diagnosticoIniciado: true, diagnosticoConcluido: true, trimestre: 1, fase: "execucao", categoriasNoTrimestre: 2, categoriasSemAcao: [],
  atrasadas: 0, medicaoVencida: 0, trimestreAnteriorSemRevisao: false, vencendo7dias: 0,
};

it("primeiro acesso: começar pelo diagnóstico", () => {
  const p = proximoPasso({ ...base, diagnosticoIniciado: false, categoriasNoTrimestre: 0, fase: "planejamento" });
  expect(p.codigo).toBe("diagnostico");
  expect(p.titulo).toBe("Vamos começar pelo seu escritório");
  expect(p.href).toBe("/diagnostico");
});
it("sem categorias no trimestre: escolher prioridades", () =>
  expect(proximoPasso({ ...base, categoriasNoTrimestre: 0 }).codigo).toBe("prioridades"));
it("categoria prioritária sem ação", () =>
  expect(proximoPasso({ ...base, categoriasSemAcao: ["comercial"] }).codigo).toBe("categoria-sem-acao"));
it("atrasadas na execução", () => expect(proximoPasso({ ...base, atrasadas: 2 }).codigo).toBe("atrasadas"));
it("na fase de planejamento atraso não é cobrado", () =>
  expect(proximoPasso({ ...base, fase: "planejamento", atrasadas: 5 }).codigo).not.toBe("atrasadas"));
it("medição vencida leva à aba de indicadores", () => {
  const p = proximoPasso({ ...base, medicaoVencida: 1 });
  expect(p.codigo).toBe("medir");
  expect(p.href).toBe("/metas?aba=kpis");
});
it("na fase de planejamento, medição vencida não vira próximo passo", () =>
  expect(proximoPasso({ ...base, fase: "planejamento", medicaoVencida: 2 }).codigo).not.toBe("medir"));
it("revisão do trimestre anterior", () =>
  expect(proximoPasso({ ...base, trimestreAnteriorSemRevisao: true }).codigo).toBe("revisao"));
it("na fase de planejamento revisão não é cobrada", () =>
  expect(proximoPasso({ ...base, fase: "planejamento", trimestreAnteriorSemRevisao: true }).codigo).toBe("em-dia"));
it("vencendo em 7 dias", () => expect(proximoPasso({ ...base, vencendo7dias: 3 }).codigo).toBe("vencendo"));
it("tudo em dia", () => expect(proximoPasso(base).codigo).toBe("em-dia"));
it("a ordem respeita a prioridade: diagnóstico antes de atraso", () =>
  expect(proximoPasso({ ...base, diagnosticoIniciado: false, atrasadas: 3 }).codigo).toBe("diagnostico"));

it("diagnóstico começado e não concluído: continuar antes de qualquer outra coisa", () => {
  const p = proximoPasso({ ...base, diagnosticoConcluido: false, categoriasNoTrimestre: 0 });
  expect(p.codigo).toBe("diagnostico-continuar");
  expect(p.titulo).toBe("Falta pouco para terminar o diagnóstico");
  expect(p.href).toBe("/diagnostico");
});

it("revisão leva ao trimestre que terminou", () => {
  const p = proximoPasso({ ...base, trimestre: 3, trimestreAnteriorSemRevisao: true });
  expect(p.codigo).toBe("revisao");
  expect(p.href).toBe("/revisao?t=2");
});

it("prioridade sem ação: fala as áreas como uma pessoa falaria", () => {
  const um = proximoPasso({ ...base, categoriasSemAcao: ["Comercial"] });
  expect(um.texto).toBe("Você escolheu “Comercial” como prioridade, mas ainda não tem nenhuma ação nela. A biblioteca tem sugestões prontas para começar.");
  const dois = proximoPasso({ ...base, categoriasSemAcao: ["Comercial", "Financeiro e Precificação"] });
  expect(dois.texto).toContain("“Comercial” e “Financeiro e Precificação” como prioridades");
  expect(dois.texto).toContain("nenhuma ação nelas");
});
