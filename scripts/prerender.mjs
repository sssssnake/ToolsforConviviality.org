// Writes a real HTML file for every page of the site, so search engines (and anyone with scripts off)
// get the full content and the right title, description and structured data without running the app.
// Reads scripts/shell.html (the empty app), opens each route in Chromium, and saves the finished page.
//   node scripts/prerender.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const SITE = "https://toolsforconviviality.org";
const ROOT = process.cwd();
const rawShell = await fs.readFile(path.join(ROOT, "scripts/shell.html"), "utf8");

// The app script holds the data for the whole directory and is about 440 KB. Left inline, it was copied into
// every page, so each review cost a visitor half a megabyte for a few kilobytes of text. It now goes into one
// shared file named after a hash of its contents: browsers keep it between pages, and a new build gets a new
// name, so a page and its script never get out of step. scripts/shell.html stays the file you edit.
const appScript = [...rawShell.matchAll(/<script>([\s\S]*?)<\/script>/g)].sort((a, b) => b[1].length - a[1].length)[0];
if (!appScript || appScript[1].length < 50000) throw new Error("Could not find the app script in scripts/shell.html");
const appFile = `app.${createHash("sha256").update(appScript[1]).digest("hex").slice(0, 10)}.js`;
for (const f of await fs.readdir(path.join(ROOT, "assets"))) {
  if (/^app\.[0-9a-f]{10}\.js$/.test(f) && f !== appFile) await fs.rm(path.join(ROOT, "assets", f));
}
await fs.writeFile(path.join(ROOT, "assets", appFile), appScript[1]);
const shell = rawShell.replace(appScript[0], () => `<script src="/assets/${appFile}"></script>`);
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".html": "text/html" };

// Serves real files (assets, fonts) from disk and the empty shell for every page route.
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const ext = path.extname(p);
  if (ext && ext !== ".html") {
    try { const f = await fs.readFile(path.join(ROOT, p)); res.writeHead(200, { "content-type": TYPES[ext] || "application/octet-stream" }); return res.end(f); }
    catch { res.writeHead(404); return res.end(); }
  }
  res.writeHead(200, { "content-type": "text/html" }); res.end(shell);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: "light" });
page.on("pageerror", e => console.error("page error:", e.message));

await page.goto(base + "/");
await page.waitForFunction(() => window.__ready === true);
const { tools, cats, bench, pairs } = await page.evaluate(() => ({ tools: TOOLS.map(t => t.slug), cats: CATS.map(c => c.id), bench: BENCH.map(t => t.slug), pairs: PAIRS.map(pairSlug) }));

const routes = [
  "/", "/directory/", "/benchmarks/", "/for-agents/", "/improve-my-conviviality-score/", "/what-is-conviviality/", "/how-we-score/", "/about/", "/suggest/", "/get-involved/", "/governance/", "/legal-notice/", "/privacy/", "/thanks/", "/suggest-a-category/",
  ...cats.map(c => `/category/${c}/`), ...tools.map(t => `/tools/${t}/`), ...bench.map(t => `/benchmarks/${t}/`),
  "/compare/", ...pairs.map(s => `/compare/${s}/`)
];
const indexable = [];
for (const route of routes) {
  await page.goto(base + route);
  await page.waitForFunction(() => window.__ready === true);
  await page.waitForTimeout(150);
  const robots = await page.$eval("#m-robots", e => e.content);
  const html = "<!doctype html>\n" + await page.evaluate(() => document.documentElement.outerHTML);
  const dir = route === "/" ? ROOT : path.join(ROOT, route);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), html);
  if (!robots.startsWith("noindex")) indexable.push(route);
}

// 404 page: GitHub Pages serves this for any address that has no file.
await page.goto(base + "/page-not-found/");
await page.waitForFunction(() => window.__ready === true);
await fs.writeFile(path.join(ROOT, "404.html"), "<!doctype html>\n" + await page.evaluate(() => document.documentElement.outerHTML));

// Review badges: one light and one dark SVG per tool, made from the editable templates in scripts/badges.
// Each badge reports the tool's current score and verdict and links nowhere by itself; makers wrap it in a link to the review.
const BADGE_TPL = { convivial: "06-convivial", leaning: "07-leaning-convivial", mixed: "08-mixed", manipulative: "09-manipulative" };
const badgeData = await page.evaluate(() => [...TOOLS, ...BENCH].map(t => ({ slug: t.slug, n: total(t), verdict: band(total(t)) })));
await fs.mkdir(path.join(ROOT, "badges"), { recursive: true });
for (const b of badgeData) {
  const key = b.n >= 25 ? "convivial" : b.n >= 18 ? "leaning" : b.n >= 10 ? "mixed" : "manipulative";
  for (const mode of ["light", "dark"]) {
    let svg = await fs.readFile(path.join(ROOT, `scripts/badges/${BADGE_TPL[key]}-${mode}.svg`), "utf8");
    svg = svg.replace(/(id="score"[^>]*>)[^<]*/, `$1${b.n}/30`)
      .replace(/(id="verdict" x=")[^"]*(")/, `$163.3$2`).replace(/(id="verdict"[^>]*>)[^<]*/, `$1${b.verdict}`)
      .replace(/<title id="title">[^<]*/, `<title id="title">Tools for Conviviality: ${b.n}/30, ${b.verdict}`)
      .replace(/font-family="Helvetica"/g, 'font-family="Helvetica, Arial, sans-serif"');
    await fs.writeFile(path.join(ROOT, "badges", `${b.slug}-${mode}.svg`), svg);
  }
}
console.log(`Wrote ${badgeData.length * 2} badges.`);

const today = new Date().toISOString().slice(0, 10);
const prio = r => (r === "/" ? "1.0" : r.startsWith("/tools/") ? "0.8" : r.startsWith("/category/") || r === "/directory/" || r === "/leaderboard/" ? "0.7" : r.startsWith("/compare/") ? "0.7" : r.startsWith("/benchmarks/") ? "0.6" : "0.5");
await fs.writeFile(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  indexable.map(r => `  <url><loc>${SITE}${r}</loc><lastmod>${today}</lastmod><priority>${prio(r)}</priority></url>`).join("\n") + `\n</urlset>\n`);

await browser.close(); server.close();
console.log(`Prerendered ${routes.length} pages, ${indexable.length} in the sitemap.`);
