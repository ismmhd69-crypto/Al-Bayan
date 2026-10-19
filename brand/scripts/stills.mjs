// Render many stills of one composition with a single browser (used by contact-sheet.py).
// Usage (from brand/): node scripts/stills.mjs <bundleDir> <CompositionId> <outDir> <frame> [frame...]
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [serveUrl, id, outDir, ...frames] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl: resolve(serveUrl), id, puppeteerInstance: browser, port: 3125 });
for (const f of frames) {
  const output = join(outDir, `${id}-${f}.png`);
  await renderStill({ composition, serveUrl: resolve(serveUrl), output, frame: Number(f), scale: 0.5, puppeteerInstance: browser, port: 3125, overwrite: true });
  console.log(output);
}
await browser.close({ silent: true });
