import Link from "next/link";
import { ItemCalendario } from "@/components/acoes/ItemCalendario";
import { acoesNoDia, diaDaSemana, gradeMes, semanaDe, somarDias, somarMeses, urlAcoes, type Acao, type FiltrosAcoes } from "@/lib/domain/acoes";
import { MESES } from "@/lib/domain/metas";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const dm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const mesNome = (s: string) => MESES[Number(s.slice(5, 7)) - 1];
const pilula = (ativo: boolean) => `inline-flex min-h-[40px] items-center rounded-full border-[1.5px] px-3.5 text-[0.88rem] font-bold ${ativo ? "border-ouro-texto bg-ouro-texto text-white" : "border-ouro-fio text-tinta hover:bg-papel-2"}`;

/** Calendário por mês, semana ou dia, pelas datas de prazo; ações sem prazo ficam na lista "Sem prazo". */
export function Calendario({ acoes, f, hoje }: { acoes: Acao[]; f: FiltrosAcoes; hoje: string }) {
  const data = f.data ?? hoje;
  const passo = (n: number) => (f.cal === "mes" ? somarMeses(data, n) : somarDias(data, f.cal === "semana" ? 7 * n : n));
  const semana = semanaDe(data);
  const titulo = f.cal === "mes" ? `${mesNome(data)} de ${data.slice(0, 4)}`
    : f.cal === "semana" ? `Semana de ${dm(semana[0])} a ${dm(semana[6])}/${semana[6].slice(0, 4)}`
    : `${DIAS[diaDaSemana(data)]}, ${dm(data)}/${data.slice(0, 4)}`;
  const semPrazo = acoes.filter((a) => !a.prazo);
  const lista = (dia: string) => {
    const l = acoesNoDia(acoes, dia);
    return l.length ? <ul className="mt-1 flex flex-col gap-1">{l.map((a) => <ItemCalendario key={a.id} acao={a} hoje={hoje} />)}</ul> : null;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-cartao border border-linha bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-tinta">{titulo}</h2>
          <nav aria-label="Período do calendário" className="flex flex-wrap gap-2">
            <Link href={urlAcoes(f, { data: passo(-1) })} className={pilula(false)}>Anterior</Link>
            <Link href={urlAcoes(f, { data: hoje })} className={pilula(false)}>Hoje</Link>
            <Link href={urlAcoes(f, { data: passo(1) })} className={pilula(false)}>Próximo</Link>
          </nav>
        </div>
        <nav aria-label="Escala do calendário" className="flex flex-wrap gap-2">
          {([["mes", "Mês"], ["semana", "Semana"], ["dia", "Dia"]] as const).map(([v, n]) => (
            <Link key={v} href={urlAcoes(f, { cal: v, data })} aria-current={f.cal === v ? "page" : undefined} className={pilula(f.cal === v)}>{n}</Link>
          ))}
        </nav>

        {f.cal === "mes" && (() => {
          const g = gradeMes(Number(data.slice(0, 4)), Number(data.slice(5, 7)));
          const mes = data.slice(5, 7);
          const comAcoes = g.flat().filter((d) => d.slice(5, 7) === mes && acoesNoDia(acoes, d).length);
          return (
            <>
              <div role="grid" aria-label={titulo} className="hidden overflow-hidden rounded-cartao border border-linha sm:block">
                <div role="row" className="grid grid-cols-7 bg-papel-2">
                  {DIAS.map((d) => <div key={d} role="columnheader" className="px-2 py-1.5 text-[0.75rem] font-bold uppercase tracking-[.08em] text-sec">{d.slice(0, 3)}</div>)}
                </div>
                {g.map((sem) => (
                  <div key={sem[0]} role="row" className="grid grid-cols-7 border-t border-linha">
                    {sem.map((d) => {
                      const fora = d.slice(5, 7) !== mes;
                      return (
                        <div key={d} role="gridcell" aria-label={`${Number(d.slice(8, 10))} de ${mesNome(d).toLowerCase()}`}
                          className={`min-h-[6.5rem] min-w-0 border-l border-linha p-1.5 first:border-l-0 ${fora ? "bg-papel text-sec/60" : "bg-white"}`}>
                          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[0.8rem] font-bold ${d === hoje ? "bg-ouro-texto text-white" : fora ? "text-sec" : "text-tinta"}`}>{Number(d.slice(8, 10))}</span>
                          {!fora && lista(d)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:hidden">
                {comAcoes.length === 0 ? <p className="text-sec">Nenhuma ação com prazo neste mês.</p> : comAcoes.map((d) => (
                  <section key={d} aria-label={`${DIAS[diaDaSemana(d)]}, ${dm(d)}`} className="border-t border-linha pt-2">
                    <h3 className="font-bold text-tinta">{DIAS[diaDaSemana(d)]}, {dm(d)}</h3>{lista(d)}
                  </section>
                ))}
              </div>
            </>
          );
        })()}

        {f.cal === "semana" && (
          <div className="grid gap-2 lg:grid-cols-7">
            {semana.map((d) => (
              <section key={d} aria-label={`${DIAS[diaDaSemana(d)]}, ${dm(d)}`} className={`min-w-0 rounded-cartao border p-2 ${d === hoje ? "border-ouro-texto" : "border-linha"}`}>
                <h3 className="text-[0.85rem] font-bold text-tinta">{DIAS[diaDaSemana(d)]}, {dm(d)}</h3>
                {lista(d) ?? <p className="text-[0.8rem] text-sec">—</p>}
              </section>
            ))}
          </div>
        )}

        {f.cal === "dia" && (lista(data) ?? <p className="text-sec">Nenhuma ação com prazo neste dia.</p>)}
      </div>

      <section aria-labelledby="sem-prazo" className="flex flex-col gap-2 rounded-cartao border border-linha bg-white px-4 py-4 sm:px-6">
        <h2 id="sem-prazo" className="font-display text-lg font-bold text-tinta">Sem prazo <span className="text-ouro-texto">({semPrazo.length})</span></h2>
        {semPrazo.length === 0 ? <p className="text-sec">Todas as ações têm prazo.</p>
          : <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{semPrazo.map((a) => <ItemCalendario key={a.id} acao={a} hoje={hoje} />)}</ul>}
      </section>
    </div>
  );
}
