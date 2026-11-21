import Link from "next/link";

export type Aba = "financeiro" | "okrs" | "kpis";
const ABAS: [Aba, string][] = [["financeiro", "Financeiro"], ["okrs", "OKRs e resultados-chave"], ["kpis", "Indicadores (KPIs)"]];
export const lerAba = (v: unknown): Aba => (v === "okrs" || v === "kpis" ? v : "financeiro");

export function AbasMetas({ atual }: { atual: Aba }) {
  return (
    <nav aria-label="Seções de metas"><ul className="flex flex-wrap gap-2">
      {ABAS.map(([a, nome]) => (
        <li key={a}><Link href={a === "financeiro" ? "/metas" : `/metas?aba=${a}`} aria-current={a === atual ? "page" : undefined}
          className={`inline-flex min-h-[44px] items-center rounded-full border-[1.5px] px-4 text-[0.9rem] font-bold ${a === atual ? "border-ouro bg-ouro text-noite" : "border-ouro-fio text-creme hover:border-creme"}`}>{nome}</Link></li>
      ))}
    </ul></nav>
  );
}
