"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Botao } from "@/components/ui/Botao";

/** Erro inesperado em uma página interna: explica, oferece tentar de novo e não expõe detalhes técnicos. */
export default function ErroInterno({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-5 py-14">
      <h1 tabIndex={-1} className="text-[1.9rem]">Algo não funcionou</h1>
      <p>Não foi possível concluir esta ação. Verifique a conexão e tente de novo. O que você já tinha salvo continua guardado.</p>
      {error.digest && <p className="text-sm text-sec">Código para a mentora: {error.digest}</p>}
      <div className="flex flex-wrap gap-3">
        <Botao onClick={() => reset()}>Tentar de novo</Botao>
        <Link href="/visao-geral" className="inline-flex min-h-[48px] items-center rounded-full border-[1.5px] border-ouro-fio px-6 font-bold text-ouro-texto hover:bg-papel-2">Ir para a Visão geral</Link>
      </div>
    </div>
  );
}
