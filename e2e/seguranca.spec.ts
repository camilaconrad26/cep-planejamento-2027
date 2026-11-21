import { expect, test } from "@playwright/test";

test("cabecalhos", async ({ request }) => {
  const r = await request.get("/entrar");
  const h = r.headers();
  expect(h["content-security-policy"] ?? "").toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"] ?? "").toMatch(/camera=\(\)/);
  expect(h["permissions-policy"] ?? "").toMatch(/microphone=\(\)/);
  expect(h["permissions-policy"] ?? "").toMatch(/geolocation=\(\)/);
});

test("nao-abre-dentro-de-outro-site", async ({ page }) => {
  await page.setContent(`<iframe id="f" src="${test.info().project.use.baseURL}/entrar"></iframe>`);
  const quadro = page.frameLocator("#f");
  await expect(quadro.getByRole("button", { name: "Entrar" })).toHaveCount(0, { timeout: 5000 });
});

test("csv-sem-sessao", async ({ request }) => {
  const r = await request.get("/exportar/acoes", { maxRedirects: 0 });
  expect(r.status()).toBe(401);
  expect(await r.text()).toContain("Sessão expirada");
});
