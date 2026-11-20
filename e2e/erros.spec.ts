import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("pagina-inexistente-em-portugues", async ({ page }) => {
  await criarConta(page);
  const r = await page.goto("/pagina-que-nao-existe");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
  await page.getByRole("link", { name: "Ir para a Visão geral" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
});
