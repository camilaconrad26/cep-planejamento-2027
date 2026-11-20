"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { exigirSessao } from "@/lib/data/sessao";
import { textoAdicionado, type ResultadoAdicao } from "@/lib/domain/biblioteca";

export type Retorno = { ok?: string; erro?: string };
const SO_ADMIN = "Só a administração pode editar a biblioteca.";
const revalidar = () => { revalidatePath("/biblioteca"); revalidatePath("/configuracoes/biblioteca"); };
const limpar = (t: string) => t.trim().slice(0, 1000);

export async function adicionarAoPlano(itemId: string, trimestre: number): Promise<Retorno> {
  await exigirSessao();
  if (![1, 2, 3, 4].includes(trimestre)) return { erro: "Escolha o trimestre." };
  const sb = await criarClienteServidor();
  const { data, error } = await sb.rpc("cep_adicionar_item", { p_item: itemId, p_trimestre: trimestre });
  if (error || !data) return { erro: "Não foi possível adicionar. Tente de novo." };
  revalidatePath("/biblioteca"); revalidatePath("/visao-geral");
  return { ok: textoAdicionado(data as unknown as ResultadoAdicao, trimestre as 1 | 2 | 3 | 4) };
}

async function admin() {
  const s = await exigirSessao();
  return s.papeis.includes("admin");
}

export async function salvarItem(id: string, texto: string): Promise<Retorno> {
  if (!(await admin())) return { erro: SO_ADMIN };
  const t = limpar(texto);
  if (!t) return { erro: "O texto não pode ficar vazio." };
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("cep_library_items").update({ texto: t }).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar o item. Tente de novo." };
  revalidar();
  return { ok: "Item salvo." };
}

export async function alternarAtivo(id: string, ativo: boolean): Promise<Retorno> {
  if (!(await admin())) return { erro: SO_ADMIN };
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("cep_library_items").update({ ativo }).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível alterar o item. Tente de novo." };
  revalidar();
  return { ok: ativo ? "Item reativado." : "Item desativado. As alunas não o veem mais." };
}

export async function criarItem(d: { categoryId: string; perfil: 1 | 2 | 3; nivel: "tatico" | "operacional" | "okr" | "kpi"; texto: string }): Promise<Retorno> {
  if (!(await admin())) return { erro: SO_ADMIN };
  const t = limpar(d.texto);
  if (!t) return { erro: "Escreva o texto do item." };
  if (![1, 2, 3].includes(d.perfil) || !["tatico", "operacional", "okr", "kpi"].includes(d.nivel)) return { erro: "Escolha perfil e nível." };
  const sb = await criarClienteServidor();
  const { data: estr } = await sb.from("cep_library_items").select("id").eq("category_id", d.categoryId).eq("perfil", d.perfil).eq("nivel", "estrategico").maybeSingle();
  if (!estr) return { erro: "Esta categoria não tem objetivo estratégico neste perfil." };
  const { data: ult } = await sb.from("cep_library_items").select("ordem").eq("category_id", d.categoryId).eq("perfil", d.perfil).order("ordem", { ascending: false }).limit(1).maybeSingle();
  const { error } = await sb.from("cep_library_items").insert({
    category_id: d.categoryId, perfil: d.perfil, nivel: d.nivel, texto: t, parent_id: estr.id, ordem: (ult?.ordem ?? 0) + 1,
  });
  if (error) return { erro: "Não foi possível criar o item. Tente de novo." };
  revalidar();
  return { ok: "Item criado." };
}

export async function salvarCategoria(id: string, d: { descricao: string; objetivo: string }): Promise<Retorno> {
  if (!(await admin())) return { erro: SO_ADMIN };
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("cep_categories").update({ descricao: limpar(d.descricao), objetivo: limpar(d.objetivo) }).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar a categoria. Tente de novo." };
  revalidar();
  return { ok: "Categoria salva." };
}
