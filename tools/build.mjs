#!/usr/bin/env node
/**
 * Prepares this folder for production, in place. Zero dependencies, Node 18+.
 *
 *   node tools/build.mjs           update index.html and the asset links in this folder
 *   node tools/build.mjs --check   change nothing; exit with an error if anything is out of date
 *
 * This folder IS the website. It deploys to Vercel as-is and can be copied unchanged into
 * campaign.thedailystar.net/health-promises-reality/. Run the build after editing any CSS, JS,
 * image, font or data file, then upload the updated folder.
 *
 * 1. Inlines assets/fonts/fonts.css and assets/styles.min.css into index.html, so the page renders
 *    without waiting for extra requests. Edit those files, never the generated
 *    <style data-inline> blocks.
 * 2. Stamps every local asset URL with ?v=<content hash>. vercel.json and .htaccess cache stamped
 *    URLs for a year and revalidate everything else (the HTML) on every visit, so a normal refresh
 *    shows a new upload while unchanged files stay cached.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
// Text files whose asset references are stamped. Vendor scripts are left untouched.
const STAMPED = [
  "assets/vendor/leaflet/leaflet.css",
  "assets/outbreak.css",
  "assets/outbreak.js",
  "assets/editorial.js",
  "assets/app.js",
  "index.html",
];

// Updated text is held in memory, then written (or, with --check, only compared) at the end.
const pending = new Map();
const onDisk = (p) => readFileSync(join(ROOT, p), "utf8");
const read = (p) => (pending.has(p) ? pending.get(p) : onDisk(p));
const update = (p, text) => {
  if (text !== read(p)) pending.set(p, text);
};
const isFile = (p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile();
const hash = (p) =>
  createHash("sha256")
    .update(pending.has(p) ? Buffer.from(pending.get(p)) : readFileSync(join(ROOT, p)))
    .digest("hex")
    .slice(0, 10);

// 1. Inline stylesheets: <link> tags on the first run, existing <style data-inline> blocks after.
let inlined = 0;
update(
  "index.html",
  read("index.html").replace(
    /<link\b[^>]*>|<style data-inline="([^"?]+)(?:\?v=[0-9a-f]{10})?">[\s\S]*?<\/style>/g,
    (tag, from) => {
      let file = from;
      if (!file) {
        const href = /\brel=["']?stylesheet\b/.test(tag) && tag.match(/\bhref=["']?\.\/(assets\/[^"'\s>?]+\.css)/);
        if (!href) return tag;
        file = href[1];
      }
      if (!isFile(file)) throw new Error(`stylesheet not found: ${file}`);
      const dir = posix.dirname(file);
      const css = onDisk(file)
        .trim()
        .replace(
          /url\((['"]?)(?!data:|https?:|\/|#)([^'")?]+)\1\)/g,
          (_, q, url) => `url(./${posix.normalize(posix.join(dir, url))})`,
        );
      inlined++;
      return `<style data-inline="${file}">${css}</style>`;
    },
  ),
);

// 2. Stamp asset URLs with content hashes. Repeat until stable, because stamping a file changes
//    its own hash, which the files referencing it must then pick up.
const EXT = "css|js|json|txt|webp|avif|jpe?g|png|gif|svg|ico|woff2?";
// A path starts with a word character (so "a.webp 960w, ./b.webp" yields two refs) and may contain
// spaces, which some portrait file names do.
const REF = new RegExp(
  String.raw`(^|[\s"'(,=\x60])((?:\./)?[\w-][\w\-./ ]*?\.(?:${EXT}))(\?v=[0-9a-f]{10})?(?=[\s"'),#\x60]|$)`,
  "gm",
);

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
    const before = read(file);
    const after = before.replace(REF, (all, lead, path) => {
      const hit = candidates(file, path).find(isFile);
      return hit && hit !== file ? `${lead}${path}?v=${hash(hit)}` : all;
    });
    if (after !== before) {
      update(file, after);
      changed = true;
    }
  }
}

const changed = [...pending.keys()].filter((p) => pending.get(p) !== onDisk(p));
const page = Buffer.from(read("index.html"));
const stats =
  `index.html ${(page.length / 1024).toFixed(1)} KB (${(gzipSync(page).length / 1024).toFixed(1)} KB gzip), ` +
  `${inlined} stylesheet(s) inlined`;

if (CHECK) {
  if (changed.length) {
    console.error(`Out of date: ${changed.join(", ")}\nRun "node tools/build.mjs", then upload the updated files.`);
    process.exit(1);
  }
  console.log(`Up to date. ${stats}`);
} else {
  for (const p of changed) writeFileSync(join(ROOT, p), pending.get(p));
  console.log(`${changed.length ? `Updated ${changed.join(", ")}` : "Already up to date"}. ${stats}`);
}
