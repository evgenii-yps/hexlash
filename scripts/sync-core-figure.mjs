#!/usr/bin/env node
/* Рисует «Вихрь» в деку — public/deckinvestors/index.html.
 *
 * Дека живёт статической страницей ВНЕ сборки: подключить туда Vue-компонент
 * нельзя, а рисовать фигуру руками нельзя тем более. Поэтому разметку сюда
 * пишет этот скрипт и берёт её из тех же файлов, что и приложение:
 *   src/data/coreFigure.js    — фигура и кольца;
 *   src/styles/core-flicker.css — стоп-кадры мерцания;
 *   src/data/coreCycle.js     — круг цветов;
 *   src/styles/tokens.css     — сами цвета.
 *
 * ⚠️ СКРИПТ НИЧЕГО НЕ РИСУЕТ САМ. Здесь нет ни одной координаты и ни одной
 * прозрачности: только раскладка того, что вернули общие файлы. Ровно
 * самостоятельная отрисовка по переписанным координатам когда-то и развела
 * знак в игре с иконкой вкладки — в проде месяцами висели два разных логотипа.
 *
 * Запуск:  node scripts/sync-core-figure.mjs
 * Правили фигуру, кольца, мерцание или круг цветов — прогоните и проверьте
 * деку глазами.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { coreFigure, vortexRings, VORTEX, FACETS, MODES } from '../src/data/coreFigure.js';
import { CORE_CYCLE } from '../src/data/coreCycle.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = join(ROOT, 'public/deckinvestors/index.html');

/* Дека идёт приглушённой во всех разделах, плюс весь слой вполсилы:
   восемнадцать разделов плотного текста с цифрами. */
const MODE = 'muted';
/* Колец на деке семь — как на компьютере (эталон). */
const RINGS = VORTEX.count.desktop;
/* Сколько граней зажигает каждая ветка и по какой дорожке кадров идёт.
   ⚠️ Та же раскладка, что в HexCore.vue (RUN_ALL / RUN_FIVE) — меняются парой.
   Основной ход: все три ветки одновременно доходят до вершины, горят все
   пятнадцать граней. */
const RUN_ALL = [{ lit: FACETS, flow: 1 }, { lit: FACETS, flow: 1 }, { lit: FACETS, flow: 1 }];
/* ⚠️ ЗАПАСНОЙ РЕЖИМ «3 + 2», ПО УМОЛЧАНИЮ ВЫКЛЮЧЕН. Прежнее правило «горит не
   больше пяти граней, как в игре»: три на первой ветке, две на второй, третья
   не участвует. Владелец просил держать наготове. Включается одним FIVE ниже
   (и парой — свойством fill-five у HexCore). В самой игре правило не меняется. */
const RUN_FIVE = [{ lit: 3, flow: 1 }, { lit: 2, flow: 2 }, { lit: 0, flow: 1 }];
const FIVE = false;
const RUN = FIVE ? RUN_FIVE : RUN_ALL;
/* Зоны сплава. Основной ход: все три проявляются по мере заполнения.
   Запасной «3 + 2»: одна, между двумя работающими ветками. */
const ZONES = FIVE ? [{ i: 0, track: '2' }] : [0, 1, 2].map((i) => ({ i, track: 'all' }));
const HEART = FIVE ? 'pair' : 'all';
/* Насколько ярче сердце с каждой веткой; масштаб — от яркости режима. */
const LIFT = [0.40, 0.75, 1.0].map((v) => +(v * MODES[MODE].facet / MODES.full.facet).toFixed(3));
const LIFT_MAX = FIVE ? LIFT[1] : LIFT[2];
/* Докуда доходит зона сплава: доля от яркости неподвижных зон под ней. */
const ZONE_MAX = +(MODES[MODE].zone / MODES.full.zone).toFixed(3);

const BLOCKS = [
  ['<!-- ВИХРЬ:НАЧАЛО -->', '<!-- ВИХРЬ:КОНЕЦ -->', 'кольца'],
  ['<!-- ЯДРО:НАЧАЛО -->', '<!-- ЯДРО:КОНЕЦ -->', 'фигура'],
  ['<!-- МЕРЦАНИЕ:НАЧАЛО -->', '<!-- МЕРЦАНИЕ:КОНЕЦ -->', 'мерцание'],
  ['<!-- ГРАНИ:НАЧАЛО -->', '<!-- ГРАНИ:КОНЕЦ -->', 'грани'],
  ['<!-- ЦВЕТА:НАЧАЛО -->', '<!-- ЦВЕТА:КОНЕЦ -->', 'цвета'],
];

/* ⚠️ Цвета НЕ объявляются здесь. Они читаются из src/styles/tokens.css —
   единственного места, где они объявлены, — и переносятся на деку, которая до
   файла токенов не дотягивается: она статическая страница вне сборки. Разбор
   простой и нарочно строгий: не нашли значение — падаем, а не подставляем
   запасное число (запасное число и есть второе объявление). */
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

