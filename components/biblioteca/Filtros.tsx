"use client";
import Link from "next/link";
import { useRef } from "react";
import { Botao } from "@/components/ui/Botao";
import { NIVEIS, type Categoria, type Filtros as F } from "@/lib/domain/biblioteca";
import { PERFIS } from "@/lib/domain/perfis";

/** Filtros pela URL (GET): mudam ao escolher; o botão "Filtrar" serve a quem navega por teclado. */
export function Filtros({ f, categorias, base, comNivel = true }: { f: F; categorias: Categoria[]; base: string; comNivel?: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const enviar = () => form.current?.requestSubmit();
  const campo = "flex min-w-0 flex-1 basis-48 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";
  return (
    <form ref={form} method="get" action={base} className="flex flex-wrap items-end gap-3 rounded-cartao border border-linha bg-white px-5 py-4">
      <label className={campo}>Perfil
        <select name="perfil" aria-label="Perfil" defaultValue={f.perfil} onChange={enviar} className="campo font-normal">
          {PERFIS.map((p) => <option key={p.n} value={p.n}>{p.nome}</option>)}
        </select>
      </label>
      <label className={campo}>Categoria
        <select name="categoria" aria-label="Categoria" defaultValue={f.categoria ?? ""} onChange={enviar} className="campo font-normal">
          <option value="">Todas</option>
          {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
      </label>
      {comNivel && (
        <label className={campo}>Nível
          <select name="nivel" aria-label="Nível" defaultValue={f.nivel ?? ""} onChange={enviar} className="campo font-normal">
            <option value="">Todos</option>
            {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.nome}</option>)}
          </select>
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" variante="secundario" tamanho="mini">Filtrar</Botao>
        <Link href={base} className="py-1.5 text-ouro-texto underline underline-offset-4 hover:text-tinta">Limpar filtros</Link>
      </div>
    </form>
  );
}
