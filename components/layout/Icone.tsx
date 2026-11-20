import type { Icone as Nome } from "@/components/layout/itensMenu";

// Ícones de traço, 24×24, mesma espessura em todos.
const D: Record<Nome, string> = {
  inicio: "M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z",
  diagnostico: "M9 4h6v3H9zM7 5.5H5.5V20h13V5.5H17M8.5 11h7M8.5 14.5h7M8.5 18h4",
  planejamento: "M12 3v18M12 3l6.5 4.5L12 12M5 21h14",
  biblioteca: "M5 4.5h4v15H5zM10.5 4.5h4v15h-4zM16 5.5l3.5-1 3 14.5-3.5 1z",
  acao: "M5 12.5 9.5 17 19 7.5",
  metas: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  revisao: "M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4",
  historico: "M12 7v5l3 2M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  config: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2.2.2-1.5-1.5L16.5 4.5l-3-1-1 2h-1l-1-2-3 1 .2 2.2L6.2 8.2 4 8l-1 3 2 1v1l-2 1 1 3 2.2-.2 1.5 1.5-.2 2.2 3 1 1-2h1l1 2 3-1-.2-2.2 1.5-1.5 2.2.2 1-3-2-1z",
  alunas: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .7 3.2 2.5 3.5 5.2",
};

export function Icone({ nome, className = "h-5 w-5" }: { nome: Nome; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={D[nome]} />
    </svg>
  );
}
