import Link from "next/link";
import { ROTULO_VISAO, VISOES, type Visao } from "@/lib/domain/arvore";

/** Escolha do período: ano, semestres e trimestres. */
export function Visoes({ atual }: { atual: Visao }) {
  return (
    <nav aria-label="Período">
      <ul className="flex flex-wrap gap-2">
        {VISOES.map((v) => (
          <li key={v}>
            <Link href={`/planejamento?visao=${v}`} aria-current={v === atual ? "page" : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-full border-[1.5px] px-4 text-[0.9rem] font-bold ${v === atual ? "border-ouro bg-ouro text-noite" : "border-ouro-fio text-creme hover:border-creme"}`}>
              {ROTULO_VISAO[v]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
