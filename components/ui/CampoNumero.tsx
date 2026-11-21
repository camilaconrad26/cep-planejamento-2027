"use client";
import { useEffect, useState, type InputHTMLAttributes } from "react";
import { parseMoeda } from "@/lib/domain/moeda";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { valor: number; onChange: (n: number) => void; inteiro?: boolean };
const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Número em formato brasileiro ("12,5", "1.000"); grava ao sair do campo. */
export function CampoNumero({ valor, onChange, inteiro, className = "campo text-right", ...rest }: Props) {
  const [texto, setTexto] = useState(valor ? fmt.format(valor) : "");
  useEffect(() => { setTexto((t) => (parseMoeda(t) === valor ? t : valor ? fmt.format(valor) : "")); }, [valor]);
  return (
    <input type="text" inputMode={inteiro ? "numeric" : "decimal"} className={className} {...rest} value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => { let n = Math.max(0, parseMoeda(texto)); if (inteiro) n = Math.round(n); setTexto(n ? fmt.format(n) : ""); onChange(n); }} />
  );
}
