import type { Metadata } from "next";
import { FormularioConta } from "@/components/conta/FormularioConta";
import { criarConta } from "@/lib/data/conta";

export const metadata: Metadata = { title: "Criar conta" };

export default function CriarConta() {
  return <FormularioConta modo="criar" acao={criarConta} />;
}
