#!/usr/bin/env node
/* Одностраничник для инвесторов → PDF (A4, одна страница).

   Запуск:   node scripts/onepager/build.mjs [--lang ru]
   Проверка: node scripts/onepager/verify.mjs

   Что откуда берётся (своих копий значений в скрипте нет):
     цвета, шрифты, шкала кегля, отступы, разрядка — src/styles/tokens.css;
     рисунок ядра «Печать»                         — src/data/coreFigure.js;
     знак                                          — docs/design-handoff/hexlash_mark/brand;
     тексты                                        — scripts/onepager/text.<lang>.json;
     выключатели (ссылка на деку, контакт)         — scripts/onepager/config.json.

   ⚠️ Токен не найден или пустой — сборка падает. Запасных чисел нет: запасное
   число и есть второе объявление, из-за которых в проде когда-то висели два
   разных логотипа.

   ⚠️ Знак подключается ФАЙЛОМ (векторной версии в проекте нет), слово HEXLASH —
   живой текст. Рисовать знак здесь нельзя.

   Нужны: playwright (глобально или в node_modules) и Chromium из
   PLAYWRIGHT_BROWSERS_PATH. Шрифты лежат рядом — scripts/onepager/fonts. */

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { coreFigure, FACETS } from '../../src/data/coreFigure.js';
import { token } from './tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

/* ---- аргументы и конфиг ------------------------------------------------- */

const config = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
const argLang = process.argv.indexOf('--lang');
const lang = argLang > -1 ? process.argv[argLang + 1] : config.lang;
const textPath = join(HERE, `text.${lang}.json`);
if (!existsSync(textPath)) throw new Error(`[onepager] нет файла текста ${textPath}`);
const T = JSON.parse(readFileSync(textPath, 'utf8'));

/* ---- токены -------------------------------------------------------------- */

const TOKEN_NAMES = [
  'void', 'panel', 'ink', 'ink-soft', 'ink-dim', 'ink-off', 'pink',
  'core-natisk', 'core-nalet', 'core-skala', 'core-zasada',
  'line', 'line-strong', 'font-display', 'font-mono',
  'ls-tight', 'ls-title', 'ls-meta', 'ls-wide',
  't-micro', 't-xs', 't-sm', 't-base', 't-md', 't-lg', 't-xl', 't-3xl', 't-2xl', 't-hero',
  'sp-1', 'sp-2', 'sp-3', 'sp-4', 'sp-5', 'sp-6', 'sp-7',
];
const tokensCss = ':root{' + TOKEN_NAMES.map((n) => `--${n}:${token(n)};`).join('') + '}';

/* ---- шрифты: ровно два семейства ---------------------------------------- */

const FONTS = [
  ['Saira Condensed', 700, 'SairaCondensed_700Bold.ttf', 'truetype'],
  ['Saira Condensed', 900, 'SairaCondensed_900Black.ttf', 'truetype'],
  ['JetBrains Mono', 400, 'JetBrainsMono-Regular.woff2', 'woff2'],
  ['JetBrains Mono', 700, 'JetBrainsMono-Bold.woff2', 'woff2'],
];
const fontsCss = FONTS.map(([fam, w, file, fmt]) => {
  const p = join(HERE, 'fonts', file);
  if (!existsSync(p)) throw new Error(`[onepager] нет файла шрифта ${p}`);
  return `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;font-display:block;src:url("${pathToFileURL(p).href}") format("${fmt}")}`;
}).join('\n');

/* Имена шрифтов в tokens.css обязаны совпадать с теми, что подключены выше. */
for (const [n, fam] of [['font-display', 'Saira Condensed'], ['font-mono', 'JetBrains Mono']]) {
  if (!token(n).includes(`"${fam}"`)) throw new Error(`[onepager] --${n} больше не ${fam}: обновите FONTS`);
}

/* ---- знак ---------------------------------------------------------------- */

/* Самый крупный файл лесенки, полная отрисовка. Бокс знака в вёрстке ≥ 48. */
const markPath = join(ROOT, 'docs/design-handoff/hexlash_mark/brand/mark-full-512.png');
if (!existsSync(markPath)) throw new Error(`[onepager] нет файла знака ${markPath}`);

