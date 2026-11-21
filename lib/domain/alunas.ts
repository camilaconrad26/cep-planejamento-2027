// Painel da mentora: um resumo por aluna (mentora e administração ficam de fora).
import type { Status } from "@/lib/domain/ciclo";
import { mediaKRs } from "@/lib/domain/resultados";

export type ResumoAluna = {
  userId: string; orgId: string; nome: string; email: string; perfil: number | null;
  diagnostico: "nao-iniciado" | "iniciado" | "concluido"; acoes: { total: number; concluidas: number }; mediaKRs: number | null; ultima: string | null;
};
type Dados = {
  perfis: { userId: string; nome: string; email: string; perfil: number | null }[];
  papeis: string[];
  membros: { userId: string; orgId: string }[];
  diagnosticos: { orgId: string; concluidoEm: string | null }[];
  tarefas: { orgId: string; status: Status }[];
  krs: { orgId: string; inicial: number | null; alvo: number | null; atual: number | null }[];
  ultimas: Record<string, string>;
};

export function resumirAlunas(d: Dados): ResumoAluna[] {
  const comPapel = new Set(d.papeis);
  return d.perfis.filter((p) => !comPapel.has(p.userId)).flatMap((p) => {
    const orgId = d.membros.find((m) => m.userId === p.userId)?.orgId;
    if (!orgId) return [];
    const diags = d.diagnosticos.filter((x) => x.orgId === orgId);
    const t = d.tarefas.filter((x) => x.orgId === orgId);
    return [{
      userId: p.userId, orgId, nome: p.nome, email: p.email, perfil: p.perfil,
      diagnostico: diags.some((x) => x.concluidoEm) ? "concluido" as const : diags.length ? "iniciado" as const : "nao-iniciado" as const,
      acoes: { total: t.length, concluidas: t.filter((x) => x.status === "concluido").length },
      mediaKRs: mediaKRs(d.krs.filter((k) => k.orgId === orgId)), ultima: d.ultimas[orgId] ?? null,
    }];
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
