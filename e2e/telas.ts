import { expect, type Page } from "@playwright/test";

/** Todas as telas da aluna (Etapa 7: celular e acessibilidade percorrem esta lista). */
export const TELAS_ALUNA = [
  "/visao-geral", "/diagnostico/1", "/diagnostico/resumo", "/diagnostico/fechamento", "/planejamento", "/planejamento?visao=ano",
  "/biblioteca", "/plano-de-acao", "/plano-de-acao?visao=kanban", "/plano-de-acao?visao=calendario", "/plano-de-acao?visao=prioridades",
  "/metas", "/metas?aba=okrs", "/metas?aba=kpis", "/revisao", "/historico", "/configuracoes", "/imprimir",
];
export const TELAS_PUBLICAS = ["/entrar", "/criar-conta"];

export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
}

/** Conta com dados para as telas não ficarem vazias: 1 objetivo, 3 ações (uma com prazo), 1 KPI com 2 medições. */
export async function prepararDados(page: Page) {
  const largura = page.viewportSize();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/planejamento?visao=ano");
  await page.getByRole("button", { name: "Novo objetivo em outra categoria" }).click();
  await page.getByLabel("Categoria do objetivo").selectOption({ label: "Comercial" });
  await page.getByLabel("Objetivo", { exact: true }).fill("Crescer a carteira de famílias com planejamento sucessório");
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  const obj = page.getByRole("article", { name: "Crescer a carteira de famílias com planejamento sucessório" });
  for (const titulo of ["Reunião mensal com contadores parceiros da região", "Gravar vídeo", "Revisar contrato de honorários"]) {
    await obj.getByRole("button", { name: "Nova ação" }).click();
    await obj.getByLabel("Ação", { exact: true }).fill(titulo);
    await obj.getByLabel("Trimestre da ação").selectOption("1");
    await obj.getByRole("button", { name: "Criar ação" }).click();
    await expect(obj.getByText(titulo)).toBeVisible();
  }
  await page.goto("/metas?aba=kpis");
  await page.getByRole("button", { name: "Novo indicador" }).click();
  await page.getByLabel("Nome do indicador").fill("Taxa de conversão de reuniões");
  await page.getByLabel("Unidade").fill("%");
  await page.getByLabel("Meta", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Criar indicador" }).click();
  const kpi = page.getByRole("article", { name: "Taxa de conversão de reuniões" });
  for (const [i, [data, valor]] of [["2026-09-15", "20"], ["2026-10-10", "35"]].entries()) {
    await kpi.getByLabel("Data da medição").fill(data);
    await kpi.getByLabel("Valor medido").fill(valor);
    await kpi.getByRole("button", { name: "Registrar medição" }).click();
    await expect(kpi.getByText(`Medições (${i + 1})`)).toBeVisible();
  }
  if (largura) await page.setViewportSize(largura);
}
