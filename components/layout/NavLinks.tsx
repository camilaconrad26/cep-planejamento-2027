"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/layout/Icone";
import type { ItemMenu } from "@/components/layout/itensMenu";
import { cx } from "@/lib/cx";

export function NavLinks({ itens, aoNavegar }: { itens: ItemMenu[]; aoNavegar?: () => void }) {
  const atual = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {itens.map((i) => {
        const ativo = atual === i.rota || atual.startsWith(i.rota + "/");
        return (
          <li key={i.rota}>
            <Link href={i.rota} onClick={aoNavegar} aria-current={ativo ? "page" : undefined}
              className={cx("flex min-h-[46px] items-center gap-3 rounded-full px-4 text-[0.97rem] transition-colors",
                ativo ? "bg-ouro/15 font-bold text-creme" : "text-cinza-claro hover:bg-white/5 hover:text-creme")}>
              <span className={ativo ? "text-ouro" : "text-cinza"}><Icone nome={i.icone} /></span>{i.rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