/* ---- ядро «Печать»: статичный кадр -------------------------------------- */

/* Рисунок целиком из coreFigure.js (единственный источник). Раскладка слоёв —
   та же, что в scripts/sync-core-figure.mjs и HexCore.vue; здесь она сведена
   к последнему кадру цикла: все пятнадцать граней горят, мерцания нет.
   Режим quiet — розовое состояние: горит одно сердце, ветки под ним налиты. */
function coreSvg() {
  const f = coreFigure('quiet');
  const o = [];
  const put = (s) => o.push(s);
  put(`<svg class="core" viewBox="0 0 ${f.box} ${f.box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`);
  put('<defs>');
  put('<radialGradient id="cPlate"><stop offset="0" stop-color="#191420" stop-opacity=".95"/><stop offset="1" stop-color="#0d0b11" stop-opacity=".55"/></radialGradient>');
  put(`<radialGradient id="cGlow"><stop offset="0" stop-color="currentColor" stop-opacity="${f.m.glow}"/><stop offset=".45" stop-color="currentColor" stop-opacity="${+(f.m.glow * 0.4).toFixed(4)}"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>`);
  put('<radialGradient id="cGem" cx=".45" cy=".4"><stop offset="0" stop-color="currentColor" stop-opacity="1"/><stop offset="1" stop-color="currentColor" stop-opacity=".55"/></radialGradient>');
  put('<radialGradient id="cGemGlow"><stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>');
  put(`<clipPath id="cFlow"><circle cx="${f.c}" cy="${f.c}" r="${f.branches[0].stops[FACETS]}"/></clipPath>`);
  put('</defs>');
  put(`<circle cx="${f.c}" cy="${f.c}" r="${f.haloR}" fill="url(#cGlow)"/>`);
  put(`<polygon points="${f.plate}" fill="url(#cPlate)"/>`);
  for (const b of f.branches) {
    put(`<polygon points="${b.points}" fill="#120f17" stroke="currentColor" stroke-opacity="${f.m.branch}" stroke-width="1.3" stroke-linejoin="round"/>`);
  }
  for (const b of f.branches) {
    put(`<g clip-path="url(#cFlow)"><polygon points="${b.strip}" fill="currentColor" fill-opacity="${f.m.facet}"/></g>`);
  }
  for (const s of f.sides) {
    put(`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${+(f.m.contour * 0.18).toFixed(4)}" stroke-width="${f.gw}" stroke-linecap="round"/>`);
    put(`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${f.m.contour}" stroke-width="${f.cw}" stroke-linecap="square"/>`);
  }
  put(`<polygon points="${f.inner}" fill="none" stroke="currentColor" stroke-opacity="${+(f.m.contour * 0.35).toFixed(4)}" stroke-width="1.2"/>`);
  put(`<circle cx="${f.c}" cy="${f.c}" r="${f.heart.glowR}" fill="url(#cGemGlow)"/>`);
  put(`<polygon points="${f.heart.frame}" fill="#0b0910" stroke="currentColor" stroke-opacity="${f.m.heart}" stroke-width="${f.heart.frameW}" stroke-linejoin="round"/>`);
  put(`<polygon points="${f.heart.ring}" fill="none" stroke="currentColor" stroke-opacity="${+(f.m.heart * 0.35).toFixed(4)}" stroke-width="1"/>`);
  put(`<polygon points="${f.heart.gem}" fill="url(#cGem)"/>`);
  put('</svg>');
  return o.join('');
}

/* ---- разметка ------------------------------------------------------------ */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* **слово** → <b>слово</b> — единственная разметка внутри текстов. */
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const CORE_IDS = ['natisk', 'nalet', 'skala', 'zasada'];

const dd = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = process.env.ONEPAGER_DATE || `${pad(dd.getDate())}.${pad(dd.getMonth() + 1)}.${dd.getFullYear()}`;

