import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test.describe("casca do app", () => {
  test("menu-lateral-desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await criarConta(page, "Joana Teste");
    const nav = page.getByRole("navigation", { name: "Menu principal" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Visão geral" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Meu diagnóstico" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Biblioteca de estratégias" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Revisão estratégica" })).toHaveCount(0); // módulo ainda não construído
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  });

  test("gaveta-celular", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await criarConta(page);
    const abrir = page.getByRole("button", { name: "Menu" });
    await abrir.click();
    const gaveta = page.getByRole("dialog", { name: "Menu" });
    await expect(gaveta).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(gaveta).toBeHidden();
    await expect(abrir).toBeFocused();
    await abrir.click();
    await gaveta.getByRole("link", { name: "Visão geral" }).click();
    await expect(gaveta).toBeHidden();
  });

  test("texto-maior-e-pular", async ({ page }) => {
    await criarConta(page);
    const botao = page.getByRole("button", { name: "Texto maior" });
    await expect(botao).toHaveAttribute("aria-pressed", "false");
    await botao.click();
    await expect(botao).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveClass(/grande/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/grande/);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
  });

  test("sem-rolagem-lateral", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await criarConta(page);
    for (const grande of [false, true]) {
      if (grande) await page.getByRole("button", { name: "Texto maior" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    }
  });
});
