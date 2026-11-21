"use client";
import { useEffect, useRef, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { definirPrioridade, removerPrioridade } from "@/lib/data/planejamentoAcoes";
import { LIMITE_PRIORIDADES } from "@/lib/domain/prioridades";
import type { Categoria } from "@/lib/domain/biblioteca";

type Escolhida = { categoryId: string; excedente: boolean };

/** Prioridades do trimestre: até 3; a 4ª pede confirmação (o banco também exige). */
export function Prioridades({ trimestre, categorias, escolhidas }: { trimestre: number; categorias: Categoria[]; escolhidas: Escolhida[] }) {
  const { enviando, erro, rodar } = useAcao();
  const [confirmar, setConfirmar] = useState<Categoria | null>(null);
  const botaoSim = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirmar) botaoSim.current?.focus(); }, [confirmar]);
  const tem = (id: string) => escolhidas.find((e) => e.categoryId === id);

  async function alternar(c: Categoria) {
    if (tem(c.id)) { await rodar(() => removerPrioridade(trimestre, c.id)); return; }
    const r = await rodar(() => definirPrioridade(trimestre, c.id, false));
    if (r?.confirmar) setConfirmar(c);
  }
  async function confirmarMesmo() {
    const c = confirmar; if (!c) return;
    setConfirmar(null);
    await rodar(() => definirPrioridade(trimestre, c.id, true));
  }

  return (
    <section aria-labelledby={`prio-${trimestre}`} className="flex flex-col gap-3 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`prio-${trimestre}`} className="font-display text-xl font-bold text-tinta">Prioridades do {trimestre}º trimestre</h2>
        <span className={`font-bold ${escolhidas.length > LIMITE_PRIORIDADES ? "text-alerta" : "text-ouro-texto"}`}>{escolhidas.length} de {LIMITE_PRIORIDADES}</span>
      </div>
      <p className="text-sec">Escolha até três categorias para concentrar o esforço neste trimestre.</p>
      <ul className="flex flex-wrap gap-2">
        {categorias.map((c) => {
          const e = tem(c.id);
          return (
            <li key={c.id} className="flex items-center gap-1.5">
              <button type="button" aria-pressed={!!e} disabled={enviando} onClick={() => alternar(c)}
                className={`min-h-[44px] rounded-full border-[1.5px] px-4 py-1.5 text-[0.92rem] font-bold transition-colors disabled:opacity-60 ${e ? "border-ouro-texto bg-ouro-texto text-white" : "border-ouro-fio bg-white text-tinta hover:bg-papel-2"}`}>
                {c.nome}
              </button>
              {e?.excedente && <span className="rounded-full border border-alerta px-2 py-0.5 text-[0.75rem] font-bold text-alerta">Acima do recomendado</span>}
            </li>
          );
        })}
      </ul>
      {confirmar && (
        <div role="alertdialog" aria-labelledby="prio-confirma" aria-describedby="prio-confirma" className="flex flex-col gap-3 rounded-cartao border border-alerta bg-papel-2 p-4">
          <p id="prio-confirma" className="font-bold text-tinta">Mais de três prioridades dispersam o esforço do trimestre. Adicionar mesmo assim?</p>
          <div className="flex flex-wrap gap-2">
            <Botao ref={botaoSim} tamanho="mini" onClick={confirmarMesmo}>Adicionar mesmo assim</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setConfirmar(null)}>Cancelar</Botao>
          </div>
        </div>
      )}
      <Erro t={erro} />
    </section>
  );
}
