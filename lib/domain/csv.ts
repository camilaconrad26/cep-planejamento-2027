// CSV para abrir direto no Excel em português: ";" como separador, vírgula decimal, BOM e proteção contra fórmula.
const numero = new Intl.NumberFormat("pt-BR", { useGrouping: false, maximumFractionDigits: 2 });
function celula(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? (Number.isFinite(v) ? numero.format(v) : "") : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; // impede que o Excel execute como fórmula
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function linhasCsv(cabecalho: string[], linhas: (string | number | null)[][]): string {
  return "﻿" + [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
}
