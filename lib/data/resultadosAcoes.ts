"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { dataValida } from "@/lib/domain/acoes";
import { dataMedicaoValida } from "@/lib/domain/resultados";
import { hojeSP } from "@/lib/domain/ciclo";

type R = { ok?: string; erro?: string };
const FALHA = "Não foi possível salvar. Tente de novo.";
const revalidar = () => { revalidatePath("/metas"); revalidatePath("/visao-geral"); revalidatePath("/planejamento"); };
const txt = (t: unknown, max: number) => String(t ?? "").trim().slice(0, max);
const num = (x: unknown): number | null | undefined => {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined; // undefined = inválido
};
const triOk = (t: unknown) => t === null || t === 1 || t === 2 || t === 3 || t === 4;

async function ctx() {
  const s = await obterSessao();
  if (!s) return null;
  const sb = await criarClienteServidor();
  const { data: ciclo } = await sb.rpc("cep_garantir_ciclo", { p_org: s.orgId, p_ano: 2027 });
  return { s, sb, ciclo: (ciclo as string | null) ?? null };
}
const pronto = (ok: string): R => { revalidar(); return { ok }; };

export async function criarOkr(d: { objetivoId: string; titulo: string; trimestre: number | null }): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const titulo = txt(d.titulo, 1000);
  if (!titulo) return { erro: "Escreva a meta do trimestre." };
  if (!triOk(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data: obj } = await c.sb.from("cep_objectives").select("cycle_id").eq("id", d.objetivoId).eq("org_id", c.s.orgId).maybeSingle();
  if (!obj) return { erro: "Escolha o objetivo." };
  const { error } = await c.sb.from("cep_okrs").insert({ org_id: c.s.orgId, cycle_id: obj.cycle_id, objective_id: d.objetivoId, titulo, trimestre: d.trimestre });
  return error ? { erro: FALHA } : pronto("Meta criada. Agora diga como vai medir: acrescente os resultados-chave.");
}
export async function editarOkr(id: string, d: { titulo: string; trimestre: number | null }): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const titulo = txt(d.titulo, 1000);
  if (!titulo) return { erro: "A meta não pode ficar vazia." };
  if (!triOk(d.trimestre)) return { erro: "Escolha o trimestre." };
  const { data, error } = await c.sb.from("cep_okrs").update({ titulo, trimestre: d.trimestre }).eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: FALHA } : pronto("Meta salva.");
}
export async function excluirOkr(id: string): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_okrs").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: "Não foi possível excluir. Tente de novo." } : pronto("Meta excluída.");
}

type CamposKr = { descricao: string; unidade: string; inicial: number | null; alvo: number | null; atual: number | null; prazo: string | null };
function validarKr(d: CamposKr) {
  const descricao = txt(d.descricao, 1000);
  if (!descricao) return { erro: "Descreva o resultado-chave." };
  const inicial = num(d.inicial), alvo = num(d.alvo), atual = num(d.atual);
  if (inicial === undefined || alvo === undefined || atual === undefined) return { erro: "Use só números nos valores." };
  if (alvo !== null && inicial === null) return { erro: "Informe o valor inicial para calcular o progresso." };
  if (d.prazo !== null && d.prazo !== undefined && !dataValida(d.prazo)) return { erro: "Data inválida." };
  return { v: { descricao, unidade: txt(d.unidade, 40) || null, valor_inicial: inicial, alvo, valor_atual: atual, prazo: d.prazo || null } };
}
export async function criarKr(okrId: string, d: CamposKr): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const r = validarKr(d); if ("erro" in r) return { erro: r.erro };
  const { data: okr } = await c.sb.from("cep_okrs").select("id").eq("id", okrId).eq("org_id", c.s.orgId).maybeSingle();
  if (!okr) return { erro: FALHA };
  const { error } = await c.sb.from("cep_key_results").insert({ org_id: c.s.orgId, okr_id: okrId, ...r.v });
  return error ? { erro: FALHA } : pronto("Resultado-chave criado.");
}
export async function editarKr(id: string, d: CamposKr): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const r = validarKr(d); if ("erro" in r) return { erro: r.erro };
  const { data, error } = await c.sb.from("cep_key_results").update(r.v).eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: FALHA } : pronto("Resultado-chave salvo.");
}
export async function lancarValorKr(id: string, atual: number | null): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const v = num(atual); if (v === undefined) return { erro: "Use só números." };
  const { data, error } = await c.sb.from("cep_key_results").update({ valor_atual: v }).eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: FALHA } : pronto("Número atualizado.");
}
export async function excluirKr(id: string): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_key_results").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: "Não foi possível excluir. Tente de novo." } : pronto("Resultado-chave excluído.");
}

type CamposKpi = { nome: string; unidade: string; sentido: "maior" | "menor"; meta: number | null; objetivoId: string | null };
async function validarKpi(c: NonNullable<Awaited<ReturnType<typeof ctx>>>, d: CamposKpi) {
  const nome = txt(d.nome, 1000);
  if (!nome) return { erro: "Dê um nome ao indicador." };
  if (d.sentido !== "maior" && d.sentido !== "menor") return { erro: "Escolha o sentido." };
  const meta = num(d.meta); if (meta === undefined) return { erro: "Use só números na meta." };
  if (d.objetivoId) {
    const { data: o } = await c.sb.from("cep_objectives").select("id").eq("id", d.objetivoId).eq("org_id", c.s.orgId).maybeSingle();
    if (!o) return { erro: "Escolha o objetivo." };
  }
  return { v: { nome, unidade: txt(d.unidade, 40) || null, sentido: d.sentido, meta, objective_id: d.objetivoId || null } };
}
export async function criarKpi(d: CamposKpi): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  if (!c.ciclo) return { erro: FALHA };
  const r = await validarKpi(c, d); if ("erro" in r) return { erro: r.erro };
  const { error } = await c.sb.from("cep_kpis").insert({ org_id: c.s.orgId, cycle_id: c.ciclo, ...r.v });
  return error ? { erro: FALHA } : pronto("Indicador criado.");
}
export async function editarKpi(id: string, d: CamposKpi): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const r = await validarKpi(c, d); if ("erro" in r) return { erro: r.erro };
  const { data, error } = await c.sb.from("cep_kpis").update(r.v).eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: FALHA } : pronto("Indicador salvo.");
}
export async function excluirKpi(id: string): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_kpis").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: "Não foi possível excluir. Tente de novo." } : pronto("Indicador excluído.");
}
export async function registrarMedicao(d: { kpiId: string; data: string; valor: number | null; nota: string }): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  if (!dataMedicaoValida(d.data, hojeSP())) return { erro: "Escolha uma data até hoje." };
  const valor = num(d.valor); if (valor === undefined || valor === null) return { erro: "Informe o valor medido." };
  const { data: k } = await c.sb.from("cep_kpis").select("id").eq("id", d.kpiId).eq("org_id", c.s.orgId).maybeSingle();
  if (!k) return { erro: FALHA };
  const { error } = await c.sb.from("cep_kpi_measurements").insert({ org_id: c.s.orgId, kpi_id: d.kpiId, data: d.data, valor, nota: txt(d.nota, 500) || null });
  return error ? { erro: FALHA } : pronto("Medição registrada.");
}
export async function excluirMedicao(id: string): Promise<R> {
  const c = await ctx(); if (!c) return { erro: "sessao" };
  const { data, error } = await c.sb.from("cep_kpi_measurements").delete().eq("id", id).eq("org_id", c.s.orgId).select("id");
  return error || !data?.length ? { erro: "Não foi possível excluir. Tente de novo." } : pronto("Medição excluída.");
}
