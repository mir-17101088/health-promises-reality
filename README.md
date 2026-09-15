# 180 Days — Health Promises vs Reality

A scroll-driven visual report for **The Daily Star** on the government's first 180 days in
health (17 Feb – 16 Aug 2026). Plain static files plus a tiny, dependency-free build step that
Vercel runs automatically.

**Production URL:** `https://campaign.thedailystar.net/health-promises-reality/`

---

## Deploy

### Option A — Vercel dashboard
1. Push the **contents of this folder** to a GitHub repo (so `index.html` sits at the repo root).
2. In Vercel: **Add New → Project → Import** the repo. Leave the build settings alone:
   `vercel.json` already sets **Build command** `node tools/build.mjs` and **Output directory** `dist`.
3. Deploy. Every later push rebuilds and redeploys.

### Option B — Vercel CLI
```bash
npm i -g vercel
cd health-promises-reality
vercel --prod
```

### Local preview
```bash
python -m http.server 4180          # edit-and-refresh preview of the source files
node tools/build.mjs                # production build into ./dist
npx serve dist -l 4190              # preview exactly what Vercel serves (gzip on)
```

No `npm install` is needed. `tools/build.mjs` uses only Node's standard library (Node 18+).

---

## Why a normal refresh now shows a new deploy

Previously CSS and JS were cached by browsers for 7 days, and images for a year as `immutable`,
under file names that never changed. A new deploy updated the HTML, but browsers kept using the
old CSS/JS until a hard refresh.

Now:

- `tools/build.mjs` stamps every local asset URL with a content hash, e.g.
  `./assets/app.js?v=2a5791fbfc`. When a file changes, its URL changes. That includes files
  referenced from other files (`app.js` → `outbreak.js` → the measles `.txt` data).
- `vercel.json` caches **stamped URLs for a year** (`immutable`) and makes **everything else,
  including the HTML, revalidate on every visit** (`max-age=0, must-revalidate`).

So each refresh checks the HTML (a cheap 304 when unchanged). New HTML points to new asset URLs,
while unchanged assets are still served from the browser cache. Nothing needs to be renamed by
hand.

If the page is also cached by The Daily Star's reverse proxy at `campaign.thedailystar.net`, that
proxy should respect the origin's `Cache-Control` headers (or have a short TTL for `.../` and
`index.html`) for the same behaviour there.

---

## Lighthouse

Lighthouse 13.4.1, Chrome, simulated throttling, against the production build (`dist`, gzip).
Reports: `../lighthouse-reports/lighthouse-*-2026-09-16.html`.

| | Performance | Accessibility | Best Practices | SEO |
|---|:---:|:---:|:---:|:---:|
| **Desktop** | **100** | **100** | **100** | **100** |
| **Mobile**  | **99**  | **100** | **100** | **100** |

Mobile Core Web Vitals: **LCP 1.9 s · TBT 20 ms · CLS 0.015 · Speed Index 1.1 s**
(previous build: Performance 94, LCP 2.8 s).

The local run flags "cache lifetimes" only because the local server does not send the
`vercel.json` headers; production does.

---

## What was optimised

- **Pre-rendered static HTML.** Full story, charts and numbers render with JavaScript off.
- **No render-blocking requests.** The build inlines the stylesheet and `@font-face` rules
  into `index.html`.
- **HTML weight cut from 80 KB to 28 KB gzipped (source).** The 144 KB inline division map is now
  `assets/images/measles-gap-map.svg`, compressed with SVGO to 68 KB and lazy-loaded. 61 leftover
  wrapper `<span>`s from the design-tool export were removed.
- **Fonts 173 KB → 41 KB.** Source Serif 4 is only used at regular weight for quotes, so its two
  variable files were pinned to static instances (84 KB → 13 KB, 72 KB → 11 KB). Glyph coverage is
  unchanged. Only the Libre Franklin file used above the fold is preloaded.
- **Less rendering work on phones.** Off-screen chapters use `content-visibility: auto`, so the
  browser skips their style and layout until the reader approaches them.
- **Hero image** stays a responsive WebP set, preloaded with `fetchpriority="high"`; no async
  decode on the LCP image.
- Removed a map-tile `preconnect` that was never reused.
- JavaScript stays small and deferred; Leaflet and the outbreak map lazy-load near the map.
- **SEO:** title and meta description sized for search results, canonical, Open Graph and Twitter
  cards, `NewsArticle` JSON-LD with image and logo objects, `robots.txt`, `sitemap.xml`, 1200×630
  share card.

---

## Structure

```
index.html                     The whole story (source; pre-rendered content)
vercel.json                    Build command, output dir, cache headers
tools/build.mjs                Production build: copy public files, inline CSS, hash-stamp URLs
dist/                          Build output (generated, git-ignored)
robots.txt · sitemap.xml       SEO
favicon.ico · assets/favicon.svg · assets/apple-touch-icon.png
measles_2026_geolocations.txt      map data  (fetched at runtime)
measles_2026_timeseries_90days.txt trend data (fetched at runtime)
assets/
  styles.min.css               page styles (inlined into dist/index.html by the build)
  app.js                        scroll reveal, statement archive, scorecard board, map loader
  editorial.js                  chapter nav scroll-spy, galleries, back-to-top
  outbreak.js · outbreak.css    Leaflet map + daily-trend web components (lazy)
  og-cover.jpg                  1200×630 social share card
  fonts/                        self-hosted, subsetted woff2 + @font-face
  images/                       portraits, hero/ (responsive WebP), web/ (gallery WebP), map SVG
  social/ · thedailystar-logo.svg
  vendor/leaflet/               Leaflet library (BSD-2, see LICENSE)
```

Only the files listed in `PUBLIC` at the top of `tools/build.mjs` are deployed.
`health_service_180_days_plan.csv`, `og-image.webp` (unused), notes and tools stay out of `dist`.

---

## Editing content

- Story text lives in `index.html`. Edit it, push, and the build handles cache-busting.
- **The scorecard section ("What the scorecard records")** is the block between
  `<!--pa:start-->` and `<!--pa:end-->` in `index.html`. Its styles are the
  `/*pa:start*/ … /*pa:end*/` block at the end of `assets/styles.min.css`, and its sticky-board
  script is the matching block at the end of `assets/app.js`. Each of the 12 commitments is an
  `<article class="pa-file">` with the same parts: the pledge, the 180-day target, what the
  scorecard reports (dashed, government register) and what that means. The stage (`data-stage`
  = `paper` / `underway` / `done`) must match the tally at the top and the board rail (`--f` =
  `0` / `.5` / `1`).
- The minister's dated statements are the JSON block `<script id="minister-data">` near the end
  of `index.html`.
- The map and trend numbers come from the two root-level `.txt` data files.

Photography: Mehedi Hasan, Orchid Chakma. © 2026 The Daily Star.
