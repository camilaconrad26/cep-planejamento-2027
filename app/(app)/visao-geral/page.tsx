// Provisória (Tasks 6–8): a Visão geral completa chega na Task 10.
import { FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { exigirSessao } from "@/lib/data/sessao";
import { nomePerfil } from "@/lib/domain/perfis";

export default async function VisaoGeral() {
  const s = await exigirSessao();
  return <FaixaTitulo olho="Turma 2027 · Área da aluna" titulo={`Olá, ${s.nome.split(" ")[0]}`} descricao={nomePerfil(s.perfil) ?? "Perfil ainda não definido"} />;
}
