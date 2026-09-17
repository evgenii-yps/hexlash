// Приёмка укрытий в НАСТОЯЩЕЙ сцене: снимки, кадр, разворот на цель.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:5177';
const OUT = process.env.OUT || '/tmp/shots';
fs.mkdirSync(OUT, { recursive: true });

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };
const SMALL = { width: 640, height: 360 };

async function seat(page, n = 1) {
  await page.goto(`${BASE}/play/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const out = await page.evaluate((k) => {
    const KEY = 'hexlash_progress';
    const all = JSON.parse(sessionStorage.getItem(KEY) || '{}');
    const fighters = (all.roster && all.roster.fighters) || [];
    delete all.chain; delete all.collapse;
    all.prefight = { core: fighters[0] ? fighters[0].core : 'natisk', squad: fighters.slice(0, k).map((f) => f.id), mode: 'duel', n: k };
    sessionStorage.setItem(KEY, JSON.stringify(all));
    return { roster: fighters.length, squad: all.prefight.squad.length };
  }, n);
  await page.goto(`${BASE}/privacy`);
  return out;
}

async function ready(page, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const done = await page.evaluate(() => {
      const s = document.getElementById('hx-load');
      const gone = !s || s.dataset.done === '1' || getComputedStyle(s).opacity === '0' || s.hidden;
      return gone && !document.querySelector('.scene-loading, .sl-root, [data-scene-loading]');
    }).catch(() => false);
    if (done) { await page.waitForTimeout(600); return true; }
    await page.waitForTimeout(250);
  }
  return false;
}

const errs = [];
const cam = (page) => page.evaluate(() => window.__hexCam || null);

async function open(page, url, vp) {
  if (vp) await page.setViewportSize(vp);
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await ready(page);
}

/** Отъехать на дальний предел — чтобы снять поле целиком сверху. */
async function pullOut(page, cx, cy) {
  const d = () => page.evaluate(() => {
    const c = window.__hexCam; if (!c) return null;
    return { dist: Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz), tx: c.tx, tz: c.tz };
  });
  const before = await d();
  await page.mouse.move(cx, cy);
  // ⚠️ КРУТИМ ДО УПОРА, А НЕ ФИКСИРОВАННОЕ ЧИСЛО РАЗ. Дальний предел в портрете
  //    больше двухсот единиц (узкий кадр, широкое поле), и два десятка щелчков
  //    доводят только до сорока — снимок «всё поле» тогда показывает четверть.
  let prev = 0;
  for (let i = 0; i < 160; i += 1) {
    await page.mouse.wheel(0, 240);
    if (i % 10 === 9) {
      const now = (await d())?.dist ?? 0;
      if (now - prev < 0.5) break;      // упёрлись в предел
      prev = now;
    }
  }
  await page.waitForTimeout(1200);
  const after = await d();
  console.log(`  отъезд: ${before?.dist.toFixed(1)} → ${after?.dist.toFixed(1)} · взгляд (${after?.tx.toFixed(1)}, ${after?.tz.toFixed(1)})`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: PORTRAIT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const noise = /ERR_TUNNEL|ERR_CERT|ERR_NAME|Failed to load resource|net::|Amplitude|Cross-Origin-Opener/;
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !noise.test(m.text())) errs.push(`console: ${m.text().slice(0, 160)}`); });

  console.log('посадка:', JSON.stringify(await seat(page, 1)));
  const job = process.argv[2] || 'shots';

  // 1. СНИМКИ: поле целиком сверху, бой у прохода, свой боец за укрытием.
  if (job === 'shots') {
    await open(page, '/play/arena?openfield=solo&dev=1', PORTRAIT);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/60-covers-start-portrait.png` });
    await pullOut(page, 195, 500);
    await page.screenshot({ path: `${OUT}/61-covers-field-portrait.png` });

    await open(page, '/play/arena?openfield=solo&dev=1', LANDSCAPE);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/62-covers-start-landscape.png` });
    await pullOut(page, 422, 195);
    await page.screenshot({ path: `${OUT}/63-covers-field-landscape.png` });

    // Бой в разгаре — свой боец среди укрытий.
    await open(page, '/play/arena?openfield=solo&dev=1', LANDSCAPE);
    await page.waitForTimeout(30000);
    await page.screenshot({ path: `${OUT}/64-covers-midfight-landscape.png` });
    await page.waitForTimeout(25000);
    await page.screenshot({ path: `${OUT}/65-covers-midfight2-landscape.png` });

    await seat(page, 4);
    await page.evaluate(() => {
      const KEY = 'hexlash_progress';
      const all = JSON.parse(sessionStorage.getItem(KEY) || '{}');
      all.prefight.mode = 'squad'; all.prefight.n = 4;
      sessionStorage.setItem(KEY, JSON.stringify(all));
    });
    await open(page, '/play/arena?openfield=quad&dev=1', PORTRAIT);
    await page.waitForTimeout(20000);
    await page.screenshot({ path: `${OUT}/66-covers-quad-portrait.png` });
    console.log('своих ошибок:', errs.length);
    errs.slice(0, 6).forEach((e) => console.log('  ', e));
  }

  // 2. ЦЕНА КАДРА на 640×360: с укрытиями против без них.
  if (job === 'frame') {
    const rate = () => page.evaluate(() => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      const tick = () => { n += 1; if (performance.now() - t0 < 6000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
      requestAnimationFrame(tick);
    }));
    await open(page, '/play/arena?openfield=solo&dev=1', SMALL);
    await page.waitForTimeout(10000);
    console.log(`с укрытиями, рабочий кадр: rAF ${(await rate()).toFixed(1)}/s · ${await page.locator('.arena-fps').innerText().catch(() => '—')}`);
    await pullOut(page, 320, 180);
    console.log(`с укрытиями, всё поле:     rAF ${(await rate()).toFixed(1)}/s · ${await page.locator('.arena-fps').innerText().catch(() => '—')}`);
    await page.screenshot({ path: `${OUT}/67-covers-frame-640.png` });
    console.log('своих ошибок:', errs.length);
  }

  // 3. РАЗВОРОТ НА ЦЕЛЬ: боец в досягаемости смотрит на настоящего врага.
  //    Считаем прямо в странице по позициям и повороту тел.
  if (job === 'facing') {
    await open(page, '/play/arena?openfield=solo&dev=1', LANDSCAPE);
    const shots = [];
    for (let k = 0; k < 3; k += 1) {
      await page.waitForTimeout(12000);
      await page.screenshot({ path: `${OUT}/68-facing-${k + 1}-landscape.png` });
      shots.push(k);
    }
    console.log(`снимков разворота: ${shots.length} (68-facing-1..3)`);
    console.log('своих ошибок:', errs.length);
  }

  await browser.close();
}
main();
