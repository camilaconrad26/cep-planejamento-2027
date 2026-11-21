import "server-only";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { obterCicloId } from "@/lib/data/ciclo";
import { lerFechamento } from "@/lib/domain/fechamento";
import { metasVazias, type AcaoVenda, type Altura, type MetasForm, type TipoProduto } from "@/lib/domain/metas";

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : Number(x) || 0);

/** Metas financeiras do ciclo ativo, ações de vendas e o faturamento de 2026 informado no fechamento. */
export async function obterMetas(orgId: string): Promise<{ cicloId: string; form: MetasForm; acoes: AcaoVenda[]; base2026: number }> {
  const sb = await criarClienteServidor();
  const cicloId = await obterCicloId(sb, orgId);
  const [ciclo, metas, prods, reais, vendas, diag] = await Promise.all([
    sb.from("cep_cycles").select("meta_porque").eq("id", cicloId).single(),
    sb.from("cep_financial_goals").select("trimestre, altura, faturamento, lucratividade, anuncios, time").eq("cycle_id", cicloId),
    sb.from("cep_products").select("tipo, nome, ticket, vendas_meta, vendas_super, vendas_mega").eq("cycle_id", cicloId),
    sb.from("cep_quarter_results").select("trimestre, faturamento_realizado").eq("cycle_id", cicloId),
    sb.from("cep_sales_actions").select("id, mes, produto, acao, ticket, quantidade, responsavel").eq("cycle_id", cicloId).order("created_at"),
    sb.from("cep_diagnostics").select("fechamento_ano").eq("org_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const form = metasVazias();
  form.porque = ciclo.data?.meta_porque ?? "";
  for (const g of metas.data ?? []) {
    const a = g.altura as Altura;
    if (g.trimestre === null) form.anual[a] = { faturamento: num(g.faturamento), lucratividade: num(g.lucratividade), anuncios: num(g.anuncios), time: num(g.time) };
    else if (g.trimestre >= 1 && g.trimestre <= 4) form.trimestres[g.trimestre as 1 | 2 | 3 | 4][a] = num(g.faturamento);
  }
  for (const p of prods.data ?? []) {
    form.produtos[p.tipo as TipoProduto] = { nome: p.nome ?? "", ticket: num(p.ticket), vendas: { meta: num(p.vendas_meta), super: num(p.vendas_super), mega: num(p.vendas_mega) } };
  }
  for (const q of reais.data ?? []) if (q.trimestre >= 1 && q.trimestre <= 4) form.realizado[q.trimestre as 1 | 2 | 3 | 4] = num(q.faturamento_realizado);
  return {
    cicloId: cicloId as string, form,
    acoes: (vendas.data ?? []).map((v) => ({ id: v.id, mes: v.mes, produto: v.produto ?? "", acao: v.acao ?? "", ticket: num(v.ticket), quantidade: num(v.quantidade), responsavel: v.responsavel ?? "" })),
    base2026: lerFechamento(diag.data?.fechamento_ano ?? {}).faturamento,
  };
}
