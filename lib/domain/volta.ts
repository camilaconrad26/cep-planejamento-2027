/**
 * Só aceita caminhos internos ("/algo"). Recusa "//host", "/\host" e caracteres de controle
 * (tab, quebra de linha), que os navegadores removem e transformam "/\t/host" em "//host".
 */
export function voltaSegura(v: unknown, padrao = "/visao-geral"): string {
  if (typeof v !== "string" || !v.startsWith("/") || /[\u0000-\u001f\\]/.test(v)) return padrao;
  try {
    const u = new URL(v, "http://cep.local");
    if (u.origin !== "http://cep.local") return padrao;
    return u.pathname + u.search + u.hash;
  } catch { return padrao; }
}
