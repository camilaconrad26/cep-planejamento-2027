import { escala, formatarNumero, nomeMes } from "@/lib/domain/resultados";

const SERIE = "#9a6b00", META = "#2f6fb0", GRADE = "#e8e1d0", TEXTO = "#6b6253";
const L = 44, R = 76, T = 22, B = 30;
const mesesEntre = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
const curto = (n: number) => new Intl.NumberFormat("pt-BR", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

/** KPI mês a mês (última medição de cada mês) com a linha da meta. Uma série: o título nomeia; a meta tem rótulo direto. */
export function GraficoLinha({ nome, unidade, meta, serie }: { nome: string; unidade: string; meta: number | null; serie: { mes: string; valor: number }[] }) {
  if (serie.length < 2) return <p className="text-[0.9rem] text-sec">Registre medições em meses diferentes para ver o gráfico.</p>;
  const vals = serie.map((p) => p.valor).concat(meta !== null ? [meta] : []);
  const ticks = escala(Math.min(0, ...vals), Math.max(...vals));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const total = Math.max(1, mesesEntre(serie[0].mes, serie[serie.length - 1].mes));
  const ultimo = serie[serie.length - 1];
  // Dois desenhos: largo (a partir de 640 px) e estreito (celular), para o texto não encolher demais.
  const desenho = (W: number, H: number, pular: boolean, classe: string) => {
    const x = (mes: string) => L + (mesesEntre(serie[0].mes, mes) / total) * (W - L - R);
    const y = (v: number) => T + (1 - (v - y0) / (y1 - y0 || 1)) * (H - T - B);
    const caminho = serie.map((p, i) => `${i ? "L" : "M"}${x(p.mes).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${classe}`} role="group" aria-label={`Gráfico de ${nome} por mês`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRADE} strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={TEXTO}>{curto(t)}</text>
          </g>
        ))}
        {serie.map((p, i) => (pular && i % 2 && i !== serie.length - 1 ? null :
          <text key={p.mes} x={x(p.mes)} y={H - 10} textAnchor="middle" fontSize={11} fill={TEXTO}>{nomeMes(p.mes).replace("/20", "/")}</text>))}
        {meta !== null && (
          <g>
            <line x1={L} x2={W - R} y1={y(meta)} y2={y(meta)} stroke={META} strokeWidth={1.5} />
            <text x={W - R + 6} y={y(meta) + 4} fontSize={11} fill={TEXTO}>{`Meta ${formatarNumero(meta, unidade)}`}</text>
          </g>
        )}
        <path d={caminho} fill="none" stroke={SERIE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {serie.map((p) => {
          const rotulo = `${nomeMes(p.mes)}: ${formatarNumero(p.valor, unidade)}`;
          return (
            <g key={p.mes} tabIndex={0} role="img" aria-label={rotulo} className="focus:outline-none [&:focus>circle]:stroke-[#2a2620]">
              <title>{rotulo}</title>
              <circle cx={x(p.mes)} cy={y(p.valor)} r={10} fill="transparent" />
              <circle cx={x(p.mes)} cy={y(p.valor)} r={4.5} fill={SERIE} stroke="#ffffff" strokeWidth={2} />
            </g>
          );
        })}
        <text x={x(ultimo.mes)} y={y(ultimo.valor) - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill="#2a2620">{formatarNumero(ultimo.valor, unidade)}</text>
      </svg>
    );
  };
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="text-[0.85rem] font-bold text-tinta">{nome} — mês a mês</figcaption>
      {desenho(620, 220, serie.length > 8, "hidden sm:block")}
      {desenho(340, 200, serie.length > 4, "sm:hidden")}
      <details className="text-[0.88rem]">
        <summary className="cursor-pointer font-bold text-ouro-texto">Ver em tabela</summary>
        <table className="mt-2 border-collapse">
          <thead><tr><th className="px-2 py-1 text-left text-sec">Mês</th><th className="px-2 py-1 text-right text-sec">Valor</th></tr></thead>
          <tbody>{serie.map((p) => <tr key={p.mes} className="border-t border-linha"><td className="px-2 py-1">{nomeMes(p.mes)}</td><td className="px-2 py-1 text-right tabular-nums">{formatarNumero(p.valor, unidade)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
