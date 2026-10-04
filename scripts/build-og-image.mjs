#!/usr/bin/env node
/* Картинка превью ссылки (og:image), 1200×630 — одна на лендинг и /deckinvestors.
 *
 * ⚠️ СКРИПТ НИЧЕГО НЕ РИСУЕТ САМ. Фигура и кольца берутся из
 * src/data/coreFigure.js (тот же файл, что фон лендинга и дека), знак — из
 * public/brand/mark-full-512.png, слово HEXLASH — живой текст шрифтом Saira
 * Condensed. Координат фигуры здесь нет.
 *
 * Запуск:  node scripts/build-og-image.mjs            → docs/landing-preview/*.html + png
 *          node scripts/build-og-image.mjs --publish  → ещё и public/og-image.png (вариант PUBLISH)
 * Нужен Playwright (глобальный) с Chromium.
 *
 * ⚠️ Всё важное лежит в центральном квадрате 630×630 (x 285…915): X, Discord
 * и часть мессенджеров обрезают края до квадрата. Края отданы только кольцам.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { coreFigure, vortexRings, MODES, FACETS } from '../src/data/coreFigure.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/landing-preview');
/* Какой вариант уходит в public/og-image.png. Смена выбора — это одна цифра. */
const PUBLISH = 1;

const PINK = '#FF0069';
const BG = '#08080a';
const TAG = 'Train the AI until it becomes the trainer.';
const W = 1200, H = 630;

