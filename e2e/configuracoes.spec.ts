import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("perfil-e-nome", async ({ page }) => {
  await criarConta(page, "Ana Teste");
  await page.goto("/configuracoes");
  await page.getByLabel("Nome completo").fill("Ana Paula Teste");
  await page.getByRole("button", { name: "Salvar nome" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Nome salvo." })).toBeVisible();
  await page.getByLabel("Perfil 2 · Consolidação").check();
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Perfil salvo." })).toBeVisible();
  await page.goto("/visao-geral");
  await expect(page.getByText("Perfil 2 · Consolidação")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Ana");
});

test("trocar-senha", async ({ page }) => {
  const { email } = await criarConta(page);
  await page.goto("/configuracoes");
  await page.getByLabel("Nova senha (mínimo 8 caracteres)").fill("curta");
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByRole("status").filter({ hasText: "A senha precisa de pelo menos 8 caracteres." })).toBeVisible();
  await page.getByLabel("Nova senha (mínimo 8 caracteres)").fill("NovaSenha#2027");
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Senha alterada." })).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("NovaSenha#2027");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
});

test("excluir-conta", async ({ page }) => {
  const { email, senha } = await criarConta(page);
  await page.goto("/configuracoes");
  const excluir = page.getByRole("button", { name: "Excluir minha conta" });
  await expect(excluir).toBeDisabled();
  await page.getByLabel('Para confirmar, digite EXCLUIR').fill("excluir");
  await expect(excluir).toBeDisabled();
  await page.getByLabel('Para confirmar, digite EXCLUIR').fill("EXCLUIR");
  await expect(excluir).toBeEnabled();
  await excluir.click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("E-mail ou senha incorretos.");
});
