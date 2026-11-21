import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterCicloId } from "@/lib/data/ciclo";
import { agruparAtividades, textoAtividade } from "@/lib/domain/atividade";

/** Ciclos, ações concluídas e registro de alterações (os `limite` mais recentes). */
export async function obterHistorico(orgId: string, limite: number) {
  const sb = await criarClienteServidor();
  const cicloId = await obterCicloId(sb, orgId);
  const [ciclos, concl, atv] = await Promise.all([
    sb.from("cep_cycles").select("id, ano, status").eq("org_id", orgId).order("ano", { ascending: false }),
    sb.from("cep_tasks").select("id, titulo, concluido_em, cep_objectives(titulo)").eq("cycle_id", cicloId).eq("status", "concluido").order("concluido_em", { ascending: false }),
    sb.from("cep_activity").select("id, entidade, acao, antes, depois, em").eq("org_id", orgId).order("em", { ascending: false }).limit(limite + 1),
  ]);
  const linhas = (atv.data ?? []).slice(0, limite).map((a) => ({
    id: a.id, em: a.em, texto: textoAtividade({ entidade: a.entidade, acao: a.acao, antes: a.antes as Record<string, unknown> | null, depois: a.depois as Record<string, unknown> | null }),
  }));
  return {
    ciclos: ciclos.data ?? [],
    concluidas: (concl.data ?? []).map((t) => ({ id: t.id, titulo: t.titulo, concluidoEm: t.concluido_em,
      objetivo: (Array.isArray(t.cep_objectives) ? t.cep_objectives[0] : t.cep_objectives as { titulo: string } | null)?.titulo ?? null })),
    atividades: agruparAtividades(linhas), temMais: (atv.data?.length ?? 0) > limite,
  };
}
