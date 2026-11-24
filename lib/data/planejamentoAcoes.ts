"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";

export type Retorno = { ok?: string; erro?: string; confirmar?: boolean };
const FALHA = "Não foi possível salvar. Tente de novo.";
const revalidar = () => { revalidatePath("/planejamento"); revalidatePath("/visao-geral"); };
const texto = (t: string) => String(t ?? "").trim().slice(0, 1000);
const triOuNulo = (t: unknown) => (t === 1 || t === 2 || t === 3 || t === 4 ? t : null);
const triValido = (t: unknown) => t === null || triOuNulo(t) !== null;

/** Sessão para ações: sem sessão devolve "sessao" em vez de redirecionar (a aluna não perde o que digitou). */
async function sessao() {
  const s = await obterSessao();
  return s ? { s, sb: await criarClienteServidor() } : null;
}

export async function definirPrioridade(trimestre: number, categoryId: string, confirmar: boolean): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  if (!triOuNulo(trimestre)) return { erro: "Escolha o trimestre." };
  const { data, error } = await c.sb.rpc("cep_definir_prioridade", { p_trimestre: trimestre, p_categoria: categoryId, p_confirmar: confirmar });
  if (error || !data) return { erro: FALHA };
  const r = data as { situacao: string; excedente: boolean };
  if (r.situacao === "confirmar") return { confirmar: true };
  revalidar();
  return { ok: r.excedente ? "Prioridade adicionada acima do recomendado." : "Prioridade adicionada." };
}

export async function removerPrioridade(trimestre: number, categoryId: string): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const { error } = await c.sb.rpc("cep_remover_prioridade", { p_trimestre: trimestre, p_categoria: categoryId });
  if (error) return { erro: FALHA };
  revalidar();
  return { ok: "Prioridade removida." };
}

export async function criarObjetivo(d: { categoryId: string; titulo: string; trimestre: number | null }): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const titulo = texto(d.titulo);
  if (!titulo) return { erro: "Escreva o objetivo." };
  if (!triValido(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data: ciclo, error: e1 } = await c.sb.rpc("cep_garantir_ciclo", { p_org: c.s.orgId, p_ano: 2027 });
  if (e1 || !ciclo) return { erro: FALHA };
  const { error } = await c.sb.from("cep_objectives").insert({ org_id: c.s.orgId, cycle_id: ciclo, category_id: d.categoryId, titulo, trimestre: d.trimestre });
  if (error) return { erro: FALHA };
  revalidar();
  return { ok: "Objetivo criado. Agora quebre em ações: o que você vai fazer para chegar lá?" };
}

export async function editarObjetivo(id: string, d: { titulo: string; trimestre: number | null }): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const titulo = texto(d.titulo);
  if (!titulo) return { erro: "O objetivo não pode ficar vazio." };
  if (!triValido(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data, error } = await c.sb.from("cep_objectives").update({ titulo, trimestre: d.trimestre }).eq("id", id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: FALHA };
  revalidar();
  return { ok: "Objetivo salvo." };
}

export async function excluirObjetivo(id: string): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  // KPIs ficariam sem objetivo e invisíveis (o banco só desliga a ligação); saem junto, como ações e OKRs.
  const k = await c.sb.from("cep_kpis").delete().eq("objective_id", id).eq("org_id", c.s.orgId);
  if (k.error) return { erro: "Não foi possível excluir. Tente de novo." };
  const { data, error } = await c.sb.from("cep_objectives").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível excluir. Tente de novo." };
  revalidar();
  return { ok: "Objetivo excluído." };
}

export async function criarAcao(d: { objectiveId: string; nivel: "tatico" | "operacional"; titulo: string; trimestre: number | null }): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const titulo = texto(d.titulo);
  if (!titulo) return { erro: "Escreva a ação." };
  if (d.nivel !== "tatico" && d.nivel !== "operacional") return { erro: "Escolha o nível." };
  if (!triValido(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data: obj } = await c.sb.from("cep_objectives").select("cycle_id").eq("id", d.objectiveId).eq("org_id", c.s.orgId).maybeSingle();
  if (!obj) return { erro: FALHA };
  const { error } = await c.sb.from("cep_tasks").insert({ org_id: c.s.orgId, cycle_id: obj.cycle_id, objective_id: d.objectiveId, nivel: d.nivel, titulo, trimestre: d.trimestre });
  if (error) return { erro: FALHA };
  revalidar();
  return { ok: "Ação criada." };
}

export async function editarAcao(id: string, d: { titulo: string; trimestre: number | null }): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const titulo = texto(d.titulo);
  if (!titulo) return { erro: "A ação não pode ficar vazia." };
  if (!triValido(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data, error } = await c.sb.from("cep_tasks").update({ titulo, trimestre: d.trimestre }).eq("id", id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: FALHA };
  revalidar();
  return { ok: "Ação salva." };
}

export async function excluirAcao(id: string): Promise<Retorno> {
  const c = await sessao(); if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_tasks").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível excluir. Tente de novo." };
  revalidar();
  return { ok: "Ação excluída." };
}
