import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import type { Categoria, ItemBiblioteca, Nivel } from "@/lib/domain/biblioteca";

/** Biblioteca inteira (inclusive itens inativos); quem filtra é filtrarItens. */
export async function obterBiblioteca(): Promise<{ categorias: Categoria[]; itens: ItemBiblioteca[] }> {
  const sb = await criarClienteServidor();
  const [c, i] = await Promise.all([
    sb.from("cep_categories").select("id, slug, nome, descricao, objetivo, ordem").order("ordem"),
    sb.from("cep_library_items").select("id, category_id, perfil, nivel, texto, parent_id, ordem, ativo").order("ordem"),
  ]);
  if (c.error || i.error) throw new Error("Não foi possível carregar a biblioteca.");
  return {
    categorias: c.data,
    itens: i.data.map((x) => ({ id: x.id, categoryId: x.category_id, perfil: x.perfil as 1 | 2 | 3, nivel: x.nivel as Nivel, texto: x.texto, parentId: x.parent_id, ordem: x.ordem, ativo: x.ativo })),
  };
}

/** Itens da biblioteca que já estão no ciclo ativo da organização (objetivos, tarefas, KRs e KPIs). */
export async function idsNoPlano(orgId: string): Promise<Set<string>> {
  const sb = await criarClienteServidor();
  const { data: ciclo } = await sb.from("cep_cycles").select("id").eq("org_id", orgId).eq("status", "ativo").maybeSingle();
  if (!ciclo) return new Set();
  const [o, t, k, p] = await Promise.all([
    sb.from("cep_objectives").select("library_item_id").eq("cycle_id", ciclo.id).not("library_item_id", "is", null),
    sb.from("cep_tasks").select("library_item_id").eq("cycle_id", ciclo.id).not("library_item_id", "is", null),
    sb.from("cep_key_results").select("library_item_id, cep_okrs!inner(cycle_id)").eq("cep_okrs.cycle_id", ciclo.id).not("library_item_id", "is", null),
    sb.from("cep_kpis").select("library_item_id").eq("cycle_id", ciclo.id).not("library_item_id", "is", null),
  ]);
  return new Set([...(o.data ?? []), ...(t.data ?? []), ...(k.data ?? []), ...(p.data ?? [])].map((x) => x.library_item_id as string));
}
