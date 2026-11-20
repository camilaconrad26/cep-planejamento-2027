import { expect, type Page } from "@playwright/test";

/** Cria uma conta nova pela tela e espera chegar à Visão geral. E-mails e2e-*@example.com são apagados depois via SQL. */
export async function criarConta(page: Page, nome = "Aluna Teste E2E") {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
  await page.goto("/criar-conta");
  await page.getByLabel("Nome completo").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Crie uma senha (mínimo 8 caracteres)").fill("SenhaTeste#2027");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
  return { email, senha: "SenhaTeste#2027" };
}
