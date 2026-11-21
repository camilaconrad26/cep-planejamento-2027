import { itensMenu } from "@/components/layout/itensMenu";

it("só mostra módulos construídos", () => {
  expect(itensMenu(["mentora"], new Set(["/visao-geral"])).map((i) => i.rota)).toEqual(["/visao-geral"]);
});
it("segue a ordem da especificação", () => {
  const todas = new Set(["/visao-geral", "/diagnostico", "/planejamento", "/biblioteca", "/plano-de-acao", "/metas", "/revisao", "/historico", "/configuracoes"] as const);
  expect(itensMenu([], todas).map((i) => i.rotulo)).toEqual([
    "Visão geral", "Meu diagnóstico", "Planejamento estratégico", "Biblioteca de estratégias", "Plano de ação",
    "Metas e indicadores", "Revisão estratégica", "Histórico", "Configurações",
  ]);
});
it("mentora vê Alunas quando o módulo existe", () => {
  expect(itensMenu(["mentora"], new Set(["/visao-geral", "/alunas"])).map((i) => i.rota)).toContain("/alunas");
});
it("aluna não vê Alunas", () => {
  expect(itensMenu([], new Set(["/visao-geral", "/alunas"])).map((i) => i.rota)).not.toContain("/alunas");
});
it("planejamento e biblioteca construídos, na ordem da especificação", async () => {
  const { ROTAS_CONSTRUIDAS } = await import("@/lib/domain/rotas");
  expect(ROTAS_CONSTRUIDAS.has("/biblioteca")).toBe(true);
  expect(itensMenu([], ROTAS_CONSTRUIDAS).map((i) => i.rotulo)).toEqual(["Visão geral", "Meu diagnóstico", "Planejamento estratégico", "Biblioteca de estratégias", "Plano de ação", "Metas e indicadores", "Configurações"]);
});
