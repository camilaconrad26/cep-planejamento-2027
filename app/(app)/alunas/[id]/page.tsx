import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Corpo, FaixaTitulo } from "@/components/layout/FaixaTitulo";
import { Cartao } from "@/components/ui/Cartao";
import { RelatorioPlano } from "@/components/relatorio/RelatorioPlano";
import { RedefinirSenha } from "@/components/alunas/RedefinirSenha";
import { exigirSessao } from "@/lib/data/sessao";
import { orgDaAluna } from "@/lib/data/alunas";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";

export const metadata: Metadata = { title: "Plano da aluna" };
export const dynamic = "force-dynamic";

export default async function PlanoDaAluna({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirSessao();
  if (!s.papeis.includes("mentora")) notFound();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const orgId = await orgDaAluna(id);
  if (!orgId) notFound();
  const sb = await criarClienteServidor();
  const { data: p } = await sb.from("cep_profiles").select("nome").eq("user_id", id).maybeSingle();
  const nome = p?.nome ?? "Aluna";
  return (
    <>
      <FaixaTitulo olho="Mentoria · só leitura" titulo={nome} descricao="Plano da aluna como ela vê, sem edição.">
        <Link href="/alunas" className="self-start text-ouro underline underline-offset-4 hover:text-creme">Voltar para a lista</Link>
      </FaixaTitulo>
      <Corpo>
        <Cartao><RelatorioPlano orgId={orgId} userId={id} titulo="h2" /></Cartao>
        <Cartao titulo="Senha provisória"><RedefinirSenha userId={id} nome={nome} /></Cartao>
      </Corpo>
    </>
  );
}
