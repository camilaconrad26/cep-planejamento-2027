"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { SeletorTrimestre } from "@/components/planejamento/campos";
import { atualizarAcao } from "@/lib/data/acoesAcoes";
import { PRIORIDADES, STATUS_LISTA, type Acao, type Prioridade } from "@/lib/domain/acoes";
import type { Status } from "@/lib/domain/ciclo";

/** Formulário completo de uma ação: título, responsável, prioridade, status, datas e trimestre. */
export function EditarAcao({ acao, onFechar }: { acao: Acao; onFechar?: () => void }) {
  const [titulo, setTitulo] = useState(acao.titulo);
  const [responsavel, setResponsavel] = useState(acao.responsavel);
  const [prioridade, setPrioridade] = useState<Prioridade>(acao.prioridade);
  const [status, setStatus] = useState<Status>(acao.status);
  const [inicio, setInicio] = useState(acao.inicio ?? "");
  const [prazo, setPrazo] = useState(acao.prazo ?? "");
  const [tri, setTri] = useState<number | null>(acao.trimestre);
  const [aviso, setAviso] = useState("");
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const campo = "flex min-w-0 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setAviso("");
    if (inicio && prazo && prazo < inicio) { setAviso("O prazo não pode ser antes do início."); return; }
    if (!titulo.trim()) { setAviso("A ação não pode ficar vazia."); return; }
    const r = await rodar(() => atualizarAcao(acao.id, { titulo, responsavel, prioridade, status, inicio: inicio || null, prazo: prazo || null, trimestre: tri }));
    if (r?.ok) onFechar?.();
  }

  return (
    <form aria-label={`Editar ação: ${acao.titulo}`} onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      <label htmlFor={`${id}-t`} className={campo}>Título da ação
        <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} className="campo font-normal" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label htmlFor={`${id}-r`} className={campo}>Responsável
          <input id={`${id}-r`} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={120} placeholder="Nome" className="campo font-normal" /></label>
        <label htmlFor={`${id}-p`} className={campo}>Prioridade
          <select id={`${id}-p`} value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)} className="campo font-normal">
            {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>{p.nome}</option>)}</select></label>
        <label htmlFor={`${id}-s`} className={campo}>Status
          <select id={`${id}-s`} value={status} onChange={(e) => setStatus(e.target.value as Status)} className="campo font-normal">
            {STATUS_LISTA.map((s) => <option key={s.valor} value={s.valor}>{s.nome}</option>)}</select></label>
        <label htmlFor={`${id}-i`} className={campo}>Início
          <input id={`${id}-i`} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="campo font-normal" /></label>
        <label htmlFor={`${id}-z`} className={campo}>Prazo
          <input id={`${id}-z`} type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="campo font-normal" /></label>
        <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre da ação" valor={tri} onChange={setTri} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando}>{enviando ? "Salvando…" : "Salvar ação"}</Botao>
        {onFechar && <Botao tamanho="mini" variante="secundario" onClick={onFechar}>Cancelar</Botao>}
      </div>
      <Erro t={aviso || erro} />
    </form>
  );
}
