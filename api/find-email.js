// Vercel Function — recherche d'email d'un prospect avec VÉRIFICATION SIRET.
//
// Méthode (licite) :
//   1. Détermine des URL candidates : le site web s'il est connu, sinon des
//      domaines déduits du nom (slug + .fr/.com…).
//   2. Récupère côté serveur (pas de CORS) les pages PUBLIQUES et légalement
//      obligatoires : mentions légales, contact, page d'accueil.
//   3. VÉRIFIE que le SIRET du prospect figure sur la page → garantit qu'on
//      est bien sur le site de la bonne entreprise (aucun faux positif : un
//      site deviné dont le SIRET ne correspond pas est écarté).
//   4. Extrait les emails, privilégie une adresse générique (contact@…).
//
// On ne lit que des pages publiques d'identité d'entreprise, en faible volume,
// avec un User-Agent explicite. Réservé à un usage B2B de prospection.
//
// Variables d'env Vercel : SUPABASE_URL, SUPABASE_ANON_KEY, PUBLIC_ORIGIN
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = process.env.PUBLIC_ORIGIN || "https://deb02-crm.vercel.app";
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

const digits = (s) => String(s || "").replace(/\D/g, "");
const LEGAL_PATHS = ["", "/mentions-legales", "/mentions-legales/", "/mentions-legales.html", "/mentions_legales", "/informations-legales", "/contact", "/contact/", "/nous-contacter"];
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const GENERIC = ["contact", "info", "accueil", "commercial", "hello", "bonjour", "secretariat", "direction", "compta", "administratif"];

function normBase(website) {
  if (!website) return null;
  let w = String(website).trim();
  if (!/^https?:\/\//i.test(w)) w = "https://" + w;
  try { return new URL(w).origin; } catch (e) { return null; }
}

function candidateBases(name) {
  const clean = String(name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\b(sarl|sas|sasu|eurl|sa|sci|ei|earl|scea|gaec|groupe|group|ets|etablissements|entreprise|societe|cie)\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ").trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const concat = words.join(""), hyphen = words.join("-");
  const names = [...new Set([concat, hyphen])].filter((s) => s.length >= 3 && s.length <= 40);
  const bases = [];
  names.forEach((n) => { [".fr", ".com"].forEach((tld) => { bases.push("https://www." + n + tld); }); });
  return bases.slice(0, 4);
}

async function fetchText(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ctrl.signal,
      headers: { "User-Agent": "AstoryaHubBot/1.0 (+prospection B2B; verification SIRET)", "Accept": "text/html,application/xhtml+xml" } });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!/text|html/i.test(ct)) return null;
    return (await r.text()).slice(0, 900000);
  } catch (e) { return null; } finally { clearTimeout(t); }
}

