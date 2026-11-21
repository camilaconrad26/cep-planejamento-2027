import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

const CATEGORIAS = ["Posicionamento e Autoridade", "Comercial", "Parcerias e Networking", "Método e Serviços", "Experiência do Cliente", "Financeiro e Precificação", "Operação e Tecnologia"];

test.describe("biblioteca", () => {
  test("abre-pelo-menu-no-perfil-1-com-aviso", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await criarConta(page);
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Biblioteca de estratégias" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Biblioteca de estratégias" })).toBeVisible();
    await expect(page.getByText("Você ainda não confirmou o seu perfil. Mostrando o Perfil 1.")).toBeVisible();
    for (const c of CATEGORIAS) await expect(page.getByRole("heading", { level: 2, name: c })).toBeVisible();
  });

  test("filtra-por-categoria-e-nivel", async ({ page }) => {
    await criarConta(page);
    await page.goto("/biblioteca");
    await page.getByLabel("Categoria", { exact: true }).selectOption("comercial");
    await page.getByLabel("Nível", { exact: true }).selectOption("tatico");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/categoria=comercial.*nivel=tatico|nivel=tatico.*categoria=comercial/);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(page.getByRole("listitem").filter({ hasText: "Tático" })).toHaveCount(1);
  });

  test("trocar-filtro-pelo-teclado-nao-recarrega", async ({ page }) => {
    await criarConta(page);
    await page.goto("/biblioteca");
    const cat = page.getByLabel("Categoria", { exact: true });
    await cat.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/categoria=/);
    await expect(cat).toBeFocused();
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/categoria=/);
  });

  test("kpi-sem-trimestre", async ({ page }) => {
    await criarConta(page);
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=kpi");
    const item = page.getByRole("listitem").filter({ hasText: "KPI" });
    await expect(item.getByLabel(/^Trimestre para:/)).toHaveCount(0);
    await item.getByRole("button", { name: "Adicionar ao meu plano" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Indicador adicionado ao seu plano." })).toBeVisible();
    await expect(item.getByText("No seu plano")).toBeVisible();
  });

  test("filtro-invalido-nao-quebra", async ({ page }) => {
    await criarConta(page);
    const r = await page.goto("/biblioteca?perfil=9&nivel=xyz&categoria=nao-existe");
    expect(r?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(7);
  });

  test("adiciona-tarefa-e-objetivo-entra-junto", async ({ page }) => {
    await criarConta(page);
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=tatico");
    const item = page.getByRole("listitem").filter({ hasText: "Tático" });
    await item.getByLabel(/^Trimestre para:/).selectOption("2");
    await item.getByRole("button", { name: "Adicionar ao meu plano" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Adicionado ao 2º trimestre. O objetivo estratégico da categoria entrou junto." })).toBeVisible();
    await expect(item.getByText("No seu plano")).toBeVisible();
    await expect(item.getByRole("button", { name: "Adicionar ao meu plano" })).toHaveCount(0);
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=estrategico");
    await expect(page.getByRole("listitem").filter({ hasText: "Estratégico" }).getByText("No seu plano")).toBeVisible();
    await page.goto("/visao-geral");
    await expect(page.getByTestId("total-acoes")).toHaveText("1");
  });

  test("celular-390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await criarConta(page);
    await page.goto("/biblioteca?categoria=comercial");
    await expect(page.getByRole("button", { name: "Adicionar ao meu plano" }).first()).toBeVisible();
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura).toBeLessThanOrEqual(390);
  });
});
