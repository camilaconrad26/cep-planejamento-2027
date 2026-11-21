"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { SeletorTrimestre } from "@/components/planejamento/campos";
import { criarObjetivo } from "@/lib/data/planejamentoAcoes";
import type { Categoria } from "@/lib/domain/biblioteca";

/** "Novo objetivo" numa categoria; sem categoryId, pede a categoria (para começar em qualquer uma). */
export function NovoObjetivo({ categoryId, categorias, trimestrePadrao }: { categoryId?: string; categorias?: Categoria[]; trimestrePadrao: number | null }) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tri, setTri] = useState<number | null>(trimestrePadrao);
  const [cat, setCat] = useState(categoryId ?? categorias?.[0]?.id ?? "");
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await rodar(() => criarObjetivo({ categoryId: cat, titulo, trimestre: tri }));
    if (r?.ok) { setTitulo(""); setAberto(false); }
  }
  if (!aberto) return <div><Botao variante="secundario" tamanho="mini" onClick={() => setAberto(true)}>{categoryId ? "Novo objetivo" : "Novo objetivo em outra categoria"}</Botao></div>;
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      {!categoryId && (
        <label className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">Categoria
          <select aria-label="Categoria do objetivo" value={cat} onChange={(e) => setCat(e.target.value)} className="campo font-normal">
            {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select></label>
      )}
      <label htmlFor={`${id}-t`} className="flex flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">Objetivo
        <input id={`${id}-t`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={1000} required autoFocus className="campo font-normal" placeholder="Ex.: fechar 10 contratos de holding" /></label>
      <SeletorTrimestre id={`${id}-q`} rotulo="Trimestre do objetivo" valor={tri} onChange={setTri} />
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando || !titulo.trim()}>{enviando ? "Criando…" : "Criar objetivo"}</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={() => setAberto(false)}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </form>
  );
}
