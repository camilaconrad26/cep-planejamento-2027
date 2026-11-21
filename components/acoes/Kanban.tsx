"use client";
import { useEffect, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { EditarAcao } from "@/components/acoes/EditarAcao";
import { SeloAtraso, SeloPrioridade } from "@/components/acoes/SeloAcao";
import { atualizarAcao } from "@/lib/data/acoesAcoes";
import { STATUS_LISTA, formatarData, type Acao } from "@/lib/domain/acoes";
import type { Status } from "@/lib/domain/ciclo";

const SESSAO = "Sua sessão expirou. Entre de novo.";

/** Kanban em 3 colunas de status: arrastar e soltar, ou "Mover para" (teclado e celular). Atraso é selo, não coluna. */
export function Kanban({ acoes, hoje }: { acoes: Acao[]; hoje: string }) {
  const [lista, setLista] = useState(acoes);
  useEffect(() => setLista(acoes), [acoes]);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Status | null>(null);
  const aviso = useAviso();
  const router = useRouter();

  async function mover(id: string, status: Status) {
    const antes = lista.find((a) => a.id === id);
    if (!antes || antes.status === status) return;
    setErro("");
    setLista((l) => l.map((a) => (a.id === id ? { ...a, status } : a))); // otimista
    const volta = () => setLista((l) => l.map((a) => (a.id === id ? { ...a, status: antes.status } : a)));
    try {
      const r = await atualizarAcao(id, { status });
      if (r.erro) { volta(); setErro(r.erro === "sessao" ? SESSAO : r.erro); return; }
      aviso({ texto: r.ok ?? "Ação salva." });
      router.refresh();
    } catch { volta(); setErro("Não foi possível mover. Verifique a conexão e tente de novo."); }
  }
  const soltar = (status: Status) => (e: DragEvent) => { e.preventDefault(); setSobre(null); const id = e.dataTransfer.getData("text/plain"); if (id) mover(id, status); };

  return (
    <div className="flex flex-col gap-3">
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUS_LISTA.map((col) => {
          const itens = lista.filter((a) => a.status === col.valor);
          return (
            <section key={col.valor} aria-labelledby={`k-${col.valor}`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setSobre(col.valor); }}
              onDragLeave={() => setSobre((s) => (s === col.valor ? null : s))} onDrop={soltar(col.valor)}
              className={`flex min-h-[10rem] min-w-0 flex-col gap-2 rounded-cartao border bg-papel-2 p-3 ${sobre === col.valor ? "border-ouro-texto ring-2 ring-ouro-texto" : "border-linha"}`}>
              <h2 id={`k-${col.valor}`} className="px-1 font-display text-lg font-bold text-tinta">{col.nome} <span className="text-ouro-texto">({itens.length})</span></h2>
              <ul className="flex flex-col gap-2">
                {itens.map((a) => (
                  <li key={a.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); e.dataTransfer.effectAllowed = "move"; }}
                    className="flex cursor-grab flex-col gap-2 rounded-cartao border border-linha bg-white p-3 active:cursor-grabbing">
                    <p className={a.status === "concluido" ? "text-sec line-through" : "font-bold text-tinta"}>{a.titulo}</p>
                    <p className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-sec">
                      {a.categoria && <span>{a.categoria.nome}</span>}
                      {a.responsavel && <span>· {a.responsavel}</span>}
                      <span>· Prazo {formatarData(a.prazo)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5"><SeloPrioridade p={a.prioridade} /><SeloAtraso acao={a} hoje={hoje} /></div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select aria-label={`Mover "${a.titulo}" para`} value={a.status} onChange={(e) => mover(a.id, e.target.value as Status)} className="campo min-h-[38px] w-auto py-1 text-[0.85rem]">
                        {STATUS_LISTA.map((s) => <option key={s.valor} value={s.valor}>{s.nome}</option>)}
                      </select>
                      <Botao tamanho="mini" variante="secundario" aria-expanded={aberta === a.id} aria-label={`Editar: ${a.titulo}`} onClick={() => setAberta(aberta === a.id ? null : a.id)}>Editar</Botao>
                    </div>
                    {aberta === a.id && <EditarAcao acao={a} onFechar={() => setAberta(null)} />}
                  </li>
                ))}
              </ul>
              {itens.length === 0 && <p className="px-1 text-[0.9rem] text-sec">Arraste uma ação para cá.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
