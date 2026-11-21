import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import type { RespostasRevisao, RetratoRevisao } from "@/lib/domain/revisao";

export type Revisao = { trimestre: number; respostas: RespostasRevisao; retrato: RetratoRevisao | null; concluidaEm: string | null };

/** Revisões do ciclo ativo e o faturamento realizado de cada trimestre. */
export async function obterRevisoes(orgId: string) {
  const sb = await criarClienteServidor();
  const { data: cicloId, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !cicloId) throw new Error("Não foi possível carregar o seu ciclo de planejamento.");
  const [rev, reais] = await Promise.all([
    sb.from("cep_reviews").select("trimestre, respostas, retrato, concluida_em").eq("cycle_id", cicloId),
    sb.from("cep_quarter_results").select("trimestre, faturamento_realizado").eq("cycle_id", cicloId),
  ]);
  const revisoes: Revisao[] = (rev.data ?? []).map((r) => ({
    trimestre: r.trimestre, respostas: (r.respostas ?? {}) as RespostasRevisao, retrato: (r.retrato ?? null) as RetratoRevisao | null, concluidaEm: r.concluida_em,
  }));
  const realizado: Record<number, number> = {};
  for (const q of reais.data ?? []) realizado[q.trimestre] = Number(q.faturamento_realizado ?? 0);
  return { cicloId: cicloId as string, revisoes, realizado };
}
