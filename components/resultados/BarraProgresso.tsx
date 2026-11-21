/** Barra de progresso com o percentual em texto (não depende só da cor). */
export function BarraProgresso({ valor, rotulo }: { valor: number; rotulo: string }) {
  const p = Math.round(valor * 100);
  return (
    <div className="flex items-center gap-2">
      <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} className="h-2 w-full max-w-[14rem] overflow-hidden rounded-full bg-papel-2">
        <div className="h-full rounded-full bg-[#9a6b00]" style={{ width: `${p}%` }} />
      </div>
      <span className="text-[0.88rem] font-bold tabular-nums text-tinta">{p}%</span>
    </div>
  );
}
