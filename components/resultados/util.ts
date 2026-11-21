import { parseMoeda } from "@/lib/domain/moeda";
/** Campo numérico opcional: vazio vira null; aceita "12,5", "1.000", "R$ 1.000". */
export const lerNumero = (s: string): number | null => (s.trim() === "" ? null : parseMoeda(s));
export const pct = (f: number | null) => (f === null ? "—" : `${Math.round(f * 100)}%`);
