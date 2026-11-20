"use server";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { exigirSessao } from "@/lib/data/sessao";

/** Cria uma tarefa operacional avulsa no ciclo ativo (ex.: a partir de um item do fechamento). */
export async function criarTarefaAvulsa(titulo: string, trimestre: 1 | 2 | 3 | 4): Promise<{ id?: string; erro?: string }> {
  const s = await exigirSessao();
  const t = titulo.trim().slice(0, 1000);
  if (!t) return { erro: "Escreva o item antes de criar a tarefa." };
  if (![1, 2, 3, 4].includes(trimestre)) return { erro: "Escolha o trimestre." };
  const sb = await criarClienteServidor();
  const { data: ciclo, error: e1 } = await sb.rpc("cep_garantir_ciclo", { p_org: s.orgId, p_ano: 2027 });
  if (e1 || !ciclo) return { erro: "Não foi possível criar a tarefa. Tente de novo." };
  const { data, error } = await sb.from("cep_tasks")
    .insert({ org_id: s.orgId, cycle_id: ciclo, nivel: "operacional", titulo: t, trimestre }).select("id").single();
  if (error) return { erro: "Não foi possível criar a tarefa. Tente de novo." };
  return { id: data.id };
}

export async function excluirTarefa(id: string): Promise<{ erro?: string }> {
  const s = await exigirSessao();
  const sb = await criarClienteServidor();
  const { error } = await sb.from("cep_tasks").delete().eq("id", id).eq("org_id", s.orgId);
  return error ? { erro: "Não foi possível desfazer. Tente de novo." } : {};
}
