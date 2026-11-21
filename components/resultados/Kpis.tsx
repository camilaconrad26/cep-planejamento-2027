"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { Erro, useAcao } from "@/components/planejamento/useAcao";
import { GraficoLinha } from "@/components/resultados/GraficoLinha";
import { lerNumero } from "@/components/resultados/util";
import { criarKpi, editarKpi, excluirKpi, excluirMedicao, registrarMedicao } from "@/lib/data/resultadosAcoes";
import { formatarData } from "@/lib/domain/acoes";
import { NOME_SITUACAO, formatarNumero, medicaoVencida, serieMensal, situacaoKPI, type KPI, type Medicao } from "@/lib/domain/resultados";

type Objetivo = { id: string; titulo: string };
const campo = "flex min-w-0 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";
const v = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

function FormKpi({ kpi, objetivos, onFechar }: { kpi?: KPI; objetivos: Objetivo[]; onFechar: () => void }) {
  const [d, setD] = useState({ nome: kpi?.nome ?? "", unidade: kpi?.unidade ?? "", sentido: kpi?.sentido ?? "maior", meta: v(kpi?.meta ?? null), objetivoId: kpi?.objetivoId ?? "" });
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const dados = { nome: d.nome, unidade: d.unidade, sentido: d.sentido as "maior" | "menor", meta: lerNumero(d.meta), objetivoId: d.objetivoId || null };
    const r = await rodar(() => (kpi ? editarKpi(kpi.id, dados) : criarKpi(dados)));
    if (r?.ok) onFechar();
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-cartao border border-ouro-fio bg-papel-2 p-4">
      <label htmlFor={`${id}-n`} className={campo}>Nome do indicador
        <input id={`${id}-n`} value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} maxLength={1000} required autoFocus className="campo font-normal" placeholder="Ex.: taxa de conversão de reuniões" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label htmlFor={`${id}-u`} className={campo}>Unidade<input id={`${id}-u`} value={d.unidade} onChange={(e) => setD({ ...d, unidade: e.target.value })} maxLength={40} placeholder="%, R$, contratos" className="campo font-normal" /></label>
        <label htmlFor={`${id}-s`} className={campo}>Sentido
          <select id={`${id}-s`} value={d.sentido} onChange={(e) => setD({ ...d, sentido: e.target.value as "maior" | "menor" })} className="campo font-normal">
            <option value="maior">Maior é melhor</option><option value="menor">Menor é melhor</option></select></label>
        <label htmlFor={`${id}-m`} className={campo}>Meta<input id={`${id}-m`} inputMode="decimal" value={d.meta} onChange={(e) => setD({ ...d, meta: e.target.value })} className="campo text-right font-normal" /></label>
        <label htmlFor={`${id}-o`} className={campo}>Objetivo (opcional)
          <select id={`${id}-o`} value={d.objetivoId} onChange={(e) => setD({ ...d, objetivoId: e.target.value })} className="campo font-normal">
            <option value="">Nenhum</option>{objetivos.map((o) => <option key={o.id} value={o.id}>{o.titulo}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="mini" disabled={enviando || !d.nome.trim()}>{kpi ? "Salvar indicador" : "Criar indicador"}</Botao>
        <Botao tamanho="mini" variante="secundario" onClick={onFechar}>Cancelar</Botao>
      </div>
      <Erro t={erro} />
    </form>
  );
}

const COR_SITUACAO = { "na-meta": "border-ok text-ok", "fora-da-meta": "border-alerta text-alerta", "sem-meta": "border-linha text-sec", "sem-medicao": "border-linha text-sec" } as const;
const ICONE = { "na-meta": "M2 6.5 5 9l5-6", "fora-da-meta": "M6 2.5v4.5M6 9.2v.3", "sem-meta": "M3 6h6", "sem-medicao": "M3 6h6" } as const;

