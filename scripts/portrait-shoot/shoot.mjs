// shoot.mjs — снимает портреты бойцов для деки через scripts/portrait-shoot/index.html.
//   BASE=http://localhost:5199 OUT=/tmp/shots node scripts/portrait-shoot/shoot.mjs \
//     "nalet:-18" "skala:0" "zasada:18"   # core:yaw° ; доп. параметры кадра — EXTRA="d=2.4&cy=1.45"
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(process.env.PW_ROOT || '/opt/node22/lib/node_modules/')('playwright');
const BASE = process.env.BASE || 'http://localhost:5199';
const OUT = process.env.OUT || 'shots';
const W = process.env.W || 720, H = process.env.H || 900, DPR = process.env.DPR || 1;
const EXTRA = process.env.EXTRA || '';
const TAG = process.env.TAG || '';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const spec of process.argv.slice(2)) {
  const [core, yaw] = spec.split(':');
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('console.error', m.text()); });
  await page.goto(`${BASE}/scripts/portrait-shoot/index.html?core=${core}&yaw=${yaw}&w=${W}&h=${H}&dpr=${DPR}&${EXTRA}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  const info = await page.evaluate(() => window.__shot);
  await page.locator('canvas').screenshot({ path: `${OUT}/${TAG}${core}.png` });
  console.log(core, yaw, info.hue, '->', `${OUT}/${TAG}${core}.png`);
  await ctx.close();
}
await browser.close();
