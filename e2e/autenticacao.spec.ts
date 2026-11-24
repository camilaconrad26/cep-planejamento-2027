import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("redireciona-sem-sessao", async ({ page }) => {
  await page.goto("/visao-geral");
  await expect(page).toHaveURL(/\/entrar\?volta=%2Fvisao-geral/);
  await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
});

test("login-invalido", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ninguem-e2e@example.com");
  await page.getByLabel("Senha").fill("senhaerrada1");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("E-mail ou senha incorretos.");
});

test("validacao-no-cadastro", async ({ page }) => {
  await page.goto("/criar-conta");
  await page.getByLabel("Nome completo").fill("Ana");
  await page.getByLabel("E-mail").fill("nao-e-email");
  await page.getByLabel("Crie uma senha (mínimo 8 caracteres)").fill("123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Informe um e-mail válido.");
});

test("cadastro-e-login", async ({ page }) => {
  const { email, senha } = await criarConta(page, "Mariana Teste");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mariana");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/visao-geral");
  await expect(page).toHaveURL(/\/entrar\?volta=/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
});

test("volta-nao-permite-sair-do-site", async ({ page }) => {
  const { email, senha } = await criarConta(page);
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/entrar?volta=%2F%2Fexemplo.com");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/localhost:3100\/visao-geral/);
});
