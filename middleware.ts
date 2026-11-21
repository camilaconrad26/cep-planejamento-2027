import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/entrar", "/criar-conta"];

/** Renova a sessão a cada requisição e protege as rotas internas. */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const caminho = req.nextUrl.pathname;
  const publica = PUBLICAS.some((p) => caminho === p || caminho.startsWith(p + "/"));
  // Server Actions verificam a sessão sozinhas e respondem {erro:"sessao"}; redirecionar aqui faria o
  // navegador receber uma página no lugar da resposta e a aluna veria "verifique a conexão".
  const acao = req.method === "POST" && req.headers.has("next-action");
  // Download da planilha: responde 401 com texto (redirecionar faria o navegador salvar a página de login).
  const arquivo = caminho.startsWith("/exportar/");
  if (!user && !publica && !acao && !arquivo) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = caminho === "/" ? "" : `?volta=${encodeURIComponent(caminho + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (user && publica) {
    const url = req.nextUrl.clone(); url.pathname = "/visao-geral"; url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|cep-selo.*\\.webp|estilo).*)"],
};
