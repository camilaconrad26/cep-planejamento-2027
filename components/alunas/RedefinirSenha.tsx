"use client";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { useAviso } from "@/components/ui/Aviso";
import { redefinirSenha } from "@/lib/data/alunasAcoes";

export function RedefinirSenha({ userId, nome }: { userId: string; nome: string }) {
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const aviso = useAviso();
  const id = useId();
  async function enviar(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setErro("");
    try { const r = await redefinirSenha(userId, senha); if (r.erro) setErro(r.erro); else { aviso({ texto: r.ok! }); setSenha(""); } }
    catch { setErro("Não foi possível redefinir a senha. Verifique a conexão."); } finally { setEnviando(false); }
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold text-tinta">Nova senha provisória</label>
      <div className="flex flex-wrap gap-2">
        <input id={id} type="text" autoComplete="off" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} maxLength={72} className="campo min-w-0 flex-1 basis-56" />
        <Botao type="submit" disabled={enviando || senha.length < 8}>{enviando ? "Aguarde…" : "Definir senha provisória"}</Botao>
      </div>
      <p className="text-[0.85rem] text-sec">Mínimo de 8 caracteres. Envie a senha a {nome} por um canal seguro e peça que ela troque em Configurações.</p>
      {erro && <p role="alert" className="font-bold text-alerta">{erro}</p>}
    </form>
  );
}
