"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { adicionarAoPlano } from "@/lib/data/bibliotecaAcoes";

/** Escolha do trimestre + "Adicionar ao meu plano". Um envio por vez (clique duplo não duplica). */
/** semTrimestre: KPI não tem trimestre (vale para o ciclo); o objetivo que entra junto usa o trimestre atual. */
export function Adicionar({ itemId, texto, trimestrePadrao, semTrimestre = false }: { itemId: string; texto: string; trimestrePadrao: 1 | 2 | 3 | 4; semTrimestre?: boolean }) {
  const [tri, setTri] = useState<number>(trimestrePadrao);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const trava = useRef(false);
  const aviso = useAviso();
  const router = useRouter();

  async function enviar() {
    if (trava.current) return;
    trava.current = true; setEnviando(true); setErro("");
    try {
      const r = await adicionarAoPlano(itemId, tri);
      if (r.erro) setErro(r.erro);
      else { aviso({ texto: r.ok ?? "Adicionado." }); router.refresh(); }
    } catch {
      setErro(navigator.onLine === false ? "Sem conexão. Verifique a internet e tente de novo." : "Não foi possível adicionar. Tente de novo.");
    } finally { trava.current = false; setEnviando(false); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {!semTrimestre && <select aria-label={`Trimestre para: ${texto}`} value={tri} onChange={(e) => setTri(Number(e.target.value))} disabled={enviando}
          className="campo min-h-[38px] w-auto py-1 text-[0.9rem]">
          {[1, 2, 3, 4].map((t) => <option key={t} value={t}>{t}º trimestre</option>)}
        </select>}
        <Botao tamanho="mini" onClick={enviar} disabled={enviando}>{enviando ? "Adicionando…" : "Adicionar ao meu plano"}</Botao>
      </div>
      {erro && <p role="alert" className="text-[0.9rem] font-bold text-alerta">{erro}</p>}
    </div>
  );
}
