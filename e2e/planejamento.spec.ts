import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

test.describe("planejamento", () => {
  test("abre-pelo-menu-no-trimestre-atual", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await criarConta(page);
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Planejamento estratégico" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Planejamento estratégico" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Período" }).getByRole("link", { name: "1º trimestre" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("0 de 3")).toBeVisible();
  });

  test("prioridades-limite-e-confirmacao", async ({ page }) => {
    await criarConta(page);
    await page.goto("/planejamento?visao=t1");
    const prio = page.getByRole("region", { name: "Prioridades do 1º trimestre" });
    for (const c of ["Comercial", "Método e Serviços", "Financeiro e Precificação"]) {
      await prio.getByRole("button", { name: c }).click();
      await expect(prio.getByRole("button", { name: c })).toHaveAttribute("aria-pressed", "true");
    }
    await expect(prio.getByText("3 de 3")).toBeVisible();
    await prio.getByRole("button", { name: "Operação e Tecnologia" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(prio.getByText("3 de 3")).toBeVisible();
    await prio.getByRole("button", { name: "Operação e Tecnologia" }).click();
    await page.getByRole("button", { name: "Adicionar mesmo assim" }).click();
    await expect(prio.getByText("4 de 3")).toBeVisible();
    await expect(prio.getByText("Acima do recomendado")).toBeVisible();
    await page.goto("/visao-geral");
    await expect(page.getByText("Escolha as prioridades do 1º trimestre")).toHaveCount(0);
  });

  test("objetivo-e-acoes", async ({ page }) => {
    await criarConta(page);
    await page.goto("/planejamento?visao=t1");
    await page.getByRole("region", { name: "Prioridades do 1º trimestre" }).getByRole("button", { name: "Comercial" }).click();
    const grupo = page.getByRole("region", { name: "Comercial" });
    await grupo.getByRole("button", { name: "Novo objetivo" }).click();
    await grupo.getByLabel("Objetivo", { exact: true }).fill("Fechar 10 contratos");
    await grupo.getByLabel("Trimestre do objetivo").selectOption("1");
    await grupo.getByRole("button", { name: "Criar objetivo" }).click();
    const obj = page.getByRole("article", { name: "Fechar 10 contratos" });
    await expect(obj).toBeVisible();

    await obj.getByRole("button", { name: "Nova ação" }).click();
    await obj.getByLabel("Ação", { exact: true }).fill("Mapear funil");
    await obj.getByLabel("Nível da ação").selectOption("tatico");
    await obj.getByLabel("Trimestre da ação").selectOption("1");
    await obj.getByRole("button", { name: "Criar ação" }).click();
    await expect(obj.getByText("Mapear funil")).toBeVisible();
    await obj.getByRole("button", { name: "Nova ação" }).click();
    await obj.getByLabel("Ação", { exact: true }).fill("Ligar para 5 indicações");
    await obj.getByLabel("Nível da ação").selectOption("operacional");
    await obj.getByLabel("Trimestre da ação").selectOption("2");
    await obj.getByRole("button", { name: "Criar ação" }).click();
    await expect(obj.getByText("Mapear funil")).toBeVisible();
    await expect(obj.getByText("Ligar para 5 indicações")).toHaveCount(0); // é do 2º trimestre

    await page.getByRole("navigation", { name: "Período" }).getByRole("link", { name: "2º trimestre" }).click();
    const obj2 = page.getByRole("article", { name: "Fechar 10 contratos" });
    await expect(obj2.getByText("Ligar para 5 indicações")).toBeVisible();
    await expect(obj2.getByText("Mapear funil")).toHaveCount(0);

    await page.getByRole("navigation", { name: "Período" }).getByRole("link", { name: "Ano todo" }).click();
    const objA = page.getByRole("article", { name: "Fechar 10 contratos" });
    await objA.getByRole("button", { name: "Editar objetivo" }).click();
    await objA.getByLabel("Objetivo", { exact: true }).fill("Fechar 12 contratos");
    await objA.getByRole("button", { name: "Salvar objetivo" }).click();
    const objB = page.getByRole("article", { name: "Fechar 12 contratos" });
    await expect(objB).toBeVisible();
    await objB.getByRole("button", { name: "Excluir objetivo" }).click();
    await expect(objB.getByRole("alertdialog")).toContainText("Excluir este objetivo e as 2 ações ligadas a ele?");
    await objB.getByRole("button", { name: "Excluir de vez" }).click();
    await expect(page.getByRole("article", { name: "Fechar 12 contratos" })).toHaveCount(0);
    await page.goto("/visao-geral");
    await expect(page.getByTestId("total-acoes")).toHaveText("0");
  });

  test("item-da-biblioteca-aparece-na-arvore", async ({ page }) => {
    await criarConta(page);
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=tatico");
    const item = page.getByRole("listitem").filter({ hasText: "Tático" });
    const texto = (await item.locator("p").first().innerText()).trim();
    await item.getByLabel(/^Trimestre para:/).selectOption("2");
    await item.getByRole("button", { name: "Adicionar ao meu plano" }).click();
    await expect(item.getByText("No seu plano")).toBeVisible();
    await page.goto("/planejamento?visao=t2");
    const grupo = page.getByRole("region", { name: "Comercial" });
    await expect(grupo.getByText("Da biblioteca")).toBeVisible();
    await expect(grupo.getByText(texto, { exact: true })).toBeVisible();
  });

  test("excluir-objetivo-avisa-kr-e-kpi-e-libera-readicao", async ({ page }) => {
    await criarConta(page);
    for (const nivel of ["okr", "kpi"]) {
      await page.goto(`/biblioteca?perfil=1&categoria=comercial&nivel=${nivel}`);
      const item = page.getByRole("listitem").filter({ hasText: nivel.toUpperCase() });
      await item.getByRole("button", { name: "Adicionar ao meu plano" }).click();
      await expect(item.getByText("No seu plano")).toBeVisible();
    }
    await page.goto("/planejamento?visao=ano");
    const obj = page.getByRole("region", { name: "Comercial" }).getByRole("article");
    await obj.getByRole("button", { name: "Excluir objetivo" }).click();
    await expect(obj.getByRole("alertdialog")).toContainText("1 resultado-chave e 1 indicador");
    await obj.getByRole("button", { name: "Excluir de vez" }).click();
    await expect(page.getByRole("region", { name: "Comercial" })).toHaveCount(0);
    await page.goto("/biblioteca?perfil=1&categoria=comercial&nivel=kpi");
    await expect(page.getByRole("listitem").filter({ hasText: "KPI" }).getByRole("button", { name: "Adicionar ao meu plano" })).toBeVisible();
  });

  test("celular-390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await criarConta(page);
    await page.goto("/planejamento");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
