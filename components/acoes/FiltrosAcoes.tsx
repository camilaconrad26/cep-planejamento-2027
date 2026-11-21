import Link from "next/link";
import { Botao } from "@/components/ui/Botao";
import { STATUS_LISTA, urlAcoes, type FiltrosAcoes as F } from "@/lib/domain/acoes";
import type { Categoria } from "@/lib/domain/biblioteca";

/** Busca e filtros (GET), aplicados pelo botão "Filtrar". */
export function FiltrosAcoes({ f, categorias }: { f: F; categorias: Categoria[] }) {
  const campo = "flex min-w-0 flex-1 basis-40 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";
  const marca = "flex min-h-[44px] items-center gap-2 text-[0.92rem] font-bold text-tinta";
  return (
    <form method="get" action="/plano-de-acao" className="flex flex-col gap-3 rounded-cartao border border-linha bg-white px-5 py-4">
      {f.visao !== "tabela" && <input type="hidden" name="visao" value={f.visao} />}
      {f.ordem !== "prazo" && <input type="hidden" name="ordem" value={f.ordem} />}
      {f.sentido !== "asc" && <input type="hidden" name="sentido" value={f.sentido} />}
      {f.cal !== "mes" && <input type="hidden" name="cal" value={f.cal} />}
      {f.data && <input type="hidden" name="data" value={f.data} />}
      <label className={campo}>Buscar ações
        <input type="search" name="q" defaultValue={f.q} maxLength={200} placeholder="Título, objetivo ou responsável" className="campo font-normal" /></label>
      <div className="flex flex-wrap gap-3">
        <label className={campo}>Categoria
          <select name="categoria" aria-label="Categoria" defaultValue={f.categoria ?? ""} className="campo font-normal">
            <option value="">Todas</option>{categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
        <label className={campo}>Nível
          <select name="nivel" aria-label="Nível" defaultValue={f.nivel ?? ""} className="campo font-normal">
            <option value="">Todos</option><option value="tatico">Tático</option><option value="operacional">Operacional</option></select></label>
        <label className={campo}>Trimestre
          <select name="trimestre" aria-label="Trimestre" defaultValue={f.trimestre ?? ""} className="campo font-normal">
            <option value="">Todos</option>{[1, 2, 3, 4].map((t) => <option key={t} value={t}>{t}º trimestre</option>)}</select></label>
        <label className={campo}>Status
          <select name="status" aria-label="Status" defaultValue={f.status ?? ""} className="campo font-normal">
            <option value="">Todos</option>{STATUS_LISTA.map((s) => <option key={s.valor} value={s.valor}>{s.nome}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className={marca}><input type="checkbox" name="atrasadas" value="1" defaultChecked={f.atrasadas} className="h-5 w-5 accent-[#7a6022]" />Só atrasadas</label>
        <label className={marca}><input type="checkbox" name="concluidas" value="1" defaultChecked={f.concluidas} className="h-5 w-5 accent-[#7a6022]" />Mostrar concluídas</label>
        <Botao type="submit" variante="secundario" tamanho="mini">Filtrar</Botao>
        <Link href={urlAcoes({ ...f, q: "", categoria: null, nivel: null, trimestre: null, status: null, atrasadas: false, concluidas: false })}
          className="py-1.5 text-ouro-texto underline underline-offset-4 hover:text-tinta">Limpar filtros</Link>
      </div>
    </form>
  );
}
