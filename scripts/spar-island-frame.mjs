// spar-island-frame.mjs — ПОМЕЩАЕТСЯ ЛИ ПЛИТА ОСТРОВА SPAR В КАДР.
//
// Мерка к правке от 28.09.2026 («отодвинуть камеру только на острове SPAR»).
// Снимает остров стоя и лёжа и говорит числом, а не на глаз: упирается ли
// освещённая плита в край кадра.
//
// ЧТО ИМЕННО ПРОВЕРЯЕТСЯ И ПОЧЕМУ ИМЕННО ЭТИ КРАЯ.
//   Остров SPAR — САМЫЙ ЛЕВЫЙ предмет в зале: левее него нет ничего, а ближе
//   всех к игроку — его собственный передний угол. Поэтому если плита влезла,
//   то вдоль ЛЕВОГО края и вдоль НИЖНЕГО края кадра остаётся одна пустота.
//   Правый край не проверяется намеренно: отойдя, камера захватывает справа
//   главную плиту зала, и пустоты там честно быть не должно.
//
//   ⚠️ ДЛЯ ЗАМЕРА ЭКРАННЫЙ СЛОЙ ПРЯЧЕТСЯ. BACK, SHOP и кабинет — светлые, и лёжа
//      они заезжают левее острова: заливка цеплялась за кнопку BACK и мерила её
//      вместо плиты. Снимок для глаз делается ДО того, со слоем на месте.
//      Спрятать элемент поверх полотна — единственный способ: снимок по самому
//      полотну всё равно дорисовывает то, что лежит поверх него.
//
//   CHROME=<путь к chrome> node scripts/spar-island-frame.mjs
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/spar-frame';
mkdirSync(OUT, { recursive: true });

// Точка постамента SPAR на экране 390×844, состав из трёх бойцов (та же, что в
// forge-islands-e2e.mjs — подобрана снимком и держится на этом составе).
const HIT_PORTRAIT = [290, 660];
// Лёжа зал разворачивается вширь, и постамент уезжает к середине кадра: точка
// снята с landscape-00-hall.png, ряд предметов на переднем краю плиты.
const HIT_LAND = [465, 305];
// Ждём сильно дольше самого перелёта: сглаживание камеры считается по кадрам,
// и на программном отрисовщике сервера полсекунды превращаются в полторы.
const SETTLE = 2500;
// Яркость, выше которой пиксель считается «не пустотой». Пустота — --void
// (#08080a): в обоих снимках её яркость 7–8, следующая ступень — 10. Порог 12
// снят гистограммой, не назначен на глаз.
const LIT = 12;

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * ОБМЕРИТЬ ОСВЕЩЁННОЕ В КАДРЕ.
 *
 * Порог отделяет светлое от пустоты: пустота (--void) даёт яркость 7–8, плита с
 * решёткой — от 12 и выше (замерено гистограммой обоих снимков).
 *
 * ⚠️ ЧТО ЭТОТ ЗАМЕР ДОКАЗЫВАЕТ, А ЧТО НЕТ. Отойдя, камера берёт справа главную
 *    плиту зала, и на экране две плиты СМЫКАЮТСЯ: заливкой их не разделить
 *    (проверено — заливка перетекает). Поэтому:
 *      · ЛЕВЫЙ и ВЕРХНИЙ края — честный приговор острову SPAR: левее и выше него
 *        в зале нет ничего, туда попасть больше нечему;
 *      · НИЖНИЙ край смотрится только по ЛЕВОЙ ПОЛОВИНЕ кадра: зал лежит правее
 *        (видно на снимках), а ближний — самый нижний — угол острова как раз в
 *        левой половине;
 *      · ПРАВЫЙ край не смотрится вовсе: там честно стоит зал.
 */
function measure(file) {
  const png = PNG.sync.read(readFileSync(file));
  const { width: W, height: H, data } = png;
  const at = (x, y) => { const i = (y * W + x) * 4; return lum(data[i], data[i + 1], data[i + 2]); };
  let minX = W, minY = H, maxYLeft = -1;
  let sum = 0, n = 0;   // насколько ярко то, что видно: остров темнеет с удалением
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) <= LIT) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x < W / 2 && y > maxYLeft) maxYLeft = y;
      if (x < W / 2) { sum += at(x, y); n++; }
    }
  }
  if (minX === W) return null;
  return {
    gapLeft: minX / W,
    gapTop: minY / H,
    gapBottom: (H - 1 - maxYLeft) / H,
    touchesLeft: minX === 0,
    touchesTop: minY === 0,
    touchesBottom: maxYLeft === H - 1,
    // Средняя яркость освещённого в ЛЕВОЙ половине кадра — это и есть остров.
    litMean: n ? sum / n : 0,
    litShare: n / (W * H / 2),
  };
}

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const tap = async (p, [x, y]) => { await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.up(); };

/** Свежий зал нужного размера, перелёт на остров SPAR, снимок. */
async function shoot(name, viewport, hit) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/play/pve`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(15_000);
  await p.screenshot({ path: `${OUT}/${name}-00-hall.png` });
  await tap(p, hit);
  await p.waitForTimeout(SETTLE);
  await p.screenshot({ path: `${OUT}/${name}-01-island.png` });   // для глаз — со слоем
  await p.addStyleTag({ content: '.hs-strip, .pve-back { display: none !important; }' });
  await p.waitForTimeout(200);
  const file = `${OUT}/${name}-02-clean.png`;
  await p.screenshot({ path: file });                              // для замера — без слоя
  await ctx.close();
  return { file, errors };
}

for (const [name, viewport, hit] of [
  ['portrait', { width: 390, height: 844 }, HIT_PORTRAIT],
  ['landscape', { width: 844, height: 390 }, HIT_LAND],
]) {
  console.log(`\n── остров SPAR, ${viewport.width}×${viewport.height} ──`);
  const { file, errors } = await shoot(name, viewport, hit);
  ok(errors.length === 0, 'ни одной ошибки на странице', errors[0] || '');
  const m = measure(file);
  if (!m) { ok(false, 'остров нашёлся в кадре', 'освещённого не видно вовсе'); continue; }
  console.log(`  · пустота до плиты: слева ${(100 * m.gapLeft).toFixed(1)}%`
    + `, сверху ${(100 * m.gapTop).toFixed(1)}%`
    + `, снизу ${(100 * m.gapBottom).toFixed(1)}% кадра`);
  console.log(`  · остров: занимает ${(100 * m.litShare).toFixed(1)}% левой половины кадра,`
    + ` средняя яркость ${m.litMean.toFixed(1)} из 255`);
  ok(!m.touchesLeft, 'левым краем плита в кадр не упирается');
  ok(!m.touchesTop, 'верхним краем плита в кадр не упирается');
  ok(!m.touchesBottom, 'нижним краем плита в кадр не упирается (левая половина кадра)');
}

console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверки пройдены');
await browser.close();
process.exit(failed ? 1 : 0);
