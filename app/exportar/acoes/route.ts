import { obterSessao } from "@/lib/data/sessao";
import { obterAcoes } from "@/lib/data/acoes";
import { linhasCsv } from "@/lib/domain/csv";
import { nomePrioridade, nomeStatus } from "@/lib/domain/acoes";

export const dynamic = "force-dynamic";
const NIVEL = { estrategico: "Estratégico", tatico: "Tático", operacional: "Operacional" } as const;

/** Planilha (CSV) com as ações do ciclo, para abrir no Excel ou no Google Planilhas. */
export async function GET() {
  const s = await obterSessao();
  if (!s) return new Response("Sessão expirada. Entre de novo.", { status: 401 });
  const { acoes } = await obterAcoes(s.orgId);
  const csv = linhasCsv(
    ["Ação", "Objetivo", "Categoria", "Nível", "Responsável", "Prioridade", "Status", "Início", "Prazo", "Trimestre"],
    acoes.map((a) => [a.titulo, a.objetivo, a.categoria?.nome ?? "Avulsa", NIVEL[a.nivel], a.responsavel, nomePrioridade(a.prioridade), nomeStatus(a.status),
      a.inicio, a.prazo, a.trimestre ? `${a.trimestre}º` : ""]),
  );
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="plano-de-acao-2027.csv"', "Cache-Control": "no-store" } });
}
