// Importação do planejamento da versão anterior (spec §9). Tolerante a campos ausentes e textos antigos.
import { CATEGORIAS, type SlugCategoria } from "@/lib/domain/categorias";
import { lerFechamento, type Fechamento } from "@/lib/domain/fechamento";
import { metasVazias, type AcaoVenda, type Altura, type MetasForm } from "@/lib/domain/metas";
import { parseMoeda } from "@/lib/domain/moeda";
import type { Status } from "@/lib/domain/ciclo";

type Tri = 1 | 2 | 3 | 4;
export type ImportacaoV1 = {
  perfil: 1 | 2 | 3 | null;
  fechamento: Fechamento;
  itens: { perfil: number; cat: number; nivel: number; tri: Tri | null; prazo: string | null; status: Status; texto: string | null }[];
  proprios: { cat: number; nivel: number; texto: string; tri: Tri | null; prazo: string | null; status: Status }[];
  tarefas: { texto: string; tri: Tri | null; feito: boolean; idV1: string | null }[];
  pendencias: { texto: string; tri: Tri | null; feito: boolean; itemId: string }[];
  metas: MetasForm;
  vendas: Omit<AcaoVenda, "id">[];
  revisoes: { trimestre: number; aprendizado: string; ajustes: string[] }[];
};

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (x && typeof x === "object" && !Array.isArray(x) ? (x as Obj) : {});
const txt = (x: unknown) => (typeof x === "string" ? x.trim() : typeof x === "number" ? String(x) : "");
const num = (x: unknown) => parseMoeda(txt(x));
const tri = (x: unknown): Tri | null => { const n = Number(x); return n === 1 || n === 2 || n === 3 || n === 4 ? n : null; };
const data = (x: unknown) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);
const status = (x: unknown): Status => (x === "Concluído" ? "concluido" : x === "Em andamento" ? "em_andamento" : "nao_iniciado");
const lista = (x: unknown): string[] => (Array.isArray(x) ? x.map((i) => txt(obj(i).texto)) : txt(x).split(/\n+/).map((t) => t.replace(/^\s*[-•*]\s*/, "").trim())).filter(Boolean);
const ALT: Altura[] = ["meta", "super", "mega"];

export function mapearV1(bruto: unknown): ImportacaoV1 {
  const d = obj(bruto), retro = obj(d.retro), m = obj(d.metas);
  const p = Number(d.perfil);
  const perfil = p === 1 || p === 2 || p === 3 ? p : null;

  const notas: Partial<Record<SlugCategoria, number>> = {};
  for (const [ci, n] of Object.entries(obj(retro.notas))) {
    const c = CATEGORIAS[Number(ci)]; const v = Number(n);
    if (c && Number.isFinite(v) && v >= 0 && v <= 10) notas[c.slug] = v;
  }
  // Itens das listas mantêm o vínculo com a tarefa criada na v1 ("tarefa"), para não oferecer "Criar tarefa" de novo.
  const comoLista = (x: unknown, chave: string) => (Array.isArray(x)
    ? x.map(obj).filter((o) => txt(o.texto)).map((o, i) => ({ id: `v1-${chave}-${i}`, texto: txt(o.texto), ...(txt(o.tarefa) ? { tarefaV1: txt(o.tarefa) } : {}) }))
    : lista(x).map((texto, i) => ({ id: `v1-${chave}-${i}`, texto })));
  const fechamento = lerFechamento({
    faturamento: num(retro.fat), meta: num(retro.meta), contratos: Math.round(num(retro.contratos)), origem: txt(retro.origem), notas,
    listas: {
      deuCerto: comoLista(retro.conquistas, "deuCerto"), naoFuncionou: comoLista(retro.naoFuncionou, "naoFuncionou"),
      aprendizados: comoLista(retro.aprendizados, "aprendizados"), parar: comoLista(retro.parar, "parar"),
      continuar: comoLista(retro.continuar, "continuar"), comecar: comoLista(retro.comecar, "comecar"),
      pendencias: (Array.isArray(retro.pend) ? retro.pend : []).map((x, i) => { const o = obj(x); return { id: `v1-pend-${i}`, texto: txt(o.texto),
        destino: (o.destino === "levar" || o.destino === "delegar" || o.destino === "encerrar") ? o.destino : null, ...(tri(o.tri) ? { tri: tri(o.tri)! } : {}) }; })
        .filter((x) => x.texto),
    },
  });

  const itens: ImportacaoV1["itens"] = [];
  for (const [chave, v] of Object.entries(obj(d.itens))) {
    const k = /^p([123])c([0-6])n([0-4])$/.exec(chave); const o = obj(v);
    if (k && o.fazer) itens.push({ perfil: Number(k[1]), cat: Number(k[2]), nivel: Number(k[3]), tri: tri(o.tri), prazo: data(o.prazo), status: status(o.status), texto: txt(o.texto) || null });
  }
  const proprios = (Array.isArray(d.custom) ? d.custom : []).map(obj)
    .filter((o) => o.fazer !== false && txt(o.texto) && Number(o.cat) >= 0 && Number(o.cat) <= 6 && Number(o.nivel) >= 0 && Number(o.nivel) <= 4)
    .map((o) => ({ cat: Number(o.cat), nivel: Number(o.nivel), texto: txt(o.texto), tri: tri(o.tri), prazo: data(o.prazo), status: status(o.status) }));
  const tarefas = (Array.isArray(d.tarefas) ? d.tarefas : []).map(obj).filter((o) => txt(o.texto))
    .map((o) => ({ texto: txt(o.texto), tri: tri(o.tri), feito: !!o.feito, idV1: txt(o.id) || null }));
  const pendencias = (Array.isArray(retro.pend) ? retro.pend : []).map(obj)
    .map((o, i) => ({ o, itemId: `v1-pend-${i}` })).filter(({ o }) => o.destino === "levar" && txt(o.texto))
    .map(({ o, itemId }) => ({ texto: txt(o.texto), tri: tri(o.tri), feito: !!o.feito, itemId }));

  const metas = metasVazias();
  const anual = obj(m.anual);
  ALT.forEach((a, i) => {
    metas.anual[a] = { faturamento: num(obj(anual.fat)[i]), lucratividade: num(obj(anual.lucro)[i]), anuncios: num(obj(anual.ads)[i]), time: Math.round(num(obj(anual.time)[i])) };
    for (const t of [1, 2, 3, 4] as Tri[]) metas.trimestres[t][a] = num(obj(obj(m.tri)[t])[i]);
  });
  (["entrada", "principal", "alto_valor"] as const).forEach((tipo, r) => {
    const o = obj(obj(m.prod)[r]);
    metas.produtos[tipo] = { nome: txt(o.nome), ticket: num(o.ticket), vendas: { meta: num(o.v0), super: num(o.v1), mega: num(o.v2) } };
  });
  metas.porque = txt(m.porque);
  const triD = obj(d.tri);
  for (const t of [1, 2, 3, 4] as Tri[]) metas.realizado[t] = num(obj(triD[t]).realizado);

  const vendas: ImportacaoV1["vendas"] = [];
  for (const [mes, l] of Object.entries(obj(d.vendas))) {
    const mm = Number(mes);
    if (!(mm >= 0 && mm <= 11) || !Array.isArray(l)) continue;
    for (const x of l.map(obj)) if (txt(x.produto) || txt(x.acao) || num(x.ticket))
      vendas.push({ mes: mm + 1, produto: txt(x.produto), acao: txt(x.acao), ticket: num(x.ticket), quantidade: num(x.qtd), responsavel: txt(x.resp) });
  }
  const revisoes = ([1, 2, 3, 4] as Tri[]).map((t) => ({ trimestre: t, aprendizado: txt(obj(triD[t]).aprendizado), ajustes: lista(obj(triD[t]).ajustes) }))
    .filter((r) => r.aprendizado || r.ajustes.length);

  return { perfil, fechamento, itens, proprios, tarefas, pendencias, metas, vendas, revisoes };
}

