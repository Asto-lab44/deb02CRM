// Vercel Function — envoi d'email via SendGrid.
//
// Variables d'environnement requises côté Vercel :
//   SENDGRID_API_KEY
//   EMAIL_FROM (ex. notifications@astorya.fr — domaine vérifié dans SendGrid)
//
// Appel côté client :
//   await fetch("/api/send-email", { method: "POST",
//     headers: { Authorization: "Bearer " + supaSessionToken, "Content-Type": "application/json" },
//     body: JSON.stringify({ to, subject, html, replyTo }) })

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Vérifie que l'appelant est un user Supabase authentifié
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  // (en prod : valider le JWT auprès de Supabase avec jose ou via getUser)

  const { to, subject, html, replyTo } = req.body || {};
  if (!to || !subject || !html) return res.status(400).json({ error: "Missing to/subject/html" });

  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return res.status(500).json({ error: "SendGrid not configured" });

  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "Hub Astorya" },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return res.status(r.status).json({ error: "SendGrid failed", details: txt });
  }
  return res.status(200).json({ ok: true });
}
