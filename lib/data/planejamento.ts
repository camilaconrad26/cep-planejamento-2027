import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import type { Categoria } from "@/lib/domain/biblioteca";
import type { KpiP, KrP, ObjetivoP, OkrP, TarefaP, Tri } from "@/lib/domain/arvore";
import type { Status } from "@/lib/domain/ciclo";

export type Plano = {
  cicloId: string; ano: number; categorias: Categoria[];
  prioridades: { trimestre: number; categoryId: string; excedente: boolean }[];
  objetivos: ObjetivoP[]; tarefas: TarefaP[]; okrs: OkrP[]; krs: KrP[]; kpis: KpiP[];
};
const tri = (t: number | null) => (t === 1 || t === 2 || t === 3 || t === 4 ? (t as Tri) : null);

/** Tudo o que a tela de planejamento mostra, do ciclo ativo da organização (RLS restringe à aluna). */
export async function obterPlano(orgId: string): Promise<Plano> {
  const sb = await criarClienteServidor();
  const { data: cicloId, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !cicloId) throw new Error("Não foi possível carregar o seu ciclo de planejamento.");
  const [ciclo, cats, prios, objs, tars, okrs, kpis] = await Promise.all([
    sb.from("cep_cycles").select("ano").eq("id", cicloId).single(),
    sb.from("cep_categories").select("id, slug, nome, descricao, objetivo, ordem").order("ordem"),
    sb.from("cep_cycle_priorities").select("trimestre, category_id, excedente").eq("cycle_id", cicloId),
    sb.from("cep_objectives").select("id, category_id, titulo, descricao, trimestre, library_item_id").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_tasks").select("id, objective_id, nivel, titulo, trimestre, status").eq("cycle_id", cicloId).eq("arquivado", false).order("created_at"),
    sb.from("cep_okrs").select("id, objective_id, titulo, trimestre").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_kpis").select("id, objective_id, nome").eq("cycle_id", cicloId).order("created_at"),
  ]);
  const okrIds = (okrs.data ?? []).map((o) => o.id);
  const krs = okrIds.length ? await sb.from("cep_key_results").select("id, okr_id, descricao, alvo").in("okr_id", okrIds).order("created_at") : { data: [] };
  return {
    cicloId: cicloId as string, ano: ciclo.data?.ano ?? 2027, categorias: cats.data ?? [],
    prioridades: (prios.data ?? []).map((p) => ({ trimestre: p.trimestre, categoryId: p.category_id, excedente: p.excedente })),
    objetivos: (objs.data ?? []).map((o) => ({ id: o.id, categoryId: o.category_id, titulo: o.titulo, descricao: o.descricao, trimestre: tri(o.trimestre), libraryItemId: o.library_item_id })),
    tarefas: (tars.data ?? []).map((t) => ({ id: t.id, objectiveId: t.objective_id, nivel: t.nivel as TarefaP["nivel"], titulo: t.titulo, trimestre: tri(t.trimestre), status: t.status as Status })),
    okrs: (okrs.data ?? []).map((o) => ({ id: o.id, objectiveId: o.objective_id, titulo: o.titulo, trimestre: tri(o.trimestre) })),
    krs: (krs.data ?? []).map((k) => ({ id: k.id, okrId: k.okr_id, descricao: k.descricao, alvo: k.alvo })),
    kpis: (kpis.data ?? []).map((k) => ({ id: k.id, objectiveId: k.objective_id, nome: k.nome })),
  };
}
