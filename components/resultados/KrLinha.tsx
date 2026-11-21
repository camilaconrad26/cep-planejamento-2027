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
  const [excluir, setExcluir] = useState(false);
  const [aviso, setAviso] = useState("");
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const p = progressoKR(kr);
  if (editando) return <li className="py-3"><FormKr okrId={kr.okrId} kr={kr} onFechar={() => setEditando(false)} /></li>;
  return (
    <li className="flex flex-col gap-2 border-t border-linha py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-bold text-tinta">{kr.descricao}</p>
        {p === null ? <span className="text-[0.84rem] text-sec">{kr.alvo !== null && kr.inicial === null ? "informe o valor inicial" : "sem meta numérica"}</span>
          : atingido(kr) && <span className="inline-flex items-center gap-1 rounded-full border border-ok px-2 py-0.5 text-[0.75rem] font-bold text-ok"><svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Atingido</span>}
      </div>
      <p className="text-[0.88rem] text-sec">
        Inicial {formatarNumero(kr.inicial, kr.unidade)} · Atual <b className="text-tinta">{formatarNumero(kr.atual, kr.unidade)}</b> · Alvo {formatarNumero(kr.alvo, kr.unidade)}
      </p>
      {p !== null && <BarraProgresso valor={p} rotulo={`Progresso de ${kr.descricao}`} />}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-v`} className="sr-only">Valor atual de {kr.descricao}</label>
        <input id={`${id}-v`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Novo valor" className="campo min-h-[38px] w-32 py-1 text-right" />
        <Botao tamanho="mini" disabled={enviando || !valor.trim()} onClick={async () => {
          setAviso("");
          const n = lerNumero(valor);
          if (n === undefined) { setAviso("Use só números."); return; }
          const r = await rodar(() => lancarValorKr(kr.id, n)); if (r?.ok) setValor("");
        }}>Lançar</Botao>
        <Botao tamanho="mini" variante="secundario" aria-label={`Editar: ${kr.descricao}`} onClick={() => setEditando(true)}>Editar</Botao>
        <Botao tamanho="mini" variante="secundario" aria-label={`Excluir: ${kr.descricao}`} disabled={enviando} onClick={() => setExcluir(true)}>Excluir</Botao>
      </div>
      {excluir && (
        <div role="alertdialog" aria-labelledby={`${id}-x`} className="flex flex-col gap-2 rounded-cartao border border-alerta bg-white p-3">
          <p id={`${id}-x`} className="font-bold text-tinta">Excluir este resultado-chave?</p>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" variante="perigo" disabled={enviando} onClick={() => rodar(() => excluirKr(kr.id))}>Excluir de vez</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Botao>
          </div>
        </div>
      )}
      <Erro t={aviso || erro} />
    </li>
  );
}
