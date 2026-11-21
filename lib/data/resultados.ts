import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterCicloId } from "@/lib/data/ciclo";
import type { KPI, KR, Medicao } from "@/lib/domain/resultados";
import { buscarTodas } from "@/lib/data/paginar";

const um = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
export type Okr = { id: string; objetivoId: string; titulo: string; trimestre: number | null };
export type ObjetivoR = { id: string; titulo: string; categoria: string; ordem: number };

/** OKRs, KRs, KPIs e medições do ciclo ativo, mais a execução (tarefas) de cada objetivo — mostrada à parte. */
export async function obterResultados(orgId: string) {
  const sb = await criarClienteServidor();
  const cicloId = await obterCicloId(sb, orgId);
  const [objs, okrs, kpis, tarefas] = await Promise.all([
    sb.from("cep_objectives").select("id, titulo, cep_categories(nome, ordem)").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_okrs").select("id, objective_id, titulo, trimestre").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_kpis").select("id, nome, unidade, sentido, meta, objective_id, created_at").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_tasks").select("objective_id, status").eq("cycle_id", cicloId).eq("arquivado", false),
  ]);
  const okrIds = (okrs.data ?? []).map((o) => o.id), kpiIds = (kpis.data ?? []).map((k) => k.id);
  const [krs, meds] = await Promise.all([
    okrIds.length ? sb.from("cep_key_results").select("id, okr_id, descricao, unidade, valor_inicial, alvo, valor_atual, prazo, updated_at").in("okr_id", okrIds).order("created_at") : { data: [] },
    kpiIds.length ? buscarTodas((de, ate) => sb.from("cep_kpi_measurements").select("id, kpi_id, data, valor, nota, created_at").in("kpi_id", kpiIds)
      .order("data").order("created_at").order("id").range(de, ate)).then((data) => ({ data })) : { data: [] },
  ]);
  const objetivos: ObjetivoR[] = (objs.data ?? []).map((o) => {
    const c = um(o.cep_categories as unknown as { nome: string; ordem: number } | { nome: string; ordem: number }[] | null);
    return { id: o.id, titulo: o.titulo, categoria: c?.nome ?? "", ordem: c?.ordem ?? 99 };
  }).sort((a, b) => a.ordem - b.ordem);
  const execucaoPorObjetivo: Record<string, number | null> = {};
  for (const o of objetivos) {
    const t = (tarefas.data ?? []).filter((x) => x.objective_id === o.id);
    execucaoPorObjetivo[o.id] = t.length ? t.filter((x) => x.status === "concluido").length / t.length : null;
  }
  const medicoes: Record<string, Medicao[]> = {};
  for (const m of meds.data ?? []) (medicoes[m.kpi_id] ??= []).push({ id: m.id, data: m.data, valor: Number(m.valor), nota: m.nota ?? "", criadoEm: m.created_at });
  return {
    cicloId: cicloId as string, objetivos, execucaoPorObjetivo, medicoes,
    okrs: (okrs.data ?? []).map((o): Okr => ({ id: o.id, objetivoId: o.objective_id, titulo: o.titulo, trimestre: o.trimestre })),
    krs: (krs.data ?? []).map((k): KR => ({
      id: k.id, okrId: k.okr_id, descricao: k.descricao, unidade: k.unidade ?? "", inicial: k.valor_inicial === null ? null : Number(k.valor_inicial),
      alvo: k.alvo === null ? null : Number(k.alvo), atual: k.valor_atual === null ? null : Number(k.valor_atual), prazo: k.prazo, atualizadoEm: k.updated_at,
    })),
    kpis: (kpis.data ?? []).map((k): KPI => ({
      id: k.id, nome: k.nome, unidade: k.unidade ?? "", sentido: k.sentido === "menor" ? "menor" : "maior", meta: k.meta === null ? null : Number(k.meta),
      objetivoId: k.objective_id, criadoEm: k.created_at,
    })),
  };
}
