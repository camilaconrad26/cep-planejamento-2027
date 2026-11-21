"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { obterCicloId } from "@/lib/data/ciclo";
import { obterMetas } from "@/lib/data/metas";
import { salvarMetas } from "@/lib/data/metasAcoes";
import { mapaBiblioteca, mapearV1, mesclarMetas, mesclarRespostas } from "@/lib/domain/v1";
import { lerFechamento, type ChaveLista, type ItemLista } from "@/lib/domain/fechamento";
import { linhasAlteradas, nadaAlterado } from "@/lib/domain/metas";

type Erro = { error: { message: string } | null };
class Falha extends Error {}
/** Toda gravação é conferida: um erro interrompe a importação e devolve a reserva (dá para tentar de novo). */
const ok = <T extends Erro>(r: T, etapa: string): T => { if (r.error) throw new Falha(etapa); return r; };

/** Importa o planejamento que a aluna preencheu na versão anterior (spec §9).
 *  Reserva a importação antes de começar (dois cliques não importam duas vezes), não substitui nada
 *  já preenchido na v2 e não repete o que já entrou numa tentativa anterior. */
export async function importarV1(): Promise<{ ok?: string; erro?: string }> {
  const s = await obterSessao();
  if (!s) return { erro: "Sua sessão expirou. Entre de novo." };
  const sb = await criarClienteServidor();
  const [perfil, v1] = await Promise.all([
    sb.from("cep_profiles").select("perfil, importado_v1_em").eq("user_id", s.userId).maybeSingle(),
    sb.from("cep2027_planos").select("dados").eq("user_id", s.userId).maybeSingle(),
  ]);
  if (perfil.data?.importado_v1_em) return { erro: "Seu planejamento da versão anterior já foi importado." };
  if (!v1.data) return { erro: "Não encontramos um planejamento seu na versão anterior." };

  // Reserva: só uma importação passa daqui.
  const reserva = await sb.from("cep_profiles").update({ importado_v1_em: new Date().toISOString() })
    .eq("user_id", s.userId).is("importado_v1_em", null).select("user_id");
  if (reserva.error) return { erro: "Não foi possível importar agora. Tente de novo." };
  if (!reserva.data?.length) return { erro: "Seu planejamento da versão anterior já foi importado." };

  const m = mapearV1(v1.data.dados);
  const agora = new Date().toISOString();
  try {
    const org = s.orgId;
    const ciclo = await obterCicloId(sb, org);
    const perfilAluna = perfil.data?.perfil ?? m.perfil ?? 1;
    if (!perfil.data?.perfil && m.perfil) ok(await sb.from("cep_profiles").update({ perfil: m.perfil }).eq("user_id", s.userId), "o perfil");

    // Biblioteca: só itens ativos; se houver repetido, o original.
    const lib = ok(await sb.from("cep_library_items").select("id, perfil, nivel, ordem, ativo, cep_categories(ordem)"), "a biblioteca").data ?? [];
    const idLib = mapaBiblioteca(lib.flatMap((i) => {
      const c = Array.isArray(i.cep_categories) ? i.cep_categories[0] : (i.cep_categories as { ordem: number } | null);
      return c ? [{ id: i.id, perfil: i.perfil, nivel: i.nivel, ordemCategoria: c.ordem, ordem: i.ordem, ativo: i.ativo }] : [];
    }));
    const cats = ok(await sb.from("cep_categories").select("id, ordem"), "as categorias").data ?? [];
    const idCat = (cat: number) => cats.find((c) => c.ordem === cat + 1)?.id;
    const TABELA = [["cep_objectives", "titulo"], ["cep_tasks", "titulo"], ["cep_tasks", "titulo"], ["cep_key_results", "descricao"], ["cep_kpis", "nome"]] as const;

    // Itens próprios (e itens que a biblioteca não tem mais) entram com o texto da aluna.
    const proprios = [...m.proprios];
    for (const it of m.itens) {
      const id = idLib.get(`${it.perfil}:${it.cat}:${it.nivel}`);
      if (!id) { if (it.texto) proprios.push({ cat: it.cat, nivel: it.nivel, texto: it.texto, tri: it.tri, prazo: it.prazo, status: it.status }); continue; }
      const { data: r } = ok(await sb.rpc("cep_adicionar_item", { p_item: id, p_trimestre: it.tri ?? 1 }), "os itens da biblioteca");
      const res = r as { id: string; ja_no_plano: boolean };
      if (res.ja_no_plano) continue; // já estava no plano da v2: não mexe.
      const [tabela, coluna] = TABELA[it.nivel];
      if (it.texto) ok(await sb.from(tabela).update({ [coluna]: it.texto.slice(0, 1000) } as never).eq("id", res.id), "os textos editados");
      if (it.nivel === 1 || it.nivel === 2) {
        ok(await sb.from("cep_tasks").update({ prazo: it.prazo, status: it.status, concluido_em: it.status === "concluido" ? agora : null, trimestre: it.tri }).eq("id", res.id), "os itens da biblioteca");
      }
    }

    for (const p of proprios) {
      const categoria = idCat(p.cat);
      if (!categoria) continue;
      const titulo = p.texto.slice(0, 1000);
      if (p.nivel === 0) {
        const ja = ok(await sb.from("cep_objectives").select("id").eq("cycle_id", ciclo).eq("titulo", titulo).limit(1), "os objetivos").data;
        if (!ja?.length) ok(await sb.from("cep_objectives").insert({ org_id: org, cycle_id: ciclo, category_id: categoria, titulo, trimestre: p.tri }), "os objetivos");
        continue;
      }
      const estr = idLib.get(`${perfilAluna}:${p.cat}:0`);
      if (!estr) continue;
      const { data: r } = ok(await sb.rpc("cep_adicionar_item", { p_item: estr, p_trimestre: p.tri ?? 1 }), "os itens próprios");
      const objetivo = (r as { id: string }).id;
      if (p.nivel === 1 || p.nivel === 2) {
        const ja = ok(await sb.from("cep_tasks").select("id").eq("objective_id", objetivo).eq("titulo", titulo).limit(1), "os itens próprios").data;
        if (!ja?.length) ok(await sb.from("cep_tasks").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, nivel: p.nivel === 1 ? "tatico" : "operacional", titulo,
          trimestre: p.tri, prazo: p.prazo, status: p.status, concluido_em: p.status === "concluido" ? agora : null }), "os itens próprios");
      } else if (p.nivel === 3) {
        let okr = ok(await sb.from("cep_okrs").select("id").eq("objective_id", objetivo).order("created_at").limit(1).maybeSingle(), "os OKRs").data;
        if (!okr) okr = ok(await sb.from("cep_okrs").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, titulo: "Resultados-chave", trimestre: p.tri }).select("id").single(), "os OKRs").data;
        const ja = ok(await sb.from("cep_key_results").select("id, cep_okrs!inner(objective_id)").eq("cep_okrs.objective_id", objetivo).eq("descricao", titulo).limit(1), "os resultados-chave").data;
        if (okr && !ja?.length) ok(await sb.from("cep_key_results").insert({ org_id: org, okr_id: okr.id, descricao: titulo }), "os resultados-chave");
      } else {
        const ja = ok(await sb.from("cep_kpis").select("id").eq("objective_id", objetivo).eq("nome", titulo).limit(1), "os indicadores").data;
        if (!ja?.length) ok(await sb.from("cep_kpis").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, nome: titulo }), "os indicadores");
      }
    }

    // Tarefas soltas e pendências levadas para 2027 (sem objetivo); guardamos o id criado para ligar às listas do fechamento.
    const tarefaCriada = new Map<string, { id: string; tri: number | null }>();
    const avulsas = [...m.tarefas.map((t) => ({ ...t, chave: t.idV1 ? `t:${t.idV1}` : null })), ...m.pendencias.map((t) => ({ ...t, chave: `p:${t.itemId}` }))];
    for (const t of avulsas) {
      const titulo = t.texto.slice(0, 1000);
      const ja = ok(await sb.from("cep_tasks").select("id, trimestre").eq("cycle_id", ciclo).is("objective_id", null).eq("titulo", titulo).limit(1), "as tarefas").data?.[0];
      const id = ja ?? ok(await sb.from("cep_tasks").insert({ org_id: org, cycle_id: ciclo, nivel: "operacional", titulo, trimestre: t.tri,
        status: t.feito ? "concluido" : "nao_iniciado", concluido_em: t.feito ? agora : null }).select("id, trimestre").single(), "as tarefas").data;
      if (t.chave && id) tarefaCriada.set(t.chave, { id: id.id, tri: id.trimestre });
    }

    // Fechamento de 2026: só se o diagnóstico ainda não tem um. Itens ligados a tarefas apontam para as tarefas da v2.
    const { data: diag } = ok(await sb.from("cep_diagnostics").select("id, fechamento_ano").eq("org_id", org).order("created_at", { ascending: false }).limit(1).maybeSingle(), "o fechamento de 2026");
    const atual = lerFechamento(diag?.fechamento_ano ?? {});
    const vazio = !atual.faturamento && !atual.meta && Object.values(atual.listas).every((l) => !l.length);
    if (!diag || vazio) {
      const listas = Object.fromEntries(Object.entries(m.fechamento.listas).map(([k, itens]) => [k, itens.map((i) => {
        const { tarefaV1, ...resto } = i as ItemLista & { tarefaV1?: string };
        const t = tarefaCriada.get(k === "pendencias" ? `p:${i.id}` : `t:${tarefaV1}`);
        return t ? { ...resto, tarefaId: t.id, ...(t.tri ? { tarefaTri: t.tri } : {}) } : resto;
      })])) as Record<ChaveLista, ItemLista[]>;
      const fechamento = { ...m.fechamento, listas };
      if (!diag) ok(await sb.from("cep_diagnostics").insert({ org_id: org, user_id: s.userId, respostas: {}, fechamento_ano: fechamento as never }), "o fechamento de 2026");
      else ok(await sb.from("cep_diagnostics").update({ fechamento_ano: fechamento as never }).eq("id", diag.id), "o fechamento de 2026");
    }

    // Metas: só completa o que está vazio na v2.
    const v2 = await obterMetas(org);
    const mescladas = mesclarMetas(v2.form, m.metas);
    const alt = linhasAlteradas(v2.form, mescladas);
    if (!nadaAlterado(alt)) { const r = await salvarMetas(mescladas, alt); if (r.erro) throw new Falha("as metas"); }
    for (const v of m.vendas) {
      const ja = ok(await sb.from("cep_sales_actions").select("id").eq("cycle_id", ciclo).eq("mes", v.mes).eq("produto", v.produto).eq("acao", v.acao).limit(1), "as ações de vendas").data;
      if (!ja?.length) ok(await sb.from("cep_sales_actions").insert({ org_id: org, cycle_id: ciclo, ...v }), "as ações de vendas");
    }

    // Revisões: só as respostas ainda em branco na v2.
    for (const rv of m.revisoes) {
      const atualRv = ok(await sb.from("cep_reviews").select("respostas").eq("cycle_id", ciclo).eq("trimestre", rv.trimestre).maybeSingle(), "as revisões").data;
      const v1r: Record<string, string | undefined> = { executado: rv.aprendizado || undefined, alterar: rv.ajustes.join("\n") || undefined };
      const respostas = mesclarRespostas((atualRv?.respostas ?? {}) as Record<string, string | undefined>, v1r);
      ok(await sb.from("cep_reviews").upsert({ org_id: org, cycle_id: ciclo, trimestre: rv.trimestre, respostas }, { onConflict: "cycle_id,trimestre" }), "as revisões");
    }
  } catch (e) {
    // Devolve a reserva: a aluna pode tentar de novo, e o que já entrou não se repete.
    await sb.from("cep_profiles").update({ importado_v1_em: null }).eq("user_id", s.userId);
    return { erro: e instanceof Falha ? `A importação parou em ${e.message}. Tente de novo; o que já entrou não se repete.` : "Não foi possível importar agora. Tente de novo." };
  }
  for (const p of ["/configuracoes", "/visao-geral", "/planejamento", "/plano-de-acao", "/metas", "/diagnostico", "/revisao"]) revalidatePath(p);
  return { ok: "Planejamento importado. Confira cada tela e ajuste o que precisar." };
}
