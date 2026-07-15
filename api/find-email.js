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

async function fetchText(url, timeoutMs = 3000) {
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
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    let r;
    try { r = await fetch(u.toString(), { headers: { Accept: "application/json" }, signal: ctrl.signal }); }
    finally { clearTimeout(t); }
    if (!r || !r.ok) return null;
    const j = await r.json();
    return j.site_web || (j.entreprise && j.entreprise.site_web) || null;
  } catch (e) { return null; }
}

// Outil dédié : Dropcontact (company + SIREN → email pro + site web). Async :
// on soumet puis on interroge quelques secondes. RGPD-compliant (FR).
async function dropcontact({ name, siren, website }, key, maxMs) {
  try {
    const submit = await fetch("https://api.dropcontact.com/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Token": key },
      body: JSON.stringify({ data: [{ company: name || undefined, siren: siren || undefined, website: website || undefined }], siren: true, language: "fr" }),
    });
    let sj = null;
    try { sj = await submit.json(); } catch (e) { return { error: "submit HTTP " + submit.status + " (non-JSON)" }; }
    const reqId = sj && (sj.request_id || sj.requestId);
    if (!reqId) return { error: "submit HTTP " + submit.status + ": " + JSON.stringify(sj).slice(0, 140) };
    // Attente bornée par le budget restant (limite Vercel Hobby 10 s).
    const started = Date.now();
    while (Date.now() - started < (maxMs || 3500)) {
      await sleep(1500);
      const p = await fetch("https://api.dropcontact.com/batch/" + reqId, { headers: { "X-Access-Token": key } });
      const pj = await p.json();
      if (pj && pj.success && Array.isArray(pj.data)) {
        const row = pj.data[0] || {};
        const email = (Array.isArray(row.email) && row.email[0] && row.email[0].email) || (typeof row.email === "string" ? row.email : null);
        return { email: email || null, website: row.website || null, provider: "dropcontact" };
      }
    }
    // Pas prêt à temps : re-tenté au prochain passage (résultat mis en cache).
    return { pending: true, provider: "dropcontact" };
  } catch (e) { return { error: "exception: " + (e.message || e) }; }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token" });
  // URL + clé PUBLISHABLE (publiques, déjà dans le bundle client) : valeurs par
  // défaut pour ne rien avoir à configurer ; surchargées par les env si présentes.
  const supaUrl = process.env.SUPABASE_URL || "https://cqdgecllzyqimfuovrpp.supabase.co";
  const supaAnon = process.env.SUPABASE_ANON_KEY || "sb_publishable_TXCd5JaM6NWtfaThEAsNDw_AH3nsEnq";
  const supa = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: auth } } });
  const { data: u, error: aerr } = await supa.auth.getUser(auth.slice(7));
  if (aerr || !u || !u.user) return res.status(401).json({ error: "Invalid token" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const targetSiret = digits(body.siret);
  const targetSiren = digits(body.siren) || (targetSiret ? targetSiret.slice(0, 9) : "");
  if (!targetSiret && !targetSiren) return res.status(200).json({ status: "no_siret", message: "SIREN/SIRET manquant — enrichis d'abord la fiche." });

  // Budget global : la fonction DOIT renvoyer du JSON avant que Vercel ne la
  // coupe (10 s sur l'offre Hobby → 504 = page HTML → plante le client).
  const DEADLINE = Date.now() + 8500;
  const timeLeft = () => DEADLINE - Date.now();

  const debug = { steps: [] };
  // ── 1. Site web « de confiance » (issu du SIREN) : fiche → Pappers → Dropcontact
  let website = body.website || "";
  let websiteTrusted = !!website;
  if (website) debug.steps.push("site fiche: " + website);
  if (!website) {
    const pw = await pappersWebsite(targetSiren);
    if (pw) { website = pw; websiteTrusted = true; debug.steps.push("site pappers: " + pw); }
    else debug.steps.push("pappers: pas de site");
  }

  const dcKey = process.env.DROPCONTACT_API_KEY;
  let dcEmail = null, dcPending = false;
  if (dcKey && timeLeft() > 3000) {
    const dc = await dropcontact({ name: body.name, siren: targetSiren, website }, dcKey, Math.min(4000, timeLeft() - 2500));
    if (!dc) debug.steps.push("dropcontact: null");
    else if (dc.error) debug.steps.push("dropcontact: " + dc.error);
    else if (dc.pending) { dcPending = true; debug.steps.push("dropcontact: pending (relance auto)"); }
    else { if (dc.email) dcEmail = dc.email; if (dc.website) { debug.steps.push("dropcontact site: " + dc.website); if (!website) { website = dc.website; websiteTrusted = true; } } if (!dc.email) debug.steps.push("dropcontact: pas d'email nominatif"); }
  } else if (!dcKey) debug.steps.push("dropcontact: clé absente");
  else debug.steps.push("dropcontact: sauté (budget)");

  // Email nominatif renvoyé directement par l'outil → priorité.
  if (dcEmail) {
    return res.status(200).json({ status: "verified_tool", email: dcEmail, emails: [dcEmail], siret_verified: true, website: website || null, source_url: website || null, provider: "dropcontact", debug });
  }

  const hostOf = (w) => { try { return new URL(normBase(w)).hostname.replace(/^www\./, ""); } catch (e) { return null; } };

  // ── 2. Site de confiance connu → on lit le site pour un email, sinon contact@domaine
  if (website && websiteTrusted) {
    const base = normBase(website);
    const domain = hostOf(website);
    let all = [], siretUrl = null;
    for (const p of LEGAL_PATHS) {
      if (timeLeft() < 1500) break;
      const html = await fetchText(base + p, Math.min(2800, timeLeft() - 800));
      if (!html) continue;
      const emails = extractEmails(html);
      all.push(...emails);
      if (targetSiret && digits(html).includes(targetSiret)) siretUrl = base + p;
      if (emails.length && siretUrl) break;
    }
    const onDom = [...new Set(all)].filter((e) => domain && (e.endsWith("@" + domain) || e.endsWith("." + domain)));
    const best = pickBest(onDom.length ? onDom : [...new Set(all)], domain);
    if (best) {
      return res.status(200).json({ status: siretUrl ? "verified_siret" : "verified_site", email: best, emails: [...new Set(all)].slice(0, 8), siret_verified: !!siretUrl, website: base, source_url: siretUrl || base, debug });
    }
    // Aucun email sur le site → adresse générique sur le domaine officiel.
    if (domain) {
      return res.status(200).json({ status: "generic_domain", email: "contact@" + domain, emails: ["contact@" + domain], siret_verified: false, website: base, source_url: base, note: "générique (domaine officiel, à vérifier)", debug });
    }
  }

  // ── 3. Aucun site de confiance → domaines devinés, acceptés SEULEMENT si le
  //       SIRET/SIREN apparaît sur la page (garantit la bonne entreprise).
  let verifiedUrl = null, verifiedEmails = [], domainOut = null, weak = false;
  outer:
  for (const b of candidateBases(body.name).slice(0, 4)) {
    if (timeLeft() < 1500) break;
    let domain = hostOf(b); if (!domain) continue;
    for (const p of LEGAL_PATHS) {
      if (timeLeft() < 1500) break outer;
      const html = await fetchText(b + p, Math.min(2800, timeLeft() - 800));
      if (!html) continue;
      const norm = digits(html);
      const emails = extractEmails(html);
      if (targetSiret && norm.includes(targetSiret)) { verifiedUrl = b + p; verifiedEmails = emails; domainOut = domain; break outer; }
      if (targetSiren && norm.includes(targetSiren) && emails.length && !verifiedUrl) { verifiedUrl = b + p; verifiedEmails = emails; domainOut = domain; weak = true; }
    }
  }
  const best = pickBest(verifiedEmails, domainOut);
  if (best) {
    return res.status(200).json({ status: weak ? "verified_siren" : "verified_siret", email: best, emails: [...new Set(verifiedEmails)].slice(0, 8), siret_verified: !weak, website: verifiedUrl ? new URL(verifiedUrl).origin : null, source_url: verifiedUrl, debug });
  }
  return res.status(200).json({ status: dcPending ? "pending" : "not_found", email: null, emails: [], siret_verified: false, website: website || null, source_url: null, debug });
}

// La fonction s'auto-borne à ~8,5s (budget interne) pour tenir dans la limite
// Hobby de 10s. maxDuration=10 est honnête sur tous les plans.
export const config = { maxDuration: 10 };
