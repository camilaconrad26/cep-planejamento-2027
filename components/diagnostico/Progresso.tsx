export function Progresso({ passo, total }: { passo: number; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ouro">Pergunta {passo} de {total}</p>
      <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <i className="block h-full rounded-full bg-ouro" style={{ width: `${(passo / total) * 100}%` }} />
      </div>
    </div>
  );
}
