// Five tiny fake sites on localhost, used to test scripts/capture.mjs without touching the real web.
import http from "node:http";
import sharp from "sharp";

const png = (size, color) => sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toBuffer();
const og = sharp({ create: { width: 1200, height: 630, channels: 3, background: "#224488" } }).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#d9480f"/></svg>`;
const page = (head, body = "<h1>Fixture</h1><p>Hello.</p>") => `<!doctype html><html><head><meta charset="utf-8"><title>Fixture</title>${head}</head><body style="font-family:sans-serif">${body}<div id="banner" style="position:fixed;bottom:0"><button>Reject all</button></div></body></html>`;

const sites = {
  4101: { // SVG icon, og image, theme colour
    "/": () => page(`<link rel="icon" type="image/svg+xml" href="/icon.svg"><meta name="theme-color" content="#d9480f"><meta property="og:image" content="/og.png">`),
    "/icon.svg": () => ["image/svg+xml", svg], "/og.png": async () => ["image/png", await og]
  },
  4102: { // PNG apple-touch-icon only, no theme colour (dominant colour path)
    "/": () => page(`<link rel="apple-touch-icon" sizes="180x180" href="/a.png">`),
    "/a.png": async () => ["image/png", await png(180, "#2b8a3e")]
  },
  4103: { // icons only via web manifest, plus an .ico that must be ignored
    "/": () => page(`<link rel="icon" href="/favicon.ico"><link rel="manifest" href="/m.json">`),
    "/favicon.ico": () => ["image/x-icon", Buffer.from("not-a-real-ico")],
    "/m.json": () => ["application/json", JSON.stringify({ icons: [{ src: "/i192.png", sizes: "192x192" }, { src: "/i512.png", sizes: "512x512" }] })],
    "/i192.png": async () => ["image/png", await png(192, "#1971c2")], "/i512.png": async () => ["image/png", await png(512, "#862e9c")]
  },
  4104: { // robots.txt forbids everyone
    "/": () => page(""), "/robots.txt": () => ["text/plain", "User-agent: *\nDisallow: /\n"]
  },
  4105: { "/": () => page("") } // opt-out entry points here; must never be fetched
};

for (const [port, routes] of Object.entries(sites)) {
  http.createServer(async (req, res) => {
    const r = routes[req.url.split("?")[0]];
    if (!r) { res.writeHead(404); return res.end(); }
    const out = await r();
    const [type, body] = Array.isArray(out) ? out : ["text/html", out];
    res.writeHead(200, { "content-type": type });
    res.end(body);
    if (port === "4105") console.error("!! opt-out site was requested");
  }).listen(Number(port), "127.0.0.1");
}
console.log("fixture sites on 4101-4105");
