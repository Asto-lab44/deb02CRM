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
//
// Pour Outlook/Microsoft 365, remplacer par Microsoft Graph (même structure).

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { summary, description, startISO, endISO, attendees, location } = req.body || {};
  if (!summary || !startISO || !endISO) return res.status(400).json({ error: "Missing summary/start/end" });

  const email = process.env.GOOGLE_SA_EMAIL;
  const key = (process.env.GOOGLE_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const calId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !key || !calId) return res.status(500).json({ error: "Google Calendar not configured" });

  const auth = new google.auth.JWT(email, null, key, ["https://www.googleapis.com/auth/calendar"]);
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const r = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary, description, location,
        start: { dateTime: startISO, timeZone: "Europe/Paris" },
        end: { dateTime: endISO, timeZone: "Europe/Paris" },
        attendees: (attendees || []).map((email) => ({ email })),
        reminders: { useDefault: true },
      },
    });
    return res.status(200).json({ ok: true, eventId: r.data.id, htmlLink: r.data.htmlLink });
  } catch (e) {
    return res.status(500).json({ error: "Calendar insert failed", details: e.message });
  }
}
