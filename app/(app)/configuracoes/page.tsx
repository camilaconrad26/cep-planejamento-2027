import type { Metadata } from "next";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import Link from "next/link";
import { Cartao } from "@/components/ui/Cartao";
import { FormExcluir, FormNome, FormPerfil, FormSenha } from "@/components/configuracoes/Formularios";
import { exigirSessao } from "@/lib/data/sessao";
import { ImportarV1 } from "@/components/configuracoes/ImportarV1";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";

export const metadata: Metadata = { title: "Configurações" };

export default async function Configuracoes() {
  const s = await exigirSessao();
  const comPapel = s.papeis.length > 0;
  const sb = await criarClienteServidor();
  const [v1, prof] = await Promise.all([
    sb.from("cep2027_planos").select("user_id").eq("user_id", s.userId).maybeSingle(),
    sb.from("cep_profiles").select("importado_v1_em").eq("user_id", s.userId).maybeSingle(),
  ]);
  const podeImportar = !!v1.data && !prof.data?.importado_v1_em;
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
        {podeImportar && <Cartao titulo="Importar da versão anterior"><ImportarV1 /></Cartao>}
        <Cartao titulo="Excluir conta">
          {comPapel ? <p className="text-sec">Contas de mentora ou administradora não podem ser excluídas por aqui.</p> : <FormExcluir />}
        </Cartao>
      </Corpo>
    </>
  );
}
