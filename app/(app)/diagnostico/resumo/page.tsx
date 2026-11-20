import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { exigirSessao } from "@/lib/data/sessao";
import { confirmarPerfil, obterDiagnostico, refazerDiagnostico } from "@/lib/data/diagnostico";
import { nomeCategoria } from "@/lib/domain/categorias";
import { resumirDiagnostico, sugerirPerfil } from "@/lib/domain/diagnostico";
import { PERFIS } from "@/lib/domain/perfis";

export const metadata: Metadata = { title: "Resumo do diagnóstico" };

export default async function Resumo({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const s = await exigirSessao();
  const d = await obterDiagnostico(s.orgId);
  if (!d?.concluidoEm) redirect("/diagnostico");
  const notas = ((d.fechamento as { notas?: Record<string, number> }).notas) ?? {};
  const r = resumirDiagnostico(d.respostas, notas);
  const sugerido = sugerirPerfil(d.respostas);
  const lista = (titulo: string, itens: string[], vazio: string) => (
    <div className="flex min-w-0 flex-1 basis-64 flex-col gap-2">
      <h3 className="font-display text-lg font-bold text-tinta">{titulo}</h3>
      {itens.length ? <ul className="flex list-disc flex-col gap-1 pl-5">{itens.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="text-sec">{vazio}</p>}
    </div>
  );
  return (
    <>
      <FaixaTitulo olho="Etapa 1 · Concluída" titulo="Resumo do diagnóstico" descricao="O que as suas respostas mostram e por onde começar o planejamento de 2027." />
      <Corpo>
        {ok && <p role="status" className="rounded-cartao border border-ok bg-white px-5 py-3 font-bold text-ok">{`Perfil ${ok} confirmado.`}</p>}
        <Cartao titulo="O que as respostas mostram">
          <div className="flex flex-wrap gap-6">
            {lista("Pontos fortes", r.fortes, "Nenhum ponto forte apareceu nas respostas de estrutura.")}
            {lista("Pontos de atenção", r.atencao, "Nenhum ponto de atenção apareceu nas respostas de estrutura.")}
          </div>
        </Cartao>
        <Cartao titulo="Prioridades sugeridas">
          {r.prioridades.length ? (
            <ol aria-label="Prioridades sugeridas" className="flex flex-col gap-2">
              {r.prioridades.map((slug, i) => (
                <li key={slug} className="flex items-center gap-3"><span aria-hidden="true" className="font-display text-xl font-bold text-ouro-texto">0{i + 1}</span><span>{nomeCategoria(slug)}</span></li>
              ))}
            </ol>
          ) : <p className="text-sec">Responda as perguntas de estrutura e de desafios para recebermos sugestões de prioridade.</p>}
          <p className="text-sec">Use estas categorias como ponto de partida ao escolher as prioridades de cada trimestre.</p>
        </Cartao>
        <Cartao titulo="Seu perfil">
          {sugerido ? (
            <form action={confirmarPerfil} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="perfil" value={sugerido} />
              <p className="min-w-0 flex-1 basis-72">Pelas respostas, o perfil sugerido é <b>{PERFIS[sugerido - 1].nome}</b>: {PERFIS[sugerido - 1].texto}</p>
              <Botao type="submit">{`Confirmar Perfil ${sugerido}`}</Botao>
            </form>
          ) : <p className="text-sec">Responda ao menos o estágio ou a quantidade de projetos para sugerirmos um perfil.</p>}
          <form action={confirmarPerfil} className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2 font-bold text-tinta">{sugerido ? "Ou escolha outro perfil" : "Escolha o seu perfil"}</legend>
              <div className="grid gap-2.5 md:grid-cols-3">
                {PERFIS.map((p) => (
                  <label key={p.n} className="flex cursor-pointer gap-3 rounded-cartao border border-linha bg-white p-4 hover:border-ouro-fio has-[:checked]:border-ouro-fio has-[:checked]:bg-papel-2">
                    <input type="radio" name="perfil" value={p.n} defaultChecked={s.perfil === p.n} required />
                    <span><b className="block font-display text-tinta">{p.nome}</b><small className="text-sec">{p.texto}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div><Botao type="submit" variante="secundario">Confirmar perfil escolhido</Botao></div>
          </form>
        </Cartao>
        <div className="flex flex-wrap gap-3">
          <Link href="/diagnostico/1" className="inline-flex min-h-[48px] items-center rounded-full border-[1.5px] border-ouro-fio px-6 font-bold text-ouro-texto hover:bg-papel-2">Editar respostas</Link>
          <form action={refazerDiagnostico}><Botao type="submit" variante="secundario">Refazer diagnóstico</Botao></form>
        </div>
      </Corpo>
    </>
  );
}
