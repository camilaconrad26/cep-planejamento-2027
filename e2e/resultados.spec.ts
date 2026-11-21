import { expect, test, type Page } from "@playwright/test";
import { criarConta } from "./ajuda";

async function criarObjetivo(page: Page, titulo = "Crescer a carteira") {
  await page.goto("/planejamento?visao=ano");
  await page.getByRole("button", { name: "Novo objetivo em outra categoria" }).click();
  await page.getByLabel("Categoria do objetivo").selectOption({ label: "Comercial" });
  await page.getByLabel("Objetivo", { exact: true }).fill(titulo);
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  await expect(page.getByRole("article", { name: titulo })).toBeVisible();
}

test.describe("resultados", () => {
  test("okr-e-kr", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await criarConta(page);
    await criarObjetivo(page);
    await page.goto("/metas");
    await page.getByRole("navigation", { name: "Seções de metas" }).getByRole("link", { name: "OKRs e resultados-chave" }).click();
    await expect(page).toHaveURL(/aba=okrs/);
    await page.getByRole("button", { name: "Novo OKR" }).click();
    await page.getByLabel("Objetivo do OKR").selectOption({ label: "Crescer a carteira (Comercial)" });
    await page.getByLabel("OKR", { exact: true }).fill("Ganhar tração comercial");
    await page.getByRole("button", { name: "Criar OKR" }).click();
    const okr = page.getByRole("article", { name: "Ganhar tração comercial" });
    await expect(okr).toBeVisible();
    await okr.getByRole("button", { name: "Novo resultado-chave" }).click();
    await okr.getByLabel("Descrição").fill("Fechar contratos de holding");
    await okr.getByLabel("Unidade").fill("contratos");
    await okr.getByLabel("Valor inicial").fill("0");
    await okr.getByLabel("Alvo").fill("10");
    await okr.getByRole("button", { name: "Criar resultado-chave" }).click();
    await okr.getByLabel("Valor atual de Fechar contratos de holding").fill("4");
    await okr.getByRole("button", { name: "Lançar" }).click();
    await expect(okr.getByRole("progressbar", { name: "Progresso de Fechar contratos de holding" })).toHaveAttribute("aria-valuenow", "40");
    await okr.getByLabel("Valor atual de Fechar contratos de holding").fill("10");
    await okr.getByRole("button", { name: "Lançar" }).click();
    await expect(okr.getByText("Atingido")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("article", { name: "Ganhar tração comercial" }).getByText("Atingido")).toBeVisible();
    await expect(page.getByText("Resultado dos KRs: 100%")).toBeVisible();
    await expect(page.getByText("Execução das ações: —")).toBeVisible();
    await page.goto("/visao-geral");
    await expect(page.getByTestId("media-krs")).toHaveText("100%");
  });

  test("sem-objetivo-avisa", async ({ page }) => {
    await criarConta(page);
    await page.goto("/metas?aba=okrs");
    await expect(page.getByText("Crie um objetivo no Planejamento estratégico")).toBeVisible();
  });
});
