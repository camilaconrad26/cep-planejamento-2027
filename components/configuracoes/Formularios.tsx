"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/Botao";
import { atualizarNome, atualizarPerfil, excluirConta, trocarSenha, type Resultado } from "@/lib/data/perfil";
import { PERFIS } from "@/lib/domain/perfis";

const rotulo = "font-bold text-tinta";
function Enviar({ children, ...p }: React.ComponentProps<typeof Botao>) {
  const { pending } = useFormStatus();
  return <Botao type="submit" {...p} disabled={pending || p.disabled}>{pending ? "Aguarde…" : children}</Botao>;
}
const Mensagem = ({ r }: { r: Resultado }) => (
  <p role="status" className={`min-h-[1.6em] font-bold ${r.erro ? "text-alerta" : "text-ok"}`}>{r.erro ?? r.ok ?? ""}</p>
);

export function FormNome({ nome }: { nome: string }) {
  const [r, acao] = useActionState(atualizarNome, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <label htmlFor="nome" className={rotulo}>Nome completo</label>
      <div className="flex flex-wrap gap-3"><input id="nome" name="nome" defaultValue={nome} maxLength={120} autoComplete="name" className="campo min-w-0 flex-1 basis-64" />
        <Enviar variante="secundario">Salvar nome</Enviar></div>
      <Mensagem r={r} />
    </form>
  );
}

export function FormPerfil({ perfil }: { perfil: number | null }) {
  const [r, acao] = useActionState(atualizarPerfil, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${rotulo} mb-2`}>Perfil profissional</legend>
        <div className="grid gap-2.5 md:grid-cols-3">
          {PERFIS.map((p) => (
            <label key={p.n} className="flex cursor-pointer gap-3 rounded-cartao border border-linha bg-white p-4 hover:border-ouro-fio has-[:checked]:border-ouro-fio has-[:checked]:bg-papel-2">
              <input type="radio" name="perfil" value={p.n} defaultChecked={perfil === p.n} required />
              <span><b className="block font-display text-tinta">{p.nome}</b><small className="text-sec">{p.texto}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div><Enviar variante="secundario">Salvar perfil</Enviar></div>
      <Mensagem r={r} />
    </form>
  );
}

export function FormSenha() {
  const [r, acao] = useActionState(trocarSenha, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <label htmlFor="senha" className={rotulo}>Nova senha (mínimo 8 caracteres)</label>
      <div className="flex flex-wrap gap-3"><input id="senha" name="senha" type="password" autoComplete="new-password" className="campo min-w-0 flex-1 basis-64" />
        <Enviar variante="secundario">Trocar senha</Enviar></div>
      <Mensagem r={r} />
    </form>
  );
}

export function FormExcluir() {
  const [r, acao] = useActionState(excluirConta, {});
  const [texto, setTexto] = useState("");
  return (
    <form action={acao} className="flex flex-col gap-3">
      <p>Excluir a conta apaga o diagnóstico, o fechamento, as tarefas e todo o planejamento. Não dá para desfazer.</p>
      <label htmlFor="confirmacao" className={rotulo}>Para confirmar, digite EXCLUIR</label>
      <div className="flex flex-wrap gap-3">
        <input id="confirmacao" name="confirmacao" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" className="campo min-w-0 flex-1 basis-48" />
        <Enviar variante="perigo" disabled={texto !== "EXCLUIR"}>Excluir minha conta</Enviar>
      </div>
      <Mensagem r={r} />
    </form>
  );
}
