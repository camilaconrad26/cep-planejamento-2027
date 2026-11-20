import type { ReactNode } from "react";
import { nomeNivel, type ItemBiblioteca } from "@/lib/domain/biblioteca";

/** Linha de um item da biblioteca: nível, texto original e a ação ao lado. */
export function ItemCartao({ item, children }: { item: ItemBiblioteca; children: ReactNode }) {
  const estr = item.nivel === "estrategico";
  return (
    <li className={`flex flex-col gap-3 border-t border-linha py-4 first:border-t-0 sm:flex-row sm:items-start sm:justify-between ${estr ? "" : "sm:pl-5"}`}>
      <div className="min-w-0 flex-1">
        <span className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">{nomeNivel(item.nivel)}</span>
        <p className={`mt-1 ${estr ? "font-display text-[1.08rem] font-bold text-tinta" : "text-tinta"}`}>{item.texto}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
