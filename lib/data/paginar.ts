import "server-only";

/** Busca todas as linhas em páginas de 1000 (o Supabase corta respostas maiores sem avisar). */
export async function buscarTodas<T>(pagina: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await pagina(de, de + 999);
    if (error) throw new Error("Não foi possível carregar as medições.");
    todas.push(...(data ?? []));
    if (!data || data.length < 1000) return todas;
  }
}
