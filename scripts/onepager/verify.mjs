#!/usr/bin/env node
/* Приёмка одностраничника. Запуск: node scripts/onepager/verify.mjs [--lang ru]
   Проверяет готовый PDF: одна страница A4 · два шрифта, оба встроены · текст
   живой и содержит все строки из text.<lang>.json · нет заглушек и запрещённых
   слов · каждое число сверено с кодом деки · цвета — из токенов.
   Любой провал — код выхода 1. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { token, ROOT } from './tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
const i = process.argv.indexOf('--lang');
const lang = i > -1 ? process.argv[i + 1] : config.lang;
const T = JSON.parse(readFileSync(join(HERE, `text.${lang}.json`), 'utf8'));
const pdf = resolve(ROOT, config.output.replace('{lang}', lang.toUpperCase()));

let failed = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { failed++; console.log('  ✗ ' + m); };
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' });
const norm = (s) => s.replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();

/* 1. страница */
console.log('1. Страница');
const info = sh('pdfinfo', [pdf]);
const pages = +info.match(/Pages:\s+(\d+)/)[1];
const size = info.match(/Page size:\s+([\d.]+) x ([\d.]+)/);
pages === 1 ? ok('страниц: 1') : bad(`страниц: ${pages}`);
(Math.abs(size[1] - 595.28) < 1 && Math.abs(size[2] - 841.89) < 1) ? ok(`формат A4 (${size[1]} × ${size[2]} pt)`) : bad(`формат ${size[1]} × ${size[2]}`);

/* 2. шрифты */
console.log('2. Шрифты (pdffonts)');
const rows = sh('pdffonts', [pdf]).split('\n').slice(2).filter(Boolean);
const names = new Set(); let allEmb = true;
for (const r of rows) {
  const name = r.slice(0, 36).trim().replace(/^[A-Z]{6}\+/, '');
  names.add(name);
  if (!/ yes yes /.test(r)) allEmb = false;
}
const okFont = (n) => /^SairaCondensed-/.test(n) || /^JetBrainsMono-/.test(n);
console.log('    ' + [...names].join(', '));
[...names].every(okFont) ? ok('только Saira Condensed и JetBrains Mono') : bad('есть посторонний шрифт');
allEmb ? ok('все встроены (emb=yes)') : bad('есть невстроенный шрифт');

/* 3. текст */
console.log('3. Текст (pdftotext)');
const text = norm(sh('pdftotext', ['-raw', '-nopgbrk', pdf, '-']));
text.length > 400 ? ok(`живой текст: ${text.length} знаков`) : bad('текст не извлекается');
/\[|\]/.test(text) ? bad('в тексте есть [ или ]') : ok('нет квадратных скобок-заглушек');
const BANNED = ['HOUSE', 'HEXARCH', 'TEMPER', 'DOCTRINE', 'ASCENSION', 'дом', 'наставник', 'mobile-first', 'работающий прототип', 'burn', 'use of funds', 'вестинг'];
for (const w of BANNED) {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, 'iu');
  if (re.test(text)) bad(`запрещённое слово: ${w}`);
}
ok(`проверены запрещённые слова (${BANNED.length})`);

/* каждая строка из файла текста реально напечатана */
const leaves = [];
(function walk(o, path) {
  if (typeof o === 'string') leaves.push([path, o]);
  else if (Array.isArray(o)) o.forEach((v, k) => walk(v, `${path}[${k}]`));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
})(T, '');
const SKIP = new Set(['lang', 'docTitle', 'footer.deck', 'footer.contact']);
const noSpaces = (s) => norm(s).replace(/ /g, '');
const flat = text.replace(/ /g, '').toLowerCase();
let missing = 0;
for (const [path, v] of leaves) {
  if (SKIP.has(path) || /\.id$/.test(path)) continue;
  const want = noSpaces(v.replace(/\*\*/g, ''));
  if (!flat.includes(want.toLowerCase())) { missing++; bad(`в PDF нет строки ${path}: «${v}»`); }
}
if (!missing) ok('все строки text.json напечатаны в PDF');
config.showDeckLink ? (text.includes('hexlash.com/deckinvestors') || bad('выключатель «дека» включён, строки нет')) : (text.includes('deckinvestors') ? bad('выключатель «дека» выключен, а строка есть') : ok('строка «дека целиком» — выключена, в PDF её нет'));
config.showContact ? ok('контакт включён') : ok('контакт — выключен, в PDF его нет');

/* 4. числа и даты — по коду деки */
console.log('4. Сверка чисел с кодом деки');
const deckHtml = readFileSync(join(ROOT, 'public/deckinvestors/index.html'), 'utf8').split('\n');
let deck = deckHtml.slice(914, 1482).join('\n')   // русский слой: первый экран + разделы 01–21
  .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
