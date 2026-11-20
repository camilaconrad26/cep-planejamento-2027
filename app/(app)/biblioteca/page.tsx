import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Adicionar } from "@/components/biblioteca/Adicionar";
import { Filtros } from "@/components/biblioteca/Filtros";
import { ItemCartao } from "@/components/biblioteca/ItemCartao";
import { exigirSessao } from "@/lib/data/sessao";
import { idsNoPlano, obterBiblioteca } from "@/lib/data/biblioteca";
import { agruparPorCategoria, filtrarItens, lerFiltros } from "@/lib/domain/biblioteca";
import { hojeSP, trimestreAtual } from "@/lib/domain/ciclo";

export const metadata: Metadata = { title: "Biblioteca de estratégias" };
export const dynamic = "force-dynamic";

export default async function Biblioteca({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const [q, bib, noPlano] = await Promise.all([searchParams, obterBiblioteca(), idsNoPlano(s.orgId)]);
  const f = lerFiltros(q, s.perfil, bib.categorias.map((c) => c.slug));
  const grupos = agruparPorCategoria(filtrarItens(bib.itens, f, bib.categorias), bib.categorias);
  const { trimestre } = trimestreAtual(2027, hojeSP());
  return (
    <>
      <FaixaTitulo olho="Método CEP" titulo="Biblioteca de estratégias"
        descricao="Os itens originais do método, por perfil, categoria e nível. Escolha o que entra no seu plano de 2027." />
      <Corpo>
        <Filtros f={f} categorias={bib.categorias} base="/biblioteca" />
        {s.perfil === null && (
          <p className="rounded-cartao border border-ouro-fio bg-papel-2 px-5 py-3 text-tinta">
            Você ainda não confirmou o seu perfil. Mostrando o Perfil {f.perfil}.{" "}
            <Link href="/diagnostico/resumo" className="font-bold text-ouro-texto underline underline-offset-4">Confirmar no diagnóstico</Link>
          </p>
        )}
        {s.perfil !== null && f.perfil !== s.perfil && (
          <p className="rounded-cartao border border-ouro-fio bg-papel-2 px-5 py-3 text-tinta">Você está vendo o Perfil {f.perfil}. O seu é o Perfil {s.perfil}.</p>
        )}
        {grupos.length === 0 && (
          <p className="text-sec">Nenhum item com esses filtros. <Link href="/biblioteca" className="font-bold text-ouro-texto underline underline-offset-4">Limpar filtros</Link></p>
        )}
        {grupos.map(({ categoria, itens }) => (
          <section key={categoria.id} aria-labelledby={`cat-${categoria.slug}`} className="flex min-w-0 flex-col gap-2 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7 sm:py-6">
            <h2 id={`cat-${categoria.slug}`} className="font-display text-xl font-bold text-tinta">{categoria.nome}</h2>
            {categoria.descricao && <p className="text-sec">{categoria.descricao}</p>}
            {categoria.objetivo && <p className="text-tinta"><b>Objetivo:</b> {categoria.objetivo}</p>}
            <ul className="mt-2">
              {itens.map((i) => (
                <ItemCartao key={i.id} item={i}>
                  {noPlano.has(i.id)
                    ? <span className="inline-flex rounded-full border border-ouro-fio bg-papel-2 px-3 py-1 text-[0.84rem] font-bold text-ouro-texto">✓ No seu plano</span>
                    : <Adicionar itemId={i.id} texto={i.texto} trimestrePadrao={trimestre} />}
                </ItemCartao>
              ))}
            </ul>
          </section>
        ))}
      </Corpo>
    </>
  );
}
