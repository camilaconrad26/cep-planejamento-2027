import { expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";

// Conta mentora temporária (papel dado por SQL antes do teste): E2E_MENTORA_EMAIL / E2E_MENTORA_SENHA.
const EMAIL = process.env.E2E_MENTORA_EMAIL, SENHA = process.env.E2E_MENTORA_SENHA;
async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
}

test("aluna-nao-ve-painel", async ({ page }) => {
  await criarConta(page);
  await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Alunas" })).toHaveCount(0);
  await page.goto("/alunas");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

test.describe("mentora", () => {
  test.skip(!EMAIL || !SENHA, "sem conta mentora de teste");
  test("lista-detalhe-e-senha", async ({ page, browser }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const nome = `Aluna Painel ${Date.now()}`;
    const aluna = await criarConta(page, nome);
    await page.goto("/planejamento?visao=ano");
    await page.getByRole("button", { name: "Novo objetivo em outra categoria" }).click();
    await page.getByLabel("Categoria do objetivo").selectOption({ label: "Comercial" });
    await page.getByLabel("Objetivo", { exact: true }).fill("Objetivo da aluna do painel");
    await page.getByRole("button", { name: "Criar objetivo" }).click();
    await expect(page.getByRole("article", { name: "Objetivo da aluna do painel" })).toBeVisible();
    await page.context().clearCookies();

    await entrar(page, EMAIL!, SENHA!);
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Alunas" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Alunas" })).toBeVisible();
    const linha = page.getByRole("row").filter({ hasText: nome });
    await expect(linha).toContainText(aluna.email);
    await linha.getByRole("link", { name: `Abrir o plano de ${nome}` }).click();
    await expect(page.getByText("Objetivo da aluna do painel")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1); // um título por página (o relatório vira h2 aqui)
    await expect(page.getByRole("button", { name: "Novo objetivo" })).toHaveCount(0); // só leitura
    await page.getByLabel("Nova senha provisória").fill("Provisoria#2027");
    await page.getByRole("button", { name: "Definir senha provisória" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Senha provisória definida." })).toBeVisible();

    const outra = await browser.newContext({ baseURL: "http://localhost:3100" });
    const p2 = await outra.newPage();
    await entrar(p2, aluna.email, "Provisoria#2027");
    await outra.close();
  });
});
