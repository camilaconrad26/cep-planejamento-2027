import { comparar } from "@/lib/domain/metas";
import { formatarMoeda } from "@/lib/domain/moeda";

/** "fecha com a meta" / "faltam R$ X" / "R$ X acima" / "—" (sem meta). */
export function Comparacao({ tem, alvo, testId }: { tem: number; alvo: number; testId?: string }) {
  const c = comparar(tem, alvo);
  const texto = c.tipo === "sem-meta" ? "—" : c.tipo === "fecha" ? "fecha com a meta" : c.tipo === "falta" ? `faltam ${formatarMoeda(c.valor)}` : `${formatarMoeda(c.valor)} acima`;
  return <span data-testid={testId} className={c.tipo === "falta" ? "font-bold text-alerta" : c.tipo === "sem-meta" ? "text-sec" : "font-bold text-ok"}>{texto}</span>;
}
