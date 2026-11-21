"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { NovaAcao } from "@/components/planejamento/NovaAcao";
import { SeletorTrimestre, nomeTri } from "@/components/planejamento/campos";
import { editarAcao, editarObjetivo, excluirAcao, excluirObjetivo } from "@/lib/data/planejamentoAcoes";
import { perguntaExclusao, type NoObjetivo, type TarefaP } from "@/lib/domain/arvore";

const STATUS: Record<TarefaP["status"], string> = { nao_iniciado: "Não iniciada", em_andamento: "Em andamento", concluido: "Concluída" };

function Acao({ t }: { t: TarefaP }) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(t.titulo);
  const [tri, setTri] = useState<number | null>(t.trimestre);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  if (editando) return (
    <li className="flex flex-col gap-2 border-t border-linha py-3 first:border-t-0">
      <label htmlFor={`${id}-t`} className="text-[0.9rem] font-bold text-tinta">Ação</label>
      <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} className="campo" />
      <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre da ação" valor={tri} onChange={setTri} />
      <div className="flex flex-wrap gap-2">
        <Botao tamanho="mini" disabled={enviando || !titulo.trim()} onClick={async () => { const r = await rodar(() => editarAcao(t.id, { titulo, trimestre: tri })); if (r?.ok) setEditando(false); }}>Salvar ação</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={() => { setEditando(false); setTitulo(t.titulo); setTri(t.trimestre); }}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </li>
  );
  return (
    <li className="flex flex-col gap-1.5 border-t border-linha py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className={t.status === "concluido" ? "text-sec line-through" : "text-tinta"}>{t.titulo}</p>
        <p className="text-[0.84rem] text-sec">{nomeTri(t.trimestre)} · {STATUS[t.status]}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Botao tamanho="mini" variante="secundario" aria-label={`Editar ação: ${t.titulo}`} onClick={() => setEditando(true)}>Editar</Botao>
        <Botao tamanho="mini" variante="secundario" aria-label={`Excluir ação: ${t.titulo}`} disabled={enviando} onClick={() => rodar(() => excluirAcao(t.id))}>Excluir</Botao>
      </div>
      <Erro t={erro} />
    </li>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: TarefaP[] }) {
  if (!itens.length) return null;
  return (
    <div>
      <h4 className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">{titulo}</h4>
      <ul>{itens.map((t) => <Acao key={`${t.id}-${t.titulo}-${t.trimestre}`} t={t} />)}</ul>
    </div>
  );
}

export function ObjetivoCartao({ o, trimestrePadrao }: { o: NoObjetivo; trimestrePadrao: number | null }) {
  const [editando, setEditando] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [titulo, setTitulo] = useState(o.titulo);
  const [tri, setTri] = useState<number | null>(o.trimestre);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const cancelar = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (excluir) cancelar.current?.focus(); }, [excluir]);
  const pergunta = perguntaExclusao(o.totalAcoes, o.totalKrs, o.kpis.length);

  return (
    <article aria-labelledby={`${id}-h`} className="flex flex-col gap-3 rounded-cartao border border-linha bg-papel px-4 py-4 sm:px-5">
      {editando ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-t`} className="text-[0.9rem] font-bold text-tinta">Objetivo</label>
          <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} className="campo" />
          <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre do objetivo" valor={tri} onChange={setTri} />
          <h3 id={`${id}-h`} className="sr-only">{o.titulo}</h3>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" disabled={enviando || !titulo.trim()} onClick={async () => { const r = await rodar(() => editarObjetivo(o.id, { titulo, trimestre: tri })); if (r?.ok) setEditando(false); }}>Salvar objetivo</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => { setEditando(false); setTitulo(o.titulo); setTri(o.trimestre); }}>Cancelar</Botao>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">Estratégico</span>
            <h3 id={`${id}-h`} className="font-display text-[1.1rem] font-bold text-tinta">{o.titulo}</h3>
            <p className="text-[0.84rem] text-sec">{nomeTri(o.trimestre)}{o.libraryItemId ? " · Da biblioteca" : ""}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Botao tamanho="mini" variante="secundario" onClick={() => setEditando(true)}>Editar objetivo</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setExcluir(true)}>Excluir objetivo</Botao>
          </div>
        </div>
      )}
      {excluir && (
        <div role="alertdialog" aria-labelledby={`${id}-x`} className="flex flex-col gap-3 rounded-cartao border border-alerta bg-white p-4">
          <p id={`${id}-x`} className="font-bold text-tinta">{pergunta}</p>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" variante="perigo" disabled={enviando} onClick={() => rodar(() => excluirObjetivo(o.id))}>Excluir de vez</Botao>
            <Botao ref={cancelar} tamanho="mini" variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Botao>
          </div>
        </div>
      )}
      <Erro t={erro} />
      <Lista titulo="Tático" itens={o.taticas} />
      <Lista titulo="Operacional" itens={o.operacionais} />
      <Lista titulo="Sem trimestre" itens={o.semTrimestre} />
      {o.okrs.map((k) => (
        <div key={k.id}>
          <h4 className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">OKR · {nomeTri(k.trimestre)}</h4>
          <ul className="mt-1 flex flex-col gap-1">{k.krs.map((r) => (
            <li key={r.id} className="text-tinta">{r.descricao}{r.alvo === null && <span className="ml-2 text-[0.84rem] text-sec">(sem meta numérica)</span>}</li>
          ))}</ul>
        </div>
      ))}
      {o.kpis.length > 0 && (
        <div>
          <h4 className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">KPI</h4>
          <ul className="mt-1 flex flex-col gap-1">{o.kpis.map((k) => <li key={k.id} className="text-tinta">{k.nome}</li>)}</ul>
        </div>
      )}
      <NovaAcao objectiveId={o.id} trimestrePadrao={trimestrePadrao} />
    </article>
  );
}
