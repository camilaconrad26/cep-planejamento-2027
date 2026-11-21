"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { EditarAcao } from "@/components/acoes/EditarAcao";
import { SeloAtraso, SeloPrioridade } from "@/components/acoes/SeloAcao";
import { formatarData, nomeStatus, progresso, type Acao, type Ordem } from "@/lib/domain/acoes";

const NIVEL: Record<Acao["nivel"], string> = { estrategico: "Estratégico", tatico: "Tático", operacional: "Operacional" };
const th = "px-3 py-2 text-left text-[0.78rem] font-bold uppercase tracking-[.08em] text-sec whitespace-nowrap";
const td = "px-3 py-2.5 align-top";

/** Tabela de ações com cabeçalhos ordenáveis e edição na própria linha. */
export function Tabela({ acoes, hoje, ordem, sentido, hrefOrdem }: { acoes: Acao[]; hoje: string; ordem: Ordem; sentido: "asc" | "desc"; hrefOrdem: Record<Ordem, string> }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const cab = (o: Ordem | null, nome: string) => (
    <th scope="col" className={th} aria-sort={o && o === ordem ? (sentido === "asc" ? "ascending" : "descending") : undefined}>
      {o ? <Link href={hrefOrdem[o]} className="inline-flex min-h-6 items-center underline-offset-4 hover:text-tinta hover:underline">{nome}{o === ordem ? (sentido === "asc" ? " ↑" : " ↓") : ""}</Link> : nome}
    </th>
  );
  return (
    <div role="region" aria-label="Tabela de ações" tabIndex={0} className="relative overflow-x-auto rounded-cartao border border-linha bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ouro-texto">
      <table className="w-full min-w-[60rem] border-collapse text-[0.93rem]">
        <thead className="border-b border-linha bg-papel-2"><tr>
          {cab("titulo", "Ação")}{cab(null, "Categoria")}{cab(null, "Nível")}{cab(null, "Responsável")}{cab("prioridade", "Prioridade")}
          {cab("status", "Status")}{cab("inicio", "Início")}{cab("prazo", "Prazo")}{cab(null, "Progresso")}<th className={th}><span className="sr-only">Editar</span></th>
        </tr></thead>
        <tbody>
          {acoes.map((a) => (
            <Fragment key={a.id}>
              <tr data-acao={a.id} className="border-t border-linha">
                <td className={td}><span className={a.status === "concluido" ? "text-sec line-through" : "font-bold text-tinta"}>{a.titulo}</span>
                  {a.objetivo && <span className="block text-[0.82rem] text-sec">{a.objetivo}</span>}<SeloAtraso acao={a} hoje={hoje} /></td>
                <td className={td}>{a.categoria?.nome ?? <span className="text-sec">Avulsa</span>}</td>
                <td className={td}>{NIVEL[a.nivel]}</td>
                <td className={td}>{a.responsavel || <span className="text-sec">—</span>}</td>
                <td className={td}><SeloPrioridade p={a.prioridade} /></td>
                <td className={`${td} whitespace-nowrap`}>{nomeStatus(a.status)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{formatarData(a.inicio)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{formatarData(a.prazo)}</td>
                <td className={`${td} tabular-nums`}>
                  <span className="sr-only">Progresso </span>{progresso(a.status)}%
                  <span aria-hidden="true" className="mt-1 block h-1.5 w-16 rounded-full bg-papel-2"><span className="block h-full rounded-full bg-ouro-texto" style={{ width: `${progresso(a.status)}%` }} /></span>
                </td>
                <td className={td}><Botao tamanho="mini" variante="secundario" aria-expanded={aberta === a.id} aria-label={`Editar: ${a.titulo}`}
                  onClick={() => setAberta(aberta === a.id ? null : a.id)}>Editar</Botao></td>
              </tr>
              {aberta === a.id && (
                <tr className="border-t border-linha"><td colSpan={10} className="p-3"><EditarAcao acao={a} onFechar={() => setAberta(null)} /></td></tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
