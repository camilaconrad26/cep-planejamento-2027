import type { Metadata } from "next";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { MetasFinanceiras } from "@/components/metas/MetasFinanceiras";
import { exigirSessao } from "@/lib/data/sessao";
import { obterMetas } from "@/lib/data/metas";

export const metadata: Metadata = { title: "Metas e indicadores" };
export const dynamic = "force-dynamic";

export default async function Metas() {
  const s = await exigirSessao();
  const d = await obterMetas(s.orgId);
  return (
    <>
      <FaixaTitulo olho="Ciclo 2027" titulo="Metas e indicadores"
        descricao="Três alturas para o mesmo ano: a meta com que você se compromete, a super meta que exige esforço extra e a mega meta de um ano excepcional." />
      <Corpo><MetasFinanceiras inicial={d.form} base2026={d.base2026} acoes={d.acoes} /></Corpo>
    </>
  );
}
