// Vercel Function — proxy Pappers authentifié.
//
// Pourquoi ce proxy :
//   Le token Pappers (quota 1000 req/mois) ne doit pas être exposé
//   côté navigateur. Tout user (et tout scraper) peut sinon l'épuiser
//   en quelques minutes. Ce proxy :
//     1. Exige un JWT Supabase valide (utilisateur authentifié)
//     2. Forward vers api.pappers.fr avec le token SERVEUR
//     3. Restreint les endpoints accessibles (whitelist)
//
// Variables d'env Vercel :
//   PAPPERS_API_TOKEN
//   SUPABASE_URL
//   SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = process.env.PUBLIC_ORIGIN || "https://deb02-crm.vercel.app";

// Whitelist des endpoints Pappers accessibles via ce proxy.
// Tout autre chemin est refusé (404).
const ALLOWED_ENDPOINTS = new Set([
  "/entreprise",
  "/recherche",
  "/suggestions",
]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // 1. JWT Supabase obligatoire
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  const token = auth.slice(7);
  const supaUrl = process.env.SUPABASE_URL;
  const supaAnon = process.env.SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) return res.status(500).json({ error: "Supabase env not configured" });
  const supa = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: "Invalid token" });

  // 2. Whitelist du path Pappers cible
  const path = String(req.query.path || "/entreprise");
  if (!ALLOWED_ENDPOINTS.has(path)) return res.status(404).json({ error: "Endpoint not allowed" });

  // 3. Récupération des query params (hors "path"), réécriture vers Pappers
  const papperToken = process.env.PAPPERS_API_TOKEN;
  if (!papperToken) return res.status(500).json({ error: "Pappers token not configured" });
  const url = new URL("https://api.pappers.fr/v2" + path);
  url.searchParams.set("api_token", papperToken);
  Object.entries(req.query).forEach(([k, v]) => {
    if (k === "path") return;
    url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
  });

  try {
    const r = await fetch(url.toString(), { method: "GET", headers: { Accept: "application/json" } });
    const body = await r.text();
    res.setHeader("Content-Type", r.headers.get("Content-Type") || "application/json");
    // Cache de 7 jours pour économiser le quota Pappers (1000 req/mois)
    res.setHeader("Cache-Control", "private, max-age=604800");
    return res.status(r.status).send(body);
  } catch (e) {
    return res.status(502).json({ error: "Pappers fetch failed", details: e.message });
  }
}
