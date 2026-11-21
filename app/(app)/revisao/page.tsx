import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { FormRevisao } from "@/components/revisao/FormRevisao";
import { exigirSessao } from "@/lib/data/sessao";
import { obterRevisoes } from "@/lib/data/revisao";
import { hojeSP, trimestreAtual } from "@/lib/domain/ciclo";

export const metadata: Metadata = { title: "Revisão estratégica" };
export const dynamic = "force-dynamic";

export default async function Revisao({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const [q, d] = await Promise.all([searchParams, obterRevisoes(s.orgId)]);
  const { trimestre: atual } = trimestreAtual(2027, hojeSP());
  const n = Number(Array.isArray(q.t) ? q.t[0] : q.t);
  const t = n === 1 || n === 2 || n === 3 || n === 4 ? n : atual;
  const rev = d.revisoes.find((r) => r.trimestre === t);
  return (
    <>
      <FaixaTitulo olho="Ciclo 2027" titulo="Revisão estratégica" descricao="Ao fim de cada trimestre, registre o que foi feito, o que travou e o que muda.">
        <nav aria-label="Trimestre da revisão"><ul className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((x) => {
            const feita = d.revisoes.some((r) => r.trimestre === x && r.concluidaEm);
            return <li key={x}><Link href={`/revisao?t=${x}`} aria-current={x === t ? "page" : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-full border-[1.5px] px-4 text-[0.9rem] font-bold ${x === t ? "border-ouro bg-ouro text-noite" : "border-ouro-fio text-creme hover:border-creme"}`}>
              {x}º trimestre{feita && <span className="sr-only"> (revisado)</span>}{feita && <span aria-hidden="true">&nbsp;✓</span>}</Link></li>;
          })}
        </ul></nav>
      </FaixaTitulo>
      <Corpo>
        <FormRevisao key={t} trimestre={t} inicial={rev?.respostas ?? {}} faturamento={d.realizado[t] ?? 0} concluida={!!rev?.concluidaEm} />
        {rev?.concluidaEm && (
          <p role="status" className="rounded-cartao border border-ouro-fio bg-papel-2 px-5 py-3 text-tinta">
            Revisão do {t}º trimestre concluída em {new Date(rev.concluidaEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Você pode continuar ajustando as respostas.
          </p>
        )}
      </Corpo>
    </>
  );
}
