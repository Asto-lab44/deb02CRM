// Serveur de développement local — zéro dépendance (Node natif).
//
// Reproduit le comportement "cleanUrls" de Vercel : une requête vers
// /crm sert crm.html, /ticketing sert ticketing.html, etc. Sans ça, la
// navigation interne (liens /crm, /fiche-client…) renverrait des 404 en
// local.
//
// Usage :  node tools/serve.js          (port 3000 par défaut)
//          PORT=8080 node tools/serve.js
//
// NB : ce serveur sert UNIQUEMENT les fichiers statiques. Les fonctions
// serverless de api/ (email, 3CX, calendar) ne tournent pas ici — pour
// celles-là il faut `vercel dev`. L'app reste pleinement utilisable sans
// (ces endpoints sont accessoires).

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  // empêche de remonter au-dessus de ROOT (path traversal)
  return p.startsWith(base) ? p : null;
}

function resolveFile(urlPath) {
  // "/"            -> index.html
  // "/crm"         -> crm.html       (cleanUrls)
  // "/components/x.js" -> tel quel
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";

  let candidate = safeJoin(ROOT, rel);
  if (!candidate) return null;

  // fichier existant tel quel
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  // cleanUrls : on tente d'ajouter .html
  if (!path.extname(candidate)) {
    const asHtml = candidate + ".html";
    if (fs.existsSync(asHtml) && fs.statSync(asHtml).isFile()) return asHtml;

    // /dossier/ -> /dossier/index.html
    const asIndex = path.join(candidate, "index.html");
    if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) return asIndex;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);

  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 — page introuvable : " + req.url);
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 — " + err.message);
      return;
    }
    res.writeHead(200, {
      "Content-Type": type,
      // pas de cache en dev, comme la config Vercel
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Hub Astorya — serveur local`);
  console.log(`  ▶  http://localhost:${PORT}\n`);
  console.log(`  (Ctrl+C pour arrêter)\n`);
});
