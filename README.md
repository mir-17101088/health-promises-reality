# 180 Days — Health Promises vs Reality

A scroll-driven visual report for **The Daily Star** on the government's first 180 days in health
(17 Feb – 16 Aug 2026).

**This folder is the finished website.** The same files go to GitHub, deploy on Vercel with no
build step, and can be copied unchanged to the campaign server.

**Production URL:** `https://campaign.thedailystar.net/health-promises-reality/`

---

## 1. Upload to GitHub

Upload the whole folder, including the hidden files, so the repo root looks like this:

```
.gitignore
.htaccess                         caching rules for the campaign server (Apache)
.vercelignore                     keeps project files off Vercel
README.md
vercel.json                       caching rules for Vercel
index.html
favicon.ico
robots.txt
sitemap.xml
measles_2026_geolocations.txt
measles_2026_timeseries_90days.txt
assets/                           everything inside: fonts/, images/, social/, vendor/, css, js
deploy/nginx/                     only used if the campaign server runs Nginx
tools/build.mjs                   run after editing CSS, JS, images or data (see section 4)
```

With GitHub's web uploader, drag the folders (`assets`, `deploy`, `tools`) as well as the loose
files, and check that `.htaccess` and `.vercelignore` appear in the repo. GitHub Desktop or
`git push` avoids missed files.

## 2. Deploy on Vercel

**Add New → Project → Import** the repo. Framework preset **Other**, no build command, output
directory the repo root (the defaults). Nothing to build: Vercel serves the files as they are.
Every push redeploys.

## 3. Deploy on campaign.thedailystar.net (for the developer)

1. Download the GitHub repo (**Code → Download ZIP**) and unzip it.
2. Upload the **contents** of the unzipped folder into the server folder that serves
   `/health-promises-reality/`, so `index.html` sits directly inside it. Replace old files.
   Make sure hidden files are uploaded too (`.htaccess`); some FTP clients hide them.
3. **Apache:** `.htaccess` sets the caching rules and hides the project files (`tools/`,
   `deploy/`, `README.md`, `vercel.json`). It needs `mod_headers` and `AllowOverride FileInfo`
   (Apache 2.4). **Nginx** ignores `.htaccess`: add `deploy/nginx/health-promises-reality.conf`
   to the server config once.
4. Open `https://campaign.thedailystar.net/health-promises-reality/`. The trailing slash matters:
   the page loads its files with relative paths, and Apache and Nginx redirect to it
   automatically.

The domain is behind Cloudflare. HTML is not cached there by default and every asset URL carries a
version (`?v=...`), so no purge is needed after an upload. If a Cloudflare page rule caches HTML
("Cache Everything"), purge `/health-promises-reality/` after each upload or exclude that path.

No Node, npm or build is needed on the server.

---

## 4. Updating the site

- **Text only in `index.html`:** edit, upload to GitHub, redeploy. Nothing else to do.
- **Any CSS, JS, image, font or data (`.txt`) file:** after editing, run

  ```bash
  node tools/build.mjs
  ```

  then upload the changed files. (Node 18+; no `npm install`.) The build:
  1. copies `assets/fonts/fonts.css` and `assets/styles.min.css` into `index.html` as inline
     `<style data-inline>` blocks, so the page renders without extra requests. Edit those two
     files, never the inline blocks;
  2. adds a content hash to every asset link (`./assets/app.js?v=2a5791fbfc`), so a changed file
     gets a new URL.

  `node tools/build.mjs --check` reports whether a build is needed without changing anything.

### Why a normal refresh shows new uploads

`vercel.json` (Vercel) and `.htaccess` (campaign server) cache URLs that carry `?v=` for a year,
and make everything else, including `index.html`, revalidate on every visit. A refresh fetches the
current HTML (a cheap 304 when unchanged); new HTML points to new asset URLs, and unchanged assets
still come from the browser cache.

---

## Lighthouse

Lighthouse 13.4.1, Chrome, simulated throttling, served with gzip from a
`/health-promises-reality/` sub-path, as on the campaign server.
Reports: `../lighthouse-reports/lighthouse-*-2026-09-16.html`.

