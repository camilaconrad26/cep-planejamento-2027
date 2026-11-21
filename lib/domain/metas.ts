// Metas financeiras da planilha "CONRAD - Planejamento Anual" (spec §5 item 6).
export type Altura = "meta" | "super" | "mega";
export const ALTURAS: { valor: Altura; nome: string }[] = [{ valor: "meta", nome: "Meta" }, { valor: "super", nome: "Super meta" }, { valor: "mega", nome: "Mega meta" }];
export type TipoProduto = "entrada" | "principal" | "alto_valor";
export const PRODUTOS: { tipo: TipoProduto; nome: string; exemplo: string }[] = [
  { tipo: "entrada", nome: "Entrada", exemplo: "Consulta, sessão de viabilidade" },
  { tipo: "principal", nome: "Principal", exemplo: "Honorários, diagnóstico" },
  { tipo: "alto_valor", nome: "Alto valor", exemplo: "Holding, planejamento sucessório" },
];
type Tri = 1 | 2 | 3 | 4;
export type LinhaAnual = { faturamento: number; lucratividade: number; anuncios: number; time: number };
export type MetasForm = {
  anual: Record<Altura, LinhaAnual>;
  trimestres: Record<Tri, Record<Altura, number>>;
  produtos: Record<TipoProduto, { nome: string; ticket: number; vendas: Record<Altura, number> }>;
  realizado: Record<Tri, number>;
  porque: string;
};
export type AcaoVenda = { id: string; mes: number; produto: string; acao: string; ticket: number; quantidade: number; responsavel: string };

const alturas = <T>(f: () => T): Record<Altura, T> => ({ meta: f(), super: f(), mega: f() });
const tris = <T>(f: () => T): Record<Tri, T> => ({ 1: f(), 2: f(), 3: f(), 4: f() });
export function metasVazias(): MetasForm {
  return {
    anual: alturas(() => ({ faturamento: 0, lucratividade: 0, anuncios: 0, time: 0 })),
    trimestres: tris(() => alturas(() => 0)),
    produtos: { entrada: { nome: "", ticket: 0, vendas: alturas(() => 0) }, principal: { nome: "", ticket: 0, vendas: alturas(() => 0) }, alto_valor: { nome: "", ticket: 0, vendas: alturas(() => 0) } },
    realizado: tris(() => 0),
    porque: "",
  };
}

const n = (x: number) => (Number.isFinite(x) ? x : 0);
export const lucroProjetado = (fat: number, pct: number) => n(fat) * n(pct) / 100;
export const anunciosEmReais = (fat: number, pct: number) => n(fat) * n(pct) / 100;
export const mediaMensal = (fat: number) => n(fat) / 12;
export const crescimento = (fat: number, base: number): number | null => (n(fat) && n(base) ? n(fat) / n(base) - 1 : null);
export const cenarioProdutos = (m: MetasForm, a: Altura) => PRODUTOS.reduce((s, p) => s + n(m.produtos[p.tipo].ticket) * n(m.produtos[p.tipo].vendas[a]), 0);
export const somaTrimestres = (m: MetasForm, a: Altura) => ([1, 2, 3, 4] as Tri[]).reduce((s, t) => s + n(m.trimestres[t][a]), 0);

export function comparar(tem: number, alvo: number): { tipo: "sem-meta" | "fecha" | "falta" | "acima"; valor: number } {
  if (!n(alvo)) return { tipo: "sem-meta", valor: 0 };
  const d = n(tem) - n(alvo);
  if (Math.abs(d) < 1) return { tipo: "fecha", valor: 0 };
  return d < 0 ? { tipo: "falta", valor: -d } : { tipo: "acima", valor: d };
}

export function dividirEmQuatro(total: number): [number, number, number, number] {
  const t = Math.round(n(total));
  const q = Math.floor(t / 4);
  return [q, q, q, t - 3 * q];
}

export const pctRealizado = (realizado: number, meta: number): number | null => (n(realizado) && n(meta) ? n(realizado) / n(meta) : null);

export const faturamentoAcao = (a: AcaoVenda) => n(a.ticket) * n(a.quantidade);
export const previstoMes = (acoes: AcaoVenda[], mes: number) => acoes.filter((a) => a.mes === mes).reduce((s, a) => s + faturamentoAcao(a), 0);
export const previstoTrimestre = (acoes: AcaoVenda[], t: number) => [0, 1, 2].reduce((s, k) => s + previstoMes(acoes, (t - 1) * 3 + 1 + k), 0);
export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
export function formatarPct(f: number | null): string {
  if (f === null || !Number.isFinite(f)) return "—";
  const v = Math.round(f * 1000) / 10;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt.format(Math.abs(v))}%`;
}
/** Percentual sem sinal, para "50% da meta". */
export const formatarPctSimples = (f: number | null) => (f === null ? "—" : `${fmt.format(Math.round(f * 1000) / 10)}%`);
