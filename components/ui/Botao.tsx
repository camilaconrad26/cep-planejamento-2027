import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "perigo";
  tamanho?: "normal" | "mini";
  sobreEscuro?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] font-bold transition-colors disabled:cursor-default disabled:opacity-55";

const cores = {
  claro: {
    primario: "bg-ouro-texto border-ouro-texto text-white hover:bg-tinta hover:border-tinta",
    secundario: "bg-transparent border-ouro-fio text-ouro-texto hover:bg-papel-2 hover:text-tinta",
    perigo: "bg-alerta border-alerta text-white hover:bg-tinta hover:border-tinta",
  },
  escuro: {
    primario: "bg-ouro border-ouro text-noite hover:bg-creme hover:border-creme",
    secundario: "bg-transparent border-ouro-fio text-ouro hover:text-creme hover:border-creme",
    perigo: "bg-transparent border-[#f2a383] text-[#f2a383] hover:text-creme hover:border-creme",
  },
};

export function Botao({ variante = "primario", tamanho = "normal", sobreEscuro, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx(
        base,
        cores[sobreEscuro ? "escuro" : "claro"][variante],
        tamanho === "mini" ? "min-h-[38px] px-4 text-[0.84rem]" : "min-h-[48px] px-6 text-[0.95rem]",
        className,
      )}
      {...rest}
    />
  );
}
