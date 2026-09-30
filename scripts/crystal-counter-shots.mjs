// crystal-counter-shots.mjs — СНИМКИ ДЛЯ ПРИЁМКИ СЧЁТЧИКА КРИСТАЛЛОВ (ТЗ 30.09.2026).
//
// Ведёт живой браузер по экрану «зал FORGE → ростер → ядро → грань → кристалл» и
// снимает нужные состояния. Запускается ДО правки (префикс `before`) и ПОСЛЕ
// (`after`) — пары «до / после» получаются одним и тем же проходом.
//
//   BASE=http://127.0.0.1:4173 PREFIX=after OUT=docs/crystal-counter/shots \
//     node scripts/crystal-counter-shots.mjs
//
// Playwright берётся из глобальной установки (ESM не читает NODE_PATH), браузер —
// готовый. Без видеокарты сцена собирается программным отрисовщиком (swiftshader).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = createRequire(process.env.PW_ROOT || '/opt/node22/lib/node_modules/')('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const PREFIX = process.env.PREFIX || 'after';
const OUT = process.env.OUT || 'docs/crystal-counter/shots';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

// Кристаллы: грань a/b/c, шаг 1..5 (числа, не строки — так хранит ростер).
const LIT = {
  0: {},
  2: { a: [1, 2] },
  3: { a: [1, 2, 3] },
  7: { a: [1, 2, 3], b: [1, 2], c: [1, 2] },
};

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const log = [];
const note = (s) => { log.push(s); console.log(s); };

/** Один проход: размер окна, боец по номеру, сколько зажжено, какой кристалл открыть. */
async function session({ w, h, fighter, lit, facet = 'a', crystal = 3 }, steps) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => note(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/play`, { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => ((JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}').roster || {}).fighters || []).length);
    if (n) break;
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(2500);
  const core = await page.evaluate(({ fighter, lit }) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const f = raw.roster.fighters[fighter];
    f.lit = lit;
    raw.roster.picked = f.id;
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
    return f.core;
  }, { fighter, lit: LIT[lit] });
  await page.goto(`${BASE}/play/pve`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('.pve-root', { timeout: 90000 });
  await page.waitForTimeout(20000);
  // Наковальню открываем тем же путём, что нажатие по ней (PveView.onPress('upgrade')):
  // пиксель на экране зависит от камеры и размера окна, а вызов — нет. Только dev-сборка.
  await page.evaluate(() => {
    const vm = document.querySelector('.pve-root').__vueParentComponent;
    vm.setupState.onPress('upgrade');
  });
  await page.waitForSelector('.fc-stage.is-preview', { timeout: 20000 });
  await page.waitForTimeout(800);
  // Карточка ядра в панели → разворот на весь экран.
  await page.locator('.fc-stage.is-preview .fc-pad').first().click({ force: true });
  await page.waitForSelector('.fco .fc', { timeout: 20000 });
  await page.waitForTimeout(800);
  // Грань и кристалл — клавишей: ведение пальцем по фигуре в скрипте не нужно.
  const fKeys = page.locator('.fco .fc-facet__key');
  await fKeys.nth('abc'.indexOf(facet)).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await page.locator('.fco .fc-cryst__key').nth(crystal).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await steps(page, core);
  await ctx.close();
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${PREFIX}-${name}.png` });

// Все состояния — на одном бойце (номер 0), плюс другое ядро — на бойце 1.
for (const [tag, w, h] of [['m', 390, 844], ['d', 1280, 800]]) {
  // 1 · ноль зажжённых (открыт свободный кристалл — видна кнопка LIGHT IT)
  await session({ w, h, fighter: 0, lit: 0, crystal: 3 }, async (p, core) => { await shot(p, `${tag}-1-lit0`); note(`${tag} lit0 core=${core}`); });
  // 2 · три зажжённых
  await session({ w, h, fighter: 0, lit: 3, crystal: 3 }, async (p) => { await shot(p, `${tag}-2-lit3`); });
  // 3 · семь: открыт свободный кристалл → LIGHT IT неактивна. 4 · гасим один (a1) → строка ушла.
  await session({ w, h, fighter: 0, lit: 7, facet: 'a', crystal: 3 }, async (p) => {
    await shot(p, `${tag}-3-lit7`);
    const dis = await p.locator('.fco .fc-light').evaluate((b) => ({ disabled: b.disabled, text: b.textContent.trim() }), undefined, { timeout: 1500 }).catch(() => null);
    note(`${tag} lit7 light-button: ${JSON.stringify(dis)}`);
    note(`${tag} lit7 noroom-line: ${JSON.stringify(await p.locator('.fco .fc-noroom').allTextContents())}`);
    // гасим зажжённый кристалл той же грани: вернуться на грань, выбрать a1, PUT OUT
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await p.locator('.fco .fc-cryst__key').nth(0).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
    await p.locator('.fco .fc-out').click(); await p.waitForTimeout(700);
    await shot(p, `${tag}-4-after-quench`);
    note(`${tag} after-quench noroom: ${JSON.stringify(await p.locator('.fco .fc-noroom').allTextContents())}`);
  });
  // 5 · другое ядро: боец 1 и боец 2 (у ростера три разных ядра)
  for (const fi of [1, 2]) {
    await session({ w, h, fighter: fi, lit: 3, crystal: 3 }, async (p, core) => { await shot(p, `${tag}-5-core-${core}`); note(`${tag} fighter ${fi} core=${core}`); });
  }
}

// 6 · кадры вспышки: телефон, два зажжённых, жмём LIGHT IT и снимаем подряд.
for (const fi of [0, 1]) {
  await session({ w: 390, h: 844, fighter: fi, lit: 2, crystal: 3 }, async (p, core) => {
    await p.locator('.fco .fc-light').click();
    for (let k = 0; k < 4; k++) { await shot(p, `m-6-flash-${core}-${k}`); await p.waitForTimeout(60); }
  });
}
writeFileSync(`${OUT}/${PREFIX}-log.txt`, log.join('\n') + '\n');
await browser.close();
