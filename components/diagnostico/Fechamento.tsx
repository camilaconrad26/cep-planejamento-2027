"use client";
import { useEffect, useRef, useState } from "react";
import { Cartao } from "@/components/ui/Cartao";
import { CampoMoeda } from "@/components/ui/CampoMoeda";
import { ListaItens } from "@/components/diagnostico/ListaItens";
import { salvarFechamento } from "@/lib/data/diagnostico";
import { CATEGORIAS } from "@/lib/domain/categorias";
import { LISTAS, type ChaveLista, type Fechamento as F } from "@/lib/domain/fechamento";
import { formatarMoeda } from "@/lib/domain/moeda";
import { marcarSalvo } from "@/lib/salvo";

const rotuloCampo = "font-bold text-tinta";

export function Fechamento({ inicial }: { inicial: F }) {
  const [f, setF] = useState(inicial);
  const pendente = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined), primeira = useRef(true);
  const ultimo = useRef(f); ultimo.current = f;
  const versao = useRef(0); // cada alteração ganha um número; só a gravação da versão mais recente encerra o "pendente"

  const salvar = async () => {
    const minha = versao.current;
    try {
      const r = await salvarFechamento(ultimo.current);
      if (r.erro === "sessao") { marcarSalvo("sessao"); return; }
      if (r.erro) throw new Error(r.erro);
      if (minha === versao.current) { pendente.current = false; marcarSalvo("salvo"); }
    } catch {
      marcarSalvo("erro");
      clearTimeout(timer.current);
      timer.current = setTimeout(salvar, 5000); // tenta de novo enquanto houver alteração não salva
    }
  };

  // Salvamento automático 900 ms depois da última alteração.
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    versao.current += 1; pendente.current = true; marcarSalvo("salvando");
    clearTimeout(timer.current);
    timer.current = setTimeout(salvar, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => { if (pendente.current) e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, []);

  const lista = (chave: ChaveLista) => {
    const l = LISTAS.find((x) => x.chave === chave)!;
    return <ListaItens key={chave} rotulo={l.rotulo} ajuda={l.ajuda} itens={f.listas[chave]} comDestino={chave === "pendencias"}
      onChange={(atualizar) => setF((x) => ({ ...x, listas: { ...x.listas, [chave]: atualizar(x.listas[chave]) } }))} />;
  };
  const ticket = f.contratos > 0 ? formatarMoeda(f.faturamento / f.contratos) : "—";
  const atingida = f.meta > 0 ? `${Math.round((f.faturamento / f.meta) * 100)}%` : "—";

  return (
    <div className="flex flex-col gap-6">
      <Cartao titulo="2026 em números">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5"><span className={rotuloCampo}>Faturamento realizado em 2026</span>
            <CampoMoeda valor={f.faturamento} onChange={(n) => setF((x) => ({ ...x, faturamento: n }))} /></label>
          <label className="flex flex-col gap-1.5"><span className={rotuloCampo}>Meta que você tinha para 2026</span>
            <CampoMoeda valor={f.meta} onChange={(n) => setF((x) => ({ ...x, meta: n }))} /></label>
          <label className="flex flex-col gap-1.5"><span className={rotuloCampo}>Contratos fechados no ano</span>
            <input className="campo text-right" inputMode="numeric" defaultValue={f.contratos || ""} placeholder="Quantidade"
              onBlur={(e) => setF((x) => ({ ...x, contratos: Math.max(0, Math.round(Number(e.target.value.replace(/\D/g, "")) || 0)) }))} /></label>
          <label className="flex flex-col gap-1.5"><span className={rotuloCampo}>Principal origem dos clientes</span>
            <input className="campo" defaultValue={f.origem} maxLength={200} placeholder="Indicação, conteúdo, parceiros…"
              onBlur={(e) => setF((x) => ({ ...x, origem: e.target.value.trim() }))} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-t-[1.5px] border-ouro-fio pt-2"><small className="block text-[0.7rem] font-bold uppercase tracking-[.18em] text-sec">Ticket médio</small>
            <span data-testid="ticket-medio" className="font-display text-2xl font-bold text-tinta">{ticket}</span></div>
          <div className="border-t-[1.5px] border-ouro-fio pt-2"><small className="block text-[0.7rem] font-bold uppercase tracking-[.18em] text-sec">Meta atingida</small>
            <span data-testid="meta-atingida" className="font-display text-2xl font-bold text-tinta">{atingida}</span></div>
        </div>
      </Cartao>

      <Cartao titulo="Nota por área">
        <p className="text-sec">De 0 a 10, como cada área do seu negócio terminou o ano? As notas baixas entram nas prioridades sugeridas do diagnóstico.</p>
        <div className="flex flex-col gap-3">
          {CATEGORIAS.map((c) => (
            <div key={c.slug} className="grid grid-cols-[1fr_2.5em] items-center gap-x-3 sm:grid-cols-[minmax(160px,240px)_1fr_2.5em]">
              <span className="col-span-2 sm:col-span-1">{c.nome}</span>
              <input type="range" min={0} max={10} step={1} aria-label={`Nota para ${c.nome}`} value={f.notas[c.slug] ?? 5}
                onChange={(e) => setF((x) => ({ ...x, notas: { ...x.notas, [c.slug]: Number(e.target.value) } }))} className="w-full accent-ouro-texto" />
              <output data-testid={`nota-${c.slug}`} className="text-right font-display text-lg font-bold text-ouro-texto">{f.notas[c.slug] ?? "–"}</output>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="O que passou">
        <p className="text-sec">Um item por linha. O que pedir ação vira tarefa com um clique, no trimestre escolhido.</p>
        <div className="grid gap-6 lg:grid-cols-3">{lista("deuCerto")}{lista("naoFuncionou")}{lista("aprendizados")}</div>
      </Cartao>
      <Cartao titulo="O que melhorar">
        <div className="grid gap-6 lg:grid-cols-3">{lista("parar")}{lista("continuar")}{lista("comecar")}</div>
      </Cartao>
      <Cartao>{lista("pendencias")}</Cartao>
    </div>
  );
}
