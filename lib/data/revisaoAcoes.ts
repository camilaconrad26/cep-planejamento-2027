"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { obterResultados } from "@/lib/data/resultados";
import { PERGUNTAS_REVISAO, montarRetratoRevisao, type RespostasRevisao } from "@/lib/domain/revisao";
import type { Status } from "@/lib/domain/ciclo";

const FALHA = "Não foi possível salvar. Tente de novo.";
const triOk = (t: number) => t === 1 || t === 2 || t === 3 || t === 4;

async function ctx() {
  const s = await obterSessao();
  if (!s) return null;
  const sb = await criarClienteServidor();
  const { data: ciclo } = await sb.rpc("cep_garantir_ciclo", { p_org: s.orgId, p_ano: 2027 });
  return ciclo ? { s, sb, ciclo: ciclo as string } : { s, sb, ciclo: null };
}

/** Gravação automática das respostas e do faturamento realizado do trimestre. */
export async function salvarRevisao(trimestre: number, d: { respostas: RespostasRevisao; faturamento: number }): Promise<{ ok?: true; erro?: string }> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  if (!c.ciclo || !triOk(trimestre)) return { erro: FALHA };
  const respostas: RespostasRevisao = {};
  for (const p of PERGUNTAS_REVISAO) { const v = String(d.respostas?.[p.chave] ?? "").slice(0, 5000); if (v.trim()) respostas[p.chave] = v; }
  const fat = Number(d.faturamento);
  const base = { org_id: c.s.orgId, cycle_id: c.ciclo, trimestre };
  const [a, b] = await Promise.all([
    c.sb.from("cep_reviews").upsert({ ...base, respostas }, { onConflict: "cycle_id,trimestre" }),
    c.sb.from("cep_quarter_results").upsert({ ...base, faturamento_realizado: Number.isFinite(fat) && fat > 0 ? fat : 0 }, { onConflict: "cycle_id,trimestre" }),
  ]);
  if (a.error || b.error) return { erro: FALHA };
  return { ok: true };
}

/** Conclui (ou atualiza) o relatório: grava o retrato dos indicadores naquele momento. */
export async function concluirRevisao(trimestre: number): Promise<{ ok?: string; erro?: string }> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  if (!c.ciclo || !triOk(trimestre)) return { erro: FALHA };
  const [r, tarefas, meta, real] = await Promise.all([
    obterResultados(c.s.orgId),
    c.sb.from("cep_tasks").select("trimestre, status").eq("cycle_id", c.ciclo).eq("arquivado", false),
    c.sb.from("cep_financial_goals").select("faturamento").eq("cycle_id", c.ciclo).eq("trimestre", trimestre).eq("altura", "meta").maybeSingle(),
    c.sb.from("cep_quarter_results").select("faturamento_realizado").eq("cycle_id", c.ciclo).eq("trimestre", trimestre).maybeSingle(),
  ]);
  const retrato = montarRetratoRevisao({
    tarefas: (tarefas.data ?? []).map((t) => ({ trimestre: t.trimestre, status: t.status as Status })),
    krs: r.krs, kpis: r.kpis.map((k) => ({ ...k, medicoes: r.medicoes[k.id] ?? [] })),
    metaTrimestre: Number(meta.data?.faturamento ?? 0), realizado: Number(real.data?.faturamento_realizado ?? 0),
  }, trimestre);
  const { error } = await c.sb.from("cep_reviews").upsert(
    { org_id: c.s.orgId, cycle_id: c.ciclo, trimestre, retrato, concluida_em: new Date().toISOString() }, { onConflict: "cycle_id,trimestre" });
  if (error) return { erro: FALHA };
  revalidatePath("/revisao"); revalidatePath("/visao-geral"); revalidatePath("/historico");
  return { ok: "Revisão concluída." };
}
