"use client";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { SeletorTrimestre, nomeTri } from "@/components/planejamento/campos";
import { KrLinha } from "@/components/resultados/KrLinha";
import { FormKr } from "@/components/resultados/FormKr";
import { pct } from "@/components/resultados/util";
import { criarOkr, editarOkr, excluirOkr } from "@/lib/data/resultadosAcoes";
import { mediaKRs, type KR } from "@/lib/domain/resultados";

type Okr = { id: string; objetivoId: string; titulo: string; trimestre: number | null };
type Objetivo = { id: string; titulo: string; categoria: string };

function NovoOkr({ objetivos }: { objetivos: Objetivo[] }) {
  const [aberto, setAberto] = useState(false);
  const [obj, setObj] = useState(objetivos[0]?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [tri, setTri] = useState<number | null>(null);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await rodar(() => criarOkr({ objetivoId: obj, titulo, trimestre: tri }));
    if (r?.ok) { setTitulo(""); setAberto(false); }
  }
  if (!aberto) return <div><Botao onClick={() => setAberto(true)}>Novo OKR</Botao></div>;
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      <label className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">Objetivo
        <select aria-label="Objetivo do OKR" value={obj} onChange={(e) => setObj(e.target.value)} className="campo font-normal">
          {objetivos.map((o) => <option key={o.id} value={o.id}>{o.titulo} ({o.categoria})</option>)}</select></label>
      <label htmlFor={`${id}-t`} className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">OKR
        <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} required autoFocus className="campo font-normal" placeholder="Ex.: ganhar tração comercial" /></label>
      <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre do OKR" valor={tri} onChange={setTri} />
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando || !titulo.trim() || !obj}>Criar OKR</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={() => setAberto(false)}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </form>
  );
}

function OkrCartao({ okr, krs }: { okr: Okr; krs: KR[] }) {
  const [novoKr, setNovoKr] = useState(false);
  const [editando, setEditando] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [titulo, setTitulo] = useState(okr.titulo);
  const [tri, setTri] = useState<number | null>(okr.trimestre);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  return (
    <article aria-labelledby={`${id}-h`} className="flex flex-col gap-2 rounded-cartao border border-linha bg-papel px-4 py-4">
      {editando ? (
        <div className="flex flex-col gap-2">
          <h4 id={`${id}-h`} className="sr-only">{okr.titulo}</h4>
          <label htmlFor={`${id}-t`} className="text-[0.9rem] font-bold text-tinta">OKR</label>
          <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} className="campo" />
          <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre do OKR" valor={tri} onChange={setTri} />
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" disabled={enviando || !titulo.trim()} onClick={async () => { const r = await rodar(() => editarOkr(okr.id, { titulo, trimestre: tri })); if (r?.ok) setEditando(false); }}>Salvar OKR</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setEditando(false)}>Cancelar</Botao>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><span className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">OKR · {nomeTri(okr.trimestre)}</span>
            <h4 id={`${id}-h`} className="font-display text-[1.05rem] font-bold text-tinta">{okr.titulo}</h4></div>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" variante="secundario" aria-label={`Editar OKR: ${okr.titulo}`} onClick={() => setEditando(true)}>Editar</Botao>
            <Botao tamanho="mini" variante="secundario" aria-label={`Excluir OKR: ${okr.titulo}`} onClick={() => setExcluir(true)}>Excluir</Botao>
          </div>
        </div>
      )}
      {excluir && (
        <div role="alertdialog" aria-labelledby={`${id}-x`} className="flex flex-col gap-2 rounded-cartao border border-alerta bg-white p-3">
          <p id={`${id}-x`} className="font-bold text-tinta">{krs.length ? `Excluir este OKR e ${krs.length === 1 ? "o 1 resultado-chave" : `os ${krs.length} resultados-chave`}?` : "Excluir este OKR?"}</p>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" variante="perigo" disabled={enviando} onClick={() => rodar(() => excluirOkr(okr.id))}>Excluir de vez</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Botao>
          </div>
        </div>
      )}
      <Erro t={erro} />
      {krs.length > 0 && <ul>{krs.map((k) => <KrLinha key={`${k.id}-${k.atualizadoEm}`} kr={k} />)}</ul>}
      {novoKr ? <FormKr okrId={okr.id} onFechar={() => setNovoKr(false)} /> : <div><Botao tamanho="mini" variante="secundario" onClick={() => setNovoKr(true)}>Novo resultado-chave</Botao></div>}
    </article>
  );
}

/** Aba OKRs: por objetivo, execução das ações e resultado dos KRs lado a lado, sem misturar. */
export function Okrs({ objetivos, okrs, krs, execucao }: { objetivos: Objetivo[]; okrs: Okr[]; krs: KR[]; execucao: Record<string, number | null> }) {
  if (!objetivos.length) return (
    <p className="rounded-cartao border border-linha bg-white px-5 py-4 text-tinta">Crie um objetivo no{" "}
      <Link href="/planejamento" className="font-bold text-ouro-texto underline underline-offset-4">Planejamento estratégico</Link> (ou adicione um pela biblioteca) para ligar OKRs a ele.</p>
  );
  return (
    <div className="flex flex-col gap-4">
      <NovoOkr objetivos={objetivos} />
      {objetivos.map((o) => {
        const seus = okrs.filter((k) => k.objetivoId === o.id);
        const seusKrs = krs.filter((r) => seus.some((k) => k.id === r.okrId));
        return (
          <section key={o.id} aria-labelledby={`obj-${o.id}`} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-white px-4 py-5 sm:px-6">
            <div>
              <span className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">{o.categoria}</span>
              <h3 id={`obj-${o.id}`} className="font-display text-lg font-bold text-tinta">{o.titulo}</h3>
              <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[0.9rem] text-sec">
                <span>Execução das ações: {pct(execucao[o.id] ?? null)}</span>
                <span>Resultado dos KRs: {pct(mediaKRs(seusKrs))}</span>
              </p>
            </div>
            {seus.length === 0 ? <p className="text-sec">Nenhum OKR neste objetivo.</p> : seus.map((k) => <OkrCartao key={k.id} okr={k} krs={krs.filter((r) => r.okrId === k.id)} />)}
          </section>
        );
      })}
    </div>
  );
}
