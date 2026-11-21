import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Cartao } from "@/components/ui/Cartao";
import { exigirSessao } from "@/lib/data/sessao";
import { obterHistorico } from "@/lib/data/historico";
import { obterRevisoes } from "@/lib/data/revisao";

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";
const quando = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default async function Historico({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await exigirSessao();
  const q = await searchParams;
  const limite = Math.min(500, Math.max(50, Number(Array.isArray(q.mais) ? q.mais[0] : q.mais) || 50));
  const [h, rev] = await Promise.all([obterHistorico(s.orgId, limite), obterRevisoes(s.orgId)]);
  const relatorios = rev.revisoes.filter((r) => r.concluidaEm).sort((a, b) => a.trimestre - b.trimestre);
  return (
    <>
      <FaixaTitulo olho="Ciclo 2027" titulo="Histórico" descricao="Relatórios de revisão, ações concluídas e tudo o que mudou no seu plano." />
      <Corpo>
        <Cartao titulo="Ciclos">
          <ul>{h.ciclos.map((c) => <li key={c.id}><b>{c.ano}</b> · {c.status === "ativo" ? "ativo" : "arquivado"}</li>)}</ul>
          <p className="text-sec">Ao fim de 2027 você poderá abrir o ciclo seguinte a partir deste. A comparação entre ciclos aparece a partir do segundo ciclo.</p>
        </Cartao>
        <Cartao titulo="Relatórios de revisão">
          {relatorios.length === 0 ? <p className="text-sec">Nenhuma revisão concluída ainda. <Link href="/revisao" className="font-bold text-ouro-texto underline underline-offset-4">Ir para a Revisão estratégica</Link></p> : (
            <ul className="flex flex-col gap-1">{relatorios.map((r) => (
              <li key={r.trimestre}><Link href={`/revisao?t=${r.trimestre}`} className="font-bold text-ouro-texto underline underline-offset-4">Relatório do {r.trimestre}º trimestre</Link>
                <span className="text-sec"> · concluído em {quando(r.concluidaEm)}</span></li>
            ))}</ul>
          )}
        </Cartao>
        <Cartao titulo={`Ações concluídas (${h.concluidas.length})`}>
          {h.concluidas.length === 0 ? <p className="text-sec">Nenhuma ação concluída ainda.</p> : (
            <ul className="flex flex-col">{h.concluidas.map((t) => (
              <li key={t.id} className="border-t border-linha py-1.5 first:border-t-0"><b>{t.titulo}</b>{t.objetivo && <span className="text-sec"> · {t.objetivo}</span>}
                <span className="block text-[0.85rem] text-sec">concluída em {quando(t.concluidoEm)}</span></li>
            ))}</ul>
          )}
        </Cartao>
        <Cartao titulo="Registro de alterações">
          {h.atividades.length === 0 ? <p className="text-sec">Nada registrado ainda.</p> : (
            <ol className="flex flex-col">{h.atividades.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-x-4 border-t border-linha py-1.5 first:border-t-0">
                <span>{a.texto}{a.vezes > 1 && <span className="text-sec"> ({a.vezes}×)</span>}</span>
                <span className="text-[0.85rem] tabular-nums text-sec">{quando(a.em)}</span></li>
            ))}</ol>
          )}
          {h.temMais && <Link href={`/historico?mais=${limite + 50}`} className="self-start font-bold text-ouro-texto underline underline-offset-4">Ver mais</Link>}
        </Cartao>
      </Corpo>
    </>
  );
}
