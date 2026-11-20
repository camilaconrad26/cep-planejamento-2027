"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/Botao";
import { Olho } from "@/components/ui/Olho";
import type { EstadoForm } from "@/lib/data/conta";

type Acao = (s: EstadoForm, f: FormData) => Promise<EstadoForm>;

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Botao type="submit" sobreEscuro disabled={pending} className="min-h-[52px] w-full text-base">{pending ? "Aguarde…" : rotulo}</Botao>;
}

const Campo = ({ id, rotulo, ...p }: { id: string; rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 text-[0.9rem]">
    <label htmlFor={id} className="font-bold text-creme">{rotulo}</label>
    <input id={id} name={id} className="campo" {...p} />
  </div>
);

export function FormularioConta({ modo, acao, volta }: { modo: "entrar" | "criar"; acao: Acao; volta?: string }) {
  const [estado, enviar] = useActionState(acao, {});
  const criar = modo === "criar";
  return (
    <form action={enviar} noValidate aria-labelledby="titulo-form"
      className="flex flex-col gap-4 rounded-cartao border border-ouro-fio bg-noite-2 p-7 shadow-[0_0_0_1px_rgba(201,162,75,.5),0_0_40px_rgba(232,199,102,.1)] sm:p-8">
      <Olho sobreEscuro>CEP · Clube da Estratégia Patrimonial</Olho>
      <h1 id="titulo-form" className="text-[1.9rem]">{criar ? "Criar minha conta" : "Entrar"}</h1>
      {volta && <input type="hidden" name="volta" value={volta} />}
      {criar && <Campo id="nome" rotulo="Nome completo" autoComplete="name" defaultValue={estado.campos?.nome} required />}
      <Campo id="email" rotulo="E-mail" type="email" autoComplete="email" defaultValue={estado.campos?.email} required />
      <Campo id="senha" rotulo={criar ? "Crie uma senha (mínimo 8 caracteres)" : "Senha"} type="password"
        autoComplete={criar ? "new-password" : "current-password"} required />
      {estado.erro && <p role="alert" className="font-bold text-[#f2a383]">{estado.erro}</p>}
      <Enviar rotulo={criar ? "Criar conta" : "Entrar"} />
      <Link href={criar ? "/entrar" : "/criar-conta"} className="py-1.5 text-ouro underline underline-offset-4 hover:text-creme">
        {criar ? "Já tenho conta. Entrar" : "Primeiro acesso? Criar minha conta"}
      </Link>
      {!criar && <p className="text-cinza">Esqueceu a senha? Peça uma senha provisória à mentora do CEP.</p>}
    </form>
  );
}
