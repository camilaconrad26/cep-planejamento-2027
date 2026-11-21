import { escala } from "@/lib/domain/resultados";
import { formatarMoeda } from "@/lib/domain/moeda";

const REAL = "#9a6b00", META = "#2f6fb0", GRADE = "#e8e1d0", TEXTO = "#6b6253";
const curto = (n: number) => new Intl.NumberFormat("pt-BR", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

/** Faturamento realizado × meta por trimestre: barras lado a lado, meta com contorno (codificação além da cor), legenda e tabela. */
export function GraficoTrimestres({ dados }: { dados: { t: number; meta: number; realizado: number }[] }) {
  const max = Math.max(...dados.flatMap((d) => [d.meta, d.realizado]));
  if (!(max > 0)) return <p className="text-[0.9rem] text-sec">Preencha as metas por trimestre ou o realizado para ver o gráfico.</p>;
  const ticks = escala(0, max);
  const topo = ticks[ticks.length - 1];
  const desenho = (W: number, H: number, BAR: number, classe: string) => {
    const L = 46, R = 8, T = 22, B = 30, GAP = 2;
    const banda = (W - L - R) / dados.length;
    const y = (v: number) => T + (1 - v / topo) * (H - T - B);
    const barra = (x: number, v: number) => { // topo arredondado de 4 px, base reta
      const yt = y(v), yb = y(0), r = Math.min(4, (yb - yt) / 2);
      return `M${x},${yb} V${yt + r} Q${x},${yt} ${x + r},${yt} H${x + BAR - r} Q${x + BAR},${yt} ${x + BAR},${yt + r} V${yb} Z`;
    };
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${classe}`} role="group" aria-label="Faturamento realizado e meta por trimestre">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRADE} strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={TEXTO}>{curto(t)}</text>
          </g>
        ))}
        {dados.map((d, i) => {
          const centro = L + banda * i + banda / 2;
          const xr = centro - BAR - GAP / 2, xm = centro + GAP / 2;
          const nr = `${d.t}º tri — realizado: ${formatarMoeda(d.realizado)}`, nm = `${d.t}º tri — meta: ${formatarMoeda(d.meta)}`;
          return (
            <g key={d.t}>
              {d.realizado > 0 && (
                <g tabIndex={0} role="img" aria-label={nr} className="focus:outline-none [&:focus>path]:stroke-[#2a2620] [&:focus>path]:stroke-2">
                  <title>{nr}</title><path d={barra(xr, d.realizado)} fill={REAL} />
                </g>
              )}
              {d.meta > 0 && (
                <g tabIndex={0} role="img" aria-label={nm} className="focus:outline-none [&:focus>path]:stroke-[#2a2620]">
                  <title>{nm}</title><path d={barra(xm + 0.75, d.meta)} fill="rgba(47,111,176,.15)" stroke={META} strokeWidth={1.5} />
                </g>
              )}
              {d.realizado > 0 && <text x={xr + BAR / 2} y={y(d.realizado) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2a2620">{curto(d.realizado)}</text>}
              <text x={centro} y={H - 10} textAnchor="middle" fontSize={11} fill={TEXTO}>{d.t}º tri</text>
            </g>
          );
        })}
      </svg>
    );
  };
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-[0.85rem]">
        <span className="font-bold text-tinta">Faturamento por trimestre</span>
        <span className="flex gap-4 text-sec">
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm" style={{ background: REAL }} />Realizado</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm border-[1.5px]" style={{ borderColor: META, background: "rgba(47,111,176,.15)" }} />Meta</span>
        </span>
      </figcaption>
      {desenho(560, 220, 22, "hidden sm:block")}
      {desenho(330, 210, 14, "sm:hidden")}
      <p className="text-[0.85rem] text-sec">A comparação com o ciclo anterior aparece a partir do segundo ciclo.</p>
      <details className="text-[0.88rem]">
        <summary className="cursor-pointer font-bold text-ouro-texto">Ver em tabela</summary>
        <table className="mt-2 border-collapse">
          <thead><tr><th className="px-2 py-1 text-left text-sec">Trimestre</th><th className="px-2 py-1 text-right text-sec">Meta</th><th className="px-2 py-1 text-right text-sec">Realizado</th></tr></thead>
          <tbody>{dados.map((d) => <tr key={d.t} className="border-t border-linha"><td className="px-2 py-1">{d.t}º trimestre</td>
            <td className="px-2 py-1 text-right tabular-nums">{d.meta ? formatarMoeda(d.meta) : "—"}</td><td className="px-2 py-1 text-right tabular-nums">{d.realizado ? formatarMoeda(d.realizado) : "—"}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
