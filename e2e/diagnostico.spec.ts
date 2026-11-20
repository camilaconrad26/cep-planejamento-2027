import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("retoma-diagnostico", async ({ page }) => {
  await criarConta(page);
  await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Meu diagnóstico" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  await expect(page.locator("main h1")).toBeFocused();
  await page.getByLabel("Atuo de forma autônoma e já conduzo casos").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 2 de 10")).toBeVisible();
  await page.getByLabel("1 a 3 anos").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 3 de 10")).toBeVisible();
  await page.getByLabel("4 a 10").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 4 de 10")).toBeVisible();
  await page.goto("/diagnostico");
  await expect(page.getByText("Pergunta 4 de 10")).toBeVisible();
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page.getByLabel("4 a 10")).toBeChecked();
});

test("resumo-e-perfil", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/1");
  await page.getByLabel("Tenho escritório com equipe e carteira de famílias").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  for (let i = 2; i <= 6; i++) {
    await expect(page.getByText(`Pergunta ${i} de 10`)).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
  }
  await expect(page.getByText("Pergunta 7 de 10")).toBeVisible();
  await page.getByLabel("Não").check(); await page.getByRole("button", { name: "Continuar" }).click(); // comercial
  await expect(page.getByText("Pergunta 8 de 10")).toBeVisible();
  await page.getByLabel("Sim").check(); await page.getByRole("button", { name: "Continuar" }).click(); // financeiro
  await expect(page.getByText("Pergunta 9 de 10")).toBeVisible();
  await page.getByLabel("Em parte").check(); await page.getByRole("button", { name: "Continuar" }).click(); // método
  await expect(page.getByText("Pergunta 10 de 10")).toBeVisible();
  await page.getByLabel("Precificar").check();
  await page.getByLabel("Quer detalhar?").fill("Cobro pouco no diagnóstico");
  await page.getByRole("button", { name: "Ver resumo" }).click();
  await expect(page).toHaveURL(/\/diagnostico\/resumo/);
  await expect(page.getByText("Controle financeiro estruturado")).toBeVisible();
  await expect(page.getByText("Processo comercial ainda não estruturado")).toBeVisible();
  const prioridades = page.getByRole("list", { name: "Prioridades sugeridas" });
  await expect(prioridades.getByRole("listitem")).toHaveText([/Comercial$/, /Financeiro e Precificação$/, /Método e Serviços$/]);
  await page.getByRole("button", { name: "Confirmar Perfil 3" }).click();
  await expect(page.getByText("Perfil 3 confirmado.")).toBeVisible();
  await page.goto("/visao-geral");
  await expect(page.getByText("Perfil 3", { exact: false })).toBeVisible();
  await page.goto("/diagnostico");
  await expect(page).toHaveURL(/\/diagnostico\/resumo/);
});

test("pular", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/1");
  for (let i = 1; i <= 9; i++) {
    await expect(page.getByText(`Pergunta ${i} de 10`)).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
  }
  await expect(page.getByText("Pergunta 10 de 10")).toBeVisible();
  await page.getByRole("button", { name: "Ver resumo" }).click();
  await expect(page.getByText("Responda ao menos o estágio ou a quantidade de projetos para sugerirmos um perfil.")).toBeVisible();
  await page.getByLabel("Perfil 2").check();
  await page.getByRole("button", { name: "Confirmar perfil escolhido" }).click();
  await expect(page.getByText("Perfil 2 confirmado.")).toBeVisible();
});

test("passo-invalido", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/99");
  await expect(page).toHaveURL(/\/diagnostico\/1$/);
});
