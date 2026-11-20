import { MenuLateral } from "@/components/layout/MenuLateral";
import { Topo } from "@/components/layout/Topo";
import { itensMenu } from "@/components/layout/itensMenu";
import { exigirSessao } from "@/lib/data/sessao";
import { ROTAS_CONSTRUIDAS } from "@/lib/domain/rotas";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const s = await exigirSessao();
  const itens = itensMenu(s.papeis, ROTAS_CONSTRUIDAS);
  return (
    <>
      <a href="#conteudo" className="pular">Pular para o conteúdo</a>
      <div className="flex min-h-screen">
        <MenuLateral itens={itens} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topo nome={s.nome} itens={itens} />
          <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
          <footer className="border-t border-linha-escura bg-noite">
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 px-5 py-5 text-sm text-cinza lg:px-8">
              <span>CEP · Clube da Estratégia Patrimonial</span><span>Planejamento Estratégico 2027</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
