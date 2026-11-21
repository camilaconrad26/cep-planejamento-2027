import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

const sem = (s: string | null) => (s ?? "").replace(/\s/g, " ");

test.describe("metas", () => {
  test("abre-e-calcula", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await criarConta(page);
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Metas e indicadores" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Metas e indicadores" })).toBeVisible();
    await page.getByLabel("Faturamento · Meta").fill("R$ 1.200.000,00");
    await page.getByLabel("Lucratividade % · Meta").fill("30");
    await page.getByLabel("Time (pessoas) · Meta").click();
    await expect(page.getByTestId("lucro-meta")).toHaveText(/360\.000/);
    await expect(page.getByTestId("mensal-meta")).toHaveText(/100\.000/);
    await expect(page.locator("#salvo")).toContainText("Salvo às");
    await page.reload();
    expect(sem(await page.getByLabel("Faturamento · Meta").inputValue())).toBe("R$ 1.200.000");
    expect(await page.getByLabel("Lucratividade % · Meta").inputValue()).toBe("30");
  });

  test("trimestres-e-realizado", async ({ page }) => {
    await criarConta(page);
    await page.goto("/metas");
    await page.getByLabel("Faturamento · Meta").fill("1.200.000");
    await page.getByLabel("Faturamento · Super meta").click();
    await page.getByRole("button", { name: "Dividir a meta anual em quatro partes iguais" }).click();
    await expect(page.getByTestId("tri-dif-meta")).toHaveText("fecha com a meta");
    await page.getByLabel("Realizado no 1º trimestre").fill("150.000");
    await page.getByLabel("Realizado no 2º trimestre").click();
    await expect(page.getByTestId("pct-real-1")).toHaveText("50% da meta");
    await expect(page.locator("#salvo")).toContainText("Salvo às");
    await page.reload();
    await expect(page.getByTestId("pct-real-1")).toHaveText("50% da meta");
  });

  test("acao-de-vendas", async ({ page }) => {
    await criarConta(page);
    await page.goto("/metas");
    const vendas = page.getByRole("region", { name: "Ações de vendas por mês" });
    await vendas.getByRole("button", { name: "2º trimestre" }).click();
    const abril = vendas.getByRole("group", { name: "Abril" });
    await abril.getByRole("button", { name: "Adicionar ação de vendas" }).click();
    await abril.getByLabel("Produto da ação 1").fill("Holding");
    await abril.getByLabel("Ticket da ação 1").fill("30.000");
    await abril.getByLabel("Vendas da ação 1").fill("2");
    await abril.getByLabel("Responsável da ação 1").click();
    await expect(abril.getByTestId("fat-acao-1")).toHaveText(/60\.000/);
    await expect(vendas.getByTestId("previsto-tri")).toHaveText(/60\.000/);
    await expect(page.locator("#salvo")).toContainText("Salvo às");
    await page.reload();
    await page.getByRole("region", { name: "Ações de vendas por mês" }).getByRole("button", { name: "2º trimestre" }).click();
    const abril2 = page.getByRole("group", { name: "Abril" });
    await expect(abril2.getByLabel("Produto da ação 1")).toHaveValue("Holding");
    await abril2.getByRole("button", { name: "Remover ação 1" }).click();
    await expect(abril2.getByLabel("Produto da ação 1")).toHaveCount(0);
    await page.reload();
    await page.getByRole("region", { name: "Ações de vendas por mês" }).getByRole("button", { name: "2º trimestre" }).click();
    await expect(page.getByRole("group", { name: "Abril" }).getByLabel("Produto da ação 1")).toHaveCount(0);
  });

  test("base-2026", async ({ page }) => {
    await criarConta(page);
    await page.goto("/diagnostico/fechamento");
    await page.getByLabel("Faturamento realizado em 2026").fill("1.000.000");
    await page.getByLabel("Meta que você tinha para 2026").click();
    await expect(page.locator("#salvo")).toContainText("Salvo às");
    await page.goto("/metas");
    await expect(page.getByText(/Base de 2026: faturamento de R\$\s1\.000\.000/)).toBeVisible();
    await page.getByLabel("Faturamento · Meta").fill("1.200.000");
    await page.getByLabel("Faturamento · Super meta").click();
    await expect(page.getByTestId("cresc-meta")).toHaveText("+20%");
  });

  test("celular-390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await criarConta(page);
    await page.goto("/metas");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
