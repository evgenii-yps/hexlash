// Шрифты для рендера. Игра берёт Saira Condensed и JetBrains Mono с Google Fonts,
// а в песочнице наружу закрыто. Подменяем ответы на уровне сети страницы: файлы
// шрифтов лежат только в обвязке (node_modules этой папки), в игру не попадают.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const NM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/@fontsource');
const FACES = [
  ['Saira Condensed', 'saira-condensed', [500, 600, 700, 800, 900]],
  ['JetBrains Mono', 'jetbrains-mono', [400, 500, 700]],
];
const HOST = 'https://fonts.gstatic.com/__showcase/';

const css = FACES.flatMap(([fam, dir, ws]) => ws.map((w) =>
  `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;src:url(${HOST}${dir}-latin-${w}-normal.woff2) format('woff2');}`)).join('\n');

/** Навешивает маршруты подмены шрифтов на контекст браузера. */
export async function routeFonts(ctx, log) {
  await ctx.route(/fonts\.googleapis\.com/, (r) => { if (log) log.mocked++; r.fulfill({ status: 200, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: css }); });
  await ctx.route(/fonts\.gstatic\.com\/__showcase\//, (r) => {
    if (log) log.mocked++;
    const file = r.request().url().split('/__showcase/')[1];
    const dir = file.replace(/-latin-.*$/, '');
    try {
      r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(path.join(NM, dir, 'files', file)) });
    } catch (e) { r.abort(); }
  });
}
