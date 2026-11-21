"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { voltaSegura } from "@/lib/domain/volta";

export type EstadoForm = { erro?: string; campos?: Record<string, string> };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** IP de quem está se cadastrando (a Vercel põe o do visitante em primeiro), para o limite de tentativas ser por pessoa. */
async function ipVisitante(): Promise<string> {
  const h = await headers();
  return ((h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "").slice(0, 64);
}

export async function entrar(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const email = txt(f, "email").toLowerCase(), senha = String(f.get("senha") ?? "");
  const campos = { email };
  if (!EMAIL.test(email)) return { erro: "Informe um e-mail válido.", campos };
  if (!senha) return { erro: "Informe a senha.", campos };
  const sb = await criarClienteServidor();
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: "E-mail ou senha incorretos.", campos };
  redirect(voltaSegura(f.get("volta")));
}

export async function criarConta(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const nome = txt(f, "nome"), email = txt(f, "email").toLowerCase(), senha = String(f.get("senha") ?? "");
  const campos = { nome, email };
  if (nome.length < 3) return { erro: "Informe o seu nome completo.", campos };
  if (!EMAIL.test(email)) return { erro: "Informe um e-mail válido.", campos };
  if (senha.length < 8) return { erro: "A senha precisa de pelo menos 8 caracteres.", campos };
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cep-conta`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "x-cep-visitante": await ipVisitante() },
    body: JSON.stringify({ acao: "cadastro", nome, email, senha }),
    cache: "no-store",
  }).catch((e) => { console.error("cep-conta: falha de rede", e?.cause ?? e); return null; });
  if (!r) return { erro: "Sem conexão com o servidor. Tente de novo.", campos };
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { erro?: string };
    return { erro: j.erro ?? "Não foi possível criar a conta. Tente de novo.", campos };
  }
  const sb = await criarClienteServidor();
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: "Conta criada, mas não foi possível entrar. Use \"Entrar\".", campos };
  redirect("/visao-geral");
}

export async function sair() {
  const sb = await criarClienteServidor();
  await sb.auth.signOut();
  redirect("/entrar");
}
