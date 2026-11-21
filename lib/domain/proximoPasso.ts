import type { Fase } from "@/lib/domain/ciclo";
import { destino, ROTAS, type Rota } from "@/lib/domain/rotas";

export type Retrato = {
  diagnosticoIniciado: boolean; diagnosticoConcluido: boolean; trimestre: 1 | 2 | 3 | 4; fase: Fase; categoriasNoTrimestre: number; categoriasSemAcao: string[];
  atrasadas: number; medicaoVencida: number; trimestreAnteriorSemRevisao: boolean; vencendo7dias: number;
};
export type CodigoPasso = "diagnostico" | "diagnostico-continuar" | "prioridades" | "categoria-sem-acao" | "atrasadas" | "medir" | "revisao" | "vencendo" | "em-dia";
export type Passo = { codigo: CodigoPasso; titulo: string; texto: string; href: string; botao: string };

const p = (codigo: CodigoPasso, titulo: string, texto: string, rota: Rota, botao: string, construidas?: ReadonlySet<Rota>): Passo =>
  ({ codigo, titulo, texto, href: destino(rota, construidas), botao });

/** O próximo passo é a primeira regra verdadeira, nesta ordem (spec §8). */
export function proximoPasso(s: Retrato, construidas?: ReadonlySet<Rota>): Passo {
  const ex = s.fase === "execucao";
  if (!s.diagnosticoIniciado)
    return p("diagnostico", "Comece pelo diagnóstico", "Dez perguntas rápidas sobre o seu escritório. Com elas sugerimos o seu perfil e as prioridades do ano.", ROTAS.diagnostico, "Fazer o diagnóstico", construidas);
  if (!s.diagnosticoConcluido)
    return p("diagnostico-continuar", "Continue o diagnóstico", "Você começou e ainda não terminou. Retome de onde parou; leva poucos minutos.", ROTAS.diagnostico, "Continuar o diagnóstico", construidas);
  if (s.categoriasNoTrimestre === 0)
    return p("prioridades", `Escolha as prioridades do ${s.trimestre}º trimestre`, "Selecione até três categorias para concentrar o esforço neste trimestre.", ROTAS.planejamento, "Escolher prioridades", construidas);
  if (s.categoriasSemAcao.length > 0)
    return p("categoria-sem-acao", "Transforme prioridade em ação", `Há categoria prioritária ainda sem nenhuma ação no plano (${s.categoriasSemAcao.join(", ")}).`, ROTAS.biblioteca, "Escolher ações", construidas);
  if (ex && s.atrasadas > 0)
    return p("atrasadas", s.atrasadas === 1 ? "1 ação atrasada" : `${s.atrasadas} ações atrasadas`, "Reveja o prazo ou conclua as ações que passaram da data.", ROTAS.planoDeAcao, "Ver ações atrasadas", construidas);
  if (ex && s.medicaoVencida > 0) {
    const passo = p("medir", "Atualize seus indicadores", "Há resultado-chave ou indicador sem medição há mais de 30 dias.", ROTAS.metas, "Lançar medições", construidas);
    return passo.href === ROTAS.metas ? { ...passo, href: `${ROTAS.metas}?aba=kpis` } : passo;
  }
  if (ex && s.trimestreAnteriorSemRevisao)
    return p("revisao", "Revise o trimestre que terminou", "Registre o que foi feito, o que travou e o que muda no próximo trimestre.", ROTAS.revisao, "Fazer a revisão", construidas);
  if (s.vencendo7dias > 0)
    return p("vencendo", s.vencendo7dias === 1 ? "1 ação vence nesta semana" : `${s.vencendo7dias} ações vencem nesta semana`, "Confira o que precisa ser entregue nos próximos 7 dias.", ROTAS.planoDeAcao, "Ver prioridades", construidas);
  return p("em-dia", "Tudo em dia", "Seu planejamento está atualizado. Siga com as ações do trimestre.", ROTAS.planoDeAcao, "Abrir o plano de ação", construidas);
}
