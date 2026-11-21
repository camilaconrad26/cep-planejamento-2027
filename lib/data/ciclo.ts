import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/tipos";

/** Ciclo ativo da organização. Só lê (a mentora pode ler o de qualquer aluna); se a própria aluna ainda não tem, cria. */
export async function obterCicloId(sb: SupabaseClient<Database>, orgId: string): Promise<string> {
  const { data } = await sb.from("cep_cycles").select("id").eq("org_id", orgId).eq("status", "ativo").maybeSingle();
  if (data) return data.id;
  const { data: id, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !id) throw new Error("Não foi possível carregar o ciclo de planejamento.");
  return id as string;
}
