// Regras puras da Biblioteca de estratégias (spec §5 item 4, §6, §8).
export type Nivel = "estrategico" | "tatico" | "operacional" | "okr" | "kpi";
export const NIVEIS: { valor: Nivel; nome: string }[] = [
  { valor: "estrategico", nome: "Estratégico" }, { valor: "tatico", nome: "Tático" }, { valor: "operacional", nome: "Operacional" },
  { valor: "okr", nome: "OKR" }, { valor: "kpi", nome: "KPI" },
];
export const nomeNivel = (n: Nivel) => NIVEIS.find((x) => x.valor === n)?.nome ?? n;

export type ItemBiblioteca = { id: string; categoryId: string; perfil: 1 | 2 | 3; nivel: Nivel; texto: string; parentId: string | null; ordem: number; ativo: boolean };
export type Categoria = { id: string; slug: string; nome: string; descricao: string; objetivo: string; ordem: number };
export type Filtros = { perfil: 1 | 2 | 3; categoria: string | null; nivel: Nivel | null };
export type ResultadoAdicao = { criado: "objetivo" | "tarefa" | "kr" | "kpi"; objetivo_criado: boolean; ja_no_plano: boolean };

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Filtros a partir da URL; valores inválidos caem no padrão (perfil da aluna, ou 1). */
export function lerFiltros(q: Record<string, string | string[] | undefined>, perfilDaAluna: 1 | 2 | 3 | null, slugs: string[]): Filtros {
  const p = Number(primeiro(q.perfil));
  const c = primeiro(q.categoria);
  const n = primeiro(q.nivel);
  return {
    perfil: p === 1 || p === 2 || p === 3 ? p : perfilDaAluna ?? 1,
    categoria: c && slugs.includes(c) ? c : null,
    nivel: NIVEIS.some((x) => x.valor === n) ? (n as Nivel) : null,
  };
}

export function filtrarItens(itens: ItemBiblioteca[], f: Filtros, categorias: Categoria[], incluirInativos = false): ItemBiblioteca[] {
  const catId = f.categoria ? categorias.find((c) => c.slug === f.categoria)?.id : null;
  return itens.filter((i) => (incluirInativos || i.ativo) && i.perfil === f.perfil && (!catId || i.categoryId === catId) && (!f.nivel || i.nivel === f.nivel));
}

const ordemNivel = (n: Nivel) => NIVEIS.findIndex((x) => x.valor === n);

export function agruparPorCategoria(itens: ItemBiblioteca[], categorias: Categoria[]): { categoria: Categoria; itens: ItemBiblioteca[] }[] {
  return [...categorias].sort((a, b) => a.ordem - b.ordem)
    .map((categoria) => ({
      categoria,
      itens: itens.filter((i) => i.categoryId === categoria.id).sort((a, b) => ordemNivel(a.nivel) - ordemNivel(b.nivel) || a.ordem - b.ordem),
    }))
    .filter((g) => g.itens.length > 0);
}

export function textoAdicionado(r: ResultadoAdicao, trimestre: 1 | 2 | 3 | 4): string {
  if (r.ja_no_plano) return "Este item já está no seu plano.";
  if (r.criado === "objetivo") return `Objetivo adicionado ao ${trimestre}º trimestre.`;
  return `Adicionado ao ${trimestre}º trimestre.${r.objetivo_criado ? " O objetivo estratégico da categoria entrou junto." : ""}`;
}
