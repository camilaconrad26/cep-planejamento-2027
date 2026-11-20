import { NavLinks } from "@/components/layout/NavLinks";
import type { ItemMenu } from "@/components/layout/itensMenu";
import { Selo } from "@/components/ui/Selo";

export function MenuLateral({ itens }: { itens: ItemMenu[] }) {
  return (
    <div className="hidden w-[272px] shrink-0 border-r border-linha-escura bg-noite lg:block">
    <aside className="escuro sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <Selo />
        <div><p className="font-display text-lg font-bold leading-none tracking-wide text-creme">CEP</p>
          <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[.2em] text-ouro">Planejamento 2027</p></div>
      </div>
      <nav aria-label="Menu principal"><NavLinks itens={itens} /></nav>
    </aside>
    </div>
  );
}