| | Performance | Accessibility | Best Practices | SEO |
|---|:---:|:---:|:---:|:---:|
| **Desktop** | **100** | **100** | **100** | **100** |
| **Mobile**  | **99**  | **100** | **100** | **100** |

Mobile Core Web Vitals: **LCP 1.9 s · TBT 100 ms · CLS 0 · Speed Index 1.0 s**
(previous build: Performance 94, LCP 2.8 s). Repeated local runs scored 94–99 on mobile depending
on how busy the test machine was.

## What was optimised

- **Pre-rendered static HTML.** Full story, charts and numbers render with JavaScript off.
- **No render-blocking requests.** Stylesheet and `@font-face` rules are inlined into `index.html`.
- **Lighter HTML.** The 144 KB inline division map is now `assets/images/measles-gap-map.svg`
  (68 KB after SVGO, lazy-loaded); 61 leftover wrapper `<span>`s were removed.
- **Fonts 173 KB → 41 KB.** Source Serif 4 is only used at regular weight for quotes, so its two
  variable files were pinned to static instances. Glyph coverage is unchanged. Only the Libre
  Franklin file used above the fold is preloaded.
- **Less rendering work on phones.** Off-screen chapters use `content-visibility: auto`.
- **Hero image** is a responsive WebP set, preloaded with `fetchpriority="high"`.
- JavaScript stays small and deferred; Leaflet and the outbreak map lazy-load near the map.
- **SEO:** search-length title and description, canonical, Open Graph and Twitter cards,
  `NewsArticle` JSON-LD with image and logo objects, `robots.txt`, `sitemap.xml`, share card.

---

## Structure

```
index.html                     The whole story, with generated inline CSS and versioned links
.htaccess · vercel.json        Caching rules (Apache · Vercel)
.vercelignore                  Project files kept off Vercel
tools/build.mjs                Inline CSS + version asset links (run after asset edits)
deploy/nginx/*.conf            Caching rules for an Nginx server
robots.txt · sitemap.xml       SEO
favicon.ico
measles_2026_geolocations.txt      map data  (fetched at runtime)
measles_2026_timeseries_90days.txt trend data (fetched at runtime)
assets/
  styles.min.css               page styles (source for the inline block in index.html)
  app.js                        scroll reveal, statement archive, promise carousel, map loader
  editorial.js                  chapter nav scroll-spy, galleries, back-to-top
  outbreak.js · outbreak.css    Leaflet map + daily-trend web components (lazy)
  og-cover.jpg                  1200×630 social share card
  fonts/                        self-hosted, subsetted woff2 + fonts.css (source for inline block)
  images/                       portraits, hero/, web/, measles-gap-map.svg
  social/ · thedailystar-logo.svg · favicon.svg · apple-touch-icon.png
  vendor/leaflet/               Leaflet library (BSD-2, see LICENSE)
```

## Editing content

- Story text lives in `index.html`.
- **The scorecard section ("What the scorecard records")** is the block between
  `<!--pa:start-->` and `<!--pa:end-->` in `index.html`. Its styles are the `/*pa:start*/ … /*pa:end*/`
  block in `assets/styles.min.css` (run the build after editing), and its horizontal-carousel script is
  the matching block at the end of `assets/app.js`. Each of the 12 commitments is an
  `<article class="pa-file pa-compact">` with a short promise, 180-day target and reported result.
  CSS subgrid shares row sizes across all 12 cards, so changing slides never changes the carousel height.
  Original evidence lives in the `promise-detail-0` through `promise-detail-11` templates and opens
  in a native dialog through “Read full record”. Keep the summary and its full record consistent
  when updating content. The stage (`data-stage` = `paper` / `underway` / `done`) must match the
  tally and status rail (`--f` = `0` / `.5` / `1`).
- The minister's dated statements are the JSON block `<script id="minister-data">` near the end of
  `index.html`.
- The map and trend numbers come from the two root-level `.txt` data files.

Photography: Mehedi Hasan, Orchid Chakma. © 2026 The Daily Star.
