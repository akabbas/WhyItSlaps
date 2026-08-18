import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
const URL = "http://localhost:3000/demo/share-graphics";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

await page.screenshot({ path: `${OUT}/demo-page-full.png`, fullPage: true });

const cards = [
  { label: "Video story card · with palette strip", file: "app-video-story-card.png" },
  { label: "Transparent overlay · Strava-style sticker", file: "app-transparent-overlay.png" },
  { label: "Music story card", file: "app-music-story-card.png" },
  { label: "Overlay in context (concept)", file: "app-overlay-in-context.png" },
];

for (const card of cards) {
  const section = page.locator("p", { hasText: card.label }).first();
  const container = section.locator("xpath=ancestor::div[contains(@class,'space-y-3')][1]");
  await container.screenshot({ path: `${OUT}/${card.file}` });
}

await browser.close();
console.log("Screenshots saved to", OUT);
