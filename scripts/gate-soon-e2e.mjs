// gate-soon-e2e.mjs — ВОРОТА АРЕНЫ: четыре режима закрыты заглушкой SOON (ТЗ 30.09.2026).
//
// ЧТО ДОКАЗЫВАЕТСЯ (на телефоне 390×844 и на десктопе 1280×720):
//   1. на первом шаге шесть островов; закрыты ровно CHAIN, RAID, COLLAPSE, HUNT (openfield);
//   2. нажатия по плите, по слову над плитой и по подписи каждого закрытого острова:
//      адрес не меняется, камера не сдвигается, остров не дрожит, шаг 2 не открывается;
//   3. запись игрока (localStorage / IndexedDB) до и после — побайтно одинакова;
//   4. DUEL и SQUAD по нажатию ведут на шаг выбора бойцов; у SQUAD есть переключатель размера;
//   5. страница не выдала ни одной ошибки.
//
//   CHROME=<путь к chrome> [BASE=http://localhost:4173] [OUT=/tmp/gate-soon-shots] node scripts/gate-soon-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/gate-soon-shots';
mkdirSync(OUT, { recursive: true });
const CLOSED = ['chain', 'raid', 'collapse', 'openfield'];
const LIVE = ['duel', 'squad'];

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

// Запись игрока целиком; очередь аналитики (AMP_*) растёт от одного присутствия и не в счёт.
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
const open = async (ctx) => {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && /component error|TypeError|ReferenceError/.test(m.text())) errors.push(m.text()); });
  await p.goto(`${BASE}/play/gate?dev=1`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(16_000);
  return p;
};
const tap = async (p, x, y) => { await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.up(); };
const probe = (p) => p.evaluate(() => window.__gateProbe());
const camOf = (pr) => JSON.stringify(pr.cam);

for (const [name, viewport] of VIEWPORTS) {
  console.log(`\n── ${name} ${viewport.width}×${viewport.height} ──`);
  const ctx = await browser.newContext({ viewport });
  const p = await open(ctx);
  await p.screenshot({ path: `${OUT}/${name}-gate.png` });
  const pr = await probe(p);
  const ids = pr.items.map((i) => i.id);
  ok(ids.length === 6, 'на первом шаге шесть островов', ids.join(', '));
  ok(LIVE.every((i) => ids.includes(i)) && CLOSED.every((i) => ids.includes(i)), 'состав: DUEL, SQUAD + четыре закрытых');

  // Подписи закрытых погашены #5D5D66, у живых — обычные; DOM-метки SOON под подписью нет.
  const caps = await p.evaluate(() => [...document.querySelectorAll('.gate-cap')].map((c) => ({
    closed: c.classList.contains('is-closed'),
    name: getComputedStyle(c.querySelector('.gc-name')).color,
    desc: getComputedStyle(c.querySelector('.gc-desc')).color,
    descOpacity: getComputedStyle(c.querySelector('.gc-desc')).opacity,
    shadow: getComputedStyle(c.querySelector('.gc-name')).textShadow,
    soonLabel: !!c.querySelector('.gc-soon'),
  })));
  const closedCaps = caps.filter((c) => c.closed);
  ok(closedCaps.length === 4, 'закрытых подписей четыре', String(closedCaps.length));
  ok(closedCaps.every((c) => c.name === 'rgb(93, 93, 102)' && c.desc === 'rgb(93, 93, 102)' && c.descOpacity === '1'),
    'имя и пояснение закрытых — #5D5D66, без дополнительного приглушения', JSON.stringify(closedCaps[0]));
  ok(closedCaps.every((c) => c.shadow === 'none'), 'у подписей закрытых нет свечения');
  ok(closedCaps.every((c) => !c.soonLabel), 'плоской метки SOON под подписью нет (слово — в сцене)');
  ok(caps.filter((c) => !c.closed).every((c) => c.name !== 'rgb(93, 93, 102)'), 'подписи живых не погашены');

  // Нажатия по закрытым: плита, слово над плитой (верх области нажатия), подпись.
  const before = await store(p);
  const camBefore = camOf(await probe(p));
  const urlBefore = p.url();
  let taps = 0, moved = 0;
  for (const id of CLOSED) {
    const it = (await probe(p)).items.find((i) => i.id === id);
    const pts = [
      [(it.left + it.right) / 2, (it.top + it.bottom) / 2],                 // центр плиты
      [(it.left + it.right) / 2, it.bottom - 4],                            // ближний край
      [(it.hit.left + it.hit.right) / 2, it.hit.top + 3],                   // верх области — над словом
      [it.capX, it.capY + 14],                                              // подпись
    ];
    for (const [x, y] of pts) {
      for (let k = 0; k < 6; k++) { await tap(p, x, y); taps++; }
      const now = await probe(p);
      const sh = now.items.find((i) => i.id === id);
      if (p.url() !== urlBefore || camOf(now) !== camBefore || Math.abs(sh.left - it.left) > 0.6 || Math.abs(sh.top - it.top) > 0.6) moved++;
    }
    const shaking = await p.evaluate(() => !!document.querySelector('.gate-cap.is-refused'));
    ok(!shaking, `${id}: нажатия не вызвали отказа-дрожи`);
  }
  await p.waitForTimeout(800);
  ok(moved === 0, `${taps} нажатий по закрытым островам: адрес, камера и плиты на месте`);
  ok(p.url() === urlBefore, 'адрес не изменился', p.url().replace(BASE, ''));
  ok((await p.evaluate(() => !!document.querySelector('.gate-size, .gate-empty'))) === false, 'шаг 2 не открылся');
  ok(camBefore === camOf(await probe(p)), 'камера не сдвинулась');
  ok(before === (await store(p)), 'запись игрока до и после побайтно одинакова', `${before.length} байт`);
  await p.screenshot({ path: `${OUT}/${name}-gate-after-taps.png` });
  await ctx.close();

  // Живые: нажатие ведёт дальше.
  for (const id of LIVE) {
    const c2 = await browser.newContext({ viewport });
    const q = await open(c2);
    const it = (await probe(q)).items.find((i) => i.id === id);
    await tap(q, (it.left + it.right) / 2, (it.top + it.bottom) / 2);
    await q.waitForTimeout(9000);
    const hasSize = await q.evaluate(() => !!document.querySelector('.gate-size'));
    const labels = await q.evaluate(() => [...document.querySelectorAll('.gs-btn')].map((b) => b.textContent.trim() + (b.classList.contains('is-on') ? '*' : '')));
    const after = await probe(q);
    ok(after.items.length !== 6 || after.items.map((i) => i.id).join() !== ids.join(),
      `${id}: нажатие открыло шаг выбора бойцов`, `${after.items.length} островов`);
    if (id === 'squad') ok(hasSize && labels.length === 2, 'SQUAD: переключатель размера на месте', labels.join(' | '));
    if (id === 'duel') ok(!hasSize, 'DUEL: переключателя нет, как и было');
    await q.screenshot({ path: `${OUT}/${name}-step2-${id}.png` });
    await c2.close();
  }
}

ok(errors.length === 0, 'ни одной ошибки на странице', errors[0] || '');
console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверки пройдены');
await browser.close();
process.exit(failed ? 1 : 0);
