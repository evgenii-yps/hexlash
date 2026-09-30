// Одна сессия рендера: браузер → мир → готовность сцены → покадровый прогон плана.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildSave } from './world.mjs';
import { routeFonts } from './fonts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = (f) => readFileSync(path.join(HERE, '../page', f), 'utf8');

// Семена. Якорь «сцена начала строиться» и якорь «плана» — разные: первый делает
// одинаковой сборку сцены (пыль, разброс), второй — всё, что происходит в самом плане.
export const SEED_BUILD = 4242;
export const SEED_PLAN = 7001;

const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];

const md5 = (b) => createHash('md5').update(b).digest('hex');

export async function openSession({ base, plan, size = [1280, 720], log = console.log }) {
  const browser = await chromium.launch({ args: ARGS });
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  // наружу — ничего (аналитика, кошельки, модель легенды). Шрифты подменены отдельно.
  await routeFonts(ctx);
  await ctx.route((u) => !/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !/fonts\.(googleapis|gstatic)\.com/.test(u.hostname), (r) => r.abort());

  // Порядок важен: сначала окружение, затем часы, затем мир.
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  });
  await ctx.addInitScript({ content: PAGE('clock.js') });
  await ctx.addInitScript(`window.__vt.setAnchorSeed(${SEED_BUILD});`);
  await ctx.addInitScript(`(${(save) => { if (!sessionStorage.getItem('hexlash_progress')) sessionStorage.setItem('hexlash_progress', JSON.stringify(save)); }})(${JSON.stringify(buildSave(plan.world))});`);

  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('  [pageerror]', e.message.slice(0, 200)));
  await page.goto(base + plan.route, { waitUntil: 'domcontentloaded' });

  const hideCss = (plan.hide || []).map((s) => `${s}{display:none !important}`).join('\n');
  if (hideCss) await page.addStyleTag({ content: hideCss });

  const pump = (n = 1) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) { window.__vt.step(1); await window.__vt.settle(); } }, n);
  const frame = () => page.evaluate(() => window.__vt.frame);

  // ── ждём, пока игра готова по-настоящему ──
  // Экран загрузки ушёл, занавеса нет, сцена отдала состояние. Время при этом
  // качаем мелкими порциями, чтобы настоящие асинхронные загрузки успевали.
  const readyJs = () => !document.getElementById('hx-load') && !document.querySelector('.hx-loading')
    && !document.querySelector('.hx-curtain.is-up') && window.__hexBootstrapped === true && window.__vt.anchored();
  let waited = 0;
  for (;;) {
    await pump(3); waited += 3;
    const ok = await page.evaluate(readyJs);
    if (ok && waited > 30) break;
    if (waited > 3600) throw new Error('сцена не стала готова за 60 виртуальных секунд');
    if (waited % 30 === 0) await page.evaluate(() => window.__vt.realDelay(40));
  }
  await page.evaluate(() => document.fonts.ready);
  // Выравнивание: состояние сцены зависит от числа кадров, прошедших с её
  // постройки, а не от того, на каком кадре страницы мы заметили «готово». Поэтому
  // план стартует ровно через `align` кадров после якоря (построения сцены).
  const align = plan.align ?? 420;
  const since = await page.evaluate(() => window.__vt.frame - window.__vt.anchorFrame());
  if (since > align) throw new Error(`сцена готова слишком поздно: ${since} кадров после постройки, align=${align}`);
  log(`  готовность на ${since}-м кадре после постройки сцены, план стартует на ${align}-м`);
  await pump(align - since);

  // ── режиссёр (у контрольных снимков игры камеры нет — игра видна как есть) ──
  if (plan.camera) {
    await page.addScriptTag({ content: PAGE('director.js') });
    const inst = await page.evaluate((cfg) => window.__director.install(cfg), plan.camera);
    if (!inst.ok) throw new Error(inst.err);
    log('  камера сцены:', JSON.stringify(inst.info));
  }

  // якорь плана: с этой точки и случайность, и время плана считаются заново
  await page.evaluate((s) => window.__vt.seed(s), SEED_PLAN);
  const f0 = await frame();
  if (plan.camera) await page.evaluate((f) => window.__director.start(f), f0);

  return {
    page, f0, pump, frame,
    /** Прогоняет кадры плана [from, to) и сохраняет снимки. */
    async run({ outDir, from = 0, to = plan.len, every = 1, onFrame }) {
      rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
      const hashes = {}; let seq = 0;
      for (let f = 0; f < to; f++) {
        // кадр f плана — состояние ПОСЛЕ f+1 шагов (кадр 0 = первый шаг после якоря)
        await pump(1);
        if (f >= from && (f - from) % every === 0) {
          const buf = await page.screenshot({ type: 'png' });
          writeFileSync(path.join(outDir, String(seq++).padStart(5, '0') + '.png'), buf);
          hashes[f] = md5(buf);
          if (onFrame) onFrame(f, to);
        }
      }
      writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ plan: plan.id, from, to, every, size, hashes }, null, 1));
      return hashes;
    },
    /** Снимок «как стоит», без шага времени. Снимаем, пока два подряд не совпадут:
     *  показ кадра GPU и съёмка страницы идут независимыми путями, и единичный снимок
     *  иногда ловит предыдущий кадр. */
    async snapshot() {
      let prev = await page.screenshot({ type: 'png' });
      for (let i = 0; i < 6; i++) {
        await page.evaluate(() => window.__vt.settle());
        const cur = await page.screenshot({ type: 'png' });
        if (md5(cur) === md5(prev)) return cur;
        prev = cur;
      }
      return prev;
    },
    async close() { await browser.close(); },
  };
}

/**
 * Прогрев dev-сервера. Первый заход на маршрут после холодного старта vite идёт
 * медленно (преобразование модулей), и это реальное время перемешивается с
 * виртуальными кадрами: снимок первой сессии на свежем сервере иногда отличался.
 * Поэтому каждый маршрут сначала открывается «вхолостую» и результат выбрасывается.
 */
export async function warm(base, routes, size = [1280, 720]) {
  for (const route of [...new Set(routes)]) {
    const s = await openSession({ base, plan: { route, align: 80, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }] } }, size, log: () => {} });
    await s.pump(5);
    await s.close();
  }
}
