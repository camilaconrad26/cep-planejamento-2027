import Link from "next/link";
import { Botao } from "@/components/ui/Botao";
import type { Pergunta as P, Respostas } from "@/lib/domain/diagnostico";

const opcao = "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-cartao border border-linha bg-white px-4 py-3 text-tinta hover:border-ouro-fio has-[:checked]:border-ouro-fio has-[:checked]:bg-papel-2 has-[:checked]:shadow-[0_0_0_1px_#c9a24b]";

export function Pergunta({ p, passo, total, respostas, acao }: { p: P; passo: number; total: number; respostas: Respostas; acao: (f: FormData) => Promise<void> }) {
  const atual = (respostas as Record<string, unknown>)[p.chave];
  const marcado = (v: string | number) => (Array.isArray(atual) ? atual.includes(String(v)) : atual !== undefined && String(atual) === String(v));
  const textoAtual = p.chave === "desafios" ? respostas.desafiosTexto : respostas.outro?.[p.chave];
  const ultima = passo === total;
  return (
    <form action={acao} className="flex flex-col gap-5 rounded-cartao border border-linha bg-white p-6 sm:p-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-[1.45rem] font-bold leading-snug text-tinta">{p.texto}</legend>
        {p.ajuda && <p className="-mt-1 text-sec">{p.ajuda}</p>}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {p.opcoes.map((o) => (
            <label key={String(o.valor)} className={opcao}>
              <input type={p.tipo === "unica" ? "radio" : "checkbox"} name="valor" value={String(o.valor)} defaultChecked={marcado(o.valor)} />
              <span>{o.rotulo}</span>
            </label>
          ))}
        </div>
        {p.textoLivre && (
          <div className="mt-2 flex flex-col gap-1.5">
            <label htmlFor="texto" className="font-bold text-tinta">Quer detalhar?</label>
            <textarea id="texto" name="texto" rows={3} maxLength={1000} defaultValue={textoAtual ?? ""} className="campo" placeholder="Opcional" />
          </div>
        )}
      </fieldset>
      {/* Ordem no DOM: Continuar primeiro, para o Enter avançar; a ordem visual é Voltar · Pular · Continuar. */}
      <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-3 border-t border-linha pt-5">
        <Botao type="submit" name="acao" value="continuar">{ultima ? "Ver resumo" : "Continuar"}</Botao>
        {!ultima ? <Botao type="submit" name="acao" value="pular" variante="secundario">Pular</Botao> : null}
        {passo > 1 && <Link href={`/diagnostico/${passo - 1}`} className="mr-auto px-2 py-3 font-bold text-ouro-texto underline underline-offset-4">Voltar</Link>}
      </div>
    </form>
  );
}
