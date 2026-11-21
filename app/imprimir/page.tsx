import type { Metadata } from "next";
import Link from "next/link";
import { RelatorioPlano } from "@/components/relatorio/RelatorioPlano";
import { BotaoImprimir } from "@/components/relatorio/BotaoImprimir";
import { exigirSessao } from "@/lib/data/sessao";

export const metadata: Metadata = { title: "Plano para impressão" };
export const dynamic = "force-dynamic";

/** Página própria para imprimir ou salvar em PDF pelo navegador (sem menu). */
export default async function Imprimir() {
  const s = await exigirSessao();
  return (
    <main className="mx-auto max-w-[880px] bg-white px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <div data-nao-imprimir className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <BotaoImprimir />
        <Link href="/configuracoes" className="text-ouro-texto underline underline-offset-4">Voltar</Link>
        <p className="w-full text-[0.88rem] text-sec">Na janela de impressão, escolha “Salvar como PDF” para guardar o arquivo.</p>
      </div>
      <RelatorioPlano orgId={s.orgId} userId={s.userId} />
    </main>
  );
}
