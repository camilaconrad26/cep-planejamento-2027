"use server";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterSessao } from "@/lib/data/sessao";
import { obterCicloId } from "@/lib/data/ciclo";
import { salvarMetas } from "@/lib/data/metasAcoes";
import { mapearV1 } from "@/lib/domain/v1";
import { lerFechamento } from "@/lib/domain/fechamento";
import { linhasAlteradas, metasVazias } from "@/lib/domain/metas";

const NIVEIS = ["estrategico", "tatico", "operacional", "okr", "kpi"] as const;

/** Importa, uma vez, o planejamento que a aluna preencheu na versão anterior (spec §9). */
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
  const m = mapearV1(v1.data.dados);
  const falha = (etapa: string) => ({ erro: `A importação parou em ${etapa}. Tente de novo; o que já entrou não se repete.` });
  try {
    const org = s.orgId;
    const ciclo = await obterCicloId(sb, org);
    const perfilAluna = perfil.data?.perfil ?? m.perfil ?? 1;
    if (!perfil.data?.perfil && m.perfil) await sb.from("cep_profiles").update({ perfil: m.perfil }).eq("user_id", s.userId);

    // Fechamento de 2026: só se o diagnóstico ainda não tem um.
    const { data: diag } = await sb.from("cep_diagnostics").select("id, fechamento_ano").eq("org_id", org).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const atual = lerFechamento(diag?.fechamento_ano ?? {});
    const vazio = !atual.faturamento && !atual.meta && Object.values(atual.listas).every((l) => !l.length);
    if (!diag) { const { error } = await sb.from("cep_diagnostics").insert({ org_id: org, user_id: s.userId, respostas: {}, fechamento_ano: m.fechamento as never }); if (error) return falha("o fechamento de 2026"); }
    else if (vazio) { const { error } = await sb.from("cep_diagnostics").update({ fechamento_ano: m.fechamento as never }).eq("id", diag.id); if (error) return falha("o fechamento de 2026"); }

    // Biblioteca: (perfil, categoria, nível) → id.
    const { data: lib } = await sb.from("cep_library_items").select("id, perfil, nivel, cep_categories(ordem)");
    const idLib = new Map<string, string>();
    for (const i of lib ?? []) {
      const c = Array.isArray(i.cep_categories) ? i.cep_categories[0] : (i.cep_categories as { ordem: number } | null);
      if (c) idLib.set(`${i.perfil}:${c.ordem - 1}:${NIVEIS.indexOf(i.nivel as (typeof NIVEIS)[number])}`, i.id);
    }
    const { data: cats } = await sb.from("cep_categories").select("id, ordem");
    const idCat = (cat: number) => cats?.find((c) => c.ordem === cat + 1)?.id;

    for (const it of m.itens) {
      const id = idLib.get(`${it.perfil}:${it.cat}:${it.nivel}`);
      if (!id) continue;
      const { error } = await sb.rpc("cep_adicionar_item", { p_item: id, p_trimestre: it.tri ?? 1 });
      if (error) return falha("os itens da biblioteca");
      if (it.nivel === 1 || it.nivel === 2) {
        await sb.from("cep_tasks").update({ prazo: it.prazo, status: it.status, concluido_em: it.status === "concluido" ? new Date().toISOString() : null, trimestre: it.tri })
          .eq("cycle_id", ciclo).eq("library_item_id", id);
      }
    }

    for (const p of m.proprios) {
      const categoria = idCat(p.cat);
      if (!categoria) continue;
      if (p.nivel === 0) { await sb.from("cep_objectives").insert({ org_id: org, cycle_id: ciclo, category_id: categoria, titulo: p.texto, trimestre: p.tri }); continue; }
      const estr = idLib.get(`${perfilAluna}:${p.cat}:0`);
      if (!estr) continue;
      const { data: r, error } = await sb.rpc("cep_adicionar_item", { p_item: estr, p_trimestre: p.tri ?? 1 });
      if (error || !r) return falha("os itens próprios");
      const objetivo = (r as { id: string }).id;
      if (p.nivel === 1 || p.nivel === 2) {
        await sb.from("cep_tasks").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, nivel: p.nivel === 1 ? "tatico" : "operacional", titulo: p.texto, trimestre: p.tri,
          prazo: p.prazo, status: p.status, concluido_em: p.status === "concluido" ? new Date().toISOString() : null });
      } else if (p.nivel === 3) {
        let { data: okr } = await sb.from("cep_okrs").select("id").eq("objective_id", objetivo).order("created_at").limit(1).maybeSingle();
        if (!okr) ({ data: okr } = await sb.from("cep_okrs").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, titulo: "Resultados-chave", trimestre: p.tri }).select("id").single());
        if (okr) await sb.from("cep_key_results").insert({ org_id: org, okr_id: okr.id, descricao: p.texto });
      } else {
        await sb.from("cep_kpis").insert({ org_id: org, cycle_id: ciclo, objective_id: objetivo, nome: p.texto });
      }
    }

    const avulsas = [...m.tarefas, ...m.pendencias].map((t) => ({ org_id: org, cycle_id: ciclo, nivel: "operacional" as const, titulo: t.texto.slice(0, 1000), trimestre: t.tri,
      status: t.feito ? "concluido" as const : "nao_iniciado" as const, concluido_em: t.feito ? new Date().toISOString() : null }));
    if (avulsas.length) { const { error } = await sb.from("cep_tasks").insert(avulsas); if (error) return falha("as tarefas"); }

    const r = await salvarMetas(m.metas, linhasAlteradas(metasVazias(), m.metas));
    if (r.erro) return falha("as metas");
    if (m.vendas.length) { const { error } = await sb.from("cep_sales_actions").insert(m.vendas.map((v) => ({ org_id: org, cycle_id: ciclo, ...v }))); if (error) return falha("as ações de vendas"); }
    for (const rv of m.revisoes) {
      await sb.from("cep_reviews").upsert({ org_id: org, cycle_id: ciclo, trimestre: rv.trimestre,
        respostas: { executado: rv.aprendizado || undefined, alterar: rv.ajustes.join("\n") || undefined } }, { onConflict: "cycle_id,trimestre" });
    }

    const { error } = await sb.from("cep_profiles").update({ importado_v1_em: new Date().toISOString() }).eq("user_id", s.userId);
    if (error) return falha("a finalização");
  } catch { return { erro: "Não foi possível importar agora. Tente de novo." }; }
  for (const p of ["/configuracoes", "/visao-geral", "/planejamento", "/plano-de-acao", "/metas", "/diagnostico", "/revisao"]) revalidatePath(p);
  return { ok: "Planejamento importado. Confira cada tela e ajuste o que precisar." };
}
