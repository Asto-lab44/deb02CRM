// server.mjs — Adaptateur hôte pour les fonctions Vercel /api/*.js
// Monte chaque fichier api/<nom>.js (export default handler(req,res)) sur /api/<nom>.
// Squelette minimal (sans dépendance) : à durcir pour la production.
import http from "node:http";
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const API_DIR = path.join(ROOT, "api");
const PORT = process.env.PORT || 3000;

// Charge tous les handlers /api/*.js au démarrage
const handlers = {};
for (const f of await readdir(API_DIR)) {
  if (!f.endsWith(".js")) continue;
  const name = f.replace(/\.js$/, "");
  try {
    const mod = await import(pathToFileURL(path.join(API_DIR, f)).href);
    handlers["/api/" + name] = mod.default || mod.handler;
  } catch (e) { console.error("skip", f, e.message); }
}
console.log("Fonctions montées :", Object.keys(handlers).join(", "));

function enrich(req, res) {
  // Compat minimale avec l'API Vercel (req.query, req.body, res.status().json())
  const u = new URL(req.url, "http://x");
  req.query = Object.fromEntries(u.searchParams);
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
  res.send = (b) => res.end(b);
}

http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://x").pathname;
  const fn = handlers[pathname];
  if (!fn) { res.statusCode = 404; return res.end("Not found"); }
  let raw = "";
  for await (const c of req) raw += c;
  try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
  enrich(req, res);
  try { await fn(req, res); if (!res.writableEnded) res.end(); }
  catch (e) { console.error(pathname, e); res.statusCode = 500; res.end(JSON.stringify({ error: "server error" })); }
}).listen(PORT, () => console.log("hub-api sur :" + PORT));
