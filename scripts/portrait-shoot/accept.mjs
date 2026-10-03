// accept.mjs — приёмка деки: снимки раздела «Команда», сверка текстов и остальных разделов.
//   BASE_URL=http://127.0.0.1:8101 NEW_URL=http://127.0.0.1:8102 OUT=docs/deck-team-portraits/accept \
//     node scripts/portrait-shoot/accept.mjs
// BASE_URL — деку из main (до), NEW_URL — из ветки (после); оба отдаются из СОБРАННОЙ папки dist.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const BASE = process.env.BASE_URL, NEW = process.env.NEW_URL;
const OUT = process.env.OUT || 'accept';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const VIEWS = [['1920x1080', 1920, 1080, 1], ['1280x720', 1280, 720, 1], ['390x844', 390, 844, 3], ['844x390', 844, 390, 3]];
const TEAM = { ru: 's21', en: 'e21' };

// 1) тексты: все текстовые узлы + alt/aria-label/title, обоих языковых слоёв
async function texts(url) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(url + '/deckinvestors/?lang=en', { waitUntil: 'load' });
  const t = await p.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const s = w.currentNode.nodeValue.trim(); if (s) out.push(s); }
    document.querySelectorAll('[alt],[aria-label],[title]').forEach((e) => ['alt', 'aria-label', 'title'].forEach((a) => { const v = e.getAttribute(a); if (v) out.push(`@${a}=${v}`); }));
    return out;
  });
  await ctx.close();
  return t;
}
const tb = await texts(BASE), tn = await texts(NEW);
const cnt = (a) => a.reduce((m, s) => (m.set(s, (m.get(s) || 0) + 1), m), new Map());
const cb = cnt(tb), cn = cnt(tn);
const gone = [], added = [];
for (const [s, n] of cb) if ((cn.get(s) || 0) < n) gone.push(`${s} ×${n - (cn.get(s) || 0)}`);
for (const [s, n] of cn) if ((cb.get(s) || 0) < n) added.push(`${s} ×${n - (cb.get(s) || 0)}`);
writeFileSync(`${OUT}/text-diff.txt`, `ИСЧЕЗЛО:\n${gone.join('\n')}\n\nПОЯВИЛОСЬ:\n${added.join('\n')}\n\nузлов до/после: ${tb.length}/${tn.length}\n`);
console.log('text gone:', gone, 'added:', added, tb.length, tn.length);

// 2) снимки раздела «Команда» на нужных размерах и языках (после)
for (const lang of ['ru', 'en']) for (const [name, w, h, dpr] of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  await p.goto(`${NEW}/deckinvestors/?lang=${lang}`, { waitUntil: 'load' });
  const sel = `#${TEAM[lang]}`;
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'start' }); window.scrollBy(0, 60); }, sel);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/team-${lang}-${name}.png` });
  await p.locator(`${sel} .dk-portrait`).first().scrollIntoViewIfNeeded();
  const info = await p.evaluate((s) => [...document.querySelectorAll(s + ' .dk-portrait img')].map((i) => ({ w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height, nat: [i.naturalWidth, i.naturalHeight], ok: i.complete && i.naturalWidth > 0 })), sel);
  console.log(lang, name, JSON.stringify(info));
  await ctx.close();
}

// 3) остальные разделы до/после (reduced-motion, элементные снимки), пиксельная разница
const ctxs = {};
for (const [k, url] of [['base', BASE], ['new', NEW]]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(`${url}/deckinvestors/?lang=en`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const ids = await p.evaluate(() => [...document.querySelectorAll('section[id^="e"]')].map((s) => s.id));
  ctxs[k] = { p, ids };
}
const report = [];
for (const id of ctxs.base.ids) {
  for (const k of ['base', 'new']) {
    const el = ctxs[k].p.locator('#' + id);
    await el.scrollIntoViewIfNeeded();
    await ctxs[k].p.waitForTimeout(250);
    await el.screenshot({ path: `${OUT}/sec-${k}-${id}.png` });
  }
  let diff = 'n/a';
  try {
    diff = execFileSync('compare', ['-metric', 'AE', `${OUT}/sec-base-${id}.png`, `${OUT}/sec-new-${id}.png`, 'null:'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (e) { diff = (e.stderr || '').toString().trim(); }
  report.push(`${id}: ${diff}`);
}
writeFileSync(`${OUT}/sections-diff.txt`, report.join('\n') + '\n');
console.log(report.join('\n'));
await browser.close();
