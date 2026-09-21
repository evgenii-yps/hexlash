#!/usr/bin/env node
/* Рисует ядро в деку — public/deckinvestors/index.html.
 *
 * Дека живёт статической страницей ВНЕ сборки: подключить Vue-компонент туда
 * нельзя, а рисовать фигуру руками нельзя тем более. Поэтому разметку сюда
 * пишет этот скрипт, и берёт он её из того же файла, что и ядро в приложении, —
 * src/data/coreFigure.js.
 *
 * ⚠️ СКРИПТ НИЧЕГО НЕ РИСУЕТ САМ. Здесь нет ни одной координаты: только
 * раскладка того, что вернул coreFigure(). Ровно самостоятельная отрисовка по
 * переписанным координатам когда-то и развела знак в игре с иконкой вкладки —
 * в проде месяцами висели два разных логотипа.
 *
 * Запуск:  node scripts/sync-core-figure.mjs
 * Правили фигуру или круг цветов — прогоните и проверьте деку глазами.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { coreFigure } from '../src/data/coreFigure.js';
import { CORE_CYCLE } from '../src/data/coreCycle.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = join(ROOT, 'public/deckinvestors/index.html');

const OPEN = '<!-- ЯДРО:НАЧАЛО -->';
const CLOSE = '<!-- ЯДРО:КОНЕЦ -->';
const COPEN = '<!-- ЦВЕТА:НАЧАЛО -->';
const CCLOSE = '<!-- ЦВЕТА:КОНЕЦ -->';

/* ⚠️ Цвета НЕ объявляются здесь. Они читаются из src/styles/tokens.css —
   единственного места, где они объявлены, — и переносятся на деку, которая
   до файла токенов не дотягивается: она статическая страница вне сборки.
   Разбор простой и нарочно строгий: не нашли значение — падаем, а не
   подставляем запасное число (запасное число и есть второе объявление). */
function tokens() {
  const css = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');
  const one = (name) => {
    const m = css.match(new RegExp('--' + name + '\\s*:\\s*([^;]+);'));
    if (!m) throw new Error(`[hexlash] токен --${name} не найден в tokens.css`);
    return m[1].trim();
  };
  const hexRgb = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  return {
    pink: one('pink-rgb').split(',').map((v) => Number(v.trim())),
    natisk: hexRgb(one('core-natisk')),
    nalet: hexRgb(one('core-nalet')),
    skala: hexRgb(one('core-skala')),
    zasada: hexRgb(one('core-zasada')),
  };
}

/* Вариант оформления и состояние у витрины ровно одно: «сердце крупнее»,
   фоновое, все грани горят. Промежуточных состояний на фоне не бывает. */
const STYLE = 'heart';
const fig = coreFigure({ styleId: STYLE, branches: { a: 5, b: 5, c: 5 } });

/* Ступени блика/тени тела — те же, что у фигуры в приложении. */
const ZONE_OP = { high: 0.022, mid: 0.013, low: 0.006 };

const lines = [];
const put = (s) => lines.push(s);

put(`<!-- Фигура ядра. НЕ ПРАВИТЬ РУКАМИ: написана`);
put(`     node scripts/sync-core-figure.mjs из src/data/coreFigure.js —`);
put(`     того же файла, что рисует ядро в игре. Вариант «${STYLE}», состояние`);
put(`     фоновое, все грани горят. Оформление — блок «A2. Ядро» в стилях. -->`);
put(`<svg class="dk-core" viewBox="0 0 ${fig.box} ${fig.box}" aria-hidden="true">`);
put(`  <defs>`);
put(`    <radialGradient id="dkCoreGlow" cx="50%" cy="50%" r="50%">`);
put(`      <stop offset="0%" stop-color="currentColor" stop-opacity=".55"/>`);
put(`      <stop offset="45%" stop-color="currentColor" stop-opacity=".18"/>`);
put(`      <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>`);
put(`    </radialGradient>`);
put(`    <radialGradient id="dkCoreInner" gradientUnits="userSpaceOnUse" cx="${fig.c}" cy="${fig.c}" r="${fig.r}">`);
put(`      <stop offset="0%" stop-color="currentColor" stop-opacity=".16"/>`);
put(`      <stop offset="55%" stop-color="currentColor" stop-opacity=".05"/>`);
put(`      <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>`);
put(`    </radialGradient>`);
for (const b of fig.branches) {
  put(`    <linearGradient id="dkCoreFlow-${b.id}" gradientUnits="userSpaceOnUse" x1="${fig.c}" y1="${fig.c}" x2="${b.tipX}" y2="${b.tipY}">`);
  put(`      <stop offset="0%" stop-color="currentColor" stop-opacity=".95"/>`);
  put(`      <stop offset="70%" stop-color="currentColor" stop-opacity=".70"/>`);
  put(`      <stop offset="100%" stop-color="currentColor" stop-opacity=".30"/>`);
  put(`    </linearGradient>`);
}
for (const z of fig.zones) {
  put(`    <radialGradient id="dkCoreZone-${z.id}" gradientUnits="userSpaceOnUse" cx="${z.cx}" cy="${z.cy}" r="${z.r}">`);
  put(`      <stop offset="0%" stop-color="currentColor" stop-opacity=".9"/>`);
  put(`      <stop offset="40%" stop-color="currentColor" stop-opacity=".38"/>`);
  put(`      <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>`);
  put(`    </radialGradient>`);
}
put(`  </defs>`);

