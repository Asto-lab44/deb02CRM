// Pré-compile tous les .jsx en .js standards (sans JSX) pour éviter de
// faire tourner Babel-standalone dans le navigateur à chaque chargement.
// À relancer après modification d'un composant : `cd tools && npm run build`.

const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const PRESET_REACT = require.resolve("@babel/preset-react");
const PLUGIN_BLOCK_SCOPING = require.resolve("@babel/plugin-transform-block-scoping");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIRS = [".", "components"];
const OUT_DIR = path.join(ROOT, "dist");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && full.endsWith(".jsx")) out.push(full);
  }
  return out;
}

function compile(srcRel) {
  const absSrc = path.join(ROOT, srcRel);
  const code = fs.readFileSync(absSrc, "utf8");
  const { code: out } = babel.transformSync(code, {
    filename: absSrc,
    presets: [[PRESET_REACT, { runtime: "classic" }]],
    plugins: [[PLUGIN_BLOCK_SCOPING, { throwIfClosureRequired: false }]],
    babelrc: false,
    configFile: false,
    sourceMaps: false,
    compact: false,
  });
  return out;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function main() {
  ensureDir(OUT_DIR);
  ensureDir(path.join(OUT_DIR, "components"));

  let count = 0;
  for (const dir of SRC_DIRS) {
    for (const src of walk(dir)) {
      const dst = path.join(OUT_DIR, src.replace(/\.jsx$/, ".js"));
      ensureDir(path.dirname(dst));
      fs.writeFileSync(dst, compile(src));
      const absSrc = path.join(ROOT, src);
      const before = (fs.statSync(absSrc).size / 1024).toFixed(1);
      const after  = (fs.statSync(dst).size / 1024).toFixed(1);
      console.log(`  ${src.padEnd(48)} ${before.padStart(7)} → ${after.padStart(7)} KB`);
      count++;
    }
  }
  console.log(`\n✓ ${count} fichier(s) compilé(s) dans dist/`);
}

main();
