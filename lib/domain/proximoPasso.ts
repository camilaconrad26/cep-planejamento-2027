import { listaNatural } from "@/lib/domain/voz";
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
    return p("diagnostico", "Vamos começar pelo seu escritório", "São dez perguntas rápidas sobre como o escritório está hoje. Com as respostas, você descobre o seu perfil e onde vale concentrar energia em 2027.", ROTAS.diagnostico, "Começar o diagnóstico", construidas);
  if (!s.diagnosticoConcluido)
    return p("diagnostico-continuar", "Falta pouco para terminar o diagnóstico", "Você já começou. É só continuar de onde parou: leva poucos minutos.", ROTAS.diagnostico, "Continuar de onde parei", construidas);
  if (s.categoriasNoTrimestre === 0)
    return p("prioridades", `Onde você quer focar no ${s.trimestre}º trimestre?`, "Escolha até três áreas do escritório para concentrar o esforço. Menos frentes, mais resultado.", ROTAS.planejamento, "Escolher o foco", construidas);
  if (s.categoriasSemAcao.length > 0)
    return p("categoria-sem-acao", "Hora de transformar foco em ação", `Você escolheu ${listaNatural(s.categoriasSemAcao.map((c) => `“${c}”`))} como ${s.categoriasSemAcao.length === 1 ? "prioridade" : "prioridades"}, mas ainda não tem nenhuma ação ${s.categoriasSemAcao.length === 1 ? "nela" : "nelas"}. A biblioteca tem sugestões prontas para começar.`, ROTAS.biblioteca, "Ver sugestões", construidas);
  if (ex && s.atrasadas > 0)
    return p("atrasadas", s.atrasadas === 1 ? "Uma ação ficou para trás" : `${s.atrasadas} ações ficaram para trás`, "Acontece. Se já fez, marque como concluída; se não deu tempo, é só definir um prazo novo.", ROTAS.planoDeAcao, "Ver o que atrasou", construidas);
  if (ex && s.medicaoVencida > 0) {
    const passo = p("medir", "Como estão os seus números?", "Faz mais de um mês que alguns resultados e indicadores não são atualizados. Lançar os números de agora mostra se você está no caminho.", ROTAS.metas, "Atualizar os números", construidas);
    return passo.href === ROTAS.metas ? { ...passo, href: `${ROTAS.metas}?aba=kpis` } : passo;
  }
  if (ex && s.trimestreAnteriorSemRevisao) {
    const passo = p("revisao", `O ${s.trimestre - 1}º trimestre terminou. Vamos olhar para ele?`, "Reserve uns minutos para registrar o que funcionou, o que travou e o que muda daqui para frente.", ROTAS.revisao, "Fazer a revisão", construidas);
    return passo.href === ROTAS.revisao ? { ...passo, href: `${ROTAS.revisao}?t=${s.trimestre - 1}` } : passo;
  }
  if (s.vencendo7dias > 0)
    return p("vencendo", s.vencendo7dias === 1 ? "Uma ação vence nesta semana" : `${s.vencendo7dias} ações vencem nesta semana`, "Vale dar uma olhada no que precisa ser entregue nos próximos 7 dias.", ROTAS.planoDeAcao, "Ver a semana", construidas);
  return p("em-dia", "Tudo em dia. Bom trabalho!", "Seu planejamento está atualizado. Agora é seguir com as ações do trimestre.", ROTAS.planoDeAcao, "Abrir o plano de ação", construidas);
}
