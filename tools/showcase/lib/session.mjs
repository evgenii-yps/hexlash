// Одна сессия рендера: браузер → мир → готовность сцены → покадровый прогон плана.
//
// Виды планов (plan.kind):
//   'scene' — обычная сцена (дом, ворота, зал): старт через `align` кадров после
//             постройки сцены;
//   'arena' — бой на арене: старт плана — момент вызова runFight (+ plan.offset);
//   'logo'  — финальная карточка (своя страница обвязки);
//   'title' — титр в чёрном кадре перехода (своя страница обвязки, lib/title.mjs).
// Кадры плана считаются от «нуля боя» t0: кадр b = frame - t0. Плановый кадр
// f = b - offset (offset > 0 у боёв: снимаем окно из середины боя, но считается он с начала).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildSave } from './world.mjs';
import { routeFonts } from './fonts.mjs';
import { createNetLog, blockNetwork, summarizeNet } from './net.mjs';
import { LOGO_PATH, logoHtml } from './logo.mjs';
import { titleHtml } from './title.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = (f) => readFileSync(path.join(HERE, '../page', f), 'utf8');

// Семена. SEED_BUILD — «сцена начала строиться» (пыль, разброс, СОСТАВ ВРАГОВ и ядро
// противника на арене); SEED_PLAN — всё, что происходит в самом плане; fightSeed —
// момент старта боя. Бои подбираются по этим числам (plan/fights.lock.json).
export const SEED_BUILD = 4242;
export const SEED_PLAN = 7001;

const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];

const md5 = (b) => createHash('md5').update(b).digest('hex');

