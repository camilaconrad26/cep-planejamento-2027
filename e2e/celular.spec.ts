import { devices, expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";
import { entrar, prepararDados, TELAS_ALUNA, TELAS_PUBLICAS } from "./telas";

const MENTORA = { email: process.env.E2E_MENTORA_EMAIL, senha: process.env.E2E_MENTORA_SENHA };
const sobra = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
async function textoMaior(page: Page, ligado: boolean) {
  const b = page.getByRole("button", { name: "Texto maior" });
  if ((await b.getAttribute("aria-pressed")) !== String(ligado)) await b.click();
  await expect(b).toHaveAttribute("aria-pressed", String(ligado));
}
async function semRolagem(page: Page, telas: string[], erros: string[]) {
  for (const tela of telas) {
    await page.goto(tela);
    const s = await sobra(page);
    if (s > 0) erros.push(`${tela} (${(await page.locator("html").getAttribute("class"))?.includes("grande") ? "texto maior" : "normal"}): ${s}px a mais`);
  }
}

test("sem-rolagem-horizontal", async ({ page, browser }) => {
  test.setTimeout(900_000);
  const conta = await criarConta(page, "Aluna Celular");
  await prepararDados(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const erros: string[] = [];
  for (const ligado of [false, true]) {
    await page.goto("/visao-geral");
    await textoMaior(page, ligado);
    await semRolagem(page, TELAS_ALUNA, erros);
  }
  await page.goto("/visao-geral");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  for (const ligado of [false, true]) {
    await page.evaluate((g) => document.documentElement.classList.toggle("grande", g), ligado);
    for (const tela of TELAS_PUBLICAS) {
      await page.goto(tela);
      await page.evaluate((g) => document.documentElement.classList.toggle("grande", g), ligado);
      const s = await sobra(page);
      if (s > 0) erros.push(`${tela} (${ligado ? "texto maior" : "normal"}): ${s}px a mais`);
    }
  }
  if (MENTORA.email && MENTORA.senha) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const m = await ctx.newPage();
    await entrar(m, MENTORA.email, MENTORA.senha);
    await m.goto("/alunas");
    const href = await m.getByRole("link", { name: "Abrir o plano de Aluna Celular" }).first().getAttribute("href");
    for (const ligado of [false, true]) {
      await m.goto("/visao-geral");
      await textoMaior(m, ligado);
      await semRolagem(m, ["/alunas", href ?? "/alunas"], erros);
    }
    await ctx.close();
  }
  expect(erros, `telas com rolagem horizontal (conta ${conta.email}):\n${erros.join("\n")}`).toEqual([]);
});

test("alvos-de-toque", async ({ page }) => {
  test.setTimeout(240_000);
  await criarConta(page, "Aluna Toque");
  await prepararDados(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const erros: string[] = [];
  for (const tela of TELAS_ALUNA) {
    await page.goto(tela);
    const pequenos = await page.evaluate(() => [...document.querySelectorAll("main button, main a[href], main select, main input:not([type=hidden]), header button, header a[href]")]
      .filter((e) => {
        const r = e.getBoundingClientRect(), st = getComputedStyle(e);
        if (!r.width || !r.height || st.visibility === "hidden") return false;
        if (e.tagName === "A" && e.closest("p, li > p, td, dd")) return false; // link dentro de texto
        if (e instanceof HTMLInputElement && (e.type === "checkbox" || e.type === "radio")) return false; // o rótulo é o alvo
        return r.height < 24 || r.width < 24; // WCAG 2.2 AA (2.5.8): alvo mínimo de 24×24 px
      }).map((e) => `${e.tagName.toLowerCase()} "${(e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 40)}" ${Math.round(e.getBoundingClientRect().height)}px`));
    for (const p of [...new Set(pequenos)]) erros.push(`${tela}: ${p}`);
  }
  expect(erros, erros.join("\n")).toEqual([]);
});

test.describe("iphone", () => {
  const { defaultBrowserType: _, ...iphone } = devices["iPhone 13"];
  test.use(iphone);
  test("navega-pelo-menu", async ({ page }) => {
    await criarConta(page, "Aluna iPhone");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Plano de ação" }).click();
    await expect(page).toHaveURL(/\/plano-de-acao/);
    await expect(menu).toBeHidden();
    expect(await sobra(page)).toBe(0);
  });
});
