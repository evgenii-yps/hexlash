// spar-closed-e2e.mjs — ОСТРОВ SPAR ЗАКРЫТ (ТЗ 30.09.2026): нажатие по плите ничего не делает,
// над плитой парит объёмное слово SOON.
//
// ЧТО ДОКАЗЫВАЕТСЯ:
//   1. зал → нажал SPAR → перелёт на остров (так и должно остаться);
//   2. остров с четырёх сторон оборота камеры: снимки для глаз (слово читается везде);
//   3. плита острова и слово — глухая зона: предмета входа нет, перебор реальных нажатий по ним
//      не даёт ни перехода, ни перелёта камеры;
//   4. запись игрока (localStorage) до и после перебора — побайтно одинакова;
//   5. маршрут /play/spar по прямому адресу по-прежнему открывается;
//   6. страница не выдала ни одной ошибки.
//
//   CHROME=<путь к chrome> [TAPS=2500] node scripts/spar-closed-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/spar-closed-shots';
const TAPS = Number(process.env.TAPS || 2500);
const SETTLE = Number(process.env.SETTLE || 2500);
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];
const VIEWPORTS = [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 720 }]];

const drag = async (p, dx) => {
  const y = p.viewportSize().height * 0.35;
  const x0 = p.viewportSize().width / 2;
  await p.mouse.move(x0, y); await p.mouse.down();
  await p.mouse.move(x0 + dx / 2, y, { steps: 6 });
  await p.mouse.move(x0 + dx, y, { steps: 6 });
  await p.mouse.up();
};
// ЗАПИСЬ ИГРОКА: всё, что игра хранит в браузере, — localStorage и IndexedDB целиком.
// Очередь событий аналитики (AMP_*) не запись игрока: она растёт от одного лишь
// присутствия на странице, поэтому в сравнение не входит.
const store = (p) => p.evaluate(async () => {
  const ls = Object.keys(localStorage).filter((k) => !k.startsWith('AMP_')).sort().map((k) => [k, localStorage.getItem(k)]);
  const idb = [];
  for (const { name } of (indexedDB.databases ? await indexedDB.databases() : [])) {
    if (!name || name.startsWith('AMP_')) continue;
    const db = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const stores = [];
    for (const sn of [...db.objectStoreNames]) {
      const rows = await new Promise((res, rej) => { const r = db.transaction(sn).objectStore(sn).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      stores.push([sn, rows]);
    }
    db.close();
    idb.push([name, stores]);
  }
  return JSON.stringify({ ls, idb });
});
// Камера успокоилась: две пробы через 0.8 с одинаковы (после оборота она сама
// возвращается в исходную позу — это не нажатие, и мерить до этого нельзя).
const settleCam = async (p) => {
  let prev = '';
  for (let i = 0; i < 40; i++) {
    const c = await p.evaluate(() => JSON.stringify(window.__forgeProbe().cam));
    if (c === prev) return c;
    prev = c; await p.waitForTimeout(800);
  }
  return prev;
};

for (const [name, viewport] of VIEWPORTS) {
  console.log(`\n── ${name} ${viewport.width}×${viewport.height} ──`);
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/play/pve?dev=1`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(16_000);
  await p.screenshot({ path: `${OUT}/${name}-00-hall.png` });

  const spar = await p.evaluate(() => { const t = window.__forgeProbe().taps.spar; return t && [t.sx * innerWidth, t.sy * innerHeight]; });
  ok(!!spar, 'предмет SPAR в зале найден');
  await p.mouse.move(spar[0], spar[1]); await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(SETTLE);
  ok(p.url().includes('/play/pve'), 'нажатие предмета SPAR оставило в зале (перелёт на остров)');
  await p.screenshot({ path: `${OUT}/${name}-01-island.png` });

  // Четыре стороны оборота камеры.
  const quarter = p.viewportSize().height / 4;
  for (let i = 1; i <= 3; i++) {
    await drag(p, quarter);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/${name}-02-orbit-${i}.png` });
  }
  await drag(p, quarter);            // полный оборот — обратно на исходную сторону
  await settleCam(p);

  // Нажатия. Сначала — что зал слышит в каждой точке кадра, потом реальные нажатия
  // ТОЛЬКО по глухой зоне (плита острова и слово над ней).
  const before = await store(p);
  const camBefore = await settleCam(p);
  const W = viewport.width, H = viewport.height;
  const N = 50;
  let door = 0, others = 0;
  const dead = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const sx = (i + 0.5) / N, sy = (j + 0.5) / N;
    const r = await p.evaluate(([x, y]) => window.__pickAt(x, y), [sx, sy]);
    if (r === 'предмет:sparGo') door++;
    else if (r === 'глухо') dead.push([sx * W, sy * H]);
    else if (r !== 'пусто') others++;
  }
  ok(door === 0, `предмета входа нет ни в одной из ${N * N} точек кадра`);
  ok(dead.length > 0, 'плита и слово в кадре — глухая зона', `точек: ${dead.length} из ${N * N}; чужих предметов/бойцов: ${others}`);

  let moved = 0;
  const n = TAPS;
  for (let k = 0; k < n; k++) {
    const [x, y] = dead[Math.floor(Math.random() * dead.length)];
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.up();
    if (k % 100 === 99 && !p.url().includes('/play/pve')) { moved++; break; }
  }
  await p.waitForTimeout(1500);
  if (!p.url().includes('/play/pve')) moved++;
  ok(moved === 0, `переходов: 0 из ${n} нажатий по плите и слову`, p.url());
  const camAfter = await p.evaluate(() => JSON.stringify(window.__forgeProbe().cam));
  ok(camBefore === camAfter, 'камера не сдвинулась ни на волос (перелёта нет)');
  await p.screenshot({ path: `${OUT}/${name}-03-after-taps.png` });

  const after = await store(p);
  ok(before === after, 'запись игрока до и после перебора побайтно одинакова', `${before.length} байт`);

  // Возврат в зал и перелёт на остров груш — слово не должно висеть в кадре.
  await p.evaluate(() => document.querySelector('.pve-back')?.click());
  await p.waitForTimeout(SETTLE);
  await p.screenshot({ path: `${OUT}/${name}-04-back-in-hall.png` });
  await ctx.close();
}

console.log('\n── прямой адрес /play/spar ──');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(12_000);
  ok(p.url().includes('/play/spar'), 'экран SPAR открывается по прямому адресу', p.url());
  await p.screenshot({ path: `${OUT}/direct-spar.png` });
  await ctx.close();
}

ok(errors.length === 0, 'ни одной ошибки на странице', errors[0] || '');
console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверки пройдены');
await browser.close();
process.exit(failed ? 1 : 0);
