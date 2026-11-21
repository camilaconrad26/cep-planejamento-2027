import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";
import { prepararDados, TELAS_ALUNA, TELAS_PUBLICAS } from "./telas";

async function violacoes(page: Page, tela: string): Promise<string[]> {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    .flatMap((v) => v.nodes.slice(0, 3).map((n) => `${tela}: ${v.id} (${v.impact}) ${n.target.join(" ")} — ${v.help}`));
}

test("axe-sem-violacoes-graves", async ({ page }) => {
  test.setTimeout(600_000);
  const erros: string[] = [];
  for (const tela of TELAS_PUBLICAS) { await page.goto(tela); erros.push(...await violacoes(page, tela)); }
  await criarConta(page, "Aluna Acessibilidade");
  await prepararDados(page);
  for (const largura of [1280, 390]) {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const tela of TELAS_ALUNA) { await page.goto(tela); erros.push(...(await violacoes(page, tela)).map((e) => `[${largura}] ${e}`)); }
  }
  expect(erros, erros.join("\n")).toEqual([]);
});

test("teclado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await criarConta(page, "Aluna Teclado");
  await page.goto("/visao-geral");
  await page.keyboard.press("Tab");
  const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(pular).toBeFocused();
  await expect(pular).toBeVisible();
  // foco sempre visível nos próximos 15 elementos
  const semFoco: string[] = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      if (!e || e === document.body) return null;
      const s = getComputedStyle(e);
      const visivel = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
      return visivel ? null : `${e.tagName.toLowerCase()} "${(e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 40)}"`;
    });
    if (r) semFoco.push(r);
  }
  expect(semFoco, `sem foco visível: ${semFoco.join(", ")}`).toEqual([]);
});
