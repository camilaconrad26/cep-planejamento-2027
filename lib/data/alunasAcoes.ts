"use server";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";

/** Senha provisória de uma aluna: a função cep-conta confere de novo que quem pede é mentora e que a conta é de aluna. */
export async function redefinirSenha(userId: string, senha: string): Promise<{ ok?: string; erro?: string }> {
  const s = await obterSessao();
  if (!s) return { erro: "Sua sessão expirou. Entre de novo." };
  if (!s.papeis.includes("mentora")) return { erro: "Apenas a mentora pode redefinir senhas." };
  if (senha.length < 8 || senha.length > 72) return { erro: "A senha precisa ter de 8 a 72 caracteres." };
  const sb = await criarClienteServidor();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { erro: "Sua sessão expirou. Entre de novo." };
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cep-conta`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ acao: "redefinir", userId, novaSenha: senha }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; erro?: string };
    return r.ok && j.ok ? { ok: "Senha provisória definida. Avise a aluna e peça que troque em Configurações." } : { erro: j.erro ?? "Não foi possível redefinir a senha." };
  } catch { return { erro: "Não foi possível redefinir a senha. Verifique a conexão." }; }
}
