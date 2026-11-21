"use client";
import { useEffect, useRef } from "react";
import { marcarSalvo } from "@/lib/salvo";

/**
 * Grava automaticamente 900 ms depois da última alteração (mesmo padrão do fechamento):
 * versão por alteração, nova tentativa a cada 5 s se falhar, sessão expirada sem perder a tela e aviso ao sair com algo pendente.
 */
export function useGravacaoAutomatica<T>(valor: T, gravar: (v: T) => Promise<{ erro?: string }>) {
  const pendente = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined), primeira = useRef(true);
  const ultimo = useRef(valor); ultimo.current = valor;
  const versao = useRef(0);
  const salvar = async () => {
    const minha = versao.current;
    try {
      const r = await gravar(ultimo.current);
      if (r.erro === "sessao") { marcarSalvo("sessao"); return; }
      if (r.erro) throw new Error(r.erro);
      if (minha === versao.current) { pendente.current = false; marcarSalvo("salvo"); }
    } catch {
      marcarSalvo("erro");
      clearTimeout(timer.current);
      timer.current = setTimeout(salvar, 5000);
    }
  };
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    versao.current += 1; pendente.current = true; marcarSalvo("salvando");
    clearTimeout(timer.current);
    timer.current = setTimeout(salvar, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  // Ao sair da página pelo menu (navegação sem recarregar), grava o que estiver pendente em vez de descartar.
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (pendente.current) void gravar(ultimo.current).then((r) => marcarSalvo(r.erro === "sessao" ? "sessao" : r.erro ? "erro" : "salvo"), () => marcarSalvo("erro"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => { if (pendente.current) e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, []);
}
