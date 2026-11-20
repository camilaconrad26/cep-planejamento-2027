import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test("numeros-e-calculos-persistem", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/fechamento");
  await page.getByLabel("Faturamento realizado em 2026").fill("200000");
  await page.getByLabel("Meta que você tinha para 2026").fill("250.000,00");
  await page.getByLabel("Contratos fechados no ano").fill("10");
  await page.getByLabel("Contratos fechados no ano").blur();
  await expect(page.getByTestId("ticket-medio")).toHaveText(/R\$\s20\.000/);
  await expect(page.getByTestId("meta-atingida")).toHaveText("80%");
  await expect(page.locator("#salvo")).toHaveText(/Salvo às/, { timeout: 15_000 });
  await page.reload();
  await expect(page.getByLabel("Faturamento realizado em 2026")).toHaveValue(/R\$\s200\.000/);
  await expect(page.getByTestId("meta-atingida")).toHaveText("80%");
});

test("lista-vira-tarefa", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/fechamento");
  const novo = page.getByLabel("Novo item em Começar a fazer");
  await novo.fill("Cobrar o diagnóstico");
  await novo.press("Enter");
  await expect(novo).toBeFocused();
  await expect(page.getByLabel("Começar a fazer, item 1")).toHaveValue("Cobrar o diagnóstico");
  await page.getByLabel("Trimestre da tarefa: Cobrar o diagnóstico").selectOption("2");
  await page.getByRole("button", { name: "Criar tarefa: Cobrar o diagnóstico" }).click();
  await expect(page.getByText("✓ Tarefa criada no 2º tri")).toBeVisible();
  await expect(page.locator("#salvo")).toHaveText(/Salvo às/, { timeout: 15_000 });
  await page.reload();
  await expect(page.getByText("✓ Tarefa criada no 2º tri")).toBeVisible();
});

test("remover-e-desfazer", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/fechamento");
  const novo = page.getByLabel("Novo item em Pendências");
  await novo.fill("Terminar tabela de honorários");
  await novo.press("Enter");
  await page.getByRole("button", { name: "Remover: Terminar tabela de honorários" }).click();
  await expect(page.getByLabel("Pendências, item 1")).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByLabel("Pendências, item 1")).toHaveValue("Terminar tabela de honorários");
});

test("notas-por-area", async ({ page }) => {
  await criarConta(page);
  await page.goto("/diagnostico/fechamento");
  await page.getByLabel("Nota para Comercial").fill("3");
  await expect(page.getByTestId("nota-comercial")).toHaveText("3");
});
