import { expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";

/** Cria pela tela de Planejamento um objetivo em Comercial com duas ações. */
async function criarAcoes(page: Page) {
  await page.goto("/planejamento?visao=ano");
  await page.getByRole("button", { name: "Novo objetivo em outra categoria" }).click();
  await page.getByLabel("Categoria do objetivo").selectOption({ label: "Comercial" });
  await page.getByLabel("Objetivo", { exact: true }).fill("Crescer a carteira");
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  const obj = page.getByRole("article", { name: "Crescer a carteira" });
  for (const [titulo, nivel, tri] of [["Reunião com contador", "tatico", "1"], ["Gravar vídeo", "operacional", "2"]]) {
    await obj.getByRole("button", { name: "Nova ação" }).click();
    await obj.getByLabel("Ação", { exact: true }).fill(titulo);
    await obj.getByLabel("Nível da ação").selectOption(nivel);
    await obj.getByLabel("Trimestre da ação").selectOption(tri);
    await obj.getByRole("button", { name: "Criar ação" }).click();
    await expect(obj.getByText(titulo)).toBeVisible();
  }
}
const linhas = (page: Page) => page.getByRole("region", { name: "Tabela de ações" }).locator("tbody tr[data-acao]");

test.describe("plano de ação", () => {
  test("abre-pelo-menu-tabela", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await criarConta(page);
    await criarAcoes(page);
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Plano de ação" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Plano de ação" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Visão" }).getByRole("link", { name: "Tabela" })).toHaveAttribute("aria-current", "page");
    await expect(linhas(page)).toHaveCount(2);
    await expect(page.getByText("2 ações")).toBeVisible();
  });

  test("busca-e-filtros", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao");
    await page.getByLabel("Buscar ações").fill("reuniao");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(linhas(page)).toHaveCount(1);
    await expect(linhas(page).first()).toContainText("Reunião com contador");
    await page.getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(linhas(page)).toHaveCount(2);
    await page.getByLabel("Trimestre", { exact: true }).selectOption("2");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/trimestre=2/);
    await expect(linhas(page)).toHaveCount(1);
    await expect(linhas(page).first()).toContainText("Gravar vídeo");
  });

  test("editar-e-ordenar", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao");
    const linha = linhas(page).filter({ hasText: "Gravar vídeo" });
    await linha.getByRole("button", { name: "Editar: Gravar vídeo" }).click();
    const form = page.getByRole("form", { name: "Editar ação: Gravar vídeo" });
    await form.getByLabel("Responsável").fill("Ana");
    await form.getByLabel("Prioridade").selectOption("alta");
    await form.getByLabel("Prazo").fill("2027-02-10");
    await form.getByLabel("Status").selectOption("em_andamento");
    await form.getByRole("button", { name: "Salvar ação" }).click();
    const nova = linhas(page).filter({ hasText: "Gravar vídeo" });
    await expect(nova).toContainText("Ana");
    await expect(nova).toContainText("Alta");
    await expect(nova).toContainText("10/02/2027");
    await expect(nova).toContainText("50%");
    await page.getByRole("link", { name: "Prazo" }).click();
    await expect(linhas(page).first()).toContainText("Gravar vídeo");
    await page.reload();
    await expect(linhas(page).filter({ hasText: "Gravar vídeo" })).toContainText("Ana");
  });

  test("prioridades", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao");
    await linhas(page).filter({ hasText: "Reunião com contador" }).getByRole("button", { name: "Editar: Reunião com contador" }).click();
    await page.getByRole("form", { name: "Editar ação: Reunião com contador" }).getByLabel("Prioridade").selectOption("alta");
    await page.getByRole("button", { name: "Salvar ação" }).click();
    await expect(linhas(page).filter({ hasText: "Reunião com contador" })).toContainText("Alta");
    await page.getByRole("navigation", { name: "Visão" }).getByRole("link", { name: "Prioridades" }).click();
    await expect(page.getByRole("region", { name: /Prioridade alta/ })).toContainText("Reunião com contador");
  });

  test("concluida-some-e-volta", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao");
    await linhas(page).filter({ hasText: "Gravar vídeo" }).getByRole("button", { name: "Editar: Gravar vídeo" }).click();
    await page.getByRole("form", { name: "Editar ação: Gravar vídeo" }).getByLabel("Status").selectOption("concluido");
    await page.getByRole("button", { name: "Salvar ação" }).click();
    await expect(linhas(page)).toHaveCount(1);
    await page.getByLabel("Mostrar concluídas").check();
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(linhas(page)).toHaveCount(2);
    await expect(linhas(page).filter({ hasText: "Gravar vídeo" })).toContainText("100%");
  });

  test("kanban-arrastar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao?visao=kanban");
    const cartao = page.getByRole("region", { name: /Não iniciada/ }).locator("li", { hasText: "Reunião com contador" });
    await cartao.dragTo(page.getByRole("region", { name: /Em andamento/ }));
    await expect(page.getByRole("region", { name: /Em andamento/ })).toContainText("Reunião com contador");
    await expect(page.getByRole("status").filter({ hasText: "Ação salva." })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("region", { name: /Em andamento/ })).toContainText("Reunião com contador");
  });

  test("kanban-teclado", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao?visao=kanban");
    await page.getByLabel('Mover "Gravar vídeo" para').selectOption("concluido");
    await page.getByRole("button", { name: 'Mover "Gravar vídeo"' }).click();
    await expect(page.getByRole("region", { name: /Concluída/ })).toContainText("Gravar vídeo");
    await page.reload();
    await expect(page.getByRole("region", { name: /Concluída/ })).toContainText("Gravar vídeo");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test("calendario", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao");
    await linhas(page).filter({ hasText: "Gravar vídeo" }).getByRole("button", { name: "Editar: Gravar vídeo" }).click();
    await page.getByRole("form", { name: "Editar ação: Gravar vídeo" }).getByLabel("Prazo").fill("2027-02-10");
    await page.getByRole("button", { name: "Salvar ação" }).click();
    await expect(linhas(page).filter({ hasText: "Gravar vídeo" })).toContainText("10/02/2027");

    await page.goto("/plano-de-acao?visao=calendario&data=2027-02-01");
    await expect(page.getByRole("heading", { name: "Fevereiro de 2027" })).toBeVisible();
    await expect(page.getByRole("gridcell", { name: /10 de fevereiro/ })).toContainText("Gravar vídeo");
    await expect(page.getByRole("region", { name: /Sem prazo/ })).toContainText("Reunião com contador");
    await page.getByRole("gridcell", { name: /10 de fevereiro/ }).getByRole("button", { name: "Gravar vídeo" }).click();
    const form = page.getByRole("form", { name: "Editar ação: Gravar vídeo" });
    await expect(form).toBeVisible();
    await expect(page.getByRole("gridcell").getByRole("form")).toHaveCount(0); // a edição abre fora da grade
    expect((await form.boundingBox())!.width).toBeGreaterThan(500);
    await page.getByRole("link", { name: "Próximo" }).click();
    await expect(page.getByRole("heading", { name: "Março de 2027" })).toBeVisible();

    await page.goto("/plano-de-acao?visao=calendario&cal=semana&data=2027-02-10");
    await expect(page.getByRole("heading", { name: "Semana de 07/02 a 13/02/2027" })).toBeVisible();
    await expect(page.getByRole("region", { name: /Quarta, 10\/02/ })).toContainText("Gravar vídeo");
    await page.goto("/plano-de-acao?visao=calendario&cal=dia&data=2027-02-10");
    await expect(page.getByRole("heading", { name: "Quarta, 10/02/2027" })).toBeVisible();
    await expect(page.getByText("Gravar vídeo")).toBeVisible();
  });

  test("calendario-celular", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao?visao=calendario&data=2027-01-01");
    await expect(page.getByRole("heading", { name: "Janeiro de 2027" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("editar-concluida-mantem-data", async ({ page }) => {
    await criarConta(page);
    await criarAcoes(page);
    await page.goto("/plano-de-acao?visao=kanban");
    await page.getByLabel('Mover "Gravar vídeo" para').selectOption("concluido");
    await page.getByRole("button", { name: 'Mover "Gravar vídeo"' }).click();
    await expect(page.getByRole("status").filter({ hasText: "Primeira ação concluída. Bom começo!" })).toBeVisible();
    await page.goto("/plano-de-acao?concluidas=1");
    await linhas(page).filter({ hasText: "Gravar vídeo" }).getByRole("button", { name: "Editar: Gravar vídeo" }).click();
    await page.getByRole("form", { name: "Editar ação: Gravar vídeo" }).getByLabel("Responsável").fill("Ana");
    await page.getByRole("button", { name: "Salvar ação" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ação salva." })).toBeVisible();
  });

  test("sem-acoes", async ({ page }) => {
    await criarConta(page);
    await page.goto("/plano-de-acao");
    await expect(page.getByText("Você ainda não tem ações.")).toBeVisible();
  });
});