put(`  <g class="dk-core__body">`);
for (const z of fig.zones) {
  put(`    <polygon points="${z.points}" fill="#F6F4F6" fill-opacity="${ZONE_OP[z.shade]}"/>`);
}
put(`    <polygon points="${fig.rim}" fill="url(#dkCoreInner)"/>`);
put(`  </g>`);

put(`  <g class="dk-core__fusion">`);
for (const z of fig.zones) {
  const op = (0.3 + (z.strength / 5) * 0.7).toFixed(3);
  put(`    <polygon points="${z.points}" fill="url(#dkCoreZone-${z.id})" opacity="${op}"/>`);
}
put(`  </g>`);

put(`  <g class="dk-core__branches">`);
for (const b of fig.branches) {
  put(`    <polygon class="dk-core__shard" points="${b.shard}"/>`);
}
for (const b of fig.branches) {
  put(`    <polygon class="dk-core__vein" points="${b.vein}" fill="url(#dkCoreFlow-${b.id})"/>`);
}
put(`  </g>`);

put(`  <g class="dk-core__nodes">`);
for (const b of fig.branches) {
  for (const n of b.nodes) {
    put(`    <polygon class="dk-core__gem" points="${n.points}"/>`);
    put(`    <polygon class="dk-core__facet" points="${n.inner}"/>`);
  }
}
put(`  </g>`);

put(`  <g class="dk-core__heart">`);
put(`    <circle class="dk-core__glow" cx="${fig.c}" cy="${fig.c}" r="${fig.heart.glowR}" fill="url(#dkCoreGlow)"/>`);
put(`    <polygon class="dk-core__stone" points="${fig.heart.outer}"/>`);
if (fig.heart.table) put(`    <polygon class="dk-core__table" points="${fig.heart.table}"/>`);
for (const l of fig.heart.cuts) {
  put(`    <line class="dk-core__cut" x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}"/>`);
}
if (fig.heart.seed) put(`    <polygon class="dk-core__seed" points="${fig.heart.seed}"/>`);
put(`  </g>`);

put(`  <polygon class="dk-core__rim" points="${fig.rim}"/>`);
put(`</svg>`);

const markup = lines.map((l) => '  ' + l).join('\n');

/* Круг цветов: имена разделов берём из src/data/coreCycle.js, значения — из
   файла токенов. Дека получает и то и другое готовым. */
const T = tokens();
const names = CORE_CYCLE.map((id) => id || 'pink');
const colors = [];
colors.push('<style>');
colors.push('/* Круг цветов витрины. НЕ ПРАВИТЬ РУКАМИ: написано');
colors.push('   node scripts/sync-core-figure.mjs — порядок из src/data/coreCycle.js,');
colors.push('   значения из src/styles/tokens.css. Второго объявления цвета в проекте');
colors.push('   быть не должно, поэтому сюда они ПЕРЕНОСЯТСЯ, а не вписываются. */');
for (const n of names) {
  const [r, g, b] = T[n];
  colors.push(`.dk-wave[data-core="${n}"]{--dk-r:${r};--dk-g:${g};--dk-b:${b}}`);
}
colors.push('</style>');
colors.push(`<script>window.DK_CORE_CYCLE=${JSON.stringify(names)};<\/script>`);
const colorBlock = colors.map((l) => '  ' + l).join('\n');

function splice(src, open, close, body, what) {
  const a = src.indexOf(open);
  const b = src.indexOf(close);
  if (a < 0 || b < 0) {
    console.error(`Не нашёл метки ${open} / ${close} в ${DECK} (${what}).`);
    console.error('Скрипт пишет только между ними и сам разметку не ищет.');
    process.exit(1);
  }
  return src.slice(0, a + open.length) + '\n' + body + '\n' + src.slice(b);
}

const html = readFileSync(DECK, 'utf8');
let next = splice(html, OPEN, CLOSE, markup, 'фигура');
next = splice(next, COPEN, CCLOSE, colorBlock, 'цвета');
if (next === html) {
  console.log('Дека уже в порядке — менять нечего.');
} else {
  writeFileSync(DECK, next);
  console.log(`Ядро записано в деку: ${lines.length} строк разметки, вариант «${STYLE}».`);
  console.log(`Круг цветов: ${names.join(' → ')} → по кругу.`);
}
