import { readFileSync } from "node:fs";

// Acesso direto à API do Supabase como a conta admin de teste, para conferir e limpar a biblioteca depois dos testes.
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const MARCA = "teste e2e";

async function token(email: string, senha: string) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: senha }) });
  if (!r.ok) throw new Error(`login admin falhou: ${r.status}`);
  return (await r.json()).access_token as string;
}

export async function apiAdmin(email: string, senha: string) {
  const h = { apikey: ANON, Authorization: `Bearer ${await token(email, senha)}`, "Content-Type": "application/json" };
  const rest = (caminho: string, init?: RequestInit) => fetch(`${URL}/rest/v1/${caminho}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } });
  return {
    /** Itens que os testes criaram ou marcaram. */
    async rastros(): Promise<{ id: string; texto: string; ativo: boolean }[]> {
      const r = await rest(`cep_library_items?select=id,texto,ativo&or=(texto.ilike.*${encodeURIComponent(MARCA)}*,texto.ilike.*(teste)*,ativo.is.false)`);
      return r.json();
    },
    async apagarCriados() { await rest(`cep_library_items?texto=ilike.*${encodeURIComponent(MARCA)}*`, { method: "DELETE" }); },
    async restaurar(id: string, texto: string) {
      await rest(`cep_library_items?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ texto, ativo: true }) });
    },
  };
}
