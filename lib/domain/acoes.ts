// Regras do Plano de ação (spec §5 item 5, §8): filtros, ordenação, listas de prioridade e calendário.
import { diasEntre, estaAtrasada, type Status } from "@/lib/domain/ciclo";

export type Prioridade = "baixa" | "media" | "alta";
export const PRIORIDADES: { valor: Prioridade; nome: string }[] = [{ valor: "baixa", nome: "Baixa" }, { valor: "media", nome: "Média" }, { valor: "alta", nome: "Alta" }];
export const STATUS_LISTA: { valor: Status; nome: string }[] = [
  { valor: "nao_iniciado", nome: "Não iniciada" }, { valor: "em_andamento", nome: "Em andamento" }, { valor: "concluido", nome: "Concluída" },
];
export const nomeStatus = (s: Status) => STATUS_LISTA.find((x) => x.valor === s)?.nome ?? s;
export const nomePrioridade = (p: Prioridade) => PRIORIDADES.find((x) => x.valor === p)?.nome ?? p;

export type Acao = {
  id: string; titulo: string; objetivo: string | null; categoria: { slug: string; nome: string } | null;
  nivel: "estrategico" | "tatico" | "operacional"; responsavel: string; prioridade: Prioridade; status: Status;
  inicio: string | null; prazo: string | null; trimestre: 1 | 2 | 3 | 4 | null;
};

export type VisaoAcoes = "tabela" | "kanban" | "calendario" | "prioridades";
export type Ordem = "prazo" | "prioridade" | "titulo" | "status" | "inicio";
export type FiltrosAcoes = {
  visao: VisaoAcoes; q: string; categoria: string | null; nivel: "tatico" | "operacional" | null; trimestre: 1 | 2 | 3 | 4 | null;
  status: Status | null; atrasadas: boolean; concluidas: boolean; ordem: Ordem; sentido: "asc" | "desc"; cal: "mes" | "semana" | "dia"; data: string | null;
};
export const VISOES_ACOES: { valor: VisaoAcoes; nome: string }[] = [
  { valor: "tabela", nome: "Tabela" }, { valor: "kanban", nome: "Kanban" }, { valor: "calendario", nome: "Calendário" }, { valor: "prioridades", nome: "Prioridades" },
];

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const de = <T extends string>(v: string, ok: readonly T[], padrao: T): T => (ok.includes(v as T) ? (v as T) : padrao);
export const dataValida = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

export function lerFiltrosAcoes(q: Record<string, string | string[] | undefined>, slugs: string[]): FiltrosAcoes {
  const cat = um(q.categoria), tri = Number(um(q.trimestre)), data = um(q.data);
  const status = um(q.status), nivel = um(q.nivel);
  return {
    visao: de(um(q.visao), ["tabela", "kanban", "calendario", "prioridades"] as const, "tabela"),
    q: um(q.q).trim().slice(0, 200),
    categoria: slugs.includes(cat) ? cat : null,
    nivel: nivel === "tatico" || nivel === "operacional" ? nivel : null,
    trimestre: tri === 1 || tri === 2 || tri === 3 || tri === 4 ? tri : null,
    status: status === "nao_iniciado" || status === "em_andamento" || status === "concluido" ? status : null,
    atrasadas: um(q.atrasadas) === "1",
    concluidas: um(q.concluidas) === "1",
    ordem: de(um(q.ordem), ["prazo", "prioridade", "titulo", "status", "inicio"] as const, "prazo"),
    sentido: um(q.sentido) === "desc" ? "desc" : "asc",
    cal: de(um(q.cal), ["mes", "semana", "dia"] as const, "mes"),
    data: dataValida(data) ? data : null,
  };
}

export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrarAcoes(lista: Acao[], f: FiltrosAcoes, hoje: string): Acao[] {
  const termo = normalizar(f.q);
  return lista.filter((x) =>
    (!termo || normalizar(`${x.titulo} ${x.objetivo ?? ""} ${x.responsavel}`).includes(termo)) &&
    (!f.categoria || x.categoria?.slug === f.categoria) &&
    (!f.nivel || x.nivel === f.nivel) &&
    (!f.trimestre || x.trimestre === f.trimestre) &&
    (!f.status || x.status === f.status) &&
    (!f.atrasadas || estaAtrasada(x, hoje)) &&
    (f.concluidas || f.status === "concluido" || x.status !== "concluido"));
}

const PESO_PRIO: Record<Prioridade, number> = { baixa: 1, media: 2, alta: 3 };
const PESO_STATUS: Record<Status, number> = { nao_iniciado: 1, em_andamento: 2, concluido: 3 };
export function ordenarAcoes(lista: Acao[], ordem: Ordem, sentido: "asc" | "desc"): Acao[] {
  const s = sentido === "asc" ? 1 : -1;
  const chave = (x: Acao): string | number | null =>
    ordem === "prazo" ? x.prazo : ordem === "inicio" ? x.inicio : ordem === "prioridade" ? PESO_PRIO[x.prioridade]
      : ordem === "status" ? PESO_STATUS[x.status] : normalizar(x.titulo);
  return [...lista].sort((a, b) => {
    const ka = chave(a), kb = chave(b);
    if (ka === null && kb === null) return normalizar(a.titulo).localeCompare(normalizar(b.titulo));
    if (ka === null) return 1;
    if (kb === null) return -1;
    const c = ka < kb ? -1 : ka > kb ? 1 : 0;
    return c * s || normalizar(a.titulo).localeCompare(normalizar(b.titulo));
  });
}

export const progresso = (s: Status): 0 | 50 | 100 => (s === "concluido" ? 100 : s === "em_andamento" ? 50 : 0);

export function listasPrioridades(lista: Acao[], hoje: string) {
  const abertas = ordenarAcoes(lista.filter((x) => x.status !== "concluido"), "prazo", "asc");
  const vencidas = abertas.filter((x) => estaAtrasada(x, hoje));
  const vencendo = abertas.filter((x) => x.prazo && x.prazo >= hoje && diasEntre(hoje, x.prazo) <= 7);
  const ja = new Set([...vencidas, ...vencendo].map((x) => x.id));
  return { vencidas, vencendo, alta: abertas.filter((x) => x.prioridade === "alta" && !ja.has(x.id)) };
}

// Calendário: datas como texto AAAA-MM-DD, contas em UTC para não depender do fuso.
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);
export const somarDias = (s: string, n: number) => { const d = utc(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const somarMeses = (s: string, n: number) => { const d = utc(s); return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))); };
export const diaDaSemana = (s: string) => utc(s).getUTCDay();
export const semanaDe = (s: string) => { const ini = somarDias(s, -diaDaSemana(s)); return Array.from({ length: 7 }, (_, i) => somarDias(ini, i)); };
export function gradeMes(ano: number, mes: number): string[][] {
  const primeiro = iso(new Date(Date.UTC(ano, mes - 1, 1)));
  const semanas: string[][] = [];
  let ini = somarDias(primeiro, -diaDaSemana(primeiro));
  while (semanas.length === 0 || Number(ini.slice(5, 7)) === mes) {
    semanas.push(Array.from({ length: 7 }, (_, i) => somarDias(ini, i)));
    ini = somarDias(ini, 7);
  }
  return semanas;
}
export const acoesNoDia = (lista: Acao[], dia: string) => lista.filter((x) => x.prazo === dia);
export const formatarData = (s: string | null) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");
