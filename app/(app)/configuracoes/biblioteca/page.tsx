import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Cartao } from "@/components/ui/Cartao";
import { Filtros } from "@/components/biblioteca/Filtros";
import { EditarCategoria, EditarItem, NovoItem } from "@/components/biblioteca/EdicaoAdmin";
import { exigirSessao } from "@/lib/data/sessao";
import { obterBiblioteca } from "@/lib/data/biblioteca";
import { agruparPorCategoria, filtrarItens, lerFiltros } from "@/lib/domain/biblioteca";

export const metadata: Metadata = { title: "Editar biblioteca" };
export const dynamic = "force-dynamic";

export default async function EditarBiblioteca({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  if (!s.papeis.includes("admin")) notFound();
  const [q, bib] = await Promise.all([searchParams, obterBiblioteca()]);
  const f = { ...lerFiltros(q, s.perfil, bib.categorias.map((c) => c.slug)), nivel: null };
  const grupos = agruparPorCategoria(filtrarItens(bib.itens, f, bib.categorias, true), bib.categorias);
  return (
    <>
      <FaixaTitulo olho="Administração" titulo="Editar biblioteca"
        descricao="Mudanças valem para as próximas adições. O que as alunas já colocaram no plano não muda." />
      <Corpo>
        <Filtros f={f} categorias={bib.categorias} base="/configuracoes/biblioteca" comNivel={false} />
        <Cartao titulo="Novo item"><NovoItem key={`${f.perfil}-${f.categoria}`} categorias={bib.categorias} perfil={f.perfil} categoria={f.categoria} /></Cartao>
        {grupos.map(({ categoria, itens }) => (
          <Cartao key={categoria.id} titulo={categoria.nome}>
            <EditarCategoria key={`${categoria.id}-${categoria.descricao}-${categoria.objetivo}`} c={categoria} />
            <ul>{itens.map((i) => <EditarItem key={`${i.id}-${i.texto}`} item={i} />)}</ul>
          </Cartao>
        ))}
      </Corpo>
    </>
  );
}
