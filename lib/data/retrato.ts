import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { calcularRetrato, type TarefaResumo } from "@/lib/domain/retrato";

/** Busca o que a Visão geral precisa e calcula o retrato. RLS garante que só vem a organização da aluna. */
export async function montarRetrato(orgId: string, hoje: string) {
  const sb = await criarClienteServidor();
  const { data: cicloId, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !cicloId) throw new Error("Não foi possível carregar o seu ciclo de planejamento.");
  const [ciclo, diag, prios, tarefas, revisoes] = await Promise.all([
    sb.from("cep_cycles").select("id, ano").eq("id", cicloId).single(),
    sb.from("cep_diagnostics").select("id").eq("org_id", orgId).limit(1),
    sb.from("cep_cycle_priorities").select("trimestre, cep_categories(slug)").eq("cycle_id", cicloId),
    sb.from("cep_tasks").select("status, prazo, trimestre, arquivado, cep_objectives(cep_categories(slug))").eq("cycle_id", cicloId),
    sb.from("cep_reviews").select("trimestre").eq("cycle_id", cicloId).not("concluida_em", "is", null),
  ]);
  const ano = ciclo.data?.ano ?? 2027;
  const slugDe = (x: unknown): string | null => {
    const o = Array.isArray(x) ? x[0] : x;
    return (o as { slug?: string } | null)?.slug ?? null;
  };
  const r = calcularRetrato({
    ano,
    diagnosticoIniciado: (diag.data?.length ?? 0) > 0,
    prioridades: (prios.data ?? []).map((p) => ({ trimestre: p.trimestre, slug: slugDe(p.cep_categories) ?? "" })).filter((p) => p.slug),
    tarefas: (tarefas.data ?? []).map((t) => {
      const obj = Array.isArray(t.cep_objectives) ? t.cep_objectives[0] : t.cep_objectives;
      return { status: t.status, prazo: t.prazo, trimestre: t.trimestre as TarefaResumo["trimestre"], arquivado: t.arquivado,
        categoria: slugDe((obj as { cep_categories?: unknown } | null)?.cep_categories) };
    }),
    trimestresRevisados: (revisoes.data ?? []).map((x) => x.trimestre),
  }, hoje);
  return { ...r, ciclo: { id: cicloId as string, ano } };
}
