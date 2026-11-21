import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { buscarTodas } from "@/lib/data/paginar";
import { resumirAlunas } from "@/lib/domain/alunas";
import type { Status } from "@/lib/domain/ciclo";

/** Todas as alunas com progresso (a mentora lê tudo pelo RLS). */
export async function listarAlunas() {
  const sb = await criarClienteServidor();
  const [perfis, papeis, membros, ciclos, diags, atv] = await Promise.all([
    buscarTodas((de, ate) => sb.from("cep_profiles").select("user_id, nome, email, perfil").order("nome").range(de, ate)),
    sb.from("cep_roles").select("user_id"),
    buscarTodas((de, ate) => sb.from("cep_organization_members").select("user_id, org_id").range(de, ate)),
    buscarTodas((de, ate) => sb.from("cep_cycles").select("id, org_id").eq("status", "ativo").range(de, ate)),
    buscarTodas((de, ate) => sb.from("cep_diagnostics").select("org_id, concluido_em").range(de, ate)),
    sb.from("cep_activity").select("org_id, em").order("em", { ascending: false }).limit(2000),
  ]);
  const ativos = ciclos.map((c) => c.id);
  const [tarefas, okrs] = await Promise.all([
    ativos.length ? buscarTodas((de, ate) => sb.from("cep_tasks").select("org_id, status").in("cycle_id", ativos).eq("arquivado", false).range(de, ate)) : [],
    ativos.length ? buscarTodas((de, ate) => sb.from("cep_okrs").select("id").in("cycle_id", ativos).range(de, ate)) : [],
  ]);
  const krs = okrs.length ? await buscarTodas((de, ate) => sb.from("cep_key_results").select("org_id, valor_inicial, alvo, valor_atual").in("okr_id", okrs.map((o) => o.id)).range(de, ate)) : [];
  const ultimas: Record<string, string> = {};
  for (const a of atv.data ?? []) ultimas[a.org_id] ??= a.em;
  return resumirAlunas({
    perfis: perfis.map((p) => ({ userId: p.user_id, nome: p.nome, email: p.email ?? "", perfil: p.perfil })),
    papeis: (papeis.data ?? []).map((p) => p.user_id),
    membros: membros.map((m) => ({ userId: m.user_id, orgId: m.org_id })),
    diagnosticos: diags.map((d) => ({ orgId: d.org_id, concluidoEm: d.concluido_em })),
    tarefas: tarefas.map((t) => ({ orgId: t.org_id, status: t.status as Status })),
    krs: krs.map((k) => ({ orgId: k.org_id, inicial: k.valor_inicial === null ? null : Number(k.valor_inicial), alvo: k.alvo === null ? null : Number(k.alvo), atual: k.valor_atual === null ? null : Number(k.valor_atual) })),
    ultimas,
  });
}

/** Organização de uma aluna (sem papel); null se não existe ou é mentora/admin. */
export async function orgDaAluna(userId: string): Promise<string | null> {
  const sb = await criarClienteServidor();
  const [m, p] = await Promise.all([
    sb.from("cep_organization_members").select("org_id").eq("user_id", userId).order("org_id").limit(1).maybeSingle(),
    sb.from("cep_roles").select("user_id").eq("user_id", userId),
  ]);
  return m.data && !(p.data ?? []).length ? m.data.org_id : null;
}