/* ---- кольца ------------------------------------------------------------- */

const half = VORTEX.span / 2;
const ringLines = [];
ringLines.push('<!-- Кольца «Вихря». НЕ ПРАВИТЬ РУКАМИ: написано');
ringLines.push('     node scripts/sync-core-figure.mjs из src/data/coreFigure.js. -->');
ringLines.push(`<svg class="dk-rings" viewBox="${-half} ${-half} ${VORTEX.span} ${VORTEX.span}" aria-hidden="true">`);
ringLines.push('  <g fill="none" stroke="currentColor">');
for (const r of vortexRings(RINGS, MODE)) {
  ringLines.push(`    <polygon points="${r.points}" stroke-opacity="${r.opacity}" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
}
ringLines.push('  </g>');
ringLines.push('</svg>');

/* ---- фигура ------------------------------------------------------------- */

const f = coreFigure(MODE);
const core = [];
const put = (s) => core.push(s);

put('<!-- Фигура ядра «Печать». НЕ ПРАВИТЬ РУКАМИ: написана');
put('     node scripts/sync-core-figure.mjs из src/data/coreFigure.js — того же');
put('     файла, что рисует ядро на лендинге. Режим яркости — ' + MODE + '. -->');
put(`<svg class="dk-core" viewBox="0 0 ${f.box} ${f.box}" style="--core-c:${f.c}px;--zone-max:${ZONE_MAX}" aria-hidden="true">`);
put('  <defs>');
put('    <radialGradient id="dkPlate">');
put('      <stop offset="0" stop-color="#191420" stop-opacity=".95"/>');
put('      <stop offset="1" stop-color="#0d0b11" stop-opacity=".55"/>');
put('    </radialGradient>');
put('    <radialGradient id="dkGlow">');
put(`      <stop offset="0" stop-color="currentColor" stop-opacity="${f.m.glow}"/>`);
put(`      <stop offset=".45" stop-color="currentColor" stop-opacity="${+(f.m.glow * 0.4).toFixed(4)}"/>`);
put('      <stop offset="1" stop-color="currentColor" stop-opacity="0"/>');
put('    </radialGradient>');
if (f.m.zone > 0) {
  put('    <radialGradient id="dkZone">');
  put('      <stop offset="0" stop-color="currentColor" stop-opacity=".55"/>');
  put('      <stop offset="1" stop-color="currentColor" stop-opacity=".04"/>');
  put('    </radialGradient>');
}
put('    <radialGradient id="dkGem" cx=".45" cy=".4">');
put('      <stop offset="0" stop-color="currentColor" stop-opacity="1"/>');
put('      <stop offset="1" stop-color="currentColor" stop-opacity=".55"/>');
put('    </radialGradient>');
put('    <radialGradient id="dkGemGlow">');
put('      <stop offset="0" stop-color="currentColor" stop-opacity=".5"/>');
put('      <stop offset="1" stop-color="currentColor" stop-opacity="0"/>');
put('    </radialGradient>');
/* Круги-заполнители: стоят в середине ядра, растут наружу.
   ⚠️ ОДИН НА ВСЕ ВЕТКИ С ОДИНАКОВЫМ ХОДОМ — как в HexCore.vue. Печать
   симметрична, свет расходится из середины кругом: трём веткам основного
   хода нужна одна обрезка, а не три одинаковых. */
const clipKey = (i) => `${RUN[i].flow}-${RUN[i].lit}`;
const clips = new Set();
f.branches.forEach((b, i) => {
  const { lit, flow } = RUN[i];
  if (!lit || clips.has(clipKey(i))) return;
  clips.add(clipKey(i));
  /* Шесть остановок. Ветке, которая зажигает меньше пяти частей, лишние
     приходят равными последней: шаг проходит, радиус не меняется. */
  const stops = [];
  for (let k = 0; k <= FACETS; k++) stops.push(`--f${k}:${b.stops[Math.min(k, lit)]}`);
  stops.push(`--f-final:${b.stops[lit]}`);
  put(`    <clipPath id="dkFlow-${clipKey(i)}">`);
  put(`      <circle cx="0" cy="0" r="1" data-core-flow="${flow}" style="${stops.join(';')}"/>`);
  put('    </clipPath>');
});
put('  </defs>');

put(`  <circle cx="${f.c}" cy="${f.c}" r="${f.haloR}" fill="url(#dkGlow)"/>`);
put(`  <polygon points="${f.plate}" fill="url(#dkPlate)"/>`);
if (f.m.zone > 0) {
  for (const z of f.zones) {
    put(`  <polygon points="${z.points}" opacity="${f.m.zone}" fill="url(#dkZone)"/>`);
  }
}
/* Зоны сплава: проявляются по мере заполнения веток. Прозрачность ведёт
   группа, а не каждая зона: одна анимация вместо трёх. */
if (f.m.zone > 0) {
  put('  <g class="hc-facets">');
  put(`    <g data-core-zone="${ZONES[0].track}">`);
  for (const z of ZONES) {
    put(`      <polygon points="${f.zones[z.i].points}" fill="url(#dkZone)"/>`);
  }
  put('    </g>');
  put('  </g>');
}
for (const b of f.branches) {
  put(`  <polygon points="${b.points}" fill="#120f17" stroke="currentColor" stroke-opacity="${f.m.branch}" stroke-width="1.3" stroke-linejoin="round"/>`);
}
/* Горящая часть ветки — одна сплошная полоса без делений. Общая жизнь слоя
   (держится — гаснет — пауза) ведёт группа: одна анимация вместо трёх. */
put('  <g class="hc-facets">');
put('    <g data-core-lit="1">');
f.branches.forEach((b, i) => {
  if (!RUN[i].lit) return;
  put(`      <g clip-path="url(#dkFlow-${clipKey(i)})">`);
  put(`        <polygon points="${b.strip}" fill="currentColor" fill-opacity="${f.m.facet}"/>`);
  put('      </g>');
});
put('    </g>');
put('  </g>');
for (const s of f.sides) {
  put(`  <g data-core-flick="1" style="--core-flick-dur:${s.dur}s;--core-flick-del:${s.del}s">`);
  put(`    <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${+(f.m.contour * 0.18).toFixed(4)}" stroke-width="${f.gw}" stroke-linecap="round"/>`);
  put(`    <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-opacity="${f.m.contour}" stroke-width="${f.cw}" stroke-linecap="square"/>`);
  put('  </g>');
}
put(`  <polygon points="${f.inner}" fill="none" stroke="currentColor" stroke-opacity="${+(f.m.contour * 0.35).toFixed(4)}" stroke-width="1.2"/>`);
put(`  <circle cx="${f.c}" cy="${f.c}" r="${f.heart.glowR}" fill="url(#dkGemGlow)"/>`);
/* Сердце ярче с каждой задействованной веткой. */
put('  <g class="hc-facets">');
put(`    <circle data-core-heart="${HEART}" cx="${f.c}" cy="${f.c}" r="${f.heart.glowR}" fill="url(#dkGemGlow)" style="--lift1:${LIFT[0]};--lift2:${LIFT[1]};--lift-max:${LIFT_MAX};--lift-final:${LIFT_MAX}"/>`);
put('  </g>');
put(`  <polygon points="${f.heart.frame}" fill="#0b0910" stroke="currentColor" stroke-opacity="${f.m.heart}" stroke-width="${f.heart.frameW}" stroke-linejoin="round"/>`);
put(`  <polygon points="${f.heart.ring}" fill="none" stroke="currentColor" stroke-opacity="${+(f.m.heart * 0.35).toFixed(4)}" stroke-width="1"/>`);
put(`  <polygon points="${f.heart.gem}" fill="url(#dkGem)"/>`);
put('</svg>');

/* ---- мерцание ----------------------------------------------------------- */

const flickCss = readFileSync(join(ROOT, 'src/styles/core-flicker.css'), 'utf8').trim();
const flick = [
  '<style>',
  '/* Мерцание контура. НЕ ПРАВИТЬ РУКАМИ: перенесено',
  '   node scripts/sync-core-figure.mjs из src/styles/core-flicker.css —',
  '   того же файла, что мерцает на лендинге. */',
  flickCss,
  '</style>',
];

/* ---- расписание заполнения --------------------------------------------- */

const facetCss = readFileSync(join(ROOT, 'src/styles/core-facets.css'), 'utf8').trim();
const facets = [
  '<style>',
  '/* Медленное заполнение граней. НЕ ПРАВИТЬ РУКАМИ: перенесено',
  '   node scripts/sync-core-figure.mjs из src/styles/core-facets.css —',
  '   того же файла, что ведёт цикл на лендинге. */',
  facetCss,
  '</style>',
];

/* ---- цвета -------------------------------------------------------------- */

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

/* ---- запись ------------------------------------------------------------- */

const bodies = [ringLines, core, flick, facets, colors].map(
  (l) => l.map((s) => '  ' + s).join('\n'),
);

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
let next = html;
BLOCKS.forEach(([open, close, what], i) => {
  next = splice(next, open, close, bodies[i], what);
});

if (next === html) {
  console.log('Дека уже в порядке — менять нечего.');
} else {
  writeFileSync(DECK, next);
  console.log(`Дека обновлена. Фигура «Печать», режим «${MODE}», колец ${RINGS}.`);
  console.log(`Круг цветов: ${names.join(' → ')} → по кругу.`);
}
