import { SeloAtraso, SeloPrioridade } from "@/components/acoes/SeloAcao";
import { formatarData, listasPrioridades, nomeStatus, type Acao } from "@/lib/domain/acoes";

/** Vencidas, vencendo em até 7 dias e prioridade alta (só ações não concluídas). */
export function ListaPrioridades({ acoes, hoje }: { acoes: Acao[]; hoje: string }) {
  const l = listasPrioridades(acoes, hoje);
  const blocos: [string, string, Acao[]][] = [["vencidas", "Vencidas", l.vencidas], ["vencendo", "Vencem em até 7 dias", l.vencendo], ["alta", "Prioridade alta", l.alta]];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {blocos.map(([id, titulo, itens]) => (
        <section key={id} aria-labelledby={`p-${id}`} className="flex min-w-0 flex-col gap-2 rounded-cartao border border-linha bg-white px-5 py-4">
          <h2 id={`p-${id}`} className="font-display text-lg font-bold text-tinta">{titulo} <span className="text-ouro-texto">({itens.length})</span></h2>
          {itens.length === 0 ? <p className="text-sec">Nada aqui.</p> : (
            <ul className="flex flex-col">{itens.map((a) => (
              <li key={a.id} className="border-t border-linha py-2.5 first:border-t-0">
                <p className="font-bold text-tinta">{a.titulo}</p>
                <p className="flex flex-wrap items-center gap-2 text-[0.85rem] text-sec">
                  <span>Prazo {formatarData(a.prazo)}</span><span>· {nomeStatus(a.status)}</span>{a.responsavel && <span>· {a.responsavel}</span>}
                  <SeloPrioridade p={a.prioridade} /><SeloAtraso acao={a} hoje={hoje} />
                </p>
              </li>
            ))}</ul>
          )}
        </section>
      ))}
    </div>
  );
}
