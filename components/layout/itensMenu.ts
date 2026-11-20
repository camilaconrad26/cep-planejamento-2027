import { ROTAS, type Rota } from "@/lib/domain/rotas";
import type { Papel } from "@/lib/data/sessao";

export type Icone = "inicio" | "diagnostico" | "planejamento" | "biblioteca" | "acao" | "metas" | "revisao" | "historico" | "config" | "alunas";
export type ItemMenu = { rota: Rota; rotulo: string; icone: Icone };

const TODOS: (ItemMenu & { papel?: Papel })[] = [
  { rota: ROTAS.visaoGeral, rotulo: "Visão geral", icone: "inicio" },
  { rota: ROTAS.diagnostico, rotulo: "Meu diagnóstico", icone: "diagnostico" },
  { rota: ROTAS.planejamento, rotulo: "Planejamento estratégico", icone: "planejamento" },
  { rota: ROTAS.biblioteca, rotulo: "Biblioteca de estratégias", icone: "biblioteca" },
  { rota: ROTAS.planoDeAcao, rotulo: "Plano de ação", icone: "acao" },
  { rota: ROTAS.metas, rotulo: "Metas e indicadores", icone: "metas" },
  { rota: ROTAS.revisao, rotulo: "Revisão estratégica", icone: "revisao" },
  { rota: ROTAS.historico, rotulo: "Histórico", icone: "historico" },
  { rota: ROTAS.configuracoes, rotulo: "Configurações", icone: "config" },
  { rota: ROTAS.alunas, rotulo: "Alunas", icone: "alunas", papel: "mentora" },
];

/** Itens do menu na ordem da especificação, só dos módulos já construídos e permitidos ao papel. */
export function itensMenu(papeis: Papel[], construidas: ReadonlySet<string>): ItemMenu[] {
  return TODOS.filter((i) => construidas.has(i.rota) && (!i.papel || papeis.includes(i.papel))).map(({ rota, rotulo, icone }) => ({ rota, rotulo, icone }));
}
