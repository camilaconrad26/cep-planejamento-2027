import type { Metadata } from "next";
import { FormularioConta } from "@/components/conta/FormularioConta";
import { entrar } from "@/lib/data/conta";
import { voltaSegura } from "@/lib/domain/volta";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  const { volta } = await searchParams;
  return <FormularioConta modo="entrar" acao={entrar} volta={voltaSegura(volta)} />;
}