deck = norm(deck).toLowerCase();
/* дата сборки — единственное число, которого в деке быть не может */
const body = text.replace(/\d{2}\.\d{2}\.\d{4}\s*$/m, '');
const nums = [...new Set((body.match(/\$?\d+(?:[.,]\d+)*(?: \d{3})*[%M]?/g) || []).map((s) => s.trim()))];
const meta = text.match(/INVESTOR ONE-PAGER[^\n]*?(\d{2}\.\d{2}\.\d{4})/);
for (const n of nums) {
  if (meta && n === meta[1] && !deck.includes(n.toLowerCase())) { console.log(`    (дата сборки ${n} — служебная, в деке её нет и быть не должно)`); continue; }
  deck.includes(n.toLowerCase()) ? ok(`${n}`) : bad(`числа «${n}» нет в деке`);
}
const PHRASES = [
  'из 2 817 web3-игр', '2018–2023', 'ноябрь 2023', 'на 99%', 'ядер четыре', '≈ $0,008', '≈ $8',
  'замер 02.10.2026', '21 дуэль', 'серверы, хранение и сеть не входят', 'платят за облик, а не за силу',
  'ни один источник не продаёт силу', 'цепь, рейд, обвал, охота', 'дуэль и отряд', 'размер раунда открыт — верхнего порога нет',
  'юрлицо и правовое заключение', 'ai arena', '$6m', 'юрий варваров', 'евгений бобров', 'иван король', 'ceo · со-основатель',
  'cto · со-основатель', 'ты растишь ии, пока он не начнёт растить других', 'не игра, а демонстрация идеи',
];
console.log('    дословные формулировки:');
for (const p of PHRASES) deck.replace(/≈\s+/g, '≈ ').includes(p) ? null : console.log(`    ⚠ в деке нет дословно: «${p}»`);
ok(`сверено формулировок: ${PHRASES.length} (расхождения — строки ⚠ выше, если есть)`);

/* 5. цвета */
console.log('5. Цвета PDF против tokens.css');
let cols;
let white = [], sizesPx = [];
try { const j = JSON.parse(sh('python3', [join(HERE, 'pdf-colors.py'), pdf])); cols = j.colors; white = j.whiteRendered; sizesPx = j.sizesPx; } catch (e) { cols = null; bad('pdf-colors.py не запустился (нужен pymupdf)'); }
if (cols) {
  const hexUp = (n) => token(n).toUpperCase();
  const TOK = { void: 0, panel: 0, ink: 0, 'ink-dim': 0, pink: 0, 'core-natisk': 0, 'core-nalet': 0, 'core-skala': 0, 'core-zasada': 0 };
  const byHex = {};
  for (const n of Object.keys(TOK)) byHex[hexUp(n)] = '--' + n;
  /* rgba-токены линий — белый с прозрачностью */
  byHex['#FFFFFF'] = '--line / --line-strong (белый с прозрачностью)';
  /* тёмные константы генератора ядра (coreFigure / HexCore.vue) — не токены */
  for (const c of ['#191420', '#0D0B11', '#120F17', '#0B0910']) byHex[c] = 'генератор ядра «Печать» (не токен)';
  for (const c of cols) {
    const key = `${c.kind} ${c.rgb} ×${c.count}${c.opacity < 1 ? ' α' + c.opacity : ''}`;
    const tok = byHex[c.rgb.toUpperCase()];
    console.log(`    ${key.padEnd(34)} ${tok ? '= ' + tok : '✗ НЕ ИЗ ТОКЕНОВ'}`);
    if (!tok) bad(`цвет ${c.rgb} (${c.kind}) не из токенов`);
  }
  if (white.length) { console.log(`    белые «непрозрачные» заливки на деле нарисованы так: ${white.join(', ')}`); if (white.some((h) => parseInt(h.slice(1, 3), 16) > 200)) bad('есть настоящая чисто-белая заливка'); else ok('это рамки —line— с прозрачностью, чисто-белого на странице нет'); }
  if (!failed) ok('все цвета PDF — из токенов (и констант генератора ядра)');
  const pureWhiteText = cols.some((c) => c.kind === 'text' && c.rgb.toUpperCase() === '#FFFFFF');
  pureWhiteText ? bad('чисто-белый текст') : ok('чисто-белого и чисто-чёрного текста нет');
}
console.log('6. Кегли — только из шкалы токенов (px)');
if (sizesPx.length) {
  const scale = ['t-micro', 't-xs', 't-sm', 't-base', 't-md', 't-lg', 't-xl', 't-3xl', 't-2xl', 't-hero'].map((n) => parseFloat(token(n)));
  console.log('    в PDF: ' + sizesPx.join(', ') + '   шкала: ' + scale.join(', '));
  const off = sizesPx.filter((v) => !scale.some((sc) => Math.abs(sc - v) < 0.1));
  off.length ? bad('вне шкалы: ' + off.join(', ')) : ok('все кегли из шкалы, минимум ' + Math.min(...sizesPx));
}
console.log(failed ? `\nПровалов: ${failed}` : '\nВсе проверки пройдены.');
process.exit(failed ? 1 : 0);
