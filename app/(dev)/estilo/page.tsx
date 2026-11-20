import { notFound } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Olho } from "@/components/ui/Olho";
import { Selo } from "@/components/ui/Selo";

export default function Estilo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main>
      <div className="escuro flex flex-wrap items-center gap-4 px-5 py-8">
        <Selo tamanho="grande" />
        <div><Olho sobreEscuro>Vitrine</Olho><h1 className="text-4xl">Componentes do CEP</h1></div>
        <Botao sobreEscuro>Primário</Botao><Botao sobreEscuro variante="secundario">Secundário</Botao>
      </div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
        <Cartao titulo="Cartão">
          <Campo rotulo="Campo" ajuda="Texto de ajuda"><input className="campo" /></Campo>
          <div className="flex flex-wrap gap-3"><Botao>Primário</Botao><Botao variante="secundario">Secundário</Botao><Botao variante="perigo">Perigo</Botao><Botao tamanho="mini">Mini</Botao></div>
        </Cartao>
      </div>
    </main>
  );
}
