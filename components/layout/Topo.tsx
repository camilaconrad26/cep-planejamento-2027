"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLinks } from "@/components/layout/NavLinks";
import type { ItemMenu } from "@/components/layout/itensMenu";
import { Botao } from "@/components/ui/Botao";
import { Selo } from "@/components/ui/Selo";
import { sair } from "@/lib/data/conta";

export function Topo({ nome, itens }: { nome: string; itens: ItemMenu[] }) {
  const [grande, setGrande] = useState(false);
  const gaveta = useRef<HTMLDialogElement>(null);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const caminho = usePathname();
  useEffect(() => setGrande(document.documentElement.classList.contains("grande")), []);
  // Ao trocar de página, leva o foco ao título (leitor de tela anuncia a nova página).
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    const h = document.querySelector<HTMLElement>("main h1");
    if (h) { h.tabIndex = -1; h.focus(); }
  }, [caminho]);

  const alternarFonte = () => {
    const g = document.documentElement.classList.toggle("grande");
    document.cookie = `cep-fonte=${g ? "1" : ""}; path=/; max-age=${g ? 31536000 : 0}; samesite=lax`;
    setGrande(g);
  };
  const fechar = () => { gaveta.current?.close(); botaoMenu.current?.focus(); };

  return (
    <header className="escuro sticky top-0 z-20 border-b border-linha-escura lg:static">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button ref={botaoMenu} type="button" onClick={() => gaveta.current?.showModal()} aria-haspopup="dialog"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-ouro-fio px-4 font-bold text-ouro hover:text-creme">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>Menu
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <span id="salvo" role="status" aria-live="polite" className="min-w-[7.5em] text-cinza" />
          <span className="text-creme">{nome}</span>
          <Botao sobreEscuro variante="secundario" tamanho="mini" aria-pressed={grande} onClick={alternarFonte}>Texto maior</Botao>
          <form action={sair}><Botao type="submit" sobreEscuro variante="secundario" tamanho="mini">Sair</Botao></form>
        </div>
      </div>
      <dialog ref={gaveta} aria-label="Menu" onCancel={(e) => { e.preventDefault(); fechar(); }}
        onClick={(e) => { if (e.target === gaveta.current) fechar(); }}
        className="escuro m-0 h-full max-h-none w-[min(320px,86vw)] border-r border-linha-escura p-0 backdrop:bg-noite/70">
        <div className="flex h-full flex-col gap-6 px-4 py-5">
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3"><Selo /><p className="font-display text-lg font-bold text-creme">CEP</p></div>
            <button type="button" onClick={fechar} aria-label="Fechar menu" className="grid h-11 w-11 place-items-center rounded-full text-2xl text-cinza-claro hover:text-creme">×</button>
          </div>
          <nav aria-label="Menu principal (celular)"><NavLinks itens={itens} aoNavegar={fechar} /></nav>
        </div>
      </dialog>
    </header>
  );
}
