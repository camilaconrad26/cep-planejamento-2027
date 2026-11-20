// Provisória (Tasks 6–7): a Visão geral completa chega na Task 10.
import { FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { exigirSessao } from "@/lib/data/sessao";

export default async function VisaoGeral() {
  const s = await exigirSessao();
  return <FaixaTitulo olho="Turma 2027 · Área da aluna" titulo={`Olá, ${s.nome.split(" ")[0]}`} />;
}