const coresHtml = T.solution.cores.map((c) => {
  if (!CORE_IDS.includes(c.id)) throw new Error(`[onepager] неизвестное ядро ${c.id}`);
  return `<li class="${c.id}">${esc(c.name)}</li>`;
}).join('');
const tilesHtml = T.barrier.tiles.map((t) =>
  `<div class="tile"><span class="tile-v">${esc(t.value)}</span><span class="tile-c">${esc(t.caption)}</span></div>`).join('');
const tokenRowsHtml = T.token.rows.map((r) =>
  `<div class="row"><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`).join('');
const peopleHtml = T.team.people.map((p) =>
  `<li class="person"><span class="p-name">${esc(p.name)}</span><span class="p-role">${esc(p.role)}</span></li>`).join('');

const extra = [];
if (config.showDeckLink) extra.push(`<span class="extra">${esc(T.footer.deck)}</span>`);
if (config.showContact) {
  if (!config.contact || !config.contact.trim()) throw new Error('[onepager] showContact включён, а contact пуст — заглушек не ставим');
  extra.push(`<span class="extra">${esc(T.footer.contact.replace('{contact}', config.contact.trim()))}</span>`);
}

const raw = {
  tokensCss, fontsCss, styleCss: readFileSync(join(HERE, 'style.css'), 'utf8'),
  coreSvg: coreSvg(), coresHtml, tilesHtml, tokenRowsHtml, peopleHtml,
  footExtraHtml: extra.join(''),
  'status.works': rich(T.status.works), 'status.dev': rich(T.status.dev),
};
const plain = { lang, date, markSrc: pathToFileURL(markPath).href };

function lookup(path) {
  return path.split('.').reduce((a, k) => (a == null ? a : a[k]), T);
}
let html = readFileSync(join(HERE, 'template.html'), 'utf8');
html = html.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, k) => {
  if (!(k in raw)) throw new Error(`[onepager] в шаблоне {{{${k}}}} без значения`);
  return raw[k];
});
html = html.replace(/\{\{([\w.]+)\}\}/g, (_, k) => {
  const v = k in plain ? plain[k] : lookup(k);
  if (v == null || typeof v === 'object') throw new Error(`[onepager] в шаблоне {{${k}}} нет значения в тексте`);
  return esc(v);
});

/* ---- печать -------------------------------------------------------------- */

function loadPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch { /* ищем глобально */ }
  const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return createRequire(join(g, 'x.js'))('playwright');
}
const { chromium } = loadPlaywright();

const work = mkdtempSync(join(tmpdir(), 'onepager-'));
const htmlPath = join(work, 'index.html');
writeFileSync(htmlPath, html);
/* Отладка: ONEPAGER_HTML=/путь/файл.html — оставить собранную страницу для осмотра. */
if (process.env.ONEPAGER_HTML) writeFileSync(process.env.ONEPAGER_HTML, html);

const out = resolve(ROOT, config.output.replace('{lang}', lang.toUpperCase()));
mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);

  /* Страница обязана вместиться: лишнее режется текстом, а не размером. */
  const fit = await page.evaluate(() => {
    const pg = document.querySelector('.page');
    const box = pg.getBoundingClientRect();
    const bad = [];
    for (const el of pg.querySelectorAll('*')) {
      if (el.closest('svg') && el.tagName !== 'svg') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > box.right + 0.5 || r.bottom > box.bottom + 0.5 || r.left < box.left - 0.5 || r.top < box.top - 0.5) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className}`);
      }
    }
    const foot = pg.querySelector('.foot').getBoundingClientRect();
    return { over: pg.scrollHeight - pg.clientHeight, bad, footBottom: foot.bottom, pageBottom: box.bottom };
  });
  if ((fit.over > 0 || fit.bad.length) && !process.env.ONEPAGER_FORCE) {
    throw new Error(`[onepager] не влезает: переполнение ${fit.over}px; вылезли: ${fit.bad.join(', ') || '—'}`);
  }
  console.log(`Влезает: подвал кончается на ${fit.footBottom.toFixed(0)} из ${fit.pageBottom.toFixed(0)} px.`);

  await page.pdf({ path: out, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
} finally {
  await browser.close();
  rmSync(work, { recursive: true, force: true });
}
console.log(`Готово: ${out}`);
