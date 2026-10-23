// Renders scripts/pdf/improve.html to assets/improve-your-conviviality-score.pdf and a cover thumbnail.
//   node scripts/build-pdf.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(root, "scripts/pdf/improve.html")).href);
await page.waitForLoadState("networkidle");
await page.pdf({ path: path.join(root, "assets/improve-your-conviviality-score.pdf"), preferCSSPageSize: true, printBackground: true });
const shot = await page.locator(".page").first().screenshot({ type: "png" });
await sharp(shot).resize({ width: 520 }).webp({ quality: 88 }).toFile(path.join(root, "assets/improve-cover.webp"));
await browser.close();
console.log("PDF and cover written.");
