export type Status = "nao_iniciado" | "em_andamento" | "concluido";
export type Fase = "planejamento" | "execucao" | "encerrado";

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export const hojeSP = (agora: Date = new Date()): string => fmt.format(agora);

/** Trimestre e fase do ciclo anual `ano` na data `hoje` (YYYY-MM-DD). */
export function trimestreAtual(ano: number, hoje: string): { trimestre: 1 | 2 | 3 | 4; fase: Fase } {
  const [a, m] = hoje.split("-").map(Number);
  if (a < ano) return { trimestre: 1, fase: "planejamento" };
  if (a > ano) return { trimestre: 4, fase: "encerrado" };
  return { trimestre: (Math.floor((m - 1) / 3) + 1) as 1 | 2 | 3 | 4, fase: "execucao" };
}

/** Atraso é calculado, nunca gravado: prazo antes de hoje e não concluída. */
export const estaAtrasada = (t: { prazo: string | null; status: Status }, hoje: string): boolean =>
  !!t.prazo && t.status !== "concluido" && t.prazo < hoje;

/** Diferença em dias entre duas datas YYYY-MM-DD (b − a). */
export const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
