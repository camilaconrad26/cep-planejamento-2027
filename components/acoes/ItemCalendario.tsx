"use client";
import { useState } from "react";
import { EditarAcao } from "@/components/acoes/EditarAcao";
import { estaAtrasada } from "@/lib/domain/ciclo";
import type { Acao } from "@/lib/domain/acoes";

/** Ação no calendário: toque abre a edição logo abaixo. */
export function ItemCalendario({ acao, hoje }: { acao: Acao; hoje: string }) {
  const [aberto, setAberto] = useState(false);
  const atrasada = estaAtrasada(acao, hoje);
  return (
    <li className="min-w-0">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)}
        className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[0.8rem] font-bold ${acao.status === "concluido" ? "border-linha text-sec line-through" : atrasada ? "border-alerta text-alerta" : "border-ouro-fio text-tinta"} bg-white hover:bg-papel-2`}>
        {acao.titulo}{atrasada && <span className="sr-only"> (atrasada)</span>}
      </button>
      {aberto && <div className="mt-1"><EditarAcao acao={acao} onFechar={() => setAberto(false)} /></div>}
    </li>
  );
}
