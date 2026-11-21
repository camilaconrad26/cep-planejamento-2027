import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { buscarTodas } from "@/lib/data/paginar";
import { resumirAlunas } from "@/lib/domain/alunas";
import type { Status } from "@/lib/domain/ciclo";

/** Todas as alunas com progresso (a mentora lê tudo pelo RLS). */
export async function listarAlunas() {
  const sb = await criarClienteServidor();
  const [perfis, papeis, membros, diags, atv, tarefas, krs] = await Promise.all([
    buscarTodas((de, ate) => sb.from("cep_profiles").select("user_id, nome, email, perfil").order("nome").order("user_id").range(de, ate)),
    sb.rpc("cep_usuarios_com_papel"),
    buscarTodas((de, ate) => sb.from("cep_organization_members").select("user_id, org_id").order("user_id").order("org_id").range(de, ate)),
    buscarTodas((de, ate) => sb.from("cep_diagnostics").select("id, org_id, concluido_em").order("id").range(de, ate)),
    sb.rpc("cep_ultima_atividade"),
    // Só o ciclo ativo, filtrado no banco (sem listas enormes de ids na URL).
    buscarTodas((de, ate) => sb.from("cep_tasks").select("id, org_id, status, cep_cycles!inner(status)").eq("cep_cycles.status", "ativo").eq("arquivado", false).order("id").range(de, ate)),
    buscarTodas((de, ate) => sb.from("cep_key_results").select("id, org_id, valor_inicial, alvo, valor_atual, cep_okrs!inner(cep_cycles!inner(status))").eq("cep_okrs.cep_cycles.status", "ativo").order("id").range(de, ate)),
  ]);
  if (papeis.error || atv.error) throw new Error("Não foi possível carregar as alunas.");
  const ultimas: Record<string, string> = {};
  for (const a of atv.data ?? []) ultimas[a.org_id] = a.em;
  return resumirAlunas({
    perfis: perfis.map((p) => ({ userId: p.user_id, nome: p.nome, email: p.email ?? "", perfil: p.perfil })),
    papeis: (papeis.data ?? []) as string[],
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
    sb.rpc("cep_usuarios_com_papel"),
  ]);
  return m.data && !p.error && !((p.data ?? []) as string[]).includes(userId) ? m.data.org_id : null;
}