function KpiCartao({ kpi, medicoes, objetivos, hoje }: { kpi: KPI; medicoes: Medicao[]; objetivos: Objetivo[]; hoje: string }) {
  const [editando, setEditando] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [m, setM] = useState({ data: hoje, valor: "", nota: "" });
  const { enviando, erro, rodar } = useAcao();
  const id = useId();
  const s = situacaoKPI(kpi, medicoes);
  const vencida = medicaoVencida(s.ultima?.data ?? null, kpi.criadoEm, hoje);
  const historico = [...medicoes].sort((a, b) => (a.data < b.data ? 1 : -1));
  async function registrar(e: FormEvent) {
    e.preventDefault();
    const r = await rodar(() => registrarMedicao({ kpiId: kpi.id, data: m.data, valor: lerNumero(m.valor), nota: m.nota }));
    if (r?.ok) setM((x) => ({ ...x, valor: "", nota: "" }));
  }
  return (
    <article aria-labelledby={`${id}-h`} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-white px-4 py-5 sm:px-6">
      {editando ? <><h3 id={`${id}-h`} className="sr-only">{kpi.nome}</h3><FormKpi kpi={kpi} objetivos={objetivos} onFechar={() => setEditando(false)} /></> : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 id={`${id}-h`} className="font-display text-lg font-bold text-tinta">{kpi.nome}</h3>
            <p className="text-[0.88rem] text-sec">{kpi.sentido === "maior" ? "Maior é melhor" : "Menor é melhor"} · Meta {formatarNumero(kpi.meta, kpi.unidade)} · Última {s.ultima ? `${formatarNumero(s.ultima.valor, kpi.unidade)} em ${formatarData(s.ultima.data)}` : "—"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[0.78rem] font-bold ${COR_SITUACAO[s.situacao]}`}>
              <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3"><path d={ICONE[s.situacao]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>{NOME_SITUACAO[s.situacao]}</span>
            {vencida && <span className="rounded-full border border-alerta bg-white px-2 py-0.5 text-[0.78rem] font-bold text-alerta">Sem medição há mais de 30 dias</span>}
            <Botao tamanho="mini" variante="secundario" aria-label={`Editar indicador: ${kpi.nome}`} onClick={() => setEditando(true)}>Editar</Botao>
            <Botao tamanho="mini" variante="secundario" aria-label={`Excluir indicador: ${kpi.nome}`} onClick={() => setExcluir(true)}>Excluir</Botao>
          </div>
        </div>
      )}
      {excluir && (
        <div role="alertdialog" aria-labelledby={`${id}-x`} className="flex flex-col gap-2 rounded-cartao border border-alerta bg-papel p-3">
          <p id={`${id}-x`} className="font-bold text-tinta">{medicoes.length ? `Excluir este indicador e ${medicoes.length === 1 ? "a 1 medição" : `as ${medicoes.length} medições`}?` : "Excluir este indicador?"}</p>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="mini" variante="perigo" disabled={enviando} onClick={() => rodar(() => excluirKpi(kpi.id))}>Excluir de vez</Botao>
            <Botao tamanho="mini" variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Botao>
          </div>
        </div>
      )}
      <form onSubmit={registrar} className="grid gap-2 sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
        <label htmlFor={`${id}-d`} className={campo}>Data da medição<input id={`${id}-d`} type="date" value={m.data} onChange={(e) => setM({ ...m, data: e.target.value })} className="campo font-normal" /></label>
        <label htmlFor={`${id}-v`} className={campo}>Valor medido<input id={`${id}-v`} inputMode="decimal" value={m.valor} onChange={(e) => setM({ ...m, valor: e.target.value })} className="campo w-full text-right font-normal sm:w-32" /></label>
        <label htmlFor={`${id}-t`} className={campo}>Nota<input id={`${id}-t`} value={m.nota} onChange={(e) => setM({ ...m, nota: e.target.value })} maxLength={500} placeholder="Opcional" className="campo font-normal" /></label>
        <Botao type="submit" tamanho="mini" disabled={enviando || !m.valor.trim() || !m.data}>Registrar medição</Botao>
      </form>
      <Erro t={erro} />
      <GraficoLinha nome={kpi.nome} unidade={kpi.unidade} meta={kpi.meta} serie={serieMensal(medicoes)} />
      {historico.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[0.9rem] font-bold text-ouro-texto">Medições ({historico.length})</summary>
          <ul className="mt-1">{historico.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-linha py-1.5 text-[0.9rem]">
              <span><span className="tabular-nums">{formatarData(x.data)}</span> · <b>{formatarNumero(x.valor, kpi.unidade)}</b>{x.nota && <span className="text-sec"> · {x.nota}</span>}</span>
              <Botao tamanho="mini" variante="secundario" aria-label={`Excluir medição de ${formatarData(x.data)}`} onClick={() => rodar(() => excluirMedicao(x.id))}>Excluir</Botao>
            </li>
          ))}</ul>
        </details>
      )}
    </article>
  );
}

/** Aba Indicadores: KPIs com medições datadas, situação frente à meta e gráfico mês a mês. */
export function Kpis({ kpis, medicoes, objetivos, hoje }: { kpis: KPI[]; medicoes: Record<string, Medicao[]>; objetivos: Objetivo[]; hoje: string }) {
  const [novo, setNovo] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      {novo ? <FormKpi objetivos={objetivos} onFechar={() => setNovo(false)} /> : <div><Botao onClick={() => setNovo(true)}>Novo indicador</Botao></div>}
      {kpis.length === 0 && <p className="text-sec">Nenhum indicador ainda. Crie um ou adicione os KPIs sugeridos pela biblioteca.</p>}
      {kpis.map((k) => <KpiCartao key={`${k.id}-${k.nome}-${k.meta}-${k.sentido}`} kpi={k} medicoes={medicoes[k.id] ?? []} objetivos={objetivos} hoje={hoje} />)}
    </div>
  );
}
