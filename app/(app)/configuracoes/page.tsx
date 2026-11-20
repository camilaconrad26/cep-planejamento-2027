import type { Metadata } from "next";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
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
        <Cartao titulo="Excluir conta">
          {comPapel ? <p className="text-sec">Contas de mentora ou administradora não podem ser excluídas por aqui.</p> : <FormExcluir />}
        </Cartao>
      </Corpo>
    </>
  );
}
