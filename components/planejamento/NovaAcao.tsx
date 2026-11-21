"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { SeletorTrimestre } from "@/components/planejamento/campos";
import { criarAcao } from "@/lib/data/planejamentoAcoes";

export function NovaAcao({ objectiveId, trimestrePadrao }: { objectiveId: string; trimestrePadrao: number | null }) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [nivel, setNivel] = useState<"tatico" | "operacional">("tatico");
  const [tri, setTri] = useState<number | null>(trimestrePadrao);
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await rodar(() => criarAcao({ objectiveId, nivel, titulo, trimestre: tri }));
    if (r?.ok) { setTitulo(""); setAberto(false); }
  }
  if (!aberto) return <div><Botao variante="secundario" tamanho="mini" onClick={() => setAberto(true)}>Nova ação</Botao></div>;
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      <label htmlFor={`${id}-t`} className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">Ação
        <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} required autoFocus className="campo font-normal" placeholder="Ex.: mapear o funil de indicações" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${id}-n`} className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">Nível
          <select id={`${id}-n`} aria-label="Nível da ação" value={nivel} onChange={(e) => setNivel(e.target.value as "tatico" | "operacional")} className="campo font-normal">
            <option value="tatico">Tático</option><option value="operacional">Operacional</option>
          </select></label>
        <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre da ação" valor={tri} onChange={setTri} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando || !titulo.trim()}>{enviando ? "Criando…" : "Criar ação"}</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={() => setAberto(false)}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </form>
  );
}
