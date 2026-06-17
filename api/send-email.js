// Vercel Function — envoi d'email via SendGrid.
//
// Variables d'environnement requises côté Vercel :
//   SENDGRID_API_KEY
//   EMAIL_FROM (ex. notifications@astorya.fr — domaine vérifié dans SendGrid)
//   SUPABASE_URL
//   SUPABASE_ANON_KEY (la même que côté client, sert à valider le JWT)
//
// Appel côté client :
//   await fetch("/api/send-email", { method: "POST",
//     headers: { Authorization: "Bearer " + supaSessionToken, "Content-Type": "application/json" },
//     body: JSON.stringify({ to, subject, html, replyTo }) })

import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = process.env.PUBLIC_ORIGIN || "https://deb02-crm.vercel.app";

function setCors(res, origin) {
  // Whitelist : on accepte uniquement le domaine de l'app (pas *)
  const allow = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1. Vérifie un vrai JWT Supabase (pas juste « starts with Bearer »)
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  const token = auth.slice(7);
  const supaUrl = process.env.SUPABASE_URL;
  const supaAnon = process.env.SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) return res.status(500).json({ error: "Supabase env not configured" });
  const supa = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: "Invalid token" });

  // 2. Validation basique des entrées (anti relais SendGrid)
  const { to, subject, html, replyTo } = req.body || {};
  if (!to || !subject || !html) return res.status(400).json({ error: "Missing to/subject/html" });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toList = (Array.isArray(to) ? to : [to]).map((e) => String(e).trim()).filter(Boolean);
  if (!toList.length || toList.some((e) => !emailRe.test(e))) return res.status(400).json({ error: "Invalid recipient" });
  if (toList.length > 50) return res.status(400).json({ error: "Too many recipients (max 50)" });
  if (replyTo && !emailRe.test(String(replyTo).trim())) return res.status(400).json({ error: "Invalid replyTo" });
  if (String(subject).length > 200) return res.status(400).json({ error: "Subject too long" });
  if (String(html).length > 500000) return res.status(400).json({ error: "Body too large" });

  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return res.status(500).json({ error: "SendGrid not configured" });

  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: toList.map((email) => ({ email })) }],
      from: { email: from, name: "Hub Astorya" },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: "text/html", value: html }],
      // Traceability : on tague l'envoi avec l'user qui l'a déclenché
      custom_args: { sender_user_id: userData.user.id },
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return res.status(r.status).json({ error: "SendGrid failed", details: txt });
  }
  return res.status(200).json({ ok: true });
}
