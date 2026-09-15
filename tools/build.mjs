#!/usr/bin/env node
/**
 * Production build for the 180 Days microsite. Zero dependencies, Node 18+.
 *
 *   node tools/build.mjs      writes ./dist (Vercel runs this on every deploy, see vercel.json)
 *
 * 1. Copies only the public files into dist/. Notes, tools and source spreadsheets stay out.
 * 2. Inlines the stylesheets linked from index.html, removing render-blocking requests.
 * 3. Stamps every local asset URL with ?v=<content hash>. vercel.json caches stamped URLs for a
 *    year and makes unstamped responses (the HTML) revalidate on every visit, so a normal refresh
 *    always shows the latest deploy while unchanged files stay cached.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PUBLIC = [
  "index.html",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "measles_2026_geolocations.txt",
  "measles_2026_timeseries_90days.txt",
  "assets",
];
// Text files whose asset references are stamped. Vendor scripts are left untouched.
const STAMPED = [
  "assets/vendor/leaflet/leaflet.css",
  "assets/outbreak.css",
  "assets/outbreak.js",
  "assets/editorial.js",
  "assets/app.js",
  "index.html",
];

const read = (p) => readFileSync(join(DIST, p), "utf8");
const write = (p, s) => writeFileSync(join(DIST, p), s);
const isFile = (p) => existsSync(join(DIST, p)) && statSync(join(DIST, p)).isFile();
const hash = (p) => createHash("sha256").update(readFileSync(join(DIST, p))).digest("hex").slice(0, 10);

// 1. Copy public files. Empty dist/ rather than deleting it: Windows refuses to remove a folder
//    that a terminal or Explorer window has open.
mkdirSync(DIST, { recursive: true });
for (const entry of readdirSync(DIST)) rmSync(join(DIST, entry), { recursive: true, force: true });
for (const p of PUBLIC) {
  if (!existsSync(join(ROOT, p))) throw new Error(`missing public file: ${p}`);
  cpSync(join(ROOT, p), join(DIST, p), { recursive: true });
}

// 2. Inline local stylesheets, rewriting their url() references to be relative to the page.
let html = read("index.html");
let inlined = 0;
html = html.replace(/<link\b[^>]*>/g, (tag) => {
  if (!/\brel=["']?stylesheet\b/.test(tag)) return tag;
  const href = tag.match(/\bhref=["']?\.\/(assets\/[^"'\s>?]+\.css)/);
  if (!href || !isFile(href[1])) return tag;
  const dir = posix.dirname(href[1]);
  const css = read(href[1]).replace(
    /url\((['"]?)(?!data:|https?:|\/|#)([^'")]+)\1\)/g,
    (_, q, url) => `url(./${posix.normalize(posix.join(dir, url))})`,
  );
  inlined++;
  return `<style>${css.trim()}</style>`;
});
write("index.html", html);

// 3. Stamp asset URLs with content hashes. Repeat until stable, because stamping a file changes
//    its own hash, which the files referencing it must then pick up.
const EXT = "css|js|json|txt|webp|avif|jpe?g|png|gif|svg|ico|woff2?";
// A path starts with a word character (so "a.webp 960w, ./b.webp" yields two refs) and may contain
// spaces, which some portrait file names do.
const REF = new RegExp(String.raw`(^|[\s"'(,=\x60])((?:\./)?[\w-][\w\-./ ]*?\.(?:${EXT}))(\?v=[0-9a-f]{10})?(?=[\s"'),#\x60]|$)`, "gm");

function candidates(file, path) {
  const clean = path.replace(/^\.\//, "");
  const base = posix.dirname(file);
  if (file.endsWith(".css")) return [posix.normalize(posix.join(base, clean))];
  if (file.endsWith(".js")) return [posix.normalize(posix.join(base, clean)), clean]; // module-relative, then page-relative
  return [clean];
}

let passes = 0;
for (let changed = true; changed; ) {
  if (++passes > 8) throw new Error("asset stamping did not settle");
  changed = false;
  for (const file of STAMPED) {
    if (!isFile(file)) continue;
    const src = read(file);
    const out = src.replace(REF, (all, lead, path) => {
      const hit = candidates(file, path).find(isFile);
      return hit && hit !== file ? `${lead}${path}?v=${hash(hit)}` : all;
    });
    if (out !== src) {
      write(file, out);
      changed = true;
    }
  }
}

const page = readFileSync(join(DIST, "index.html"));
const stamped = (read("index.html").match(/\?v=[0-9a-f]{10}/g) || []).length;
console.log(
  `dist ready: ${inlined} stylesheet(s) inlined, ${stamped} stamped URLs in index.html, ` +
    `index.html ${(page.length / 1024).toFixed(1)} KB (${(gzipSync(page).length / 1024).toFixed(1)} KB gzip), ${passes} pass(es)`,
);
