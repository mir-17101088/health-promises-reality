# 180 Days — Health Promises vs Reality

A static, scroll-driven visual report for **The Daily Star** on the government's
first 180 days in health (17 Feb – 16 Aug 2026). This folder is a **self-contained
static site** — no build step, no server code, no dependencies to install. Push it
to GitHub and deploy on Vercel as-is.

**Production URL:** `https://campaign.thedailystar.net/health-promises-reality/`

---

## Deploy

### Option A — Vercel dashboard (no CLI)
1. Create a new GitHub repo and upload the **contents of this folder** to its root
   (so `index.html` sits at the repo root, not inside a subfolder).
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Other**. Build command: **none**. Output directory: **`.`** (root).
4. Deploy. `vercel.json` handles caching headers and clean URLs automatically.

### Option B — Vercel CLI
```bash
npm i -g vercel
cd health-promises-reality
vercel --prod
```

### Serving under the `/health-promises-reality/` path
Every asset is referenced with **relative** paths (`./assets/…`), so the site works
correctly whether it is served from a domain root (e.g. the Vercel preview URL) or
from the `/health-promises-reality/` sub-path behind The Daily Star's reverse proxy.
No path rewriting is required. The canonical URL and social tags already point to the
production sub-path.

---

## Lighthouse

Measured with Lighthouse (Chrome), served with gzip + the caching headers in
`vercel.json` (i.e. representative of production):

| | Performance | Accessibility | Best Practices | SEO |
|---|:---:|:---:|:---:|:---:|
| **Desktop** | **100** | **100** | **100** | **100** |
| **Mobile**  | **94**  | **100** | **100** | **100** |

Core Web Vitals (mobile, simulated Slow 4G): **LCP ≈ 2.9 s · CLS 0 · TBT ≈ 0 ms.**
On Vercel's edge network (HTTP/2, Brotli, global CDN) real-world numbers are typically
better than this local measurement.

---

## What was optimised

This started as a Claude Design canvas file (`.dc.html`) that rendered entirely in the
browser via React + a canvas runtime (~250 KB of framework JS, and **no content in the
initial HTML** — bad for both speed and SEO). It was converted to a hand-tuned static site:

- **Pre-rendered to static HTML.** All copy, 29 inline SVG charts, and the district
  choropleth are baked into `index.html`. The React/canvas runtime (`react`, `react-dom`,
  `support.js`, `image-slot.js`) and the 273 KB `bd_divisions.js` geometry file were removed.
  The page now renders its full story even with JavaScript disabled.
- **Hero image:** 8.2 MB JPEG → responsive WebP set (37–172 KB) + a JPEG fallback,
  preloaded with `fetchpriority="high"`. This is the LCP element.
- **Map geometry** simplified with Douglas–Peucker (choropleth SVG 274 KB → 144 KB,
  visually identical at display size).
- **Fonts** self-hosted and **subsetted** to the 105 glyphs actually used
  (275 KB → 170 KB), `font-display: swap`, critical subset preloaded.
- **JavaScript** is tiny and deferred. Only ~8 KB (`editorial.js` + `app.js`) loads up
  front; **Leaflet + the map/chart code (~165 KB) lazy-load** only as the reader nears them.
- **CSS** combined into one minified file, with critical CSS inlined in `<head>`.
- Explicit `width`/`height` on every image (CLS = 0); long-cache headers for static assets.
- **Full SEO:** title, meta description, canonical, Open Graph + Twitter cards,
  JSON-LD `NewsArticle`, `robots.txt`, `sitemap.xml`, and a 1200×630 share card
  (`assets/og-cover.jpg`).

---

## Structure

```
index.html                     The whole story (pre-rendered, content inline)
vercel.json                    Caching headers + clean URLs
robots.txt · sitemap.xml       SEO
favicon.ico · assets/favicon.svg · assets/apple-touch-icon.png
measles_2026_geolocations.txt      map data  (fetched at runtime from site root)
measles_2026_timeseries_90days.txt trend data (fetched at runtime from site root)
assets/
  styles.min.css               combined + minified page styles
  app.js                        scroll-reveal, statement archive, lazy map loader
  editorial.js                  chapter nav scroll-spy, galleries, back-to-top
  outbreak.js · outbreak.css    Leaflet map + daily-trend web components (lazy)
  og-cover.jpg                  1200×630 social share card
  fonts/                        self-hosted, subsetted woff2 + @font-face
  images/                       portraits, hero/ (responsive WebP), web/ (gallery WebP)
  social/ · thedailystar-logo.svg
  vendor/leaflet/               Leaflet library (BSD-2, see LICENSE)
```

### Note on the data files
`outbreak.js` fetches `measles_2026_geolocations.txt` and
`measles_2026_timeseries_90days.txt` from the **site root** at runtime. Keep them at the
deployment root (next to `index.html`). If the site is served from a sub-path, they must
resolve at that sub-path root — which the relative loader handles automatically.

### The map uses OpenStreetMap tiles
The interactive district map loads tiles from `tile.openstreetmap.org` (attributed
in-map). This is the only third-party runtime request; everything else is self-hosted.

---

## Editing content
The story text lives directly in `index.html`. The minister's dated statements (the
"In his own words" archive) are a small JSON block near the end of `index.html`
(`<script id="minister-data" type="application/json">`) — edit there to change that
section. The map and trend numbers come from the two root-level `.txt` data files.

Photography: Mehedi Hasan, Orchid Chakma. © 2026 The Daily Star.
