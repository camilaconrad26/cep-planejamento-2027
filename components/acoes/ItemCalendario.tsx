"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { EditarAcao } from "@/components/acoes/EditarAcao";
import { estaAtrasada } from "@/lib/domain/ciclo";
import type { Acao } from "@/lib/domain/acoes";

type Ctx = { aberta: Acao | null; abrir: (a: Acao | null) => void };
const Edicao = createContext<Ctx>({ aberta: null, abrir: () => {} });

/** Guarda qual ação do calendário está em edição; o formulário abre fora da grade, em largura cheia. */
export function ProvedorEdicaoCalendario({ children }: { children: ReactNode }) {
  const [aberta, abrir] = useState<Acao | null>(null);
  return <Edicao.Provider value={{ aberta, abrir }}>{children}</Edicao.Provider>;
}

export function PainelEdicaoCalendario() {
  const { aberta, abrir } = useContext(Edicao);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (aberta) { ref.current?.scrollIntoView({ block: "nearest" }); ref.current?.querySelector("input")?.focus(); } }, [aberta]);
  if (!aberta) return null;
  return <div ref={ref}><EditarAcao key={aberta.id} acao={aberta} onFechar={() => abrir(null)} /></div>;
}

export function ItemCalendario({ acao, hoje }: { acao: Acao; hoje: string }) {
  const { aberta, abrir } = useContext(Edicao);
  const atrasada = estaAtrasada(acao, hoje);
  return (
    <li className="min-w-0">
      <button type="button" aria-expanded={aberta?.id === acao.id} onClick={() => abrir(aberta?.id === acao.id ? null : acao)}
        className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[0.8rem] font-bold ${acao.status === "concluido" ? "border-linha text-sec line-through" : atrasada ? "border-alerta text-alerta" : "border-ouro-fio text-tinta"} bg-white hover:bg-papel-2`}>
        {acao.titulo}{atrasada && <span className="sr-only"> (atrasada)</span>}
      </button>
    </li>
  );
}
