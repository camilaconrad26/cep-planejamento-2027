import { expect, test } from "@playwright/test";
import { criarConta } from "./ajuda";

/** Critérios de aceitação (spec §11) num caminho só, do cadastro à revisão. Mapa completo em docs/aceitacao.md. */
test("jornada-completa", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const { email, senha } = await criarConta(page, "Aluna da Jornada");

  // diagnóstico → perfil sugerido, confirmado pela aluna
  await page.goto("/diagnostico/1");
  await page.getByLabel("Tenho escritório com equipe e carteira de famílias").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  for (let i = 2; i <= 9; i++) {
    await expect(page.getByText(`Pergunta ${i} de 10`)).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
  }
  await expect(page.getByText("Pergunta 10 de 10")).toBeVisible();
  await page.getByLabel("Precificar").check();
  await page.getByRole("button", { name: "Ver resumo" }).click();
  await page.getByRole("button", { name: "Confirmar Perfil 3" }).click();
  await expect(page.getByText("Perfil 3 confirmado.")).toBeVisible();

  // o perfil influencia a biblioteca; a biblioteca traz os conteúdos originais
  await page.goto("/biblioteca");
  await expect(page.getByLabel("Perfil")).toHaveValue("3");
  await page.goto("/biblioteca?perfil=3&categoria=comercial&nivel=tatico");
  const item = page.getByRole("listitem").filter({ hasText: "Tático" }).first();
  await item.getByLabel(/^Trimestre para:/).selectOption("1");
  await item.getByRole("button", { name: "Adicionar ao meu plano" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Adicionado ao 1º trimestre." })).toBeVisible();

  // o planejamento mostra o objetivo e a ação; as ações selecionadas aparecem na execução
  await page.goto("/planejamento?visao=ano");
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Comercial" }) }).getByText("Da biblioteca").first()).toBeVisible();
  await page.goto("/plano-de-acao");
  const tabela = page.getByRole("region", { name: "Tabela de ações" });
  await expect(tabela.locator("tbody tr[data-acao]")).toHaveCount(1);
  const linha = tabela.locator("tbody tr[data-acao]").first();

  // editar: prazo e status atualizam
  await linha.getByRole("button", { name: /^Editar:/ }).click();
  const form = page.getByRole("form", { name: /^Editar ação:/ });
  await form.getByLabel("Responsável").fill("Ana");
  await form.getByLabel("Prazo").fill("2027-02-10");
  await form.getByRole("button", { name: "Salvar ação" }).click();
  await expect(tabela.locator("tbody tr[data-acao]").first()).toContainText("10/02/2027");

  // filtros
  await page.goto("/plano-de-acao?trimestre=2");
  await expect(page.getByRole("region", { name: "Tabela de ações" }).locator("tbody tr[data-acao]")).toHaveCount(0);
  await page.goto("/plano-de-acao?trimestre=1");
  await expect(page.getByRole("region", { name: "Tabela de ações" }).locator("tbody tr[data-acao]")).toHaveCount(1);

  // Kanban: mover pelo teclado (alternativa ao arrastar)
  await page.goto("/plano-de-acao?visao=kanban");
  await page.getByLabel(/^Mover ".*" para$/).first().selectOption("concluido");
  await page.getByRole("button", { name: /^Mover "/ }).first().click();
  await expect(page.getByRole("region", { name: /Concluída/ }).locator("li")).toHaveCount(1);

  // indicadores refletem dados reais: execução 100% (1 de 1 concluída)
  await page.goto("/visao-geral");
  await expect(page.getByTestId("total-acoes")).toHaveText("1");
  await expect(page.getByTestId("execucao")).toHaveText("100%");

  // metas
  await page.goto("/metas");
  await page.getByLabel("Faturamento · Meta").fill("R$ 1.200.000,00");
  await page.getByLabel("Time (pessoas) · Meta").click();
  await expect(page.locator("#salvo")).toContainText("Salvo às");

  // revisão trimestral gera histórico
  await page.goto("/revisao?t=1");
  await page.getByLabel("O que foi executado?").fill("Fechei a ação do trimestre");
  await page.getByLabel("O que impediu a execução?").click();
  await expect(page.locator("#salvo")).toContainText("Salvo às");
  await page.getByRole("button", { name: "Concluir revisão" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Revisão do 1º trimestre concluída em" })).toBeVisible();
  await page.goto("/historico");
  await expect(page.getByText("Revisão do 1º trimestre concluída").first()).toBeVisible();

  // sair e entrar de novo: tudo salvo no Supabase
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/visao-geral/);
  await page.goto("/plano-de-acao?concluidas=1");
  await expect(page.getByRole("region", { name: "Tabela de ações" }).locator("tbody tr[data-acao]").first()).toContainText("Ana");
  await page.goto("/metas");
  expect(sem(await page.getByLabel("Faturamento · Meta").inputValue())).toBe("R$ 1.200.000");
  await page.goto("/revisao?t=1");
  await expect(page.getByLabel("O que foi executado?")).toHaveValue("Fechei a ação do trimestre");
});
const sem = (s: string) => s.replace(/\s/g, " ");
