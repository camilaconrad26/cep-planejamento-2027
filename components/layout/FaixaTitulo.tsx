import type { ReactNode } from "react";
import { Olho } from "@/components/ui/Olho";

/** Faixa escura de título da página, como as seções do site do CEP. */
export function FaixaTitulo({ olho, titulo, descricao, children }: { olho: string; titulo: ReactNode; descricao?: ReactNode; children?: ReactNode }) {
  return (
    <header className="escuro border-b border-linha-escura">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-5 py-9 lg:px-8 lg:py-11">
        <Olho sobreEscuro>{olho}</Olho>
        <h1 className="text-[1.85rem] leading-tight lg:text-[2.3rem] focus:outline-none">{titulo}</h1>
        {descricao && <p className="max-w-[62ch] text-[1.1rem] text-cinza-claro">{descricao}</p>}
        {children}
      </div>
    </header>
  );
}

export const Corpo = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-5 pb-12 pt-8 lg:px-8">{children}</div>
);
