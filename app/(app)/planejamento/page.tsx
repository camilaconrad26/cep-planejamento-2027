import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Visoes } from "@/components/planejamento/Visoes";
import { Prioridades } from "@/components/planejamento/Prioridades";
import { ObjetivoCartao } from "@/components/planejamento/ObjetivoCartao";
import { NovoObjetivo } from "@/components/planejamento/NovoObjetivo";
import { exigirSessao } from "@/lib/data/sessao";
import { obterPlano } from "@/lib/data/planejamento";
import { lerVisao, montarArvore, trimestreDaVisao, trimestresDa, type Visao } from "@/lib/domain/arvore";
import { hojeSP, trimestreAtual } from "@/lib/domain/ciclo";

export const metadata: Metadata = { title: "Planejamento estratégico" };
export const dynamic = "force-dynamic";

export default async function Planejamento({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const [q, plano] = await Promise.all([searchParams, obterPlano(s.orgId)]);
  const { trimestre: atual, fase } = trimestreAtual(plano.ano, hojeSP());
  const visao: Visao = lerVisao(Array.isArray(q.visao) ? q.visao[0] : q.visao, `t${atual}` as Visao);
  const tri = trimestreDaVisao(visao);
  const tris = trimestresDa(visao);
  const prioridadesPeriodo = plano.prioridades.filter((p) => tris.includes(p.trimestre as 1));
  const grupos = montarArvore({ ...plano, prioridades: [...new Set(prioridadesPeriodo.map((p) => p.categoryId))] }, visao);
  const nome = (id: string) => plano.categorias.find((c) => c.id === id)?.nome ?? "";

  return (
    <>
      <FaixaTitulo olho={`Ciclo ${plano.ano}`} titulo="Planejamento estratégico"
        descricao="Escolha as prioridades de cada trimestre e desdobre cada objetivo em ações táticas e operacionais.">
        {fase === "planejamento" && <span className="self-start rounded-full border border-ouro-fio px-3 py-0.5 text-sm font-bold text-ouro">Fase de planejamento</span>}
        <Visoes atual={visao} />
      </FaixaTitulo>
      <Corpo>
        {tri ? (
          <Prioridades trimestre={tri} categorias={plano.categorias}
            escolhidas={prioridadesPeriodo.map((p) => ({ categoryId: p.categoryId, excedente: p.excedente }))} />
        ) : (
          <section aria-labelledby="prio-periodo" className="flex flex-col gap-2 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7">
            <h2 id="prio-periodo" className="font-display text-xl font-bold text-tinta">Prioridades do período</h2>
            <ul className="flex flex-col gap-1">
              {tris.map((t) => {
                const n = plano.prioridades.filter((p) => p.trimestre === t).map((p) => nome(p.categoryId));
                return <li key={t}><b className="text-tinta">{t}º trimestre:</b> {n.length ? n.join(", ") : <span className="text-sec">nenhuma escolhida</span>}</li>;
              })}
            </ul>
            <p className="text-sec">Para escolher, abra um trimestre.</p>
          </section>
        )}
        {grupos.length === 0 && (
          <p className="text-sec">Nenhum objetivo neste período. Comece pelas prioridades ou busque ideias na{" "}
            <Link href="/biblioteca" className="font-bold text-ouro-texto underline underline-offset-4">biblioteca</Link>.</p>
        )}
        {grupos.map((g) => (
          <section key={g.categoria.id} aria-labelledby={`g-${g.categoria.slug}`} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-white px-4 py-5 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={`g-${g.categoria.slug}`} className="font-display text-xl font-bold text-tinta">{g.categoria.nome}</h2>
              {g.prioritaria && <span className="rounded-full border border-ouro-fio bg-papel-2 px-3 py-0.5 text-[0.8rem] font-bold text-ouro-texto">Prioridade</span>}
            </div>
            {g.objetivos.length === 0 && <p className="text-sec">Ainda sem objetivo nesta categoria.</p>}
            {g.objetivos.map((o) => <ObjetivoCartao key={`${o.id}-${o.titulo}-${o.trimestre}`} o={o} trimestrePadrao={tri} />)}
            <div className="flex flex-wrap items-center gap-3">
              <NovoObjetivo categoryId={g.categoria.id} trimestrePadrao={tri} />
              <Link href={`/biblioteca?categoria=${g.categoria.slug}`} className="text-ouro-texto underline underline-offset-4 hover:text-tinta">Buscar na biblioteca</Link>
            </div>
          </section>
        ))}
        <NovoObjetivo categorias={plano.categorias} trimestrePadrao={tri} />
      </Corpo>
    </>
  );
}
