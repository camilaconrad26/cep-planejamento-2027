"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { ALTURAS, PRODUTOS, type AcaoVenda, type MetasForm } from "@/lib/domain/metas";

const FALHA = "Não foi possível salvar. Tente de novo.";
const pos = (x: unknown) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : 0; };
const txt = (t: unknown, max: number) => String(t ?? "").trim().slice(0, max);

async function contexto() {
  const s = await obterSessao();
  if (!s) return null;
  const sb = await criarClienteServidor();
  const { data: ciclo, error } = await sb.rpc("cep_garantir_ciclo", { p_org: s.orgId, p_ano: 2027 });
  if (error || !ciclo) return { s, sb, ciclo: null };
  return { s, sb, ciclo: ciclo as string };
}

/** Grava a página de metas inteira (upserts idempotentes; a gravação automática pode repetir sem duplicar). */
export async function salvarMetas(f: MetasForm): Promise<{ ok?: true; erro?: string }> {
  const c = await contexto();
  if (!c) return { erro: "sessao" };
  if (!c.ciclo) return { erro: FALHA };
  const base = { org_id: c.s.orgId, cycle_id: c.ciclo };
  const metas = ALTURAS.flatMap(({ valor: a }) => [
    { ...base, trimestre: null, altura: a, faturamento: pos(f.anual?.[a]?.faturamento), lucratividade: Math.min(pos(f.anual?.[a]?.lucratividade), 100),
      anuncios: Math.min(pos(f.anual?.[a]?.anuncios), 100), time: Math.min(Math.round(pos(f.anual?.[a]?.time)), 32000) },
    ...([1, 2, 3, 4] as const).map((t) => ({ ...base, trimestre: t, altura: a, faturamento: pos(f.trimestres?.[t]?.[a]), lucratividade: null, anuncios: null, time: null })),
  ]);
  const produtos = PRODUTOS.map(({ tipo }) => ({
    ...base, tipo, nome: txt(f.produtos?.[tipo]?.nome, 200), ticket: pos(f.produtos?.[tipo]?.ticket),
    vendas_meta: pos(f.produtos?.[tipo]?.vendas?.meta), vendas_super: pos(f.produtos?.[tipo]?.vendas?.super), vendas_mega: pos(f.produtos?.[tipo]?.vendas?.mega),
  }));
  const reais = ([1, 2, 3, 4] as const).map((t) => ({ ...base, trimestre: t, faturamento_realizado: pos(f.realizado?.[t]) }));
  const [a, b, d, e] = await Promise.all([
    c.sb.from("cep_financial_goals").upsert(metas, { onConflict: "cycle_id,trimestre,altura" }),
    c.sb.from("cep_products").upsert(produtos, { onConflict: "cycle_id,tipo" }),
    c.sb.from("cep_quarter_results").upsert(reais, { onConflict: "cycle_id,trimestre" }),
    c.sb.from("cep_cycles").update({ meta_porque: txt(f.porque, 2000) }).eq("id", c.ciclo),
  ]);
  if (a.error || b.error || d.error || e.error) return { erro: FALHA };
  revalidatePath("/metas");
  return { ok: true };
}

export async function criarAcaoVenda(mes: number): Promise<{ id?: string; erro?: string }> {
  const c = await contexto();
  if (!c) return { erro: "sessao" };
  if (!c.ciclo || !Number.isInteger(mes) || mes < 1 || mes > 12) return { erro: FALHA };
  const { data, error } = await c.sb.from("cep_sales_actions").insert({ org_id: c.s.orgId, cycle_id: c.ciclo, mes }).select("id").single();
  if (error) return { erro: FALHA };
  return { id: data.id };
}

export async function salvarAcaoVenda(a: AcaoVenda): Promise<{ ok?: true; erro?: string }> {
  const c = await contexto();
  if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_sales_actions").update({
    produto: txt(a.produto, 200), acao: txt(a.acao, 500), ticket: pos(a.ticket), quantidade: pos(a.quantidade), responsavel: txt(a.responsavel, 120),
  }).eq("id", a.id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: FALHA };
  return { ok: true };
}

export async function excluirAcaoVenda(id: string): Promise<{ ok?: true; erro?: string }> {
  const c = await contexto();
  if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_sales_actions").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível remover. Tente de novo." };
  return { ok: true };
}