const NIVEIS = ["estrategico", "tatico", "operacional", "okr", "kpi"];
/** (perfil:categoria:nível) → id do item da biblioteca: só ativos; se houver mais de um, o original (menor ordem). */
export function mapaBiblioteca(itens: { id: string; perfil: number; nivel: string; ordemCategoria: number; ordem: number; ativo: boolean }[]): Map<string, string> {
  const m = new Map<string, { id: string; ordem: number }>();
  for (const i of itens) {
    if (!i.ativo) continue;
    const k = `${i.perfil}:${i.ordemCategoria - 1}:${NIVEIS.indexOf(i.nivel)}`;
    const atual = m.get(k);
    if (!atual || i.ordem < atual.ordem) m.set(k, { id: i.id, ordem: i.ordem });
  }
  return new Map([...m].map(([k, v]) => [k, v.id]));
}

/** Metas: só preenche o que ainda está vazio na v2 (linha por linha); nada já digitado é substituído. */
export function mesclarMetas(v2: MetasForm, v1: MetasForm): MetasForm {
  const r: MetasForm = structuredClone(v2);
  const vaziaAnual = (l: MetasForm["anual"]["meta"]) => !l.faturamento && !l.lucratividade && !l.anuncios && !l.time;
  for (const a of ALT) {
    if (vaziaAnual(r.anual[a])) r.anual[a] = { ...v1.anual[a] };
    for (const t of [1, 2, 3, 4] as Tri[]) if (!r.trimestres[t][a]) r.trimestres[t][a] = v1.trimestres[t][a];
  }
  for (const p of ["entrada", "principal", "alto_valor"] as const) {
    const x = r.produtos[p];
    if (!x.nome && !x.ticket && !x.vendas.meta && !x.vendas.super && !x.vendas.mega) r.produtos[p] = structuredClone(v1.produtos[p]);
  }
  for (const t of [1, 2, 3, 4] as Tri[]) if (!r.realizado[t]) r.realizado[t] = v1.realizado[t];
  if (!r.porque.trim()) r.porque = v1.porque;
  return r;
}
/** Respostas da revisão: só entram as que a aluna ainda não escreveu na v2. */
export function mesclarRespostas<T extends Record<string, string | undefined>>(v2: T, v1: T): T {
  const r = { ...v2 } as Record<string, string | undefined>;
  for (const [k, v] of Object.entries(v1)) if (v && !(r[k] ?? "").trim()) r[k] = v;
  return r as T;
}
