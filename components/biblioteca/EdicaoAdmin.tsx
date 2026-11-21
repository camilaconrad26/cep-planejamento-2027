"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { alternarAtivo, criarItem, salvarCategoria, salvarItem, type Retorno } from "@/lib/data/bibliotecaAcoes";
import { NIVEIS, nomeNivel, type Categoria, type ItemBiblioteca } from "@/lib/domain/biblioteca";
import { PERFIS } from "@/lib/domain/perfis";

/** Executa uma ação de admin, uma por vez, mostrando o resultado no aviso ou junto ao formulário. */
function useAcao() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const trava = useRef(false);
  const aviso = useAviso();
  const router = useRouter();
  async function rodar(f: () => Promise<Retorno>) {
    if (trava.current) return false;
    trava.current = true; setEnviando(true); setErro("");
    try {
      const r = await f();
      if (r.erro) { setErro(r.erro); return false; }
      aviso({ texto: r.ok ?? "Salvo." }); router.refresh(); return true;
    } catch { setErro("Não foi possível salvar. Verifique a conexão e tente de novo."); return false; }
    finally { trava.current = false; setEnviando(false); }
  }
  return { enviando, erro, rodar };
}
const Erro = ({ t }: { t: string }) => (t ? <p role="alert" className="text-[0.9rem] font-bold text-alerta">{t}</p> : null);

export function EditarCategoria({ c }: { c: Categoria }) {
  const [descricao, setDescricao] = useState(c.descricao);
  const [objetivo, setObjetivo] = useState(c.objetivo);
  const { enviando, erro, rodar } = useAcao();
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 font-bold text-tinta">Descrição
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={1000} className="campo font-normal" /></label>
      <label className="flex flex-col gap-1.5 font-bold text-tinta">Objetivo
        <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} maxLength={1000} className="campo font-normal" /></label>
      <div><Botao variante="secundario" tamanho="mini" disabled={enviando} onClick={() => rodar(() => salvarCategoria(c.id, { descricao, objetivo }))}>
        {enviando ? "Salvando…" : "Salvar categoria"}</Botao></div>
      <Erro t={erro} />
    </div>
  );
}

export function EditarItem({ item }: { item: ItemBiblioteca }) {
  const [texto, setTexto] = useState(item.texto);
  const { enviando, erro, rodar } = useAcao();
  return (
    <li data-id={item.id} className={`flex flex-col gap-2 border-t border-linha py-4 first:border-t-0 ${item.ativo ? "" : "opacity-75"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-ouro-texto">{nomeNivel(item.nivel)}</span>
        {!item.ativo && <span className="rounded-full border border-alerta px-2.5 py-0.5 text-[0.78rem] font-bold text-alerta">Inativo</span>}
      </div>
      <textarea aria-label={`Texto do item ${nomeNivel(item.nivel)}`} value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={1000} className="campo" />
      <div className="flex flex-wrap gap-2">
        <Botao tamanho="mini" disabled={enviando || texto.trim() === item.texto} onClick={() => rodar(() => salvarItem(item.id, texto))}>Salvar</Botao>
        {item.nivel !== "estrategico" && (
          <Botao tamanho="mini" variante="secundario" disabled={enviando} onClick={() => rodar(() => alternarAtivo(item.id, !item.ativo))}>
            {item.ativo ? "Desativar" : "Reativar"}</Botao>
        )}
      </div>
      <Erro t={erro} />
    </li>
  );
}

export function NovoItem({ categorias, perfil, categoria }: { categorias: Categoria[]; perfil: 1 | 2 | 3; categoria: string | null }) {
  const { enviando, erro, rodar } = useAcao();
  const [texto, setTexto] = useState("");
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cat = categorias.find((c) => c.slug === f.get("categoria"));
    if (!cat) return;
    const ok = await rodar(() => criarItem({ categoryId: cat.id, perfil: Number(f.get("perfil")) as 1 | 2 | 3,
      nivel: f.get("nivel") as "tatico" | "operacional" | "okr" | "kpi", texto }));
    if (ok) setTexto("");
  }
  const campo = "flex min-w-0 flex-1 basis-44 flex-col gap-1.5 text-[0.9rem] font-bold text-tinta";
  return (
    <form aria-label="Novo item" onSubmit={enviar} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className={campo}><span>Categoria <span className="sr-only">do novo item</span></span>
          <select name="categoria" defaultValue={categoria ?? categorias[0]?.slug} aria-label="Categoria do novo item" className="campo font-normal">
            {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
        <label className={campo}><span>Perfil</span>
          <select name="perfil" defaultValue={perfil} aria-label="Perfil do novo item" className="campo font-normal">
            {PERFIS.map((p) => <option key={p.n} value={p.n}>{p.nome}</option>)}</select></label>
        <label className={campo}><span>Nível</span>
          <select name="nivel" defaultValue="tatico" aria-label="Nível do novo item" className="campo font-normal">
            {NIVEIS.filter((n) => n.valor !== "estrategico").map((n) => <option key={n.valor} value={n.valor}>{n.nome}</option>)}</select></label>
      </div>
      <textarea aria-label="Texto do novo item" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={1000} required className="campo" placeholder="Texto do item" />
      <div><Botao type="submit" disabled={enviando || !texto.trim()}>{enviando ? "Criando…" : "Criar item"}</Botao></div>
      <Erro t={erro} />
    </form>
  );
}
