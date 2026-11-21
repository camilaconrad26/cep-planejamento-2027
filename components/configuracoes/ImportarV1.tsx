"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { importarV1 } from "@/lib/data/importarV1";

export function ImportarV1() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const aviso = useAviso();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sec">Encontramos o planejamento que você preencheu na versão anterior. Traga para cá o fechamento de 2026, os itens marcados, as tarefas, as metas e os trimestres. Isso é feito uma vez só.</p>
      <div><Botao disabled={enviando} onClick={async () => {
        setEnviando(true); setErro("");
        try { const r = await importarV1(); if (r.erro) setErro(r.erro); else { aviso({ texto: r.ok! }); router.refresh(); } }
        catch { setErro("Não foi possível importar agora. Tente de novo."); } finally { setEnviando(false); }
      }}>{enviando ? "Importando…" : "Importar meu planejamento"}</Botao></div>
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
    </div>
  );
}
