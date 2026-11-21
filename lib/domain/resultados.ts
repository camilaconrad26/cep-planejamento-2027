// Resultados: KRs e KPIs (spec §8). Execução (tarefas) é medida à parte, nunca misturada com resultado.
import { diasEntre } from "@/lib/domain/ciclo";
import { dataValida } from "@/lib/domain/acoes";
import { parseMoeda } from "@/lib/domain/moeda";

export type KR = {
  id: string; okrId: string; descricao: string; unidade: string;
  inicial: number | null; alvo: number | null; atual: number | null; prazo: string | null; atualizadoEm: string;
};
export type Medicao = { id: string; data: string; valor: number; nota: string; criadoEm?: string };
export type KPI = { id: string; nome: string; unidade: string; sentido: "maior" | "menor"; meta: number | null; objetivoId: string | null; criadoEm: string };

const fin = (x: number | null): x is number => typeof x === "number" && Number.isFinite(x);

/** (atual − inicial) ÷ (alvo − inicial), limitado a 0–1. Sem alvo ou sem inicial = sem cálculo (null):
 *  tratar inicial vazio como 0 faria "zerar inadimplência" ou "reduzir para 2" aparecer como atingido. */
export function progressoKR(k: Pick<KR, "inicial" | "alvo" | "atual">): number | null {
  if (!fin(k.alvo) || !fin(k.inicial)) return null;
  const ini = k.inicial;
  const atual = fin(k.atual) ? k.atual : ini;
  if (k.alvo === ini) return atual === k.alvo ? 1 : 0;
  return Math.min(1, Math.max(0, (atual - ini) / (k.alvo - ini)));
}
export const atingido = (k: Pick<KR, "inicial" | "alvo" | "atual">) => progressoKR(k) === 1;
export function mediaKRs(krs: Pick<KR, "inicial" | "alvo" | "atual">[]): number | null {
  const ps = krs.map(progressoKR).filter((p): p is number => p !== null);
  return ps.length ? ps.reduce((s, p) => s + p, 0) / ps.length : null;
}

// Por data; na mesma data, a registrada por último vale (correção do mesmo dia).
const porData = (ms: Medicao[]) => [...ms].sort((a, b) =>
  a.data < b.data ? -1 : a.data > b.data ? 1 : (a.criadoEm ?? "") < (b.criadoEm ?? "") ? -1 : (a.criadoEm ?? "") > (b.criadoEm ?? "") ? 1 : 0);
export function situacaoKPI(k: Pick<KPI, "sentido" | "meta">, medicoes: Medicao[]): { ultima: Medicao | null; situacao: "sem-medicao" | "sem-meta" | "na-meta" | "fora-da-meta" } {
  const ultima = porData(medicoes).at(-1) ?? null;
  if (!ultima) return { ultima: null, situacao: "sem-medicao" };
  if (!fin(k.meta)) return { ultima, situacao: "sem-meta" };
  const ok = k.sentido === "maior" ? ultima.valor >= k.meta : ultima.valor <= k.meta;
  return { ultima, situacao: ok ? "na-meta" : "fora-da-meta" };
}
export const NOME_SITUACAO = { "sem-medicao": "Sem medição", "sem-meta": "Sem meta", "na-meta": "Na meta", "fora-da-meta": "Fora da meta" } as const;

/** Um ponto por mês: a última medição daquele mês. */
export function serieMensal(medicoes: Medicao[]): { mes: string; valor: number }[] {
  const m = new Map<string, number>();
  for (const x of porData(medicoes)) m.set(x.data.slice(0, 7), x.valor);
  return [...m].map(([mes, valor]) => ({ mes, valor }));
}

/** Mais de 30 dias sem medição (contando da criação quando nunca foi medido). */
export const medicaoVencida = (ultimaData: string | null, criadoEm: string, hoje: string) =>
  diasEntre(ultimaData ?? criadoEm.slice(0, 10), hoje) > 30;

const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
export function formatarNumero(n: number | null, unidade = ""): string {
  if (!fin(n)) return "—";
  const u = unidade.trim();
  if (u === "R$") return `R$ ${fmt.format(n)}`;
  return u ? `${fmt.format(n)} ${u}` : fmt.format(n);
}

/** Marcas redondas para o eixo (passos de 1, 2, 2,5, 5 × 10ⁿ). */
export function escala(min: number, max: number, passos = 4): number[] {
  if (min === max) return min > 0 ? [0, min, min * 2] : min < 0 ? [min * 2, min, 0] : [0, 1];
  const bruto = (max - min) / passos;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((p) => p >= bruto - 1e-9)!;
  const ini = Math.floor(min / passo) * passo, fim = Math.ceil(max / passo) * passo;
  const r: number[] = [];
  for (let v = ini; v <= fim + passo / 1e6; v += passo) r.push(Math.round(v * 1e6) / 1e6);
  return r;
}

export const nomeMes = (mes: string) =>
  `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(mes.slice(5, 7)) - 1]}/${mes.slice(0, 4)}`;

/** Regra 5 do próximo passo: KRs com meta numérica e KPIs sem medição há mais de 30 dias. */
export function contarMedicoesVencidas(krs: KR[], kpis: KPI[], ultimaPorKpi: Record<string, string | undefined>, hoje: string): number {
  const k = krs.filter((r) => fin(r.alvo) && medicaoVencida(r.atualizadoEm.slice(0, 10), r.atualizadoEm, hoje)).length;
  const p = kpis.filter((x) => medicaoVencida(ultimaPorKpi[x.id] ?? null, x.criadoEm, hoje)).length;
  return k + p;
}

/** Número digitado: vazio = null; texto que não é número = undefined (nunca vira 0 em silêncio). */
export function lerNumeroEstrito(s: string): number | null | undefined {
  const t = s.trim();
  if (!t) return null;
  if (!/^(R\$\s*)?-?\s*[\d.]+(,\d+)?\s*%?$/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) return undefined;
  const negativo = /^(R\$\s*)?-/.test(t);
  const n = parseMoeda(t.replace("-", ""));
  return Number.isFinite(n) ? (negativo ? -n : n) : undefined;
}
/** Data da medição: válida, não no futuro e não antes de 2020 (evita digitar 2072 por 2027). */
export const dataMedicaoValida = (data: string, hoje: string) => dataValida(data) && data <= hoje && data >= "2020-01-01";
