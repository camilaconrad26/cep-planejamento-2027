"use client";
/** Seletor de trimestre com opção "Sem trimestre". */
export function SeletorTrimestre({ rotulo, valor, onChange, id }: { rotulo: string; valor: number | null; onChange: (v: number | null) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta">{rotulo.replace(/ d[oa] (objetivo|ação)$/, "")}
      <select id={id} aria-label={rotulo} value={valor ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className="campo font-normal">
        <option value="">Sem trimestre</option>
        {[1, 2, 3, 4].map((t) => <option key={t} value={t}>{t}º trimestre</option>)}
      </select>
    </label>
  );
}
export const nomeTri = (t: number | null) => (t ? `${t}º trimestre` : "Sem trimestre");
