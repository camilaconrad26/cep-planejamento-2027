"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Aviso = { texto: string; desfazer?: () => void };
const Ctx = createContext<(a: Aviso) => void>(() => {});
export const useAviso = () => useContext(Ctx);

/** Aviso flutuante anunciado a leitores de tela, com "Desfazer" opcional por 10 s. */
export function ProvedorAviso({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mostrar = useCallback((a: Aviso) => {
    clearTimeout(t.current); setAviso(a);
    t.current = setTimeout(() => setAviso(null), a.desfazer ? 10_000 : 6_000);
  }, []);
  return (
    <Ctx.Provider value={mostrar}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 grid place-items-center px-4">
        {aviso && (
          <div className="escuro pointer-events-auto flex max-w-full items-center gap-4 rounded-cartao border border-linha-escura px-5 py-3 text-creme shadow-[0_8px_28px_rgba(0,0,0,.4)]">
            <span>{aviso.texto}</span>
            {aviso.desfazer && (
              <button type="button" onClick={() => { aviso.desfazer?.(); setAviso(null); }}
                className="min-h-[38px] rounded-full bg-ouro px-4 text-sm font-bold text-noite hover:bg-creme">Desfazer</button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
