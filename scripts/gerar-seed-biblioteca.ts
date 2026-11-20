// Gera a migração que semeia a biblioteca do CEP a partir dos 105 itens do Notion
// (transcritos em scripts/fonte/dados-v1.js, o mesmo arquivo da v1).
// Uso: npx tsx scripts/gerar-seed-biblioteca.ts > supabase/migrations/20261120000400_cep_biblioteca_seed.sql
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { CATEGORIAS } from "../lib/domain/categorias";

const NIVEIS = ["estrategico", "tatico", "operacional", "okr", "kpi"] as const;
const NAMESPACE = "6f1c2c5e-2a4b-4c8e-9d0a-ce0000000001";

function uuidV5(nome: string): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const h = createHash("sha1").update(Buffer.concat([ns, Buffer.from(nome, "utf8")])).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/** Id estável de um item: perfil 1–3, índice da categoria em CATS, índice do nível 0–4. */
export const idItem = (perfil: number, cat: number, nivel: number) => uuidV5(`item:${perfil}:${cat}:${nivel}`);
const idCategoria = (cat: number) => uuidV5(`categoria:${cat}`);
const q = (s: string | null) => (s === null ? "null" : `'${s.replace(/'/g, "''")}'`);
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function carregarFonte(arquivo = path.join(__dirname, "fonte", "dados-v1.js")): { SEMENTE: string[][][]; CATS: string[] } {
  const ctx: Record<string, unknown> = {};
  vm.runInNewContext(readFileSync(arquivo, "utf8") + "\n;this.SEMENTE = SEMENTE; this.CATS = CATS;", ctx, { timeout: 1000 });
  return { SEMENTE: ctx.SEMENTE as string[][][], CATS: ctx.CATS as string[] };
}

export function gerarSeed(semente: string[][][], cats: string[]): string {
  const linhas = ["-- Gerado por scripts/gerar-seed-biblioteca.ts. Não editar à mão.", "-- Biblioteca do CEP: 7 categorias e os itens do Notion, com texto intacto."];
  cats.forEach((nome, i) => {
    const c = CATEGORIAS.find((x) => x.nome === nome);
    linhas.push(
      `insert into public.cep_categories (id, slug, nome, descricao, objetivo, ordem) values (${q(idCategoria(i))}, ${q(c?.slug ?? slugify(nome))}, ${q(nome)}, ${q(c?.descricao ?? "")}, ${q(c?.objetivo ?? "")}, ${i + 1}) on conflict (id) do nothing;`,
    );
  });
  semente.forEach((porCategoria, p) =>
    porCategoria.forEach((niveis, c) =>
      niveis.forEach((texto, n) => {
        const pai = n === 0 ? null : idItem(p + 1, c, 0);
        linhas.push(
          `insert into public.cep_library_items (id, category_id, perfil, nivel, texto, parent_id, ordem) values (${q(idItem(p + 1, c, n))}, ${q(idCategoria(c))}, ${p + 1}, '${NIVEIS[n]}', ${q(texto)}, ${q(pai)}, ${n + 1}) on conflict (id) do nothing;`,
        );
      }),
    ),
  );
  return linhas.join("\n") + "\n";
}

if (require.main === module) {
  const { SEMENTE, CATS } = carregarFonte();
  process.stdout.write(gerarSeed(SEMENTE, CATS));
}
