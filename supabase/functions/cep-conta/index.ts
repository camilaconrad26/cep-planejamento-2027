// CEP · Planejamento Estratégico v2 — cadastro aberto (sem e-mail de confirmação) e senha provisória pela mentora.
// verify_jwt desligado: o cadastro é público e a ação "redefinir" valida o token aqui dentro.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resp = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Tabelas do escritório que liberam acesso por e-mail. Como este cadastro não confirma a posse do e-mail,
// esses endereços nunca podem ser cadastrados por aqui.
const TABELAS_EQUIPE = ["crm_equipe", "painel_equipe", "kyron_admins"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return resp(405, { erro: "Método não permitido." });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return resp(400, { erro: "Pedido inválido." }); }

  if (b.acao === "cadastro") {
    const nome = String(b.nome ?? "").trim().slice(0, 120);
    const email = String(b.email ?? "").trim().toLowerCase();
    const senha = String(b.senha ?? "");
    if (nome.length < 3) return resp(400, { erro: "Informe o seu nome completo." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return resp(400, { erro: "Informe um e-mail válido." });
    if (senha.length < 8 || senha.length > 72) return resp(400, { erro: "A senha precisa de pelo menos 8 caracteres." });
    for (const t of TABELAS_EQUIPE) {
      const { data, error } = await admin.from(t).select("email").ilike("email", email.replace(/[\\%_]/g, "\\$&")).limit(1);
      if (error) return resp(500, { erro: "Não foi possível criar a conta. Tente de novo." });
      if (data.length) return resp(403, { erro: "Este e-mail não pode ser cadastrado por aqui. Fale com a mentora." });
    }
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome, origem: "cep" } });
    if (error || !data.user) {
      const ja = /already|registered|exists/i.test(error?.message ?? "");
      return resp(ja ? 409 : 400, { erro: ja ? 'Este e-mail já tem cadastro. Use "Entrar".' : "Não foi possível criar a conta." });
    }
    const { error: e2 } = await admin.rpc("cep_iniciar_conta", { p_user: data.user.id, p_nome: nome, p_email: email });
    if (e2) {
      await admin.auth.admin.deleteUser(data.user.id);
      return resp(500, { erro: "Não foi possível criar a conta. Tente de novo." });
    }
    return resp(200, { ok: true });
  }

  if (b.acao === "redefinir") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: quem } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!quem?.user) return resp(401, { erro: "Sessão expirada. Entre de novo." });
    const { data: m } = await admin.from("cep_roles").select("user_id").eq("user_id", quem.user.id).eq("papel", "mentora").maybeSingle();
    if (!m) return resp(403, { erro: "Apenas a mentora pode redefinir senhas." });
    const nova = String(b.novaSenha ?? "");
    if (nova.length < 8 || nova.length > 72) return resp(400, { erro: "A senha precisa de pelo menos 8 caracteres." });
    const alvoId = String(b.userId ?? "");
    const { data: papeisAlvo } = await admin.from("cep_roles").select("papel").eq("user_id", alvoId);
    if (papeisAlvo?.length) return resp(403, { erro: "Não é possível redefinir a senha de outra mentora ou administradora." });
    const { data: alvo } = await admin.auth.admin.getUserById(alvoId);
    const origem = alvo?.user?.user_metadata?.origem;
    if (!alvo?.user || (origem !== "cep" && origem !== "cep2027")) return resp(403, { erro: "Esta conta não pode ter a senha redefinida por aqui." });
    const { error } = await admin.auth.admin.updateUserById(alvo.user.id, { password: nova });
    if (error) return resp(400, { erro: "Não foi possível redefinir a senha." });
    return resp(200, { ok: true });
  }
  return resp(400, { erro: "Ação desconhecida." });
});
