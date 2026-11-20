// Provisória (Task 6): a Visão geral completa chega na Task 10.
import { exigirSessao } from "@/lib/data/sessao";
import { sair } from "@/lib/data/conta";
import { Botao } from "@/components/ui/Botao";

export default async function VisaoGeral() {
  const s = await exigirSessao();
  return (
    <main className="escuro min-h-screen px-5 py-10">
      <h1 className="text-3xl">Olá, {s.nome.split(" ")[0]}</h1>
      <form action={sair} className="mt-6"><Botao type="submit" sobreEscuro variante="secundario">Sair</Botao></form>
    </main>
  );
}
