import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("revisao", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await criarConta(page);
  await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Revisão estratégica" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Revisão estratégica" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Trimestre da revisão" }).getByRole("link", { name: "1º trimestre" })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("O que foi executado?").fill("Lives semanais e duas parcerias");
  await page.getByLabel("Quais precisam ser alteradas?").fill("Menos eventos presenciais");
  await page.getByLabel("Faturamento realizado no trimestre").fill("150.000");
  await page.getByLabel("O que impediu a execução?").click();
  await expect(page.locator("#salvo")).toContainText("Salvo às");
  await page.getByRole("button", { name: "Concluir revisão" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Revisão do 1º trimestre concluída em" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Quais precisam ser alteradas?")).toHaveValue("Menos eventos presenciais");
  await expect(page.getByRole("button", { name: "Concluída" })).toBeDisabled();
  await page.goto("/metas");
  await expect(page.getByTestId("pct-real-1")).toHaveText("—"); // sem meta do trimestre, sem %
  expect((await page.getByLabel("Realizado no 1º trimestre").inputValue()).replace(/\s/g, " ")).toBe("R$ 150.000");
});
