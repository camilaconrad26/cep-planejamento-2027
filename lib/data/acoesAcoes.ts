"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { conclusao, dataValida, type Prioridade } from "@/lib/domain/acoes";
import type { Status } from "@/lib/domain/ciclo";
import type { Database } from "@/lib/data/tipos";

type Upd = Database["public"]["Tables"]["cep_tasks"]["Update"];

export type CamposAcao = Partial<{ titulo: string; responsavel: string; prioridade: Prioridade; status: Status; inicio: string | null; prazo: string | null; trimestre: number | null }>;
const FALHA = "Não foi possível salvar. Tente de novo.";

/** Atualiza só os campos enviados de uma ação da própria organização. */
export async function atualizarAcao(id: string, p: CamposAcao): Promise<{ ok?: string; erro?: string }> {
  const s = await obterSessao();
  if (!s) return { erro: "sessao" };
  const sb = await criarClienteServidor();
  const upd: Upd = {};
  if (p.titulo !== undefined) { const t = String(p.titulo ?? "").trim().slice(0, 1000); if (!t) return { erro: "A ação não pode ficar vazia." }; upd.titulo = t; }
  if (p.responsavel !== undefined) upd.responsavel = String(p.responsavel ?? "").trim().slice(0, 120) || null;
  if (p.prioridade !== undefined) { if (!["baixa", "media", "alta"].includes(p.prioridade)) return { erro: "Escolha a prioridade." }; upd.prioridade = p.prioridade; }
  if (p.status !== undefined) {
    if (!["nao_iniciado", "em_andamento", "concluido"].includes(p.status)) return { erro: "Escolha o status." };
    upd.status = p.status;
  }
  for (const [campo, coluna] of [["inicio", "data_inicio"], ["prazo", "prazo"]] as const) {
    const v = p[campo];
    if (v === undefined) continue;
    if (v !== null && !dataValida(v)) return { erro: "Data inválida." };
    if (coluna === "prazo") upd.prazo = v; else upd.data_inicio = v;
  }
  if (p.trimestre !== undefined) { if (p.trimestre !== null && ![1, 2, 3, 4].includes(p.trimestre)) return { erro: "Escolha o trimestre." }; upd.trimestre = p.trimestre as Upd["trimestre"]; }
  if (!Object.keys(upd).length) return { ok: "Nada a salvar." };

  let concluiu = false;
  if ("data_inicio" in upd || "prazo" in upd || upd.status) {
    const { data: atual } = await sb.from("cep_tasks").select("data_inicio, prazo, status").eq("id", id).eq("org_id", s.orgId).maybeSingle();
    if (!atual) return { erro: FALHA };
    if (upd.status) {
      Object.assign(upd, conclusao(atual.status as Status, upd.status as Status, new Date().toISOString()));
      concluiu = upd.status === "concluido" && atual.status !== "concluido";
    }
    const ini = ("data_inicio" in upd ? upd.data_inicio : atual.data_inicio) as string | null;
    const fim = ("prazo" in upd ? upd.prazo : atual.prazo) as string | null;
    if (ini && fim && fim < ini) return { erro: "O prazo não pode ser antes do início." };
  }
  const { data, error } = await sb.from("cep_tasks").update(upd).eq("id", id).eq("org_id", s.orgId).select("id");
  if (error || !data?.length) return { erro: FALHA };
  revalidatePath("/plano-de-acao"); revalidatePath("/visao-geral"); revalidatePath("/planejamento");
  return { ok: concluiu ? "Ação concluída." : "Ação salva." };
}
