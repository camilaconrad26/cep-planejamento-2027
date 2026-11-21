export { lerNumeroEstrito as lerNumero } from "@/lib/domain/resultados";
export const pct = (f: number | null) => (f === null ? "—" : `${Math.round(f * 100)}%`);
