import Link from "next/link";
import { Selo } from "@/components/ui/Selo";

export default function NaoEncontrada() {
  return (
    <main className="escuro flex min-h-screen flex-col items-center justify-center gap-5 px-5 py-12 text-center">
      <Selo tamanho="grande" />
      <h1 className="text-3xl">Página não encontrada</h1>
      <p className="max-w-[46ch]">O endereço pode ter mudado ou esta parte do sistema ainda está em construção.</p>
      <Link href="/visao-geral" className="inline-flex min-h-[50px] items-center rounded-full bg-ouro px-7 font-bold text-noite hover:bg-creme">Ir para a Visão geral</Link>
    </main>
  );
}