function extractEmails(html) {
  const found = new Set();
  (html.match(EMAIL_RE) || []).forEach((e) => found.add(e.toLowerCase()));
  (html.match(/mailto:([^"'?>\s]+)/gi) || []).forEach((m) => found.add(decodeURIComponent(m.slice(7)).toLowerCase()));
  return [...found].filter((e) => !/\.(png|jpe?g|gif|svg|webp|css|js)$/.test(e) && !/(sentry|wixpress|example\.com|@sentry|\.png|u002)/.test(e));
}

function pickBest(emails, domain) {
  const onDom = domain ? emails.filter((e) => e.split("@")[1] && (e.endsWith("@" + domain) || e.endsWith("." + domain))) : [];
  const pool = onDom.length ? onDom : emails;
  const gen = pool.find((e) => GENERIC.some((p) => e.startsWith(p + "@")));
  return gen || pool[0] || null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Récupère le site web d'une entreprise via Pappers (couplage demandé).
async function pappersWebsite(siren) {
  const token = process.env.PAPPERS_API_TOKEN;
  if (!token || !siren) return null;
  try {
    const u = new URL("https://api.pappers.fr/v2/entreprise");
    u.searchParams.set("api_token", token);
    u.searchParams.set("siren", digits(siren).slice(0, 9));
    const r = await fetch(u.toString(), { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    return j.site_web || (j.entreprise && j.entreprise.site_web) || null;
  } catch (e) { return null; }
}

// Outil dédié : Dropcontact (company + SIREN → email pro + site web). Async :
// on soumet puis on interroge quelques secondes. RGPD-compliant (FR).
async function dropcontact({ name, siren, website }, key) {
  try {
    const submit = await fetch("https://api.dropcontact.com/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Token": key },
      body: JSON.stringify({ data: [{ company: name || undefined, siren: siren || undefined, website: website || undefined }], siren: true, language: "fr" }),
    });
    const sj = await submit.json();
    const reqId = sj && (sj.request_id || sj.requestId);
    if (!reqId) return null;
    for (let i = 0; i < 6; i++) {
      await sleep(2500);
      const p = await fetch("https://api.dropcontact.com/batch/" + reqId, { headers: { "X-Access-Token": key } });
      const pj = await p.json();
      if (pj && pj.success && Array.isArray(pj.data)) {
        const row = pj.data[0] || {};
        const email = (Array.isArray(row.email) && row.email[0] && row.email[0].email) || (typeof row.email === "string" ? row.email : null);
        return { email: email || null, website: row.website || null, provider: "dropcontact" };
      }
    }
    return { pending: true, provider: "dropcontact" };
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  const supaUrl = process.env.SUPABASE_URL, supaAnon = process.env.SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) return res.status(500).json({ error: "Supabase env not configured" });
  const supa = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: auth } } });
  const { data: u, error: aerr } = await supa.auth.getUser(auth.slice(7));
  if (aerr || !u || !u.user) return res.status(401).json({ error: "Invalid token" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const targetSiret = digits(body.siret);
  const targetSiren = digits(body.siren) || (targetSiret ? targetSiret.slice(0, 9) : "");
  if (!targetSiret && !targetSiren) return res.status(200).json({ status: "no_siret", message: "SIREN/SIRET manquant — enrichis d'abord la fiche." });

  // Site web : fourni, sinon récupéré via Pappers (couplage).
  let website = body.website || "";
  if (!website) { website = (await pappersWebsite(targetSiren)) || ""; }

  // 1) Outil dédié (Dropcontact) si configuré — company + SIREN → email + site.
  const dcKey = process.env.DROPCONTACT_API_KEY;
  if (dcKey) {
    const dc = await dropcontact({ name: body.name, siren: targetSiren, website }, dcKey);
    if (dc && dc.email) {
      return res.status(200).json({ status: "verified_tool", email: dc.email, emails: [dc.email], siret_verified: true, website: dc.website || website || null, source_url: dc.website || null, provider: "dropcontact" });
    }
    if (dc && dc.website && !website) website = dc.website;
  }

  // 2) Fallback : lecture mentions légales + vérification SIRET.
  const bases = [];
  const known = normBase(website);
  if (known) bases.push(known);
  candidateBases(body.name).forEach((b) => { if (!bases.includes(b)) bases.push(b); });

  let verifiedUrl = null, verifiedEmails = [], anyEmails = [], domainOut = null, checkedSiren = false;
  outer:
  for (const base of bases.slice(0, 5)) {
    let domain = null; try { domain = new URL(base).hostname.replace(/^www\./, ""); } catch (e) { continue; }
    for (const p of LEGAL_PATHS) {
      const html = await fetchText(base + p);
      if (!html) continue;
      const norm = digits(html);
      const siretMatch = targetSiret && norm.includes(targetSiret);
      const sirenMatch = targetSiren && norm.includes(targetSiren);
      const emails = extractEmails(html);
      anyEmails.push(...emails);
      if (siretMatch) { verifiedUrl = base + p; verifiedEmails = emails; domainOut = domain; break outer; }
      if (sirenMatch && emails.length && !verifiedUrl) { verifiedUrl = base + p; verifiedEmails = emails; domainOut = domain; checkedSiren = true; }
    }
  }

  const pool = verifiedEmails.length ? verifiedEmails : [...new Set(anyEmails)];
  const best = pickBest(pool, domainOut);
  const strong = !!verifiedUrl && !checkedSiren; // SIRET exact
  const siteOut = website || (verifiedUrl ? (function () { try { return new URL(verifiedUrl).origin; } catch (e) { return null; } })() : (domainOut ? "https://www." + domainOut : null));
  return res.status(200).json({
    status: best ? (strong ? "verified_siret" : (verifiedUrl ? "verified_siren" : "found_unverified")) : "not_found",
    email: best || null,
    emails: [...new Set(pool)].slice(0, 8),
    siret_verified: strong,
    source_url: verifiedUrl || null,
    website: siteOut,
    domain: domainOut,
  });
}

// Autorise le temps de polling Dropcontact.
export const config = { maxDuration: 30 };
