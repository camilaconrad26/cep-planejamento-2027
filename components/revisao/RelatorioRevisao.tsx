import { PERGUNTAS_REVISAO, compararRetratos, type RespostasRevisao, type RetratoRevisao } from "@/lib/domain/revisao";
import { formatarMoeda } from "@/lib/domain/moeda";

const pct = (f: number | null) => (f === null ? "—" : `${Math.round(f * 100)}%`);
function variacao(tipo: "pct" | "moeda" | "numero", a: number | null, d: number | null): string {
  if (a === null || d === null) return "—";
  const v = d - a;
  const s = v > 0 ? "+" : v < 0 ? "−" : "";
  if (tipo === "pct") return `${s}${Math.abs(Math.round(v * 100))} p.p.`;
  if (tipo === "moeda") return `${s}${formatarMoeda(Math.abs(v))}`;
  return `${s}${Math.abs(v)}`;
}
const valor = (tipo: "pct" | "moeda" | "numero", x: number | null) => (x === null ? "—" : tipo === "pct" ? pct(x) : tipo === "moeda" ? formatarMoeda(x) : String(x));
const Num = ({ rotulo, v, extra }: { rotulo: string; v: string; extra?: string }) => (
  <div className="min-w-0 border-t-[1.5px] border-ouro-fio pt-2"><dt className="text-[0.7rem] font-bold uppercase tracking-[.16em] text-sec">{rotulo}</dt>
    <dd className="font-display text-[1.5rem] font-bold tabular-nums text-tinta">{v}</dd>{extra && <dd className="text-[0.82rem] text-sec">{extra}</dd>}</div>
);

/** Relatório salvo ao concluir a revisão: execução e resultado separados, respostas e comparação com a revisão anterior. */
export function RelatorioRevisao({ trimestre, retrato, anterior, respostas, concluidaEm }:
  { trimestre: number; retrato: RetratoRevisao; anterior: RetratoRevisao | null; respostas: RespostasRevisao; concluidaEm: string }) {
  const data = new Date(concluidaEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const comp = compararRetratos(retrato, anterior);
  return (
    <section aria-labelledby={`rel-${trimestre}`} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-ouro-fio bg-white px-5 py-5 sm:px-7">
      <div>
        <h2 id={`rel-${trimestre}`} className="font-display text-xl font-bold text-tinta">Relatório do {trimestre}º trimestre</h2>
        <p className="text-[0.88rem] text-sec">Retrato salvo em {data}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-1 font-bold text-tinta">Execução das ações</h3>
          <dl className="grid grid-cols-2 gap-3"><Num rotulo="Concluídas" v={`${retrato.execucao.concluidas} de ${retrato.execucao.total}`} /><Num rotulo="Execução" v={pct(retrato.execucao.pct)} /></dl>
        </div>
        <div>
          <h3 className="mb-1 font-bold text-tinta">Resultados</h3>
          <dl className="grid grid-cols-3 gap-3">
            <Num rotulo="Média dos KRs" v={pct(retrato.krs.media)} extra={`${retrato.krs.atingidos} de ${retrato.krs.comMeta} atingidos`} />
            <Num rotulo="KPIs na meta" v={retrato.kpis.total ? `${retrato.kpis.naMeta} de ${retrato.kpis.total}` : "—"} />
            <Num rotulo="Faturamento" v={retrato.faturamento.realizado ? formatarMoeda(retrato.faturamento.realizado) : "—"} extra={retrato.faturamento.pct === null ? undefined : `${pct(retrato.faturamento.pct)} da meta`} />
          </dl>
        </div>
      </div>
      <div>
        <h3 className="mb-1 font-bold text-tinta">Respostas</h3>
        <dl className="flex flex-col gap-2">
          {PERGUNTAS_REVISAO.map((p) => (
            <div key={p.chave}><dt className="text-[0.9rem] font-bold text-ouro-texto">{p.texto}</dt>
              <dd className="whitespace-pre-line text-tinta">{respostas[p.chave]?.trim() || <span className="text-sec">Sem resposta.</span>}</dd></div>
          ))}
        </dl>
      </div>
      <div>
        <h3 className="mb-1 font-bold text-tinta">Comparado à revisão anterior</h3>
        {anterior === null ? <p className="text-sec">Esta é a primeira revisão do ciclo; a comparação aparece a partir da próxima.</p> : (
          <div role="region" aria-label="Comparação com a revisão anterior" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-[0.93rem]">
              <thead><tr className="text-left text-[0.78rem] uppercase tracking-[.08em] text-sec"><th className="py-1 pr-3">Indicador</th><th className="py-1 pr-3 text-right">{anterior.trimestre}º tri</th><th className="py-1 pr-3 text-right">{trimestre}º tri</th><th className="py-1 text-right">Variação</th></tr></thead>
              <tbody>{comp.map((c) => (
                <tr key={c.campo} className="border-t border-linha"><td className="py-1.5 pr-3">{c.campo}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{valor(c.tipo, c.antes)}</td><td className="py-1.5 pr-3 text-right tabular-nums">{valor(c.tipo, c.depois)}</td>
                  <td data-testid={`var-${c.campo}`} className="py-1.5 text-right font-bold tabular-nums">{variacao(c.tipo, c.antes, c.depois)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
