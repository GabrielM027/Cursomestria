import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return res.status(500).json({ error: "Supabase não configurado na Vercel." });

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Sessão administrativa ausente." });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const userResult = await adminClient.auth.getUser(token);
  if (userResult.error || !userResult.data.user) return res.status(401).json({ error: "Sessão administrativa inválida." });

  const currentProfile = await adminClient.from("adminProfiles").select("id,isActive").eq("userId", userResult.data.user.id).eq("isActive", true).maybeSingle();
  if (currentProfile.error || !currentProfile.data) return res.status(403).json({ error: "Acesso administrativo não autorizado." });

  const { name, email, password } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" || !email.includes("@") || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Informe nome, e-mail válido e senha com ao menos 8 caracteres." });
  }

  const created = await adminClient.auth.admin.createUser({ email: email.trim().toLowerCase(), password, email_confirm: true, user_metadata: { name: name.trim() } });
  if (created.error || !created.data.user) return res.status(400).json({ error: created.error?.message || "Não foi possível criar a conta." });

  const profile = await adminClient.from("adminProfiles").insert({ userId: created.data.user.id, name: name.trim(), email: email.trim().toLowerCase(), isActive: true }).select("id,userId,name,email,isActive,createdAt").single();
  if (profile.error) {
    await adminClient.auth.admin.deleteUser(created.data.user.id);
    return res.status(400).json({ error: profile.error.message });
  }

  return res.status(201).json(profile.data);
}
