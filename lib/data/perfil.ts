"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/data/supabase/servidor";
import { exigirSessao } from "@/lib/data/sessao";

export type Resultado = { ok?: string; erro?: string; n?: number };

export async function atualizarNome(_: Resultado, f: FormData): Promise<Resultado> {
  const s = await exigirSessao();
  const nome = String(f.get("nome") ?? "").trim().slice(0, 120);
  if (nome.length < 3) return { erro: "Informe o seu nome completo.", n: Date.now() };
  const sb = await criarClienteServidor();
  const { error } = await sb.from("cep_profiles").update({ nome }).eq("user_id", s.userId);
  if (error) return { erro: "Não foi possível salvar o nome. Tente de novo.", n: Date.now() };
  revalidatePath("/", "layout");
  return { ok: "Nome salvo.", n: Date.now() };
}

export async function atualizarPerfil(_: Resultado, f: FormData): Promise<Resultado> {
  const s = await exigirSessao();
  const p = Number(f.get("perfil"));
  if (![1, 2, 3].includes(p)) return { erro: "Escolha um dos três perfis.", n: Date.now() };
  const sb = await criarClienteServidor();
  const { error } = await sb.from("cep_profiles").update({ perfil: p }).eq("user_id", s.userId);
  if (error) return { erro: "Não foi possível salvar o perfil. Tente de novo.", n: Date.now() };
  revalidatePath("/", "layout");
  return { ok: "Perfil salvo.", n: Date.now() };
}

export async function trocarSenha(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirSessao();
  const nova = String(f.get("senha") ?? "");
  if (nova.length < 8) return { erro: "A senha precisa de pelo menos 8 caracteres.", n: Date.now() };
  const sb = await criarClienteServidor();
  const { error } = await sb.auth.updateUser({ password: nova });
  if (error) return { erro: /same|different/i.test(error.message) ? "A nova senha precisa ser diferente da atual." : "Não foi possível trocar a senha. Tente de novo.", n: Date.now() };
  return { ok: "Senha alterada.", n: Date.now() };
}

export async function excluirConta(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirSessao();
  if (String(f.get("confirmacao") ?? "") !== "EXCLUIR") return { erro: "Digite EXCLUIR para confirmar.", n: Date.now() };
  const sb = await criarClienteServidor();
  const { error } = await sb.rpc("cep_excluir_minha_conta");
  if (error) return { erro: "Não foi possível excluir a conta. Fale com a mentora do CEP.", n: Date.now() };
  await sb.auth.signOut();
  redirect("/entrar");
}
