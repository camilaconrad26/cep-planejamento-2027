import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";

export type Papel = "mentora" | "admin";
export type Sessao = { userId: string; email: string; orgId: string; perfil: 1 | 2 | 3 | null; papeis: Papel[]; nome: string };

/** Sessão da aluna logada (uma vez por requisição). Sem sessão, vai para /entrar. */
export const exigirSessao = cache(async (): Promise<Sessao> => {
  const sb = await criarClienteServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/entrar");
  const [perfil, membro, papeis] = await Promise.all([
    sb.from("cep_profiles").select("nome, perfil").eq("user_id", user.id).maybeSingle(),
    sb.from("cep_organization_members").select("org_id").eq("user_id", user.id).order("org_id").limit(1).maybeSingle(),
    sb.from("cep_roles").select("papel").eq("user_id", user.id),
  ]);
  if (!perfil.data || !membro.data) throw new Error("Conta sem perfil ou organização. Fale com a mentora do CEP.");
  return {
    userId: user.id, email: user.email ?? "", orgId: membro.data.org_id, nome: perfil.data.nome,
    perfil: (perfil.data.perfil as 1 | 2 | 3 | null) ?? null, papeis: (papeis.data ?? []).map((p) => p.papel as Papel),
  };
});
