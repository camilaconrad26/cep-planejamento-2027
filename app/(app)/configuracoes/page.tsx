import type { Metadata } from "next";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import Link from "next/link";
import { Cartao } from "@/components/ui/Cartao";
import { FormExcluir, FormNome, FormPerfil, FormSenha } from "@/components/configuracoes/Formularios";
import { exigirSessao } from "@/lib/data/sessao";

export const metadata: Metadata = { title: "Configurações" };

export default async function Configuracoes() {
  const s = await exigirSessao();
  const comPapel = s.papeis.length > 0;
  return (
    <>
      <FaixaTitulo olho="Conta" titulo="Configurações" descricao={`Você entra com ${s.email}.`} />
      <Corpo>
        <Cartao titulo="Seus dados"><FormNome nome={s.nome} /></Cartao>
        <Cartao titulo="Perfil"><p className="text-sec">O perfil define as sugestões da biblioteca de estratégias. Você pode trocar quando quiser.</p><FormPerfil perfil={s.perfil} /></Cartao>
        <Cartao titulo="Senha"><FormSenha /></Cartao>
        <Cartao titulo="Exportar">
          <p className="text-sec">Leve o seu planejamento para fora do sistema quando quiser.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/imprimir" className="rounded-full border-[1.5px] border-ouro-fio px-5 py-2.5 font-bold text-ouro-texto hover:bg-papel-2 hover:text-tinta">Versão para imprimir ou salvar em PDF</Link>
            <a href="/exportar/acoes" download className="rounded-full border-[1.5px] border-ouro-fio px-5 py-2.5 font-bold text-ouro-texto hover:bg-papel-2 hover:text-tinta">Baixar ações em planilha (CSV)</a>
          </div>
        </Cartao>
        {s.papeis.includes("admin") && (
          <Cartao titulo="Biblioteca">
            <p className="text-sec">Corrija textos, desative ou crie itens e ajuste a descrição das categorias.</p>
            <Link href="/configuracoes/biblioteca" className="self-start rounded-full border-[1.5px] border-ouro-fio px-5 py-2.5 font-bold text-ouro-texto hover:bg-papel-2 hover:text-tinta">Editar biblioteca</Link>
          </Cartao>
        )}
        <Cartao titulo="Excluir conta">
          {comPapel ? <p className="text-sec">Contas de mentora ou administradora não podem ser excluídas por aqui.</p> : <FormExcluir />}
        </Cartao>
      </Corpo>
    </>
  );
}
