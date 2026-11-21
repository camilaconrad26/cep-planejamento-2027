import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { criarConta } from "./ajuda";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));

test("importar-v1", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { email, senha } = await criarConta(page, "Aluna da V1");
  await page.goto("/configuracoes");
  await expect(page.getByRole("heading", { name: "Importar da versão anterior" })).toHaveCount(0); // sem plano na v1, sem cartão

  // a própria aluna grava o seu plano da v1 (como fazia o site antigo)
  const tok = await (await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: senha }) })).json();
  const uid = JSON.parse(Buffer.from(tok.access_token.split(".")[1], "base64url").toString()).sub;
  const dados = { perfil: 1, itens: { p1c1n1: { fazer: true, tri: "2", prazo: "2027-03-01", status: "Em andamento" } },
    tarefas: [{ id: "t", texto: "Tarefa vinda da v1", tri: "1", feito: false }], metas: { anual: { fat: { 0: "1.000.000" } } }, retro: { fat: "800.000" } };
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cep2027_planos`, { method: "POST",
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: uid, nome: "Aluna da V1", email, dados }) });
  expect(r.status).toBe(201);

  await page.reload();
  await page.getByRole("button", { name: "Importar meu planejamento" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Planejamento importado." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Importar da versão anterior" })).toHaveCount(0);

  await page.goto("/planejamento?visao=ano");
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Comercial" }) }).getByText("Da biblioteca")).toBeVisible();
  await page.goto("/plano-de-acao");
  await expect(page.getByText("Tarefa vinda da v1")).toBeVisible();
  await expect(page.getByText("01/03/2027")).toBeVisible();
  await page.goto("/metas");
  expect((await page.getByLabel("Faturamento · Meta").inputValue()).replace(/\s/g, " ")).toBe("R$ 1.000.000");
  await expect(page.getByText(/Base de 2026: faturamento de R\$\s800\.000/)).toBeVisible();
});
