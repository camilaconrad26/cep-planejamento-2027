import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import type { Acao, Prioridade } from "@/lib/domain/acoes";
import type { Categoria } from "@/lib/domain/biblioteca";
import type { Status } from "@/lib/domain/ciclo";

const um = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);

/** Ações (tarefas não arquivadas) do ciclo ativo, com objetivo e categoria. */
export async function obterAcoes(orgId: string): Promise<{ acoes: Acao[]; categorias: Categoria[] }> {
  const sb = await criarClienteServidor();
  const { data: cicloId, error } = await sb.rpc("cep_garantir_ciclo", { p_org: orgId, p_ano: 2027 });
  if (error || !cicloId) throw new Error("Não foi possível carregar o seu ciclo de planejamento.");
  const [t, c] = await Promise.all([
    sb.from("cep_tasks").select("id, titulo, nivel, responsavel, prioridade, status, data_inicio, prazo, trimestre, cep_objectives(titulo, cep_categories(slug, nome))")
      .eq("cycle_id", cicloId).eq("arquivado", false).order("created_at"),
    sb.from("cep_categories").select("id, slug, nome, descricao, objetivo, ordem").order("ordem"),
  ]);
  if (t.error) throw new Error("Não foi possível carregar as ações.");
  const acoes: Acao[] = (t.data ?? []).map((x) => {
    const obj = um(x.cep_objectives as unknown as { titulo: string; cep_categories: { slug: string; nome: string } | { slug: string; nome: string }[] | null } | null);
    const cat = obj ? um(obj.cep_categories) : null;
    const tri = x.trimestre;
    return {
      id: x.id, titulo: x.titulo, objetivo: obj?.titulo ?? null, categoria: cat ? { slug: cat.slug, nome: cat.nome } : null,
      nivel: x.nivel as Acao["nivel"], responsavel: x.responsavel ?? "", prioridade: x.prioridade as Prioridade, status: x.status as Status,
      inicio: x.data_inicio, prazo: x.prazo, trimestre: tri === 1 || tri === 2 || tri === 3 || tri === 4 ? tri : null,
    };
  });
  return { acoes, categorias: c.data ?? [] };
}
