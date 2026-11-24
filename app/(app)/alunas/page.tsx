import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { exigirSessao } from "@/lib/data/sessao";
import { listarAlunas } from "@/lib/data/alunas";
import { NovaAluna } from "@/components/alunas/NovaAluna";

export const metadata: Metadata = { title: "Alunas" };
export const dynamic = "force-dynamic";
const DIAG = { "nao-iniciado": "Não iniciado", iniciado: "Em andamento", concluido: "Concluído" } as const;
const data = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

export default async function Alunas() {
  const s = await exigirSessao();
  if (!s.papeis.includes("mentora")) notFound();
  const alunas = await listarAlunas();
  const th = "px-3 py-2 text-left text-[0.78rem] font-bold uppercase tracking-[.08em] text-sec whitespace-nowrap";
  return (
    <>
      <FaixaTitulo olho="Mentoria" titulo="Alunas" descricao="Progresso de cada aluna. Os planos abrem só para leitura." />
      <Corpo>
        <NovaAluna />
        {alunas.length === 0 ? <p className="text-sec">Nenhuma aluna cadastrada ainda.</p> : (
          <div role="region" aria-label="Lista de alunas" tabIndex={0} className="relative overflow-x-auto rounded-cartao border border-linha bg-white">
            <table className="w-full min-w-[46rem] border-collapse text-[0.93rem]">
              <thead className="bg-papel-2"><tr><th className={th}>Aluna</th><th className={th}>Perfil</th><th className={th}>Diagnóstico</th><th className={th}>Ações concluídas</th><th className={th}>Média dos KRs</th><th className={th}>Última alteração</th></tr></thead>
              <tbody>{alunas.map((a) => (
                <tr key={a.userId} className="border-t border-linha">
                  <td className="px-3 py-2.5"><Link href={`/alunas/${a.userId}`} aria-label={`Abrir o plano de ${a.nome}`} className="font-bold text-ouro-texto underline underline-offset-4">{a.nome}</Link>
                    <span className="block text-[0.82rem] text-sec">{a.email}</span></td>
                  <td className="px-3 py-2.5">{a.perfil ? `Perfil ${a.perfil}` : "—"}</td>
                  <td className="px-3 py-2.5">{DIAG[a.diagnostico]}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.acoes.total ? `${a.acoes.concluidas} de ${a.acoes.total} (${Math.round((a.acoes.concluidas / a.acoes.total) * 100)}%)` : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.mediaKRs === null ? "—" : `${Math.round(a.mediaKRs * 100)}%`}</td>
                  <td className="px-3 py-2.5 tabular-nums">{data(a.ultima)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Corpo>
    </>
  );
}
