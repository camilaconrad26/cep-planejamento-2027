import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Pergunta } from "@/components/diagnostico/Pergunta";
import { Progresso } from "@/components/diagnostico/Progresso";
import { exigirSessao } from "@/lib/data/sessao";
import { obterDiagnostico, salvarResposta } from "@/lib/data/diagnostico";
import { PERGUNTAS } from "@/lib/domain/diagnostico";

export const metadata: Metadata = { title: "Meu diagnóstico" };

export default async function Passo({ params }: { params: Promise<{ passo: string }> }) {
  const n = Number((await params).passo);
  if (!Number.isInteger(n) || n < 1 || n > PERGUNTAS.length) redirect("/diagnostico/1");
  const s = await exigirSessao();
  const d = await obterDiagnostico(s.orgId);
  return (
    <>
      <FaixaTitulo olho="Etapa 1" titulo="Meu diagnóstico" descricao="Dez perguntas rápidas sobre o seu escritório. Você pode pular qualquer uma e voltar depois.">
        <div className="mt-2 max-w-md"><Progresso passo={n} total={PERGUNTAS.length} /></div>
      </FaixaTitulo>
      <Corpo>
        <Pergunta key={n} p={PERGUNTAS[n - 1]} passo={n} total={PERGUNTAS.length} respostas={d?.respostas ?? {}} acao={salvarResposta.bind(null, n)} />
      </Corpo>
    </>
  );
}
