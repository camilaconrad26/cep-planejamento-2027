import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterPlano } from "@/lib/data/planejamento";
import { obterMetas } from "@/lib/data/metas";
import { obterResultados } from "@/lib/data/resultados";
import { obterAcoes } from "@/lib/data/acoes";
import { obterRevisoes } from "@/lib/data/revisao";
import { montarArvore } from "@/lib/domain/arvore";
import { lerFechamento } from "@/lib/domain/fechamento";
import { nomePerfil } from "@/lib/domain/perfis";
import { formatarMoeda } from "@/lib/domain/moeda";
import { ALTURAS } from "@/lib/domain/metas";
import { formatarData, nomeStatus } from "@/lib/domain/acoes";
import { PERGUNTAS_REVISAO } from "@/lib/domain/revisao";
import { NOME_SITUACAO, formatarNumero, progressoKR, situacaoKPI } from "@/lib/domain/resultados";

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="mt-2 border-b border-ouro-fio pb-1 font-display text-xl font-bold text-tinta">{children}</h2>;
const pct = (f: number | null) => (f === null ? "—" : `${Math.round(f * 100)}%`);
const moeda = (n: number) => (n ? formatarMoeda(n) : "—");

/** O plano inteiro, só para leitura: usado na impressão (a própria aluna) e no painel da mentora. */
export async function RelatorioPlano({ orgId, userId }: { orgId: string; userId: string }) {
  const sb = await criarClienteServidor();
  const [perfil, diag, plano, metas, res, acoes, rev] = await Promise.all([
    sb.from("cep_profiles").select("nome, email, perfil").eq("user_id", userId).maybeSingle(),
    sb.from("cep_diagnostics").select("fechamento_ano, concluido_em").eq("org_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    obterPlano(orgId), obterMetas(orgId), obterResultados(orgId), obterAcoes(orgId), obterRevisoes(orgId),
  ]);
  const f = lerFechamento(diag.data?.fechamento_ano ?? {});
  const grupos = montarArvore({ ...plano, prioridades: [...new Set(plano.prioridades.map((p) => p.categoryId))] }, "ano");
  const nomeCat = (id: string) => plano.categorias.find((c) => c.id === id)?.nome ?? "";
  const avulsas = acoes.acoes.filter((a) => !a.objetivo);
  const m = metas.form;
  return (
    <article className="flex flex-col gap-4 text-[0.95rem] text-tinta">
      <header className="flex flex-col gap-1">
        <p className="text-[0.72rem] font-bold uppercase tracking-[.18em] text-ouro-texto">Planejamento Estratégico 2027 · CEP</p>
        <h1 className="font-display text-2xl font-bold">{perfil.data?.nome ?? "Aluna"}</h1>
        <p className="text-sec">{perfil.data?.email} · {nomePerfil(perfil.data?.perfil ?? null) ?? "Perfil não definido"} · Diagnóstico {diag.data?.concluido_em ? "concluído" : diag.data ? "em andamento" : "não iniciado"}</p>
      </header>

      <section><H2>Fechamento de 2026</H2>
        <p>Faturamento {moeda(f.faturamento)} · Meta {moeda(f.meta)} · Contratos {f.contratos || "—"}{f.origem && ` · Origem: ${f.origem}`}</p>
        {(["deuCerto", "naoFuncionou", "parar", "continuar", "comecar"] as const).map((k) => f.listas[k].length > 0 && (
          <p key={k}><b>{{ deuCerto: "Deu certo", naoFuncionou: "Não funcionou", parar: "Parar", continuar: "Continuar", comecar: "Começar" }[k]}:</b> {f.listas[k].map((i) => i.texto).join("; ")}</p>
        ))}
      </section>

      <section><H2>Prioridades por trimestre</H2>
        <ul>{[1, 2, 3, 4].map((t) => { const n = plano.prioridades.filter((p) => p.trimestre === t).map((p) => nomeCat(p.categoryId));
          return <li key={t}><b>{t}º trimestre:</b> {n.length ? n.join(", ") : "—"}</li>; })}</ul>
      </section>

      <section><H2>Objetivos e ações</H2>
        {grupos.length === 0 && <p className="text-sec">Nenhum objetivo ainda.</p>}
        {grupos.map((g) => (
          <div key={g.categoria.id} className="mt-2 break-inside-avoid">
            <h3 className="font-bold">{g.categoria.nome}{g.prioritaria && " · prioridade"}</h3>
            {g.objetivos.map((o) => (
              <div key={o.id} className="ml-3 mt-1">
                <p><b>{o.titulo}</b> <span className="text-sec">({o.trimestre ? `${o.trimestre}º tri` : "sem trimestre"})</span></p>
                <ul className="ml-4 list-disc">
                  {[...o.taticas, ...o.operacionais, ...o.semTrimestre].map((t) => <li key={t.id}>{t.titulo} — {t.nivel === "operacional" ? "operacional" : "tático"}, {t.trimestre ? `${t.trimestre}º tri` : "sem trimestre"}, {nomeStatus(t.status)}</li>)}
                  {o.okrs.flatMap((k) => k.krs.map((r) => { const p = progressoKR({ inicial: null, alvo: r.alvo, atual: null, ...res.krs.find((x) => x.id === r.id) });
                    return <li key={r.id}>KR: {r.descricao} — {p === null ? "sem meta numérica" : pct(p)}</li>; }))}
                  {o.kpis.map((k) => { const kp = res.kpis.find((x) => x.id === k.id); const s = kp ? situacaoKPI(kp, res.medicoes[k.id] ?? []) : null;
                    return <li key={k.id}>KPI: {k.nome} — {s ? NOME_SITUACAO[s.situacao] : "—"}{s?.ultima ? ` (última ${formatarNumero(s.ultima.valor, kp?.unidade)})` : ""}</li>; })}
                </ul>
              </div>
            ))}
          </div>
        ))}
        {avulsas.length > 0 && (<div className="mt-2"><h3 className="font-bold">Ações avulsas</h3>
          <ul className="ml-4 list-disc">{avulsas.map((a) => <li key={a.id}>{a.titulo} — {a.trimestre ? `${a.trimestre}º tri` : "sem trimestre"}, prazo {formatarData(a.prazo)}, {nomeStatus(a.status)}{a.responsavel && `, ${a.responsavel}`}</li>)}</ul></div>)}
      </section>

      <section className="break-inside-avoid"><H2>Metas financeiras</H2>
        <table className="mt-1 w-full max-w-xl border-collapse">
          <thead><tr className="text-left text-sec"><th className="py-1"></th>{ALTURAS.map((a) => <th key={a.valor} className="py-1 text-right">{a.nome}</th>)}</tr></thead>
          <tbody>
            <tr className="border-t border-linha"><td className="py-1">Faturamento anual</td>{ALTURAS.map((a) => <td key={a.valor} className="py-1 text-right tabular-nums">{moeda(m.anual[a.valor].faturamento)}</td>)}</tr>
            {[1, 2, 3, 4].map((t) => <tr key={t} className="border-t border-linha"><td className="py-1">{t}º trimestre</td>{ALTURAS.map((a) => <td key={a.valor} className="py-1 text-right tabular-nums">{moeda(m.trimestres[t as 1][a.valor])}</td>)}</tr>)}
          </tbody>
        </table>
        <p className="mt-1">Realizado: {[1, 2, 3, 4].map((t) => `${t}º tri ${moeda(m.realizado[t as 1])}`).join(" · ")}</p>
        {m.porque && <p><b>Por que essa meta:</b> {m.porque}</p>}
      </section>

      <section><H2>Revisões dos trimestres</H2>
        {rev.revisoes.filter((r) => r.concluidaEm).length === 0 && <p className="text-sec">Nenhuma revisão concluída.</p>}
        {rev.revisoes.filter((r) => r.concluidaEm).sort((a, b) => a.trimestre - b.trimestre).map((r) => (
          <div key={r.trimestre} className="mt-2 break-inside-avoid">
            <h3 className="font-bold">{r.trimestre}º trimestre — execução {pct(r.retrato?.execucao.pct ?? null)}, média dos KRs {pct(r.retrato?.krs.media ?? null)}</h3>
            <dl>{PERGUNTAS_REVISAO.filter((p) => r.respostas[p.chave]).map((p) => <div key={p.chave}><dt className="font-bold text-ouro-texto">{p.texto}</dt><dd className="whitespace-pre-line">{r.respostas[p.chave]}</dd></div>)}</dl>
          </div>
        ))}
      </section>
    </article>
  );
}
