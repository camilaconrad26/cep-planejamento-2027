import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/data/tipos";

/** Cliente do Supabase para Server Components e Server Actions, com a sessão da aluna nos cookies. */
export async function criarClienteServidor() {
  const loja = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try { lista.forEach(({ name, value, options }) => loja.set(name, value, options)); }
        catch { /* Server Component: o middleware renova a sessão */ }
      },
    },
  });
}