/* ---- фигура ядра, статичная, все пятнадцать граней горят ------------------ */
function coreSvg(px, mode = 'full') {
  const fig = coreFigure(mode);
  const m = fig.m;
  const id = (n) => `c${px}${n}`;
  const lit = fig.branches.map((b) => `<polygon points="${b.strip}" fill="currentColor" fill-opacity="${m.facet}"/>`).join('');
  const zones = m.zone > 0 ? fig.zones.map((z) => `<polygon points="${z.points}" opacity="${m.zone}" fill="url(#${id('zone')})"/>`).join('') : '';
  const branches = fig.branches.map((b) => `<polygon points="${b.points}" fill="#120f17" stroke="currentColor" stroke-opacity="${m.branch}" stroke-width="1.3" stroke-linejoin="round"/>`).join('');
  const sides = fig.sides.map((s) => `
    <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${m.contour * 0.18}" stroke-width="${fig.gw}" stroke-linecap="round"/>
    <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${m.contour}" stroke-width="${fig.cw}" stroke-linecap="square"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fig.box} ${fig.box}" width="${px}" height="${px}" style="color:${PINK}">
  <defs>
    <radialGradient id="${id('plate')}"><stop offset="0" stop-color="#191420" stop-opacity=".95"/><stop offset="1" stop-color="#0d0b11" stop-opacity=".55"/></radialGradient>
    <radialGradient id="${id('glow')}"><stop offset="0" stop-color="currentColor" stop-opacity="${m.glow}"/><stop offset=".45" stop-color="currentColor" stop-opacity="${m.glow * 0.4}"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id('zone')}"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="currentColor" stop-opacity=".04"/></radialGradient>
    <radialGradient id="${id('gem')}" cx=".45" cy=".4"><stop offset="0" stop-color="currentColor" stop-opacity="1"/><stop offset="1" stop-color="currentColor" stop-opacity=".55"/></radialGradient>
    <radialGradient id="${id('gg')}"><stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="${fig.c}" cy="${fig.c}" r="${fig.haloR}" fill="url(#${id('glow')})"/>
  <polygon points="${fig.plate}" fill="url(#${id('plate')})"/>
  ${zones}${branches}${lit}${sides}
  <polygon points="${fig.inner}" fill="none" stroke="currentColor" stroke-opacity="${m.contour * 0.35}" stroke-width="1.2"/>
  <circle cx="${fig.c}" cy="${fig.c}" r="${fig.heart.glowR}" fill="url(#${id('gg')})"/>
  <polygon points="${fig.heart.frame}" fill="#0b0910" stroke="currentColor" stroke-opacity="${m.heart}" stroke-width="${fig.heart.frameW}" stroke-linejoin="round"/>
  <polygon points="${fig.heart.ring}" fill="none" stroke="currentColor" stroke-opacity="${m.heart * 0.35}" stroke-width="1"/>
  <polygon points="${fig.heart.gem}" fill="url(#${id('gem')})"/>
</svg>`;
}

/* ---- кольца «Вихря» вокруг фигуры: середина (cx,cy), coreR — половина стороны квадрата фигуры */
function ringsSvg(cx, cy, coreR, mode = 'full', count = 7, boost = 1) {
  const rings = vortexRings(count, mode);
  const polys = rings.map((r) => {
    const pts = r.points.split(' ').map((p) => {
      const [x, y] = p.split(',').map(Number);
      return `${(cx + x * coreR).toFixed(1)},${(cy + y * coreR).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${PINK}" stroke-opacity="${Math.min(1, r.opacity * boost)}" stroke-width="1.2"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0">${polys}</svg>`;
}

const markImg = (px) => `<img src="../../public/brand/mark-full-512.png" width="${px}" height="${px}" alt="" style="display:block">`;
/* Связка знак + слово: знак 44 / слово 24 / зазор 14 — пересчёт от бокса знака. */
const lockup = (mark, extra = '') => `<div style="display:flex;align-items:center;gap:${(mark * 14 / 44).toFixed(1)}px;${extra}">${markImg(mark)}<span class="word" style="font-size:${(mark * 24 / 44).toFixed(1)}px">HEXLASH</span></div>`;

/* ---- три раскладки. Все ключевые элементы внутри x 285…915 --------------- */
const VARIANTS = [
  { id: 1, name: 'Ядро в центре, связка сверху, строка снизу',
    body: () => `
      ${ringsSvg(600, 315, 230)}
      <div class="abs" style="left:285px;width:630px;top:0;height:630px">
        ${lockup(72, 'position:absolute;left:50%;top:36px;transform:translateX(-50%)')}
        <div style="position:absolute;left:50%;top:125px;transform:translateX(-50%)">${coreSvg(380)}</div>
        <div class="tag" style="top:538px">${TAG}</div>
      </div>` },
  { id: 2, name: 'Слово крупно под ядром',
    body: () => `
      ${ringsSvg(600, 232, 190)}
      <div class="abs" style="left:285px;width:630px;top:0;height:630px">
        <div style="position:absolute;left:50%;top:52px;transform:translateX(-50%)">${coreSvg(360)}</div>
        <div style="position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;align-items:center;gap:22px">
          ${markImg(76)}<span class="word" style="font-size:112px;line-height:1">HEXLASH</span>
        </div>
        <div class="tag" style="top:552px">${TAG}</div>
      </div>` },
  { id: 3, name: 'Слово и знак по центру, ядро как большой фон',
    body: () => `
      ${ringsSvg(600, 315, 250, 'full', 7, 0.9)}
      <div style="position:absolute;left:210px;top:-5px;opacity:.42">${coreSvg(640, 'muted')}</div>
      <div class="abs" style="left:285px;width:630px;top:0;height:630px">
        <div style="position:absolute;left:0;right:0;top:238px;display:flex;justify-content:center;align-items:center;gap:22px">
          ${markImg(92)}<span class="word" style="font-size:100px;line-height:1">HEXLASH</span>
        </div>
        <div class="tag" style="top:540px;color:#F6F4F6">${TAG}</div>
      </div>` },
];

const FONTS = `
@font-face{font-family:'Saira Condensed';font-weight:900;src:url(fonts/saira-condensed-900.woff2) format('woff2');}
@font-face{font-family:'Saira Condensed';font-weight:600;src:url(fonts/saira-condensed-600.woff2) format('woff2');}`;
const CSS = `${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:${BG}}
.og{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${BG};color:#F6F4F6;font-family:'Saira Condensed',sans-serif}
.abs{position:absolute}
.word{font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#F6F4F6}
.tag{position:absolute;left:0;right:0;text-align:center;font-weight:600;font-size:34px;letter-spacing:.04em;color:#CFCCD3;white-space:nowrap}`;

const page = (v) => `<!doctype html><html><head><meta charset="utf-8"><title>og ${v.id}</title><style>${CSS}</style></head><body><div class="og" id="og">${v.body()}</div></body></html>`;

mkdirSync(OUT, { recursive: true });
for (const v of VARIANTS) writeFileSync(join(OUT, `og-variant-${v.id}.html`), page(v));

const compare = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Превью ссылки — варианты</title>
<style>
body{background:#141418;color:#F6F4F6;font-family:system-ui,sans-serif;margin:0;padding:28px}
h1{font-size:20px;margin:0 0 6px} p{color:#aaa;margin:0 0 24px;font-size:14px;max-width:900px;line-height:1.5}
.v{margin:0 0 40px} .v h2{font-size:16px;margin:0 0 4px} .v small{color:#aaa;display:block;margin-bottom:10px}
.pair{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0} figcaption{font-size:12px;color:#888;margin-top:6px}
img{display:block;border:1px solid #333;height:auto}
.full{width:600px} .sq{width:315px}
</style></head><body>
<h1>Картинка превью ссылки: варианты раскладки</h1>
<p>Слева — как картинку видят Telegram и сайты целиком (1200×630). Справа — как её обрежут X и Discord до центрального квадрата 630×630: всё важное должно остаться в нём. В мета-теги сейчас стоит вариант ${PUBLISH}. Сменить — поменять цифру PUBLISH в scripts/build-og-image.mjs и запустить <code>node scripts/build-og-image.mjs --publish</code>.</p>
${VARIANTS.map((v) => `<div class="v"><h2>Вариант ${v.id}${v.id === PUBLISH ? ' — сейчас в мета-тегах' : ''}</h2><small>${v.name}</small>
<div class="pair"><figure><img class="full" src="og-variant-${v.id}.png"><figcaption>целиком 1200×630</figcaption></figure>
<figure><img class="sq" src="og-variant-${v.id}-square.png"><figcaption>обрезка до квадрата 630×630</figcaption></figure></div></div>`).join('')}
</body></html>`;
writeFileSync(join(OUT, 'index.html'), compare);

/* ---- рендер ------------------------------------------------------------- */
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const v of VARIANTS) {
  await pg.goto(pathToFileURL(join(OUT, `og-variant-${v.id}.html`)).href);
  await pg.evaluate(() => document.fonts.ready);
  const el = await pg.$('#og');
  await el.screenshot({ path: join(OUT, `og-variant-${v.id}.png`) });
  await pg.screenshot({ path: join(OUT, `og-variant-${v.id}-square.png`), clip: { x: 285, y: 0, width: 630, height: 630 } });
}
await browser.close();

if (process.argv.includes('--publish')) {
  writeFileSync(join(ROOT, 'public/og-image.png'), readFileSync(join(OUT, `og-variant-${PUBLISH}.png`)));
  console.log(`public/og-image.png ← вариант ${PUBLISH}`);
}
console.log('готово:', OUT);
