// As 7 categorias do método CEP, na ordem do Notion "Planejamento Estratégico | CEP".
// REVISAR COM A USUÁRIA: descrição e objetivo são rascunho.
export type SlugCategoria = "posicionamento" | "comercial" | "parcerias" | "metodo" | "experiencia" | "financeiro" | "operacao";

export const CATEGORIAS: { slug: SlugCategoria; nome: string; descricao: string; objetivo: string; ordem: number }[] = [
  { slug: "posicionamento", nome: "Posicionamento e Autoridade", ordem: 1,
    descricao: "Como o mercado e as famílias reconhecem você: nicho, mensagem, conteúdo e presença institucional.",
    objetivo: "Ser lembrada como referência em planejamento patrimonial no recorte que você escolheu." },
  { slug: "comercial", nome: "Comercial", ordem: 2,
    descricao: "O caminho da primeira conversa ao contrato: funil, proposta, objeções e acompanhamento.",
    objetivo: "Transformar conversas em contratos de forma previsível." },
  { slug: "parcerias", nome: "Parcerias e Networking", ordem: 3,
    descricao: "A rede de profissionais que indica e completa o seu trabalho: contadores, corretores, avaliadores, tabelionatos e entidades.",
    objetivo: "Ter parceiros que geram indicações e viabilizam projetos completos." },
  { slug: "metodo", nome: "Método e Serviços", ordem: 4,
    descricao: "O seu jeito de conduzir um caso, do diagnóstico à implementação, e os serviços que você oferece.",
    objetivo: "Entregar com método próprio, padronizado e com profundidade." },
  { slug: "experiencia", nome: "Experiência do Cliente", ordem: 5,
    descricao: "O que a família vive durante e depois do projeto: comunicação, reuniões, entregas e relacionamento.",
    objetivo: "Fazer a família entender cada etapa, confiar no processo e permanecer na carteira." },
  { slug: "financeiro", nome: "Financeiro e Precificação", ordem: 6,
    descricao: "Preço, custos, caixa e rentabilidade do escritório.",
    objetivo: "Cobrar com critério e ter previsibilidade de caixa e margem." },
  { slug: "operacao", nome: "Operação e Tecnologia", ordem: 7,
    descricao: "Rotina, ferramentas, documentos, automação e segurança da informação.",
    objetivo: "Trabalhar com organização, menos retrabalho e dados protegidos." },
];

export const nomeCategoria = (slug: string) => CATEGORIAS.find((c) => c.slug === slug)?.nome ?? slug;
