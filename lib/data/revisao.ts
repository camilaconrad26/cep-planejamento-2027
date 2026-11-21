import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterCicloId } from "@/lib/data/ciclo";
import type { RespostasRevisao, RetratoRevisao } from "@/lib/domain/revisao";

export type Revisao = { trimestre: number; respostas: RespostasRevisao; retrato: RetratoRevisao | null; concluidaEm: string | null };

/** Revisões do ciclo ativo e o faturamento realizado de cada trimestre. */
export async function obterRevisoes(orgId: string) {
  const sb = await criarClienteServidor();
  const cicloId = await obterCicloId(sb, orgId);
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
