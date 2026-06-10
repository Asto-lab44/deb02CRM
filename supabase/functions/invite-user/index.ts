// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Invitation utilisateur (Edge Function Deno)
// ════════════════════════════════════════════════════════════════════
//
// Invite un nouvel utilisateur dans le Hub :
//   1. Vérifie que l'appelant est admin (groupe "admin" dans profile_groups)
//   2. Appelle auth.admin.inviteUserByEmail() qui envoie un mail d'invitation
//      Supabase contenant un lien magique pour définir le mot de passe
//   3. Le trigger handle_new_user (déjà en place) crée la row profile
//   4. On enrichit la row profile avec name + role + extension_3cx
//   5. On assigne les groupes initiaux dans profile_groups
//
// BODY ATTENDU
//   { email, name, role?, extension?, groups? }
// ════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};
const json = (body: any, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "content-type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  // 1. Vérifie le JWT de l'appelant
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing Authorization Bearer JWT" }, 401);
  const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: u, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !u?.user) return json({ error: "Invalid JWT" }, 401);

  // 2. Vérifie que l'appelant est admin
  const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: pg } = await supaAdmin
    .from("profile_groups")
    .select("group_id")
    .eq("profile_id", u.user.id)
    .eq("group_id", "admin");
  if (!pg || pg.length === 0) {
    return json({ error: "Réservé aux admins" }, 403);
  }

  // 3. Parse body
  let body: any = {};
  try { body = await req.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400); }
  const email     = String(body.email || "").trim().toLowerCase();
  const name      = String(body.name  || "").trim();
  const role      = String(body.role  || "").trim() || null;
  const extension = String(body.extension || "").trim() || null;
  const groups    = Array.isArray(body.groups) ? body.groups.filter(Boolean) : [];

  if (!email || !email.includes("@")) return json({ error: "Email invalide" }, 400);
  if (!name) return json({ error: "Nom obligatoire" }, 400);

  // 4. Invite via Supabase Auth admin (mail magic link)
  // @ts-ignore - admin API typings
  const { data: invited, error: inviteErr } = await supaAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  });
  if (inviteErr) {
    // Cas "User already exists" → on tente quand même la mise à jour du profile
    if (!/already (registered|exists)/i.test(inviteErr.message)) {
      return json({ error: "Échec invitation : " + inviteErr.message }, 502);
    }
  }

  const newUserId = invited?.user?.id;
  // 5. Récupère l'id si user pré-existant
  let userId: string | null = newUserId || null;
  if (!userId) {
    const { data: list } = await supaAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = (list?.users || []).find((x: any) => (x.email || "").toLowerCase() === email);
    userId = found?.id || null;
  }
  if (!userId) return json({ error: "User créé mais id introuvable" }, 500);

  // 6. Met à jour le profile (le trigger handle_new_user a déjà créé la row de base)
  await supaAdmin.from("profiles").upsert({
    id: userId,
    email,
    name,
    role,
    extension_3cx: extension,
    status: "invited",
  });

  // 7. Assigne les groupes
  if (groups.length > 0) {
    const rows = groups.map((gid: string) => ({ profile_id: userId, group_id: gid }));
    await supaAdmin.from("profile_groups").upsert(rows, { onConflict: "profile_id,group_id" });
  }

  return json({ ok: true, user_id: userId, email, invited: !!newUserId });
});
