import { redirect } from "next/navigation";
import { exigirSessao } from "@/lib/data/sessao";
import { obterDiagnostico } from "@/lib/data/diagnostico";
import { PERGUNTAS } from "@/lib/domain/diagnostico";
import { primeiraSemResposta } from "@/lib/domain/perfis";

export default async function Diagnostico() {
  const s = await exigirSessao();
  const d = await obterDiagnostico(s.orgId);
  if (d?.concluidoEm) redirect("/diagnostico/resumo");
  redirect(`/diagnostico/${primeiraSemResposta(d?.respostas ?? {}, PERGUNTAS.map((p) => p.chave)) ?? PERGUNTAS.length}`);
}
