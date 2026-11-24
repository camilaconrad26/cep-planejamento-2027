import Link from "next/link";
import type { Passo } from "@/lib/domain/proximoPasso";

export function ProximoPasso({ passo }: { passo: Passo }) {
  return (
    <section aria-labelledby="titulo-passo" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-cartao border border-ouro-fio bg-papel-2 p-6 shadow-[0_0_0_1px_#c9a24b] sm:p-7">
      <div className="flex min-w-0 flex-[999_1_340px] flex-col gap-2">
        <p id="titulo-passo" className="text-[0.72rem] font-bold uppercase tracking-olho text-ouro-texto">Seu próximo passo</p>
        <h2 className="font-display text-[1.6rem] font-bold leading-tight text-tinta">{passo.titulo}</h2>
        <p className="max-w-[60ch] text-texto">{passo.texto}</p>
      </div>
      <Link href={passo.href} className="inline-flex min-h-[50px] items-center rounded-full bg-ouro-texto px-7 font-bold text-white hover:bg-tinta">{passo.botao} →</Link>
    </section>
  );
}
