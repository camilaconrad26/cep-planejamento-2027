"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAviso } from "@/components/ui/Aviso";

type R = { ok?: string; erro?: string; confirmar?: boolean };
const SESSAO = "Sua sessão expirou. Copie o que escreveu e entre de novo.";

/** Executa uma ação do servidor, uma por vez; mostra o resultado no aviso e o erro junto ao formulário. */
export function useAcao() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const trava = useRef(false);
  const aviso = useAviso();
  const router = useRouter();
  async function rodar(f: () => Promise<R>): Promise<R | null> {
    if (trava.current) return null;
    trava.current = true; setEnviando(true); setErro("");
    try {
      const r = await f();
      if (r.erro) { setErro(r.erro === "sessao" ? SESSAO : r.erro); return r; }
      if (r.ok) { aviso({ texto: r.ok }); router.refresh(); }
      return r;
    } catch {
      setErro(typeof navigator !== "undefined" && navigator.onLine === false ? "Sem conexão. Verifique a internet e tente de novo." : "Não foi possível salvar. Tente de novo.");
      return null;
    } finally { trava.current = false; setEnviando(false); }
  }
  return { enviando, erro, rodar, limparErro: () => setErro("") };
}

export const Erro = ({ t }: { t: string }) => (t ? <p role="alert" className="text-[0.9rem] font-bold text-alerta">{t}</p> : null);
