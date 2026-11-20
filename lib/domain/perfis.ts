export const PERFIS = [
  { n: 1, nome: "Perfil 1 · Estruturação", texto: "Está entrando na área patrimonial. Ainda não tem casos próprios, ou está nos primeiros." },
  { n: 2, nome: "Perfil 2 · Consolidação", texto: "Atua de forma autônoma e já conduz casos patrimoniais. Quer consolidar método, preço e posicionamento." },
  { n: 3, nome: "Perfil 3 · Escala", texto: "Tem escritório com equipe e carteira de famílias empresárias. Quer escala, padrão e recorrência." },
] as const;
export const nomePerfil = (n: number | null) => (n ? PERFIS[n - 1]?.nome ?? null : null);
/** Primeiro passo sem resposta (1..10), ou null se todas respondidas. */
export function primeiraSemResposta(r: Record<string, unknown>, chaves: string[]): number | null {
  const i = chaves.findIndex((k) => { const v = r[k]; return v === undefined || v === "" || (Array.isArray(v) && v.length === 0); });
  return i < 0 ? null : i + 1;
}
