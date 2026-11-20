import { expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";

// A conta admin vem de E2E_ADMIN_EMAIL / E2E_ADMIN_SENHA (criada e apagada por quem roda os testes; papel dado por SQL).
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const SENHA = process.env.E2E_ADMIN_SENHA;

async function entrarAdmin(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(EMAIL!);
  await page.getByLabel("Senha").fill(SENHA!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
}

test("aluna-nao-ve-edicao", async ({ page }) => {
  await criarConta(page);
  await page.goto("/configuracoes");
  await expect(page.getByRole("link", { name: "Editar biblioteca" })).toHaveCount(0);
  await page.goto("/configuracoes/biblioteca");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

test.describe("administração", () => {
  test.skip(!EMAIL || !SENHA, "sem conta admin de teste");

  test("admin-edita-desativa-e-reativa", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/configuracoes");
    await page.getByRole("link", { name: "Editar biblioteca" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Editar biblioteca" })).toBeVisible();
    await expect(page.getByText("Mudanças valem para as próximas adições. O que as alunas já colocaram no plano não muda.")).toBeVisible();
    await page.getByLabel("Perfil", { exact: true }).selectOption("1");
    await page.getByLabel("Categoria", { exact: true }).selectOption("comercial");
    await expect(page).toHaveURL(/categoria=comercial/);
    const item = page.getByRole("listitem").filter({ hasText: "Tático" });
    const campo = item.getByRole("textbox");
    const original = await campo.inputValue();
    await campo.fill(`${original} (teste)`);
    await item.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Item salvo." })).toBeVisible();
    await item.getByRole("button", { name: "Desativar" }).click();
    await expect(item.getByText("Inativo")).toBeVisible();

    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=tatico");
    await expect(page.getByText("Nenhum item com esses filtros.")).toBeVisible();

    await page.goto("/configuracoes/biblioteca?perfil=1&categoria=comercial");
    const de_novo = page.getByRole("listitem").filter({ hasText: "Tático" });
    await de_novo.getByRole("button", { name: "Reativar" }).click();
    await expect(de_novo.getByText("Inativo")).toHaveCount(0);
    await de_novo.getByRole("textbox").fill(original);
    await de_novo.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Item salvo." })).toBeVisible();

    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=tatico");
    await expect(page.getByText(original, { exact: true })).toBeVisible();
  });

  test("admin-cria-item", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/configuracoes/biblioteca?perfil=1&categoria=comercial");
    const novo = page.getByRole("form", { name: "Novo item" });
    await novo.getByLabel("Categoria do novo item").selectOption("comercial");
    await novo.getByLabel("Perfil do novo item").selectOption("1");
    await novo.getByLabel("Nível do novo item").selectOption("kpi");
    await novo.getByLabel("Texto do novo item").fill("KPI teste e2e");
    await novo.getByRole("button", { name: "Criar item" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Item criado." })).toBeVisible();
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=kpi");
    await expect(page.getByText("KPI teste e2e")).toBeVisible();
  });
});
