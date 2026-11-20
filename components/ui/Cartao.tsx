import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Cartao({ titulo, children, className }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7 sm:py-6", className)}>
      {titulo && <h2 className="font-display text-xl font-bold leading-snug text-tinta">{titulo}</h2>}
      {children}
    </section>
  );
}
