import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { calcularRetrato, type TarefaResumo } from "@/lib/domain/retrato";
import { contarMedicoesVencidas, mediaKRs, situacaoKPI, type KPI, type KR } from "@/lib/domain/resultados";

/** Busca o que a Visão geral precisa e calcula o retrato. RLS garante que só vem a organização da aluna. */
export async function montarRetrato(orgId: string, hoje: string) {
  const sb = await criarClienteServidor();
  const { data: cicloId, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !cicloId) throw new Error("Não foi possível carregar o seu ciclo de planejamento.");
  const [ciclo, diag, prios, tarefas, revisoes, okrs, kpis] = await Promise.all([
    sb.from("cep_cycles").select("id, ano").eq("id", cicloId).single(),
    sb.from("cep_diagnostics").select("id, concluido_em").eq("org_id", orgId).order("created_at", { ascending: false }).limit(1),
    sb.from("cep_cycle_priorities").select("trimestre, cep_categories(slug)").eq("cycle_id", cicloId),
    sb.from("cep_tasks").select("status, prazo, trimestre, arquivado, cep_objectives(cep_categories(slug))").eq("cycle_id", cicloId),
    sb.from("cep_reviews").select("trimestre").eq("cycle_id", cicloId).not("concluida_em", "is", null),
    sb.from("cep_okrs").select("id").eq("cycle_id", cicloId),
    sb.from("cep_kpis").select("id, nome, unidade, sentido, meta, objective_id, created_at").eq("cycle_id", cicloId),
  ]);
  const okrIds = (okrs.data ?? []).map((o) => o.id), kpiIds = (kpis.data ?? []).map((k) => k.id);
  const [krsR, medsR] = await Promise.all([
    okrIds.length ? sb.from("cep_key_results").select("id, okr_id, descricao, unidade, valor_inicial, alvo, valor_atual, prazo, updated_at").in("okr_id", okrIds) : { data: [] },
    kpiIds.length ? sb.from("cep_kpi_measurements").select("id, kpi_id, data, valor").in("kpi_id", kpiIds).order("data") : { data: [] },
  ]);
  const krs: KR[] = (krsR.data ?? []).map((k) => ({ id: k.id, okrId: k.okr_id, descricao: k.descricao, unidade: k.unidade ?? "",
    inicial: k.valor_inicial === null ? null : Number(k.valor_inicial), alvo: k.alvo === null ? null : Number(k.alvo),
    atual: k.valor_atual === null ? null : Number(k.valor_atual), prazo: k.prazo, atualizadoEm: k.updated_at }));
  const kpiList: KPI[] = (kpis.data ?? []).map((k) => ({ id: k.id, nome: k.nome, unidade: k.unidade ?? "", sentido: k.sentido === "menor" ? "menor" : "maior",
    meta: k.meta === null ? null : Number(k.meta), objetivoId: k.objective_id, criadoEm: k.created_at }));
  const ultima: Record<string, string> = {};
  for (const m of medsR.data ?? []) ultima[m.kpi_id] = m.data;
  const ano = ciclo.data?.ano ?? 2027;
  const slugDe = (x: unknown): string | null => {
    const o = Array.isArray(x) ? x[0] : x;
    return (o as { slug?: string } | null)?.slug ?? null;
  };
  const r = calcularRetrato({
    ano,
    diagnosticoIniciado: (diag.data?.length ?? 0) > 0,
    diagnosticoConcluido: !!diag.data?.[0]?.concluido_em,
    prioridades: (prios.data ?? []).map((p) => ({ trimestre: p.trimestre, slug: slugDe(p.cep_categories) ?? "" })).filter((p) => p.slug),
    tarefas: (tarefas.data ?? []).map((t) => {
      const obj = Array.isArray(t.cep_objectives) ? t.cep_objectives[0] : t.cep_objectives;
      return { status: t.status, prazo: t.prazo, trimestre: t.trimestre as TarefaResumo["trimestre"], arquivado: t.arquivado,
        categoria: slugDe((obj as { cep_categories?: unknown } | null)?.cep_categories) };
    }),
    trimestresRevisados: (revisoes.data ?? []).map((x) => x.trimestre),
    medicaoVencida: contarMedicoesVencidas(krs, kpiList, ultima, hoje),
  }, hoje);
  const resultados = {
    mediaKRs: mediaKRs(krs), krsComMeta: krs.filter((k) => k.alvo !== null).length,
    kpis: kpiList.length,
    kpisNaMeta: kpiList.filter((k) => situacaoKPI(k, (medsR.data ?? []).filter((m) => m.kpi_id === k.id).map((m) => ({ id: m.id, data: m.data, valor: Number(m.valor), nota: "" }))).situacao === "na-meta").length,
  };
  return { ...r, resultados, ciclo: { id: cicloId as string, ano } };
}
