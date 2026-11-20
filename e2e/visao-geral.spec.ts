import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("primeiro-acesso", async ({ page }) => {
  await criarConta(page, "Beatriz Teste");
  const passo = page.getByRole("region", { name: "Seu próximo passo estratégico" });
  await expect(passo.getByRole("heading", { name: "Comece pelo diagnóstico" })).toBeVisible();
  await expect(page.getByText("Ciclo 2027 · 1º trimestre")).toBeVisible();
  await expect(page.getByText("Fase de planejamento")).toBeVisible();
  await passo.getByRole("link", { name: "Fazer o diagnóstico" }).click();
  await expect(page).toHaveURL(/\/diagnostico\/1/);
});

test("depois-do-diagnostico-e-tarefa", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/1");
  await page.getByLabel("Atuo de forma autônoma e já conduzo casos").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 2 de 10")).toBeVisible();
  await page.goto("/diagnostico/fechamento");
  const novo = page.getByLabel("Novo item em Começar a fazer");
  await novo.fill("Cobrar o diagnóstico"); await novo.press("Enter");
  await page.getByRole("button", { name: "Criar tarefa: Cobrar o diagnóstico" }).click();
  await expect(page.getByText("✓ Tarefa criada no 1º tri")).toBeVisible();
  await page.goto("/visao-geral");
  const passo = page.getByRole("region", { name: "Seu próximo passo estratégico" });
  await expect(passo.getByRole("heading", { name: "Escolha as prioridades do 1º trimestre" })).toBeVisible();
  await expect(page.getByTestId("total-acoes")).toHaveText("1");
  await passo.getByRole("link", { name: "Escolher prioridades" }).click();
  await expect(page).toHaveURL(/#em-breve/);
  await expect(page.locator("#em-breve")).toBeVisible();
});
