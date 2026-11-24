"use client";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { criarAluna } from "@/lib/data/alunasAcoes";

/** A mentora cria a conta da aluna com uma senha provisória (a aluna troca em Configurações). */
export function NovaAluna() {
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: "", email: "", senha: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const aviso = useAviso();
  const router = useRouter();
  const id = useId();
  const valido = f.nome.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && f.senha.length >= 8 && f.senha.length <= 72;
  async function enviar(e: FormEvent) {
    e.preventDefault(); if (!valido) return;
    setEnviando(true); setErro("");
    try {
      const r = await criarAluna({ nome: f.nome.trim(), email: f.email.trim().toLowerCase(), senha: f.senha });
      if (r.erro) setErro(r.erro);
      else { aviso({ texto: r.ok! }); setF({ nome: "", email: "", senha: "" }); router.refresh(); }
    } catch { setErro("Não foi possível criar a conta. Verifique a conexão."); } finally { setEnviando(false); }
  }
  if (!aberto) return <div><Botao onClick={() => setAberto(true)}>Cadastrar aluna</Botao></div>;
  const rotulo = "flex flex-col gap-1.5 font-bold text-tinta";
  return (
    <form onSubmit={enviar} aria-labelledby={`${id}-t`} className="flex flex-col gap-4 rounded-cartao border border-linha bg-white px-5 py-5 sm:px-7">
      <h2 id={`${id}-t`} className="font-display text-xl font-bold text-tinta">Cadastrar aluna</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={rotulo}>Nome completo da aluna
          <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={120} autoComplete="off" className="campo font-normal" /></label>
        <label className={rotulo}>E-mail da aluna
          <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={200} autoComplete="off" className="campo font-normal" /></label>
      </div>
      <label className={`${rotulo} max-w-sm`}>Senha provisória
        <input type="text" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} minLength={8} maxLength={72} autoComplete="off"
          aria-describedby={`${id}-ajuda`} className="campo font-normal" /></label>
      <p id={`${id}-ajuda`} className="-mt-2 text-[0.85rem] text-sec">Mínimo de 8 caracteres. Envie o e-mail e a senha à aluna por um canal seguro e peça que ela troque em Configurações no primeiro acesso.</p>
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" disabled={enviando || !valido}>{enviando ? "Criando…" : "Criar conta da aluna"}</Botao>
        <Botao type="button" variante="secundario" onClick={() => { setAberto(false); setErro(""); }}>Fechar</Botao>
      </div>
    </form>
  );
}
