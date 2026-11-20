import { CATEGORIAS, type SlugCategoria } from "@/lib/domain/categorias";

// Opções em linguagem do CEP — REVISAR COM A USUÁRIA.
export type Resposta = string | number | string[] | undefined;
export type Respostas = {
  estagio?: 1 | 2 | 3; tempo?: string; projetos?: string; equipe?: string; servicos?: string[]; origens?: string[];
  comercial?: string; financeiro?: string; metodo?: string; desafios?: string[]; desafiosTexto?: string; outro?: Record<string, string>;
};
export type Pergunta = {
  chave: keyof Respostas; texto: string; ajuda?: string;
  tipo: "unica" | "varias"; opcoes: { valor: string | number; rotulo: string }[]; textoLivre?: boolean;
};

const simNao = [{ valor: "Sim", rotulo: "Sim" }, { valor: "Em parte", rotulo: "Em parte" }, { valor: "Não", rotulo: "Não" }];
const op = (...r: string[]) => r.map((x) => ({ valor: x, rotulo: x }));

export const PERGUNTAS: Pergunta[] = [
  { chave: "estagio", texto: "Em qual estágio está seu escritório?", tipo: "unica", opcoes: [
    { valor: 1, rotulo: "Estou começando na área patrimonial" },
    { valor: 2, rotulo: "Atuo de forma autônoma e já conduzo casos" },
    { valor: 3, rotulo: "Tenho escritório com equipe e carteira de famílias" }] },
  { chave: "tempo", texto: "Há quanto tempo atua com planejamento patrimonial?", tipo: "unica", opcoes: op("Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos") },
  { chave: "projetos", texto: "Quantos projetos patrimoniais já conduziu?", tipo: "unica", opcoes: op("Nenhum", "1 a 3", "4 a 10", "11 a 30", "Mais de 30") },
  { chave: "equipe", texto: "Trabalha sozinho ou possui equipe?", tipo: "unica", opcoes: op("Trabalho sozinha(o)", "Tenho apoio pontual (estagiário, parceiro)", "Tenho equipe fixa") },
  { chave: "servicos", texto: "Quais são os principais serviços oferecidos?", ajuda: "Marque todos que se aplicam.", tipo: "varias", textoLivre: true,
    opcoes: op("Diagnóstico patrimonial", "Holding familiar", "Planejamento sucessório", "Testamento e pacto antenupcial", "Acordo de sócios", "Inventário", "Outro") },
  { chave: "origens", texto: "Como chegam atualmente seus clientes?", ajuda: "Marque todos que se aplicam.", tipo: "varias", textoLivre: true,
    opcoes: op("Indicação de clientes", "Parceiros (contador, corretor, assessor)", "Conteúdo e redes sociais", "Eventos e palestras", "Anúncios", "Outro") },
  { chave: "comercial", texto: "Possui processos comerciais estruturados?", tipo: "unica", opcoes: simNao },
  { chave: "financeiro", texto: "Possui controle financeiro?", tipo: "unica", opcoes: simNao },
  { chave: "metodo", texto: "Possui método próprio de atendimento?", tipo: "unica", opcoes: simNao },
  { chave: "desafios", texto: "Quais são seus principais desafios atualmente?", ajuda: "Marque os que mais pesam hoje e, se quiser, descreva.", tipo: "varias", textoLivre: true,
    opcoes: op("Conseguir clientes", "Precificar", "Ser reconhecida(o) como especialista", "Organizar a rotina", "Padronizar entregas", "Conduzir a família", "Construir parcerias") },
];

const DESAFIO_CATEGORIA: Record<string, SlugCategoria> = {
  "Conseguir clientes": "comercial", Precificar: "financeiro", "Ser reconhecida(o) como especialista": "posicionamento",
  "Organizar a rotina": "operacao", "Padronizar entregas": "metodo", "Conduzir a família": "experiencia", "Construir parcerias": "parcerias",
};

/** Perfil sugerido: o estágio declarado manda; sem ele, projetos conduzidos e equipe. */
export function sugerirPerfil(r: Respostas): 1 | 2 | 3 | null {
  if (r.estagio) return r.estagio;
  if (!r.projetos) return null;
  if (r.equipe === "Tenho equipe fixa" && (r.projetos === "11 a 30" || r.projetos === "Mais de 30")) return 3;
  if (r.projetos === "Nenhum" || r.projetos === "1 a 3") return 1;
  return 2;
}

const ESTRUTURA: { chave: "comercial" | "financeiro" | "metodo"; forte: string; atencao: string }[] = [
  { chave: "comercial", forte: "Processo comercial estruturado", atencao: "Processo comercial ainda não estruturado" },
  { chave: "financeiro", forte: "Controle financeiro estruturado", atencao: "Controle financeiro ainda não estruturado" },
  { chave: "metodo", forte: "Método próprio de atendimento", atencao: "Método de atendimento em construção" },
];

/** Pontos fortes, de atenção e até 3 categorias prioritárias. */
export function resumirDiagnostico(r: Respostas, notas: Partial<Record<string, number>> = {}) {
  const fortes: string[] = [], atencao: string[] = [], pts: Partial<Record<SlugCategoria, number>> = {};
  const soma = (c: SlugCategoria, n: number) => { pts[c] = (pts[c] ?? 0) + n; };
  for (const e of ESTRUTURA) {
    const v = r[e.chave];
    if (v === "Sim") fortes.push(e.forte);
    else if (v === "Em parte" || v === "Não") { atencao.push(e.atencao); soma(e.chave, v === "Não" ? 2 : 1); }
  }
  for (const d of r.desafios ?? []) if (DESAFIO_CATEGORIA[d]) soma(DESAFIO_CATEGORIA[d], 2);
  for (const [slug, nota] of Object.entries(notas)) {
    if (typeof nota !== "number" || !CATEGORIAS.some((c) => c.slug === slug)) continue;
    if (nota <= 4) soma(slug as SlugCategoria, 2); else if (nota <= 6) soma(slug as SlugCategoria, 1);
  }
  const prioridades = CATEGORIAS.filter((c) => (pts[c.slug] ?? 0) > 0)
    .sort((a, b) => (pts[b.slug] ?? 0) - (pts[a.slug] ?? 0) || a.ordem - b.ordem)
    .slice(0, 3).map((c) => c.slug);
  return { fortes, atencao, prioridades };
}
