import { estaAtrasada } from "@/lib/domain/ciclo";
import type { Acao } from "@/lib/domain/acoes";

/** Selo "Atrasada" (texto + cor, nunca só cor). */
export function SeloAtraso({ acao, hoje }: { acao: Acao; hoje: string }) {
  if (!estaAtrasada(acao, hoje)) return null;
  return <span className="inline-flex rounded-full border border-alerta bg-white px-2 py-0.5 text-[0.75rem] font-bold text-alerta">Atrasada</span>;
}
const COR: Record<Acao["prioridade"], string> = { alta: "border-alerta text-alerta", media: "border-ouro-fio text-ouro-texto", baixa: "border-linha text-sec" };
const NOME: Record<Acao["prioridade"], string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const SeloPrioridade = ({ p }: { p: Acao["prioridade"] }) => (
  <span className={`inline-flex rounded-full border bg-white px-2 py-0.5 text-[0.75rem] font-bold ${COR[p]}`}><span className="sr-only">Prioridade </span>{NOME[p]}</span>
);
