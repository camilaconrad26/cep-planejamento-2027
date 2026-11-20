import type { SlugCategoria } from "@/lib/domain/categorias";

export type ItemLista = { id: string; texto: string; tri?: 1 | 2 | 3 | 4; tarefaId?: string; tarefaTri?: number; destino?: "levar" | "delegar" | "encerrar" | null };
export type ChaveLista = "deuCerto" | "naoFuncionou" | "aprendizados" | "parar" | "continuar" | "comecar" | "pendencias";
export type Fechamento = {
  faturamento: number; meta: number; contratos: number; origem: string;
  notas: Partial<Record<SlugCategoria, number>>;
  listas: Record<ChaveLista, ItemLista[]>;
};

export const LISTAS: { chave: ChaveLista; rotulo: string; ajuda: string; grupo: "passou" | "melhorar" | "pendencias" }[] = [
  { chave: "deuCerto", rotulo: "O que deu certo", ajuda: "Casos, entregas, parcerias e hábitos que funcionaram.", grupo: "passou" },
  { chave: "naoFuncionou", rotulo: "O que não funcionou", ajuda: "O que travou, o que você tentou e abandonou, o que custou caro.", grupo: "passou" },
  { chave: "aprendizados", rotulo: "O que 2026 ensinou", ajuda: "O que você faria diferente se o ano começasse hoje.", grupo: "passou" },
  { chave: "parar", rotulo: "Parar de fazer", ajuda: "O que consome tempo e não traz resultado.", grupo: "melhorar" },
  { chave: "continuar", rotulo: "Continuar fazendo", ajuda: "O que funciona e merece ser mantido.", grupo: "melhorar" },
  { chave: "comecar", rotulo: "Começar a fazer", ajuda: "O que faltou em 2026 e entra em 2027.", grupo: "melhorar" },
  { chave: "pendencias", rotulo: "Pendências", ajuda: "O que ficou em aberto. Decida o destino; o que for levado para 2027 vira tarefa.", grupo: "pendencias" },
];

const vazio = (): Record<ChaveLista, ItemLista[]> => Object.fromEntries(LISTAS.map((l) => [l.chave, []])) as unknown as Record<ChaveLista, ItemLista[]>;

/** Normaliza o JSON gravado (tolerante a campos ausentes ou textos livres antigos). */
export function lerFechamento(bruto: unknown): Fechamento {
  const b = (bruto ?? {}) as Partial<Fechamento> & Record<string, unknown>;
  const listas = vazio();
  for (const { chave } of LISTAS) {
    const v = (b.listas as Record<string, unknown> | undefined)?.[chave];
    listas[chave] = Array.isArray(v) ? (v as ItemLista[]).filter((i) => i && typeof i.texto === "string")
      : typeof v === "string" ? v.split(/\n+/).map((t) => t.trim()).filter(Boolean).map((texto, i) => ({ id: `migrado-${chave}-${i}`, texto })) : [];
  }
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  return { faturamento: num(b.faturamento), meta: num(b.meta), contratos: num(b.contratos), origem: typeof b.origem === "string" ? b.origem : "",
    notas: (b.notas && typeof b.notas === "object" ? b.notas : {}) as Fechamento["notas"], listas };
}
