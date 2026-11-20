import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Rótulo pequeno em caixa alta que antecede títulos, como no site do CEP. */
export function Olho({ children, sobreEscuro }: { children: ReactNode; sobreEscuro?: boolean }) {
  return (
    <p className={cx("m-0 text-[0.72rem] font-bold uppercase leading-tight tracking-olho", sobreEscuro ? "text-ouro" : "text-ouro-texto")}>
      {children}
    </p>
  );
}
