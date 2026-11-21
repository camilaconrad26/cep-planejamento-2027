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

  test("kpi-e-medicoes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await criarConta(page);
    await page.goto("/metas?aba=kpis");
    await page.getByRole("button", { name: "Novo indicador" }).click();
    await page.getByLabel("Nome do indicador").fill("Taxa de conversão");
    await page.getByLabel("Unidade").fill("%");
    await page.getByLabel("Sentido").selectOption("maior");
    await page.getByLabel("Meta", { exact: true }).fill("30");
    await page.getByRole("button", { name: "Criar indicador" }).click();
    const kpi = page.getByRole("article", { name: "Taxa de conversão" });
    await expect(kpi.getByText("Sem medição", { exact: true })).toBeVisible();
    await kpi.getByLabel("Data da medição").fill("2072-01-15"); // data no futuro é recusada
    await kpi.getByLabel("Valor medido").fill("20");
    await kpi.getByRole("button", { name: "Registrar medição" }).click();
    await expect(kpi.getByText("Sem medição", { exact: true })).toBeVisible(); // o campo de data barra o futuro: nada é registrado
    await expect(kpi.getByText(/^Medições \(/)).toHaveCount(0);
    for (const [i, [data, valor]] of [["2026-09-15", "20"], ["2026-10-10", "35"]].entries()) {
      await kpi.getByLabel("Data da medição").fill(data);
      await kpi.getByLabel("Valor medido").fill(valor);
      await kpi.getByRole("button", { name: "Registrar medição" }).click();
      await expect(kpi.getByText(`Medições (${i + 1})`)).toBeVisible();
    }
    await expect(kpi.getByText("Na meta", { exact: true })).toBeVisible();
    await expect(kpi.getByRole("img", { name: "out/2026: 35 %" })).toBeVisible();
    await page.reload();
    const k2 = page.getByRole("article", { name: "Taxa de conversão" });
    await k2.getByRole("button", { name: "Excluir indicador: Taxa de conversão" }).click();
    await expect(k2.getByRole("alertdialog")).toContainText("Excluir este indicador e as 2 medições?");
    await k2.getByRole("button", { name: "Excluir de vez" }).click();
    await expect(page.getByRole("article", { name: "Taxa de conversão" })).toHaveCount(0);
  });

  test("grafico-trimestral", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await criarConta(page);
    await page.goto("/metas");
    await page.getByLabel("1º trimestre · Meta").fill("300.000");
    await page.getByLabel("Realizado no 1º trimestre").fill("150.000");
    await page.getByLabel("Realizado no 2º trimestre").click();
    await expect(page.getByRole("img", { name: /1º tri — realizado: R\$\s150\.000/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /1º tri — meta: R\$\s300\.000/ })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("sem-objetivo-avisa", async ({ page }) => {
    await criarConta(page);
    await page.goto("/metas?aba=okrs");
    await expect(page.getByText("Crie um objetivo no Planejamento estratégico")).toBeVisible();
  });
});
