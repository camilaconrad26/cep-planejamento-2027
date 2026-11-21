type C = { total: number; emAndamento: number; atrasadas: number; vencendo7dias: number; execucaoPct: number };

export function Numeros({ c }: { c: C }) {
  const item = (rotulo: string, valor: string, id?: string, alerta?: boolean) => (
    <div className="min-w-0 border-t-[1.5px] border-ouro-fio pt-2.5">
      <dt className="text-[0.7rem] font-bold uppercase tracking-[.18em] text-sec">{rotulo}</dt>
      <dd data-testid={id} className={`font-display text-[1.7rem] font-bold tabular-nums ${alerta ? "text-alerta" : "text-tinta"}`}>{valor}</dd>
    </div>
  );
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {item("Ações no plano", String(c.total), "total-acoes")}
      {item("Em andamento", c.total ? String(c.emAndamento) : "—")}
      {item("Atrasadas", c.total ? String(c.atrasadas) : "—", undefined, c.atrasadas > 0)}
      {item("Vencem em 7 dias", c.total ? String(c.vencendo7dias) : "—")}
      {item("Execução", c.total ? `${c.execucaoPct}%` : "—", "execucao")}
    </dl>
  );
}
