// Vercel Function — endpoint de réception des appels entrants 3CX.
//
// À configurer côté 3CX :
//   Settings → Phone System → URL Call Action
//   URL : https://deb02-crm.vercel.app/api/3cx-webhook
//   Method : POST
//   Trigger : on incoming call
//   Body : {"phone": "{caller_number}", "callId": "{call_id}", "extension": "{extension}"}
//
// À configurer côté Vercel :
//   Settings → Environment Variables :
//     SUPABASE_URL (déjà défini)
//     SUPABASE_SERVICE_ROLE_KEY (à créer — clé secret côté serveur uniquement)
//     CX_WEBHOOK_SECRET (un secret partagé pour valider la requête)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Auth obligatoire via header partagé (fail closed)
  const secret = req.headers["x-3cx-secret"];
  if (!process.env.CX_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "CX_WEBHOOK_SECRET not configured" });
  }
  if (!secret || secret !== process.env.CX_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Bad secret" });
  }

  const { phone, callId, extension, recordingUrl } = req.body || {};
  if (!phone) return res.status(400).json({ error: "Missing phone" });

  // ── Lookup client par téléphone (à étendre selon votre logique)
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) return res.status(500).json({ error: "Supabase not configured" });

  // Insère l'appel en base via REST API Supabase (pas besoin du SDK serveur)
  const callRow = {
    caller_phone: phone,
    line: extension || "Hotline support",
    direction: "inbound",
    status: "completed",
    started_at: new Date().toISOString(),
    recording_url: recordingUrl || null,
  };

  const r = await fetch(`${supaUrl}/rest/v1/calls`, {
    method: "POST",
    headers: {
      apikey: supaKey,
      Authorization: `Bearer ${supaKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(callRow),
  });

  if (!r.ok) {
    const err = await r.text();
    return res.status(500).json({ error: "Supabase insert failed", details: err });
  }
  const [created] = await r.json();

  // ── Pousser un événement realtime (Supabase Realtime fait déjà ça via INSERT)
  return res.status(200).json({ ok: true, callId: created.id });
}
