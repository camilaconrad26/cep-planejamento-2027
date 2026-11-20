"use server";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { exigirSessao } from "@/lib/data/sessao";
import { PERGUNTAS, resumirDiagnostico, sugerirPerfil, type Respostas } from "@/lib/domain/diagnostico";
import { lerFechamento, type Fechamento } from "@/lib/domain/fechamento";

export type Diagnostico = { id: string; respostas: Respostas; fechamento: Record<string, unknown>; perfilSugerido: 1 | 2 | 3 | null; concluidoEm: string | null };

/** Diagnóstico mais recente da organização (ou null se ainda não começou). */
export async function obterDiagnostico(orgId: string): Promise<Diagnostico | null> {
  const sb = await criarClienteServidor();
  const { data } = await sb.from("cep_diagnostics").select("id, respostas, fechamento_ano, perfil_sugerido, concluido_em")
    .eq("org_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { id: data.id, respostas: (data.respostas ?? {}) as Respostas, fechamento: (data.fechamento_ano ?? {}) as Record<string, unknown>,
    perfilSugerido: (data.perfil_sugerido as 1 | 2 | 3 | null) ?? null, concluidoEm: data.concluido_em };
}

async function gravar(orgId: string, userId: string, patch: { respostas?: Respostas; fechamento_ano?: object; concluido_em?: string | null; perfil_sugerido?: number | null; resumo?: object }) {
  const sb = await criarClienteServidor();
  const atual = await obterDiagnostico(orgId);
  const r = atual
    ? await sb.from("cep_diagnostics").update(patch as never).eq("id", atual.id)
    : await sb.from("cep_diagnostics").insert({ org_id: orgId, user_id: userId, ...patch } as never);
  if (r.error) throw new Error("Não foi possível salvar. Verifique a conexão e tente de novo.");
}

/** Lê a resposta do formulário de uma pergunta. */
function lerResposta(passo: number, f: FormData, atuais: Respostas): Respostas {
  const p = PERGUNTAS[passo - 1];
  const novo: Respostas = { ...atuais };
  if (p.tipo === "unica") {
    const v = f.get("valor");
    if (v === null || v === "") delete (novo as Record<string, unknown>)[p.chave];
    else (novo as Record<string, unknown>)[p.chave] = p.chave === "estagio" ? Number(v) : String(v);
  } else {
    (novo as Record<string, unknown>)[p.chave] = f.getAll("valor").map(String);
  }
  if (p.textoLivre) {
    const t = String(f.get("texto") ?? "").trim().slice(0, 1000);
    if (p.chave === "desafios") novo.desafiosTexto = t;
    else novo.outro = { ...(novo.outro ?? {}), [p.chave]: t };
  }
  return novo;
}

export async function salvarResposta(passo: number, f: FormData) {
  const s = await exigirSessao();
  if (f.get("acao") !== "pular") {
    const atual = await obterDiagnostico(s.orgId);
    await gravar(s.orgId, s.userId, { respostas: lerResposta(passo, f, atual?.respostas ?? {}) });
  } else if (!(await obterDiagnostico(s.orgId))) {
    await gravar(s.orgId, s.userId, { respostas: {} }); // pular também conta como diagnóstico iniciado
  }
  if (passo < PERGUNTAS.length) redirect(`/diagnostico/${passo + 1}`);
  await concluir(s.orgId, s.userId);
  redirect("/diagnostico/resumo");
}

async function concluir(orgId: string, userId: string) {
  const d = await obterDiagnostico(orgId);
  const respostas = d?.respostas ?? {};
  const notas = ((d?.fechamento as { notas?: Record<string, number> })?.notas) ?? {};
  await gravar(orgId, userId, { perfil_sugerido: sugerirPerfil(respostas), resumo: resumirDiagnostico(respostas, notas), concluido_em: new Date().toISOString() });
}

/** Salvamento automático do fechamento do ano anterior. */
export async function salvarFechamento(f: Fechamento): Promise<{ erro?: string }> {
  const s = await exigirSessao();
  const limpo = lerFechamento(f);
  if (JSON.stringify(limpo).length > 150_000) return { erro: "Texto longo demais. Encurte alguns itens." };
  try { await gravar(s.orgId, s.userId, { fechamento_ano: limpo }); return {}; }
  catch { return { erro: "Não foi possível salvar. Verifique a conexão." }; }
}

export async function confirmarPerfil(f: FormData) {
  const s = await exigirSessao();
  const p = Number(f.get("perfil"));
  if (![1, 2, 3].includes(p)) redirect("/diagnostico/resumo?erro=perfil");
  const sb = await criarClienteServidor();
  const { error } = await sb.from("cep_profiles").update({ perfil: p }).eq("user_id", s.userId);
  if (error) throw new Error("Não foi possível salvar o perfil. Tente de novo.");
  redirect(`/diagnostico/resumo?ok=${p}`);
}

export async function refazerDiagnostico() {
  const s = await exigirSessao();
  const d = await obterDiagnostico(s.orgId);
  const sb = await criarClienteServidor();
  await sb.from("cep_diagnostics").insert({ org_id: s.orgId, user_id: s.userId, respostas: (d?.respostas ?? {}) as never, fechamento_ano: (d?.fechamento ?? {}) as never });
  redirect("/diagnostico/1");
}
