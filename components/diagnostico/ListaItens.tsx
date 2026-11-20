"use client";
import { useRef } from "react";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { criarTarefaAvulsa, excluirTarefa } from "@/lib/data/tarefas";
import type { ItemLista } from "@/lib/domain/fechamento";

type Props = { rotulo: string; ajuda: string; itens: ItemLista[]; onChange: (i: ItemLista[]) => void; triPadrao?: 1 | 2 | 3 | 4; comDestino?: boolean };
const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));
const DESTINOS = [["levar", "Levar para 2027"], ["delegar", "Delegar"], ["encerrar", "Encerrar de vez"]] as const;

/** Lista de itens curtos; cada item pode virar tarefa de um trimestre no plano de 2027. */
export function ListaItens({ rotulo, ajuda, itens, onChange, triPadrao = 1, comDestino }: Props) {
  const aviso = useAviso();
  const novo = useRef<HTMLInputElement>(null);
  const id = "lista-" + rotulo.normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase();
  const muda = (i: number, p: Partial<ItemLista>) => onChange(itens.map((x, k) => (k === i ? { ...x, ...p } : x)));

  const adicionar = () => {
    const t = novo.current?.value.trim();
    if (!t) { novo.current?.focus(); return; }
    onChange([...itens, { id: novoId(), texto: t }]);
    if (novo.current) { novo.current.value = ""; novo.current.focus(); }
  };
  const remover = (i: number) => {
    const antes = itens;
    onChange(itens.filter((_, k) => k !== i));
    aviso({ texto: "Item removido.", desfazer: () => onChange(antes) });
  };
  const criarTarefa = async (i: number) => {
    const it = itens[i], tri = it.tri ?? triPadrao;
    const r = await criarTarefaAvulsa(it.texto, tri);
    if (r.erro || !r.id) return aviso({ texto: r.erro ?? "Não foi possível criar a tarefa." });
    const idTarefa = r.id;
    muda(i, { tarefaId: idTarefa, tarefaTri: tri });
    aviso({ texto: `Tarefa criada no ${tri}º trimestre.`, desfazer: async () => {
      await excluirTarefa(idTarefa);
      onChange(itens.map((x, k) => (k === i ? { ...x, tarefaId: undefined, tarefaTri: undefined } : x)));
    } });
  };

  return (
    <div role="group" aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h3 id={id} className="font-display text-[1.05rem] font-bold text-tinta">{rotulo}</h3>
      <p className="text-[0.92rem] text-sec">{ajuda}</p>
      <ul className="flex flex-col gap-2">
        {itens.map((it, i) => {
          const podeTarefa = !comDestino || it.destino === "levar";
          return (
            <li key={it.id} className="grid grid-cols-[1fr_44px] items-center gap-x-1 gap-y-1.5 border-b border-linha pb-2">
              <input className="campo" value={it.texto} maxLength={500} aria-label={`${rotulo}, item ${i + 1}`}
                onChange={(e) => muda(i, { texto: e.target.value })} />
              <button type="button" onClick={() => remover(i)} aria-label={`Remover: ${it.texto}`}
                className="grid h-11 w-11 place-items-center rounded-full text-xl text-sec hover:bg-[#f6e7df] hover:text-alerta">×</button>
              <div className="col-span-2 flex flex-wrap items-center gap-2">
                {comDestino && (
                  <select className="campo !min-h-[38px] w-auto py-1" aria-label={`Destino: ${it.texto}`} value={it.destino ?? ""}
                    onChange={(e) => muda(i, { destino: (e.target.value || null) as ItemLista["destino"] })}>
                    <option value="">Destino</option>
                    {DESTINOS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                  </select>
                )}
                {it.tarefaId ? (
                  <span className="text-sm font-bold text-ok">{`✓ Tarefa criada no ${it.tarefaTri}º tri`}</span>
                ) : podeTarefa ? (
                  <>
                    <select className="campo !min-h-[38px] w-auto py-1" aria-label={`Trimestre da tarefa: ${it.texto}`} value={it.tri ?? triPadrao}
                      onChange={(e) => muda(i, { tri: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
                      {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{q}º tri</option>)}
                    </select>
                    <Botao variante="secundario" tamanho="mini" aria-label={`Criar tarefa: ${it.texto}`} onClick={() => criarTarefa(i)}>Criar tarefa</Botao>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={novo} className="campo min-w-0 flex-1" placeholder="Escreva e tecle Enter" aria-label={`Novo item em ${rotulo}`} maxLength={500}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }} />
        <Botao variante="secundario" tamanho="mini" onClick={adicionar}>Adicionar</Botao>
      </div>
    </div>
  );
}
