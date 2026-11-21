import type { Metadata } from "next";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { MetasFinanceiras } from "@/components/metas/MetasFinanceiras";
import { AbasMetas, lerAba } from "@/components/resultados/AbasMetas";
import { Okrs } from "@/components/resultados/Okrs";
import { Kpis } from "@/components/resultados/Kpis";
import { hojeSP } from "@/lib/domain/ciclo";
import { exigirSessao } from "@/lib/data/sessao";
import { obterMetas } from "@/lib/data/metas";
import { obterResultados } from "@/lib/data/resultados";

export const metadata: Metadata = { title: "Metas e indicadores" };
export const dynamic = "force-dynamic";

export default async function Metas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const q = await searchParams;
  const aba = lerAba(Array.isArray(q.aba) ? q.aba[0] : q.aba);
  return (
    <>
      <FaixaTitulo olho="Ciclo 2027" titulo="Metas e indicadores"
        descricao="Três alturas para o mesmo ano: a meta com que você se compromete, a super meta que exige esforço extra e a mega meta de um ano excepcional.">
        <AbasMetas atual={aba} />
      </FaixaTitulo>
      <Corpo>
        {aba === "financeiro" && await (async () => {
          const d = await obterMetas(s.orgId);
          return <MetasFinanceiras inicial={d.form} base2026={d.base2026} acoes={d.acoes} />;
        })()}
        {aba === "okrs" && await (async () => {
          const r = await obterResultados(s.orgId);
          return <Okrs objetivos={r.objetivos} okrs={r.okrs} krs={r.krs} execucao={r.execucaoPorObjetivo} />;
        })()}
        {aba === "kpis" && await (async () => {
          const r = await obterResultados(s.orgId);
          return <Kpis kpis={r.kpis} medicoes={r.medicoes} objetivos={r.objetivos} hoje={hojeSP()} />;
        })()}
      </Corpo>
    </>
  );
}
