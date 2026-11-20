"use client";
import { useEffect, useState, type InputHTMLAttributes } from "react";
import { formatarMoeda, parseMoeda } from "@/lib/domain/moeda";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { valor: number; onChange: (n: number) => void };

/** Campo de valor em reais: aceita "200000", "200.000" ou "R$ 200.000,00"; formata ao sair do campo. */
export function CampoMoeda({ valor, onChange, className = "campo text-right", ...rest }: Props) {
  const [texto, setTexto] = useState(valor ? formatarMoeda(valor) : "");
  useEffect(() => { setTexto((t) => (parseMoeda(t) === valor ? t : valor ? formatarMoeda(valor) : "")); }, [valor]);
  return (
    <input type="text" inputMode="decimal" className={className} placeholder="R$" {...rest} value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => { const n = parseMoeda(texto); setTexto(n ? formatarMoeda(n) : ""); onChange(n); }} />
  );
}
