/** Só aceita caminhos internos ("/algo"), nunca "//host" ou URLs absolutas: evita redirecionar para fora do site. */
export const voltaSegura = (v: unknown, padrao = "/visao-geral"): string =>
  typeof v === "string" && /^\/(?![/\\])/.test(v) ? v : padrao;
