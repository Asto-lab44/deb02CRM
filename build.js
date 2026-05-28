// Pré-compile tous les .jsx en .js standards (sans JSX) pour éviter de
// faire tourner Babel-standalone dans le navigateur à chaque chargement.
// À relancer après modification d'un composant : `node build.js`.

const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const SRC_DIRS = [".", "components"];
const OUT_DIR = "dist";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && full.endsWith(".jsx")) out.push(full);
  }
  return out;
}

function compile(srcPath) {
  const code = fs.readFileSync(srcPath, "utf8");
  const { code: out } = babel.transformSync(code, {
    filename: srcPath,
    presets: [
      ["@babel/preset-react", { runtime: "classic" }],
    ],
    sourceMaps: false,
    compact: false, // gardons lisible (debug)
  });
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  ensureDir(OUT_DIR);
  ensureDir(path.join(OUT_DIR, "components"));

  let count = 0;
  for (const dir of SRC_DIRS) {
    for (const src of walk(dir)) {
      const rel = path.relative(".", src);
      const dst = path.join(OUT_DIR, rel.replace(/\.jsx$/, ".js"));
      ensureDir(path.dirname(dst));
      const out = compile(src);
      fs.writeFileSync(dst, out);
      const before = (fs.statSync(src).size / 1024).toFixed(1);
      const after  = (fs.statSync(dst).size / 1024).toFixed(1);
      console.log(`  ${rel.padEnd(48)} ${before.padStart(7)} → ${after.padStart(7)} KB`);
      count++;
    }
  }
  console.log(`\n✓ ${count} fichier(s) compilé(s) dans dist/`);
}

main();
