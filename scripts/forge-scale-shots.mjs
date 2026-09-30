// forge-scale-shots.mjs — СНИМКИ И ЗАМЕРЫ ДЛЯ ПРИЁМКИ «КРУПНЕЕ ТЕКСТ КАРТОЧКИ КРИСТАЛЛА» (ТЗ 30.09.2026).
// Тот же проход, что у crystal-counter-shots.mjs, но состояния — под правку размеров
// и с замером: кегль каждого элемента карточки, выход за край окна, прокрутка панели.
//   BASE=http://127.0.0.1:4173 PREFIX=before OUT=docs/forge-type-scale/shots node scripts/forge-scale-shots.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = createRequire(process.env.PW_ROOT || '/opt/node22/lib/node_modules/')('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const PREFIX = process.env.PREFIX || 'after';
const OUT = process.env.OUT || 'docs/forge-type-scale/shots';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });
const LIT = { 3: { a: [1, 2, 3] }, 7: { a: [1, 2, 3], b: [1, 2], c: [1, 2] } };
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const log = [];
const note = (s) => { log.push(s); console.log(s); };

async function seed(page, { fighter, lit }) {
  await page.goto(`${BASE}/play`, { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => ((JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}').roster || {}).fighters || []).length);
    if (n) break; await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(2500);
  await page.evaluate(({ fighter, lit }) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const f = raw.roster.fighters[fighter]; f.lit = lit; raw.roster.picked = f.id;
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  }, { fighter, lit: LIT[lit] });
}

// Замер: кегль, высота кнопок, нижняя кромка, выход за окно, прокрутка предков.
const measure = (page, root) => page.evaluate((root) => {
  const q = (s) => document.querySelector(`${root} ${s}`);
  const fs = (s) => { const e = q(s); if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { px: c.fontSize, h: Math.round(r.height), w: Math.round(r.width), bottom: Math.round(r.bottom) }; };
  const names = ['.fc-who .nm', '.fc-who .cr', '.fc-kicker', '.fc-name', '.fc-hint', '.fc-line--effect', '.fc-char__label', '.fc-char__text', '.fc-light', '.fc-out', '.fc-why', '.fc-noroom', '.fc-back', '.fc-pip'];
  const out = {}; for (const n of names) { const v = fs(n); if (v) out[n] = v; }
  const ws = document.documentElement.clientWidth, hs = document.documentElement.clientHeight;
  const card = q('.fc'); const cr = card && card.getBoundingClientRect();
  let sc = null; for (let e = card; e; e = e.parentElement) { if (e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) { sc = { cls: e.className, sh: e.scrollHeight, ch: e.clientHeight }; break; } }
  const hOver = [...document.querySelectorAll(`${root} .fc *`)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > ws + 1 || r.left < -1); }).map((e) => e.className && e.className.baseVal === undefined ? e.className : e.tagName).slice(0, 5);
  const lines = q('.fc-lines'); 
  return { viewport: [ws, hs], cardBottom: cr && Math.round(cr.bottom), cardTop: cr && Math.round(cr.top), scroller: sc, hOverflow: hOver, linesScroll: lines ? { sh: lines.scrollHeight, ch: lines.clientHeight } : null, pipRow: (() => { const p = q('.fc-pips'); if (!p) return null; const r = p.getBoundingClientRect(); return { w: Math.round(r.width), l: Math.round(r.left), r: Math.round(r.right) }; })(), els: out };
}, root);

async function forge({ w, h, fighter, lit, facet, crystal }, steps) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => note(`pageerror: ${e.message}`));
  await seed(page, { fighter, lit });
  await page.goto(`${BASE}/play/pve`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('.pve-root', { timeout: 90000 }); await page.waitForTimeout(20000);
  await page.evaluate(() => document.querySelector('.pve-root').__vueParentComponent.setupState.onPress('upgrade'));
  await page.waitForSelector('.fc-stage.is-preview', { timeout: 20000 }); await page.waitForTimeout(800);
  await page.locator('.fc-stage.is-preview .fc-pad').first().click({ force: true });
  await page.waitForSelector('.fco .fc', { timeout: 20000 }); await page.waitForTimeout(800);
  await steps(page);
  await ctx.close();
}
const pick = async (p, facet, crystal, root = '.fco') => {
  await p.locator(`${root} .fc-facet__key`).nth('abc'.indexOf(facet)).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  if (crystal != null) { await p.locator(`${root} .fc-cryst__key`).nth(crystal).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(900); }
};
const shot = (p, n) => p.screenshot({ path: `${OUT}/${PREFIX}-${n}.png` });
const meas = async (p, tag, root = '.fco') => { const m = await measure(p, root); note(`${tag}: ${JSON.stringify(m)}`); };

for (const [tag, w, h] of (process.env.ONLY === 'spar' ? [] : [['m', 390, 844], ['d', 1280, 800]])) {
  // 1 · кристалл BREAK (самый длинный по сумме текста) с тремя зажжёнными: LIGHT IT живая
  await forge({ w, h, fighter: 0, lit: 3 }, async (p) => { await pick(p, 'a', 3); await shot(p, `${tag}-1-break`); await meas(p, `${tag} break`); });
  // 2 · COLD — второй по длине, в другой грани
  await forge({ w, h, fighter: 0, lit: 3 }, async (p) => { await pick(p, 'b', 4); await shot(p, `${tag}-2-cold`); await meas(p, `${tag} cold`); });
  // 3 · все семь заняты, открыт свободный кристалл: LIGHT IT погашена, NO ROOM
  await forge({ w, h, fighter: 0, lit: 7 }, async (p) => { await pick(p, 'a', 3); await shot(p, `${tag}-3-lit7`); await meas(p, `${tag} lit7`); });
  // 4 · открыт зажжённый кристалл: PUT OUT
  await forge({ w, h, fighter: 0, lit: 3 }, async (p) => { await pick(p, 'a', 0); await shot(p, `${tag}-4-putout`); await meas(p, `${tag} putout`); });
  // 5 · уровень грани (подпись грани, подсказка)
  await forge({ w, h, fighter: 0, lit: 3 }, async (p) => { await pick(p, 'a', null); await shot(p, `${tag}-5-facet`); await meas(p, `${tag} facet`); });
}

// 6 · SPAR, телефон: та же карточка у своего бойца
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => note(`pageerror: ${e.message}`));
  await seed(page, { fighter: 0, lit: 3 });
  await page.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('.fc', { timeout: 90000 }); await page.waitForTimeout(20000);
  await page.locator('.sp-tab').first().click({ force: true }); await page.waitForTimeout(1200);
  await shot(page, 'm-6-spar-0');
  const fk = page.locator('.fc-facet__key'); note(`spar facet keys: ${await fk.count()}`);
  await pick(page, 'a', 3, 'body');
  await shot(page, 'm-6-spar-break'); await meas(page, 'spar break', 'body');
  await ctx.close();
}
writeFileSync(`${OUT}/${PREFIX}-log.txt`, log.join('\n') + '\n');
await browser.close();
