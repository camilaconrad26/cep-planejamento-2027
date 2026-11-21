import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Toda ação de servidor usa a sessão da própria aluna, então o RLS (supabase/tests/seguranca.sql) limita o que ela alcança.
// Uma chave privilegiada no app furaria isso: este teste impede que ela entre.
const arquivos = (d: string): string[] => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? (f === "__tests__" ? [] : arquivos(p)) : /\.(ts|tsx)$/.test(f) ? [p] : [];
});

it("o app não usa chave privilegiada do Supabase", () => {
  const achados = ["app", "lib", "components"].flatMap(arquivos).concat("middleware.ts")
    .filter((f) => /service_role|SERVICE_ROLE|SUPABASE_SECRET/.test(readFileSync(f, "utf8")));
  expect(achados).toEqual([]);
});
