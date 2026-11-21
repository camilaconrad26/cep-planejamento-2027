"use client";
import { useId, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { BarraProgresso } from "@/components/resultados/BarraProgresso";
import { FormKr } from "@/components/resultados/FormKr";
import { lerNumero } from "@/components/resultados/util";
import { excluirKr, lancarValorKr } from "@/lib/data/resultadosAcoes";
import { atingido, formatarNumero, progressoKR, type KR } from "@/lib/domain/resultados";

/** Um resultado-chave: valores, progresso e lançamento rápido do valor atual. */
export function KrLinha({ kr }: { kr: KR }) {
  const [valor, setValor] = useState("");
  const [editando, setEditando] = useState(false);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const p = progressoKR(kr);
  if (editando) return <li className="py-3"><FormKr okrId={kr.okrId} kr={kr} onFechar={() => setEditando(false)} /></li>;
  return (
    <li className="flex flex-col gap-2 border-t border-linha py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-bold text-tinta">{kr.descricao}</p>
        {p === null ? <span className="text-[0.84rem] text-sec">sem meta numérica</span>
          : atingido(kr) && <span className="inline-flex items-center gap-1 rounded-full border border-ok px-2 py-0.5 text-[0.75rem] font-bold text-ok"><svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Atingido</span>}
      </div>
      <p className="text-[0.88rem] text-sec">
        Inicial {formatarNumero(kr.inicial ?? (kr.alvo !== null ? 0 : null), kr.unidade)} · Atual <b className="text-tinta">{formatarNumero(kr.atual, kr.unidade)}</b> · Alvo {formatarNumero(kr.alvo, kr.unidade)}
      </p>
      {p !== null && <BarraProgresso valor={p} rotulo={`Progresso de ${kr.descricao}`} />}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-v`} className="sr-only">Valor atual de {kr.descricao}</label>
        <input id={`${id}-v`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Novo valor" className="campo min-h-[38px] w-32 py-1 text-right" />
        <Botao tamanho="mini" disabled={enviando || !valor.trim()} onClick={async () => { const r = await rodar(() => lancarValorKr(kr.id, lerNumero(valor))); if (r?.ok) setValor(""); }}>Lançar</Botao>
        <Botao tamanho="mini" variante="secundario" aria-label={`Editar: ${kr.descricao}`} onClick={() => setEditando(true)}>Editar</Botao>
        <Botao tamanho="mini" variante="secundario" aria-label={`Excluir: ${kr.descricao}`} disabled={enviando} onClick={() => rodar(() => excluirKr(kr.id))}>Excluir</Botao>
      </div>
      <Erro t={erro} />
    </li>
  );
}
