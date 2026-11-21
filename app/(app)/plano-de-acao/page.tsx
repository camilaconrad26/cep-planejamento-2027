import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { FiltrosAcoes } from "@/components/acoes/FiltrosAcoes";
import { Tabela } from "@/components/acoes/Tabela";
import { ListaPrioridades } from "@/components/acoes/ListaPrioridades";
import { Kanban } from "@/components/acoes/Kanban";
import { Calendario } from "@/components/acoes/Calendario";
import { exigirSessao } from "@/lib/data/sessao";
import { obterAcoes } from "@/lib/data/acoes";
import { VISOES_ACOES, filtrarAcoes, lerFiltrosAcoes, ordenarAcoes, urlAcoes, type Ordem } from "@/lib/domain/acoes";
import { hojeSP } from "@/lib/domain/ciclo";

export const metadata: Metadata = { title: "Plano de ação" };
export const dynamic = "force-dynamic";

export default async function PlanoDeAcao({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const [q, d] = await Promise.all([searchParams, obterAcoes(s.orgId)]);
  const hoje = hojeSP();
  const f = lerFiltrosAcoes(q, d.categorias.map((c) => c.slug));
  // No Kanban a coluna "Concluída" sempre aparece com as concluídas (o filtro "Mostrar concluídas" vale para as outras visões).
  const visiveis = ordenarAcoes(filtrarAcoes(d.acoes, f.visao === "kanban" ? { ...f, concluidas: true } : f, hoje), f.ordem, f.sentido);
  const hrefOrdem = Object.fromEntries((["prazo", "prioridade", "titulo", "status", "inicio"] as Ordem[])
    .map((o) => [o, urlAcoes(f, { ordem: o, sentido: f.ordem === o && f.sentido === "asc" ? "desc" : o === "prioridade" ? "desc" : "asc" })])) as Record<Ordem, string>;

  return (
    <>
      <FaixaTitulo olho="Ciclo 2027" titulo="Plano de ação" descricao="As mesmas ações em quatro visões. Atualize status, prazos e responsáveis à medida que o trimestre anda.">
        <nav aria-label="Visão"><ul className="flex flex-wrap gap-2">
          {VISOES_ACOES.map((v) => (
            <li key={v.valor}><Link href={urlAcoes(f, { visao: v.valor })} aria-current={v.valor === f.visao ? "page" : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-full border-[1.5px] px-4 text-[0.9rem] font-bold ${v.valor === f.visao ? "border-ouro bg-ouro text-noite" : "border-ouro-fio text-creme hover:border-creme"}`}>{v.nome}</Link></li>
          ))}
        </ul></nav>
      </FaixaTitulo>
      <Corpo>
        {d.acoes.length === 0 ? (
          <p className="rounded-cartao border border-linha bg-white px-5 py-4 text-tinta">Você ainda não tem ações. Crie no{" "}
            <Link href="/planejamento" className="font-bold text-ouro-texto underline underline-offset-4">Planejamento estratégico</Link> ou adicione pela{" "}
            <Link href="/biblioteca" className="font-bold text-ouro-texto underline underline-offset-4">Biblioteca</Link>.</p>
        ) : (
          <>
            <FiltrosAcoes f={f} categorias={d.categorias} />
            <p className="text-sec" role="status">{visiveis.length === 1 ? "1 ação" : `${visiveis.length} ações`}</p>
            {visiveis.length === 0 && f.visao !== "kanban" && f.visao !== "calendario" && <p className="text-sec">Nenhuma ação com esses filtros.</p>}
            {f.visao === "kanban" && <Kanban acoes={visiveis} hoje={hoje} />}
            {f.visao === "calendario" && <Calendario acoes={visiveis} f={f} hoje={hoje} />}
            {f.visao !== "kanban" && f.visao !== "calendario" && visiveis.length > 0 && (f.visao === "prioridades"
              ? <ListaPrioridades acoes={visiveis} hoje={hoje} />
              : <Tabela acoes={visiveis} hoje={hoje} ordem={f.ordem} sentido={f.sentido} hrefOrdem={hrefOrdem} />)}
          </>
        )}
      </Corpo>
    </>
  );
}
