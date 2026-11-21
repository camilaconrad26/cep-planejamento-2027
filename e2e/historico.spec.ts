import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { criarConta } from "./ajuda";

test("historico-e-exportacao", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await criarConta(page, "Ana Exportação");
  await page.goto("/planejamento?visao=ano");
  await page.getByRole("button", { name: "Novo objetivo em outra categoria" }).click();
  await page.getByLabel("Categoria do objetivo").selectOption({ label: "Comercial" });
  await page.getByLabel("Objetivo", { exact: true }).fill("Crescer a carteira");
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  const obj = page.getByRole("article", { name: "Crescer a carteira" });
  await obj.getByRole("button", { name: "Nova ação" }).click();
  await obj.getByLabel("Ação", { exact: true }).fill("=Mapear funil; parceiros");
  await obj.getByRole("button", { name: "Criar ação" }).click();
  await expect(obj.getByText("=Mapear funil; parceiros")).toBeVisible();
  await page.goto("/plano-de-acao?visao=kanban");
  await page.getByLabel('Mover "=Mapear funil; parceiros" para').selectOption("concluido");
  await page.getByRole("button", { name: 'Mover "=Mapear funil; parceiros"' }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ação concluída." })).toBeVisible();

  await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Histórico" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Histórico" })).toBeVisible();
  const secao = (t: RegExp | string) => page.locator("section", { has: page.getByRole("heading", { name: t }) });
  await expect(secao(/Ações concluídas/).getByText("=Mapear funil; parceiros")).toBeVisible();
  await expect(secao("Registro de alterações").getByText("Ação concluída: =Mapear funil; parceiros")).toBeVisible();
  await expect(secao("Registro de alterações").getByText("Objetivo criado: Crescer a carteira")).toBeVisible();

  await page.goto("/configuracoes");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Baixar ações em planilha (CSV)" }).click()]);
  expect(download.suggestedFilename()).toBe("plano-de-acao-2027.csv");
  const csv = readFileSync((await download.path())!, "utf8");
  expect(csv.startsWith("﻿Ação;Objetivo;Categoria")).toBe(true);
  expect(csv).toContain(`"'=Mapear funil; parceiros";Crescer a carteira;Comercial;Operacional`.replace("Operacional", "Tático"));

  await page.getByRole("link", { name: "Versão para imprimir ou salvar em PDF" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ana Exportação" })).toBeVisible();
  await expect(page.getByText("=Mapear funil; parceiros")).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimir ou salvar em PDF" })).toBeVisible();
});
