import type { Metadata } from "next";
import Link from "next/link";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Fechamento } from "@/components/diagnostico/Fechamento";
import { exigirSessao } from "@/lib/data/sessao";
import { obterDiagnostico } from "@/lib/data/diagnostico";
import { lerFechamento } from "@/lib/domain/fechamento";

export const metadata: Metadata = { title: "Fechamento de 2026" };

export default async function PaginaFechamento() {
  const s = await exigirSessao();
  const d = await obterDiagnostico(s.orgId);
  return (
    <>
      <FaixaTitulo olho="Etapa 1 · Meu diagnóstico" titulo="Fechamento de 2026"
        descricao="Antes de definir 2027, feche 2026 com sinceridade. O que você registrar aqui alimenta as prioridades e vira tarefa quando pedir ação." />
      <Corpo>
        <Fechamento inicial={lerFechamento(d?.fechamento)} />
        <div className="flex flex-wrap gap-3 border-t-[1.5px] border-ouro-fio pt-6">
          <Link href="/diagnostico" className="inline-flex min-h-[48px] items-center rounded-full border-[1.5px] border-ouro-fio px-6 font-bold text-ouro-texto hover:bg-papel-2">Voltar ao diagnóstico</Link>
        </div>
      </Corpo>
    </>
  );
}
