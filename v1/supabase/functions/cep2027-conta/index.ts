// CEP · Planejamento 2027 (v1): cadastro de alunas (sem e-mail de confirmação) e senha provisória definida pela mentora.
// verify_jwt desligado: o cadastro é público e a ação "redefinir" valida o token aqui dentro.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resp = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Tabelas do escritório que liberam acesso por e-mail. Esses e-mails nunca podem ser cadastrados por aqui,
// porque este cadastro não confirma a posse do e-mail.
const TABELAS_EQUIPE = ["crm_equipe", "painel_equipe", "kyron_admins"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return resp(405, { erro: "Método não permitido." });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let b: Record<string, string>;
  try { b = await req.json(); } catch { return resp(400, { erro: "Pedido inválido." }); }

  if (b.acao === "cadastro") {
    const nome = String(b.nome ?? "").trim().slice(0, 120);
    const email = String(b.email ?? "").trim().toLowerCase();
    const senha = String(b.senha ?? "");
    if (nome.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return resp(400, { erro: "Confira nome e e-mail." });
    if (senha.length < 8) return resp(400, { erro: "A senha precisa de pelo menos 8 caracteres." });
    if (senha.length > 72) return resp(400, { erro: "A senha pode ter no máximo 72 caracteres." });
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
    const { data: liberado, error: eLim } = await admin.rpc("cep_registrar_tentativa", { p_ip: ip });
    if (eLim) return resp(500, { erro: "Não foi possível criar a conta." });
    if (!liberado) return resp(429, { erro: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." });
    for (const t of TABELAS_EQUIPE) {
      const { data, error } = await admin.from(t).select("email").ilike("email", email.replace(/[\\%_]/g, "\\$&")).limit(1);
      if (error) return resp(500, { erro: "Não foi possível criar a conta." });
      if (data.length) return resp(409, { erro: 'Este e-mail já tem cadastro. Use "Entrar".' }); // não revela quem é da equipe
    }
    // origem em app_metadata (não editável pela pessoa); user_metadata mantido por compatibilidade.
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true,
      user_metadata: { nome, origem: "cep2027" }, app_metadata: { origem: "cep2027" } });
    if (error || !data.user) {
      const ja = /already|registered|exists/i.test(error?.message ?? "");
      return resp(ja ? 409 : 400, { erro: ja ? 'Este e-mail já tem cadastro. Use "Entrar".' : "Não foi possível criar a conta." });
    }
    const { error: e2 } = await admin.from("cep2027_planos").insert({ user_id: data.user.id, nome, email });
    if (e2) { await admin.auth.admin.deleteUser(data.user.id); return resp(500, { erro: "Não foi possível criar a conta." }); }
    return resp(200, { ok: true });
  }

  if (b.acao === "redefinir") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: quem } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!quem?.user) return resp(401, { erro: "Sessão expirada. Entre de novo." });
    const { data: m, error: eM } = await admin.from("cep2027_mentoras").select("user_id").eq("user_id", quem.user.id).maybeSingle();
    if (eM) return resp(500, { erro: "Não foi possível verificar a permissão. Tente de novo." });
    if (!m) return resp(403, { erro: "Apenas a mentora pode redefinir senhas." });
    const nova = String(b.novaSenha ?? "");
    if (nova.length < 8 || nova.length > 72) return resp(400, { erro: "A senha precisa ter de 8 a 72 caracteres." });
    // Só contas criadas por este sistema (origem cep2027, em app_metadata) podem ter a senha redefinida aqui.
    const { data: alvo } = await admin.auth.admin.getUserById(String(b.userId));
    if (!alvo?.user || alvo.user.app_metadata?.origem !== "cep2027") return resp(403, { erro: "Esta conta não pode ter a senha redefinida por aqui." });
    const { error } = await admin.auth.admin.updateUserById(alvo.user.id, { password: nova });
    if (error) return resp(400, { erro: "Não foi possível redefinir a senha." });
    return resp(200, { ok: true });
  }
  return resp(400, { erro: "Ação desconhecida." });
});
