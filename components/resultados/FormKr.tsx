"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { criarKr, editarKr } from "@/lib/data/resultadosAcoes";
import type { KR } from "@/lib/domain/resultados";
import { lerNumero } from "@/components/resultados/util";

const v = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

/** Criar ou editar um resultado-chave. */
export function FormKr({ okrId, kr, onFechar }: { okrId: string; kr?: KR; onFechar: () => void }) {
  const [d, setD] = useState({ descricao: kr?.descricao ?? "", unidade: kr?.unidade ?? "", inicial: v(kr?.inicial ?? null), alvo: v(kr?.alvo ?? null), atual: v(kr?.atual ?? null), prazo: kr?.prazo ?? "" });
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const campo = "flex min-w-0 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";
  const muda = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const dados = { descricao: d.descricao, unidade: d.unidade, inicial: lerNumero(d.inicial), alvo: lerNumero(d.alvo), atual: lerNumero(d.atual), prazo: d.prazo || null };
    const r = await rodar(() => (kr ? editarKr(kr.id, dados) : criarKr(okrId, dados)));
    if (r?.ok) onFechar();
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      <label htmlFor={`${id}-d`} className={campo}>Descrição
        <input id={`${id}-d`} value={d.descricao} onChange={muda("descricao")} maxLength={1000} required autoFocus className="campo font-normal" placeholder="Ex.: fechar 10 contratos de holding" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label htmlFor={`${id}-u`} className={campo}>Unidade<input id={`${id}-u`} value={d.unidade} onChange={muda("unidade")} maxLength={40} placeholder="contratos, %, R$" className="campo font-normal" /></label>
        <label htmlFor={`${id}-i`} className={campo}>Valor inicial<input id={`${id}-i`} inputMode="decimal" value={d.inicial} onChange={muda("inicial")} className="campo text-right font-normal" /></label>
        <label htmlFor={`${id}-a`} className={campo}>Alvo<input id={`${id}-a`} inputMode="decimal" value={d.alvo} onChange={muda("alvo")} className="campo text-right font-normal" /></label>
        <label htmlFor={`${id}-t`} className={campo}>Valor atual<input id={`${id}-t`} inputMode="decimal" value={d.atual} onChange={muda("atual")} className="campo text-right font-normal" /></label>
        <label htmlFor={`${id}-p`} className={campo}>Prazo<input id={`${id}-p`} type="date" value={d.prazo} onChange={muda("prazo")} className="campo font-normal" /></label>
      </div>
      <p className="text-[0.85rem] text-sec">Sem alvo, o resultado-chave fica como “sem meta numérica” e não entra no cálculo.</p>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando || !d.descricao.trim()}>{kr ? "Salvar resultado-chave" : "Criar resultado-chave"}</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={onFechar}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </form>
  );
}
