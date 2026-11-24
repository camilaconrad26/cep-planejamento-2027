import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Cartao } from "@/components/ui/Cartao";
import { Numeros } from "@/components/visao-geral/Numeros";
import { ProximoPasso } from "@/components/visao-geral/ProximoPasso";
import { exigirSessao } from "@/lib/data/sessao";
import { montarRetrato } from "@/lib/data/retrato";
import { hojeSP } from "@/lib/domain/ciclo";
import { nomeCategoria } from "@/lib/domain/categorias";
import { nomePerfil } from "@/lib/domain/perfis";
import { proximoPasso } from "@/lib/domain/proximoPasso";
import { primeiroNome, saudacao } from "@/lib/domain/voz";

export const metadata: Metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

const EM_BREVE: [string, string][] = [
];

export default async function VisaoGeral() {
  const s = await exigirSessao();
  const r = await montarRetrato(s.orgId, hojeSP());
  const passo = proximoPasso(r.retrato);
  const perfil = nomePerfil(s.perfil);
  return (
    <>
      <FaixaTitulo olho="Turma 2027 · Área da aluna" titulo={`${saudacao()}, ${primeiroNome(s.nome)}`}
        descricao={r.retrato.fase === "planejamento"
          ? "Estamos montando o seu 2027. Um passo de cada vez, começando pelo que mais importa."
          : `Estamos no ${r.retrato.trimestre}º trimestre. Veja como está o seu ano e o que vem a seguir.`}>
        <div className="flex flex-wrap items-center gap-2 text-[0.95rem]">
          <span className="text-creme">{`Ciclo ${r.ciclo.ano} · ${r.retrato.trimestre}º trimestre`}</span>
          {r.retrato.fase === "planejamento" && <span className="rounded-full border border-ouro-fio px-3 py-0.5 text-sm font-bold text-ouro">Fase de planejamento</span>}
          <span aria-hidden="true" className="text-cinza">·</span>
          {perfil ? <span>{perfil}</span> : <Link href="/diagnostico" className="text-ouro underline underline-offset-4">Descubra o seu perfil no diagnóstico</Link>}
        </div>
      </FaixaTitulo>
      <Corpo>
        <ProximoPasso passo={passo} />
        <Cartao titulo="Como está a execução">
          <Numeros c={r.contagens} />
          {r.contagens.total === 0 && <p className="text-sec">Assim que você escolher as primeiras ações no planejamento, o andamento delas aparece aqui.</p>}
        </Cartao>
        <Cartao titulo="Como estão os resultados">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="min-w-0 border-t-[1.5px] border-ouro-fio pt-2.5"><dt className="text-[0.7rem] font-bold uppercase tracking-[.18em] text-sec">Resultados-chave alcançados</dt>
              <dd data-testid="media-krs" className="font-display text-[1.7rem] font-bold tabular-nums text-tinta">{r.resultados.mediaKRs === null ? "—" : `${Math.round(r.resultados.mediaKRs * 100)}%`}</dd></div>
            <div className="min-w-0 border-t-[1.5px] border-ouro-fio pt-2.5"><dt className="text-[0.7rem] font-bold uppercase tracking-[.18em] text-sec">Indicadores na meta</dt>
              <dd data-testid="kpis-na-meta" className="font-display text-[1.7rem] font-bold tabular-nums text-tinta">{r.resultados.kpis ? `${r.resultados.kpisNaMeta} de ${r.resultados.kpis}` : "—"}</dd></div>
          </dl>
          <p className="text-sec">Fazer as ações é uma coisa; bater a meta é outra. Por isso os resultados são medidos à parte.{" "}
            <Link href="/metas?aba=okrs" className="font-bold text-ouro-texto underline underline-offset-4">Ver metas e indicadores</Link></p>
        </Cartao>
        <Cartao titulo={`Seu foco no ${r.retrato.trimestre}º trimestre`}>
          {r.prioridades.length
            ? <ul className="flex flex-wrap gap-2">{r.prioridades.map((p) => <li key={p} className="rounded-full border border-ouro-fio bg-papel-2 px-4 py-1.5 font-bold text-tinta">{nomeCategoria(p)}</li>)}</ul>
            : <p className="text-sec">Você ainda não escolheu onde focar neste trimestre. <Link href="/planejamento" className="font-bold text-ouro-texto underline underline-offset-4">Escolher agora</Link></p>}
        </Cartao>
{EM_BREVE.length > 0 && (
        <section id="em-breve" aria-labelledby="titulo-em-breve" className="scroll-mt-24 rounded-cartao border border-dashed border-ouro-fio p-6">
          <h2 id="titulo-em-breve" className="font-display text-xl font-bold text-tinta">Próximas etapas do sistema</h2>
          <p className="mt-1 text-sec">Estes módulos estão em construção e entram no menu assim que ficarem prontos. Enquanto isso, comece pelo diagnóstico e pelo fechamento de 2026.</p>
          <ul className="mt-3 flex flex-col gap-1.5">{EM_BREVE.map(([t, d]) => <li key={t}><b className="text-tinta">{t}:</b> {d}.</li>)}</ul>
        </section>
        )}
      </Corpo>
    </>
  );
}
