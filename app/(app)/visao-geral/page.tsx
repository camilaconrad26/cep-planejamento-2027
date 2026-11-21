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

export const metadata: Metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

const EM_BREVE = [
  ["Plano de ação", "tabela, quadro Kanban, calendário e lista de prioridades"],
  ["OKRs e indicadores", "resultados-chave e KPIs com medições e gráficos, dentro de Metas e indicadores"],
  ["Revisão estratégica e Histórico", "revisão de cada trimestre, relatórios e comparação entre ciclos"],
];

export default async function VisaoGeral() {
  const s = await exigirSessao();
  const r = await montarRetrato(s.orgId, hojeSP());
  const passo = proximoPasso(r.retrato);
  const perfil = nomePerfil(s.perfil);
  return (
    <>
      <FaixaTitulo olho="Turma 2027 · Área da aluna" titulo={`Olá, ${s.nome.split(" ")[0]}`}>
        <div className="flex flex-wrap items-center gap-2 text-[0.95rem]">
          <span className="text-creme">{`Ciclo ${r.ciclo.ano} · ${r.retrato.trimestre}º trimestre`}</span>
          {r.retrato.fase === "planejamento" && <span className="rounded-full border border-ouro-fio px-3 py-0.5 text-sm font-bold text-ouro">Fase de planejamento</span>}
          <span aria-hidden="true" className="text-cinza">·</span>
          {perfil ? <span>{perfil}</span> : <Link href="/diagnostico" className="text-ouro underline underline-offset-4">Defina o seu perfil no diagnóstico</Link>}
        </div>
      </FaixaTitulo>
      <Corpo>
        <ProximoPasso passo={passo} />
        <Cartao titulo="Execução do ciclo">
          <Numeros c={r.contagens} />
          {r.contagens.total === 0 && <p className="text-sec">As ações aparecem aqui quando você criar tarefas no fechamento de 2026 ou montar o plano.</p>}
        </Cartao>
        <Cartao titulo={`Prioridades do ${r.retrato.trimestre}º trimestre`}>
          {r.prioridades.length
            ? <ul className="flex flex-wrap gap-2">{r.prioridades.map((p) => <li key={p} className="rounded-full border border-ouro-fio bg-papel-2 px-4 py-1.5 font-bold text-tinta">{nomeCategoria(p)}</li>)}</ul>
            : <p className="text-sec">Nenhuma categoria escolhida para este trimestre ainda.</p>}
        </Cartao>
        <section id="em-breve" aria-labelledby="titulo-em-breve" className="scroll-mt-24 rounded-cartao border border-dashed border-ouro-fio p-6">
          <h2 id="titulo-em-breve" className="font-display text-xl font-bold text-tinta">Próximas etapas do sistema</h2>
          <p className="mt-1 text-sec">Estes módulos estão em construção e entram no menu assim que ficarem prontos. Enquanto isso, comece pelo diagnóstico e pelo fechamento de 2026.</p>
          <ul className="mt-3 flex flex-col gap-1.5">{EM_BREVE.map(([t, d]) => <li key={t}><b className="text-tinta">{t}:</b> {d}.</li>)}</ul>
        </section>
      </Corpo>
    </>
  );
}
