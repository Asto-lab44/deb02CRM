// Vercel Function — création d'événement Google Calendar.
//
// Setup :
//   1. https://console.cloud.google.com/apis/credentials → créer un Service Account
//   2. Activer Google Calendar API sur le projet
//   3. Partager le calendrier cible avec l'email du service account (avec droits Make changes)
//   4. Variables d'env Vercel :
//        GOOGLE_SA_EMAIL
//        GOOGLE_SA_PRIVATE_KEY (échapper les \n)
//        GOOGLE_CALENDAR_ID (ex. equipe@astorya.fr)
//        SUPABASE_URL
//        SUPABASE_ANON_KEY
//
// Pour Outlook/Microsoft 365, remplacer par Microsoft Graph (même structure).

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = process.env.PUBLIC_ORIGIN || "https://deb02-crm.vercel.app";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1. JWT Supabase obligatoire (le calendrier équipe est privé, pas de création anonyme)
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  const token = auth.slice(7);
  const supaUrl = process.env.SUPABASE_URL;
  const supaAnon = process.env.SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) return res.status(500).json({ error: "Supabase env not configured" });
  const supa = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: "Invalid token" });

  // 2. Validation des entrées
  const { summary, description, startISO, endISO, attendees, location } = req.body || {};
  if (!summary || !startISO || !endISO) return res.status(400).json({ error: "Missing summary/start/end" });
  if (String(summary).length > 200) return res.status(400).json({ error: "Summary too long" });
  if (description && String(description).length > 10000) return res.status(400).json({ error: "Description too long" });
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);
  if (isNaN(startDate) || isNaN(endDate)) return res.status(400).json({ error: "Invalid date" });
  if (endDate <= startDate) return res.status(400).json({ error: "End must be after start" });
  if (endDate - startDate > 30 * 24 * 3600 * 1000) return res.status(400).json({ error: "Event too long (max 30 days)" });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanAttendees = (attendees || []).map((e) => String(e).trim()).filter(Boolean);
  if (cleanAttendees.length > 50) return res.status(400).json({ error: "Too many attendees (max 50)" });
  if (cleanAttendees.some((e) => !emailRe.test(e))) return res.status(400).json({ error: "Invalid attendee email" });

  const email = process.env.GOOGLE_SA_EMAIL;
  const key = (process.env.GOOGLE_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const calId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !key || !calId) return res.status(500).json({ error: "Google Calendar not configured" });

  const jwt = new google.auth.JWT(email, null, key, ["https://www.googleapis.com/auth/calendar"]);
  const calendar = google.calendar({ version: "v3", auth: jwt });

  try {
    const r = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary, description, location,
        start: { dateTime: startISO, timeZone: "Europe/Paris" },
        end: { dateTime: endISO, timeZone: "Europe/Paris" },
        attendees: cleanAttendees.map((email) => ({ email })),
        reminders: { useDefault: true },
        extendedProperties: { private: { sender_user_id: userData.user.id } },
      },
    });
    return res.status(200).json({ ok: true, eventId: r.data.id, htmlLink: r.data.htmlLink });
  } catch (e) {
    return res.status(500).json({ error: "Calendar insert failed", details: e.message });
  }
}