// Усреднение подкадров размытия движения — в ЛИНЕЙНОМ свете (как складывает свет настоящий затвор), результат — снова sRGB.
const TO_LIN = new Float32Array(256).map((_, i) => { const v = i / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
function fromLin(x) { const v = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; return Math.min(255, Math.max(0, Math.round(v * 255))); }
export function averagePngs(bufs) {
  const { PNG } = require('playwright-core/lib/utilsBundle');
  const ims = bufs.map((b) => PNG.sync.read(b)); const { width, height } = ims[0];
  const out = new PNG({ width, height }); const n = ims.length;
  for (let i = 0; i < out.data.length; i += 4) {
    for (let c = 0; c < 3; c++) { let a = 0; for (const im of ims) a += TO_LIN[im.data[i + c]]; out.data[i + c] = fromLin(a / n); }
    out.data[i + 3] = 255;
  }
  // RGB без альфы, как у обычных снимков окна: смена формата кадров посреди последовательности пересобирает граф фильтров ffmpeg, и фильтры с памятью (tmix) теряют кадры
  return PNG.sync.write(out, { colorType: 2, inputColorType: 6, inputHasAlpha: true });
}
// Смещения подкадров (в кадрах симуляции) для затвора шириной span: центры четырёх равных долей, симметрично вокруг кадра
export const BLUR_SUBFRAMES = 4;
export const blurOffsets = (span) => Array.from({ length: BLUR_SUBFRAMES }, (_, k) => ((k + 0.5) / BLUR_SUBFRAMES - 0.5) * span);

export async function openSession({ base, plan, size = [1280, 720], log = console.log }) {
  const net = createNetLog();
  const browser = await chromium.launch({ args: ARGS });
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await routeFonts(ctx, net);
  await blockNetwork(ctx, net);
  const isLogo = plan.kind === 'logo' || plan.kind === 'title';   // страницы обвязки: карточка логотипа и титры переходов
  if (isLogo) await ctx.route(base + LOGO_PATH, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: plan.kind === 'title' ? titleHtml(plan) : logoHtml(plan) }));

  // Порядок важен: сначала окружение, затем часы, затем мир.
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  });
  await ctx.addInitScript({ content: PAGE('clock.js') });
  await ctx.addInitScript(`window.__vt.setAnchorSeed(${plan.seedBuild ?? SEED_BUILD});`);
  await ctx.addInitScript(`(${(save) => { if (!sessionStorage.getItem('hexlash_progress')) sessionStorage.setItem('hexlash_progress', JSON.stringify(save)); }})(${JSON.stringify(buildSave(plan.world))});`);

  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('  [pageerror]', e.message.slice(0, 200)));
  await page.goto(base + (isLogo ? LOGO_PATH : plan.route), { waitUntil: 'domcontentloaded' });

  const hideCss = (plan.hide || []).map((s) => `${s}{display:none !important}`).join('\n');
  if (hideCss) await page.addStyleTag({ content: hideCss });
  await page.addScriptTag({ content: PAGE('director.js') });
  await page.addScriptTag({ content: PAGE('helpers.js') });

  const frame = () => page.evaluate(() => window.__vt.frame);
  const stepOne = () => page.evaluate(async () => { window.__vt.step(1); await window.__vt.settle(); return window.__sample ? window.__sample() : null; });
  const pump = (n = 1) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) { window.__vt.step(1); await window.__vt.settle(); } }, n);

  let t0;
  if (isLogo) {
    await pump(2);
    t0 = (await frame()) - 2;
    // после pump(2) страница уже на кадре t0+2, а кадр плана f снимается после (f+1)-го шага, то есть на кадре t0+3+f: связка и титры отсчитывают свои кадры от t0+3
    await page.evaluate((t) => { window.__logoBase = t + 3; }, t0);
  } else {
    // ── ждём, пока игра готова по-настоящему ──
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

    if (plan.kind === 'arena') {
      // Перехватываем runFight: в этот момент засеваем случайность боя и запоминаем кадр.
      // Ставить надо ДО автозапуска (1,5 с после снятия экрана загрузки) — поэтому по кадру.
      const fightSeed = plan.fightSeed ?? SEED_PLAN;
      let hooked = false;
      for (let i = 0; i < 600 && !hooked; i++) {
        hooked = await page.evaluate((seed) => {
          const st = window.__findSceneState((s) => typeof s.runFight === 'function' && s.field);
          if (!st) return false;
          const orig = st.runFight;
          st.runFight = function (...a) { window.__vt.seed(seed); window.__fightStart = window.__vt.frame; return orig.apply(this, a); };
          window.__st = st;
          window.__sample = () => {
            const us = st.field.units();
            return {
              hp: us.map((u) => (u.dead ? 0 : +u.f.getHp().toFixed(2))),
              dead: us.map((u) => (u.dead ? 1 : 0)),
              x: us.map((u) => +u.f.group.position.x.toFixed(2)),
              z: us.map((u) => +u.f.group.position.z.toFixed(2)),
              core: us.map((u) => u.coreId || ''),
              side: us.map((u) => u.sideId || ''),
              line: ((document.querySelector('.cmd-line') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
              tog: ((document.querySelector('.cmd-toggle') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
            };
          };
          return true;
        }, fightSeed);
        if (!hooked) await pump(1);
      }
      if (!hooked) throw new Error('не нашёл runFight на арене');
      for (let i = 0; i < 900; i++) {
        if (await page.evaluate(() => window.__fightStart !== undefined)) break;
        await pump(1);
      }
      t0 = await page.evaluate(() => window.__fightStart);
      if (t0 === undefined) throw new Error('бой не начался');
    } else {
      // Выравнивание: состояние сцены зависит от числа кадров, прошедших с её
      // постройки, а не от того, на каком кадре страницы мы заметили «готово».
      const align = plan.align ?? 420;
      const since = await page.evaluate(() => window.__vt.frame - window.__vt.anchorFrame());
      if (since > align) throw new Error(`сцена готова слишком поздно: ${since} кадров после постройки, align=${align}`);
      log(`  готовность на ${since}-м кадре после постройки сцены, план стартует на ${align}-м`);
      await pump(align - since);
      t0 = await frame();
    }
  }

  // ── режиссёр (у контрольных снимков игры камеры нет — игра видна как есть) ──
  const offset = plan.offset || 0;
  if (plan.camera) {
    const inst = await page.evaluate((cfg) => window.__director.install(cfg), plan.camera);
    if (!inst.ok) throw new Error(inst.err);
    log('  камера сцены:', JSON.stringify(inst.info));
  }
  // общая точка отсчёта для бесконечных CSS-анимаций (см. page/clock.js: rebase) — до первого кадра плана
  if (!isLogo) await page.evaluate(() => window.__vt.rebase());
  // якорь плана: с этой точки случайность считается заново (кроме арены — там он в runFight)
  if (plan.kind !== 'arena') await page.evaluate((s) => window.__vt.seed(s), SEED_PLAN);

  // ── действия (мышь и т.п.) ──
  const actionsAt = new Map();
  for (const a of plan.actions || []) { if (!actionsAt.has(a.b)) actionsAt.set(a.b, []); actionsAt.get(a.b).push(a); }
  const centerOf = async (a) => {
    if (a.expr) return page.evaluate(a.expr);
    return page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, a.sel);
  };
  const marks = [];
  async function doAction(a, b) {
    if (a.type === 'move' || a.type === 'click') { const c = await centerOf(a); await page.mouse.move(c.x, c.y); }
    if (a.type === 'down' || a.type === 'click') await page.mouse.down();
    if (a.type === 'up' || a.type === 'click') await page.mouse.up();
    if (a.type === 'clickEl') await page.evaluate((sel) => document.querySelector(sel).click(), a.sel);
    if (a.type === 'eval') await page.evaluate(a.code);
    await page.evaluate(() => window.__vt.sync());
    marks.push({ b, f: b - offset, name: a.mark || a.type, kind: 'action' });
  }

  return {
    page, t0, pump, frame, marks, offset,
    net: () => summarizeNet(net),
    /** Прогоняет кадры боя [0, offset+len) и сохраняет снимки окна. capture:false — только расчёт (подбор зёрен). */
    async run({ outDir, every = 1, capture = true, frames, onFrame, stopWhen, ranges, blur = true, blurSpan }) {   // ranges: [[от, до), …] в кадрах плана — снимать только их (имя файла = номер кадра / every)
      if (capture) { rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true }); }
      const hashes = {}; const journal = []; let seq = 0; let fillCount = 0;
      const total = frames ?? (offset + plan.len);
      for (let b = 0; b < total; b++) {
        for (const a of actionsAt.get(b) || []) await doAction(a, b);
        if (b === offset && plan.camera) await page.evaluate((f) => window.__director.start(f), t0 + offset);
        const row = await stepOne();
        if (row) journal.push(row);
        if (stopWhen && row && stopWhen(row, b, journal)) break;
        const f = b - offset;
        if (capture && f >= 0 && f % every === 0 && (!ranges || ranges.some(([a, z]) => f >= a && f < z))) {
          // BAM, шаг 1: кадр стягивается к центру в чёрный (план задаёт fx:[{kind:'squeeze', f0, f1}])
          for (const fx of plan.fx || []) {
            if (fx.kind === 'squeeze' && f >= fx.f0 && f < fx.f1) {
              const u = (f - fx.f0 + 1) / (fx.f1 - fx.f0); const k = Math.max(0, 1 - Math.pow(u, 1.6));
              await page.evaluate((k2) => { const h = document.documentElement, e = document.body; h.style.background = '#000'; e.style.margin = '0'; e.style.height = '100vh'; e.style.width = '100vw'; e.style.clipPath = 'inset(0)'; e.style.transformOrigin = '50% 50%'; e.style.transform = `scale(${k2})`; h.style.overflow = 'hidden'; }, k);
            }
          }
          let buf;
          // игра пропустила кадр (сама рисует реже 60 кадр/с) — дорисовываем его нашей камерой, иначе кадр будет дублем предыдущего
          if (plan.camera) { const drew = await page.evaluate(() => window.__director.rendered()); if (!drew) { await page.evaluate(() => window.__director.sub(0)); await page.evaluate(() => window.__vt.settle()); fillCount++; } }
          // размытие движения: на быстрых участках плана (plan.blur — [[от, до), …]) кадр = среднее четырёх подкадров камеры, затвор 180° кадра ролика
          if (blur && plan.camera && (plan.blur || []).some(([a, z]) => f >= a && f < z)) {
            const shots = [];
            for (const off of blurOffsets(blurSpan ?? 0.5 * every)) {
              const ok = await page.evaluate((o) => window.__director.sub(o), off);
              if (!ok) break;
              await page.evaluate(() => window.__vt.settle());
              shots.push(await page.screenshot({ type: 'png' }));
            }
            buf = shots.length === BLUR_SUBFRAMES ? averagePngs(shots) : await page.screenshot({ type: 'png' });
          } else buf = await page.screenshot({ type: 'png' });
          writeFileSync(path.join(outDir, String(ranges ? f / every : seq++).padStart(5, '0') + '.png'), buf);
          hashes[f] = md5(buf);
          if (onFrame) onFrame(f, plan.len);
        }
      }
      if (capture) writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ plan: plan.id, offset, len: plan.len, every, size, hashes }, null, 1));
      return { hashes, journal, filled: fillCount };
    },
    /** Снимок «как стоит», без шага времени. Снимаем, пока два подряд не совпадут:
     *  показ кадра GPU и съёмка страницы идут независимыми путями. */
    async snapshot() {
      await page.evaluate(() => { window.__vt.rebase(); return window.__vt.settle(); });   // фаза бесконечных CSS-анимаций — от общей точки (иначе свечение кнопки плывёт на ≤4 уровня)
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
 * виртуальными кадрами. Поэтому каждый маршрут сначала открывается вхолостую.
 */
export async function warm(base, items, size = [1280, 720]) {
  const seen = new Set();
  for (const it of items) {
    const plan = typeof it === 'string'
      ? { route: it, align: 80, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }] } }
      : { ...it, align: 80, camera: undefined, actions: [], hide: [] };
    const key = plan.kind + '|' + plan.route;
    if (seen.has(key)) continue; seen.add(key);
    const s = await openSession({ base, plan, size, log: () => {} });
    await s.pump(5);
    await s.close();
  }
}
