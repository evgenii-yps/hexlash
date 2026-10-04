// landing-mark-flight-e2e.mjs — ЗНАК В КОНЦЕ КРУГА ПЕТЛИ УЛЕТАЕТ В ШАПКУ (ТЗ v2, 03.10.2026).
//
// Стенд ставит петлю на нужное ВРЕМЯ КАДРА (видео в момент съёмки ставится на паузу —
// кадр получается точным, а не «примерно»), снимает экран и меряет коробки.
//
//   BASE=http://127.0.0.1:4173 OUT=docs/landing-trailer/mark-flight \
//   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/landing-mark-flight-e2e.mjs
//
// Запускать на СОБРАННОЙ странице (vite build + vite preview), не на dev-сервере.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = process.env.OUT || '/tmp/mark-flight';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
mkdirSync(OUT, { recursive: true });

// Время кадров (секунды петли) — от HIT_S = 16.45 и чисел из src/data/heroLoop.js.
const HIT = 16.45;
const HOLD = 1.0;
const FLIGHT = 1.1;
const T = {
  '1-znak-proyavilsya': HIT + 0.6,
  '2-nachalo-poleta': HIT + HOLD + 0.12,
  '3-seredina': HIT + HOLD + FLIGHT * 0.5,
  '4-priliot': HIT + HOLD + FLIGHT - 0.1,    // последние кадры с летящей копией
};

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});

const errors = [];

async function open(vp, { reduce = false, blockVideo = false, hash = '', scrollY = 0 } = {}) {
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: vp.width < 700 ? 2 : 1,
    reducedMotion: reduce ? 'reduce' : 'no-preference',
    isMobile: vp.width < 700, hasTouch: vp.width < 700,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${vp.width}: ${e.message}`));
  if (blockVideo) await page.route('**/landing-trailer/loop-*', (r) => r.abort());
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'load' });
  await page.waitForSelector('.hero-mark', { state: 'attached' });
  // Вход страницы (is-in) и экран загрузки сайта — ждём, пока слово встанет.
  await page.waitForTimeout(2200);
  if (scrollY) await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  return { ctx, page };
}

// Ждём, пока видео доиграет до t, и ставим его на паузу. Кадр после этого стоит.
const seekAndHold = (page, t) => page.evaluate(async (target) => {
  const v = document.querySelector('.hero-bg__video');
  if (!v) return null;
  // Замедление в 4 раза: на медленной машине headless-видео отдаёт кадры редко, и кадр
  // прилёта пропускается. Страница учитывает скорость (rate в событии кадра).
  v.playbackRate = 0.25;
  if (v.paused) await v.play().catch(() => {});
  // Подвод: если мы ещё далеко до цели — прыгаем к ней поближе (не доиграть 16 с реального времени).
  if (v.currentTime < target - 0.6 || v.currentTime > target) {
    v.currentTime = Math.max(0, target - 0.5);
    await new Promise((r) => v.addEventListener('seeked', r, { once: true }));
    if (v.paused) await v.play().catch(() => {});
  }
  await new Promise((res) => {
    const tick = () => (v.currentTime >= target ? res() : requestAnimationFrame(tick));
    tick();
  });
  v.pause();
  await new Promise((r) => setTimeout(r, 60));
  return v.currentTime;
}, t);

const rects = (page) => page.evaluate(() => {
  const r = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return [b.left, b.top, b.width, b.height].map((x) => +x.toFixed(2));
  };
  const cs = (sel) => {
    const e = document.querySelector(sel);
    return e ? getComputedStyle(e) : null;
  };
  return {
    hero: r('.hero-mark'), nav: r('.nav-logo .logo-mark'),
    heroOp: +cs('.hero-mark').opacity, navOp: +cs('.nav-logo .logo-mark').opacity,
    navFilter: cs('.nav-logo .logo-mark').filter,
    navAnims: document.querySelector('.nav-logo .logo-mark').getAnimations().length,
    still: {
      word: r('.headline .word'), lead: r('.lead'), leadSub: r('.lead-sub'),
      cta: r('.cta-row'), watch: r('.btn-watch'), links: r('.nav-links'), social: r('.nav-social'),
      navBar: r('.nav'),
    },
  };
});

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SIZES = [[1920, 1080, 'desktop-1920'], [1280, 720, 'desktop-1280'],
  [430, 932, 'phone-430'], [390, 844, 'phone-390'], [360, 740, 'phone-360']];

const summary = {};

for (const [w, h, name] of SIZES) {
  if (ONLY && !ONLY.includes(String(w))) continue;
  console.log(`\n== ${name} (${w}×${h})`);
  const { ctx, page } = await open({ width: w, height: h });
  const hasVideo = await page.evaluate(() => !!document.querySelector('.hero-bg__video'));
  ok(hasVideo, 'видео-петля создана');
  // База: что стоит на месте до удара — слово, лозунг, кнопки, меню.
  await seekAndHold(page, 15.5);
  const base = await rects(page);
  ok(base.heroOp === 0, 'до удара знака по центру нет', `opacity=${base.heroOp}`);
  ok(base.navOp === 1, 'знак шапки виден всегда (до удара)', `opacity=${base.navOp}`);
  summary[name] = {};
  for (const [label, t] of Object.entries(T)) {
    const got = await seekAndHold(page, t);
    const m = await rects(page);
    await page.screenshot({ path: `${OUT}/${name}-${label}.png` });
    summary[name][label] = { t: +got.toFixed(3), hero: m.hero, nav: m.nav, heroOp: m.heroOp, navOp: m.navOp };
    console.log(`  ${label}  t=${got.toFixed(2)}  hero=${JSON.stringify(m.hero)}  op=${m.heroOp}  nav=${JSON.stringify(m.nav)}`);
    if (label === '1-znak-proyavilsya') ok(m.heroOp > 0.9, 'знак по центру проявился', `opacity=${m.heroOp}`);
    if (label === '4-priliot') {
      ok(m.heroOp === 1 && m.navOp === 1, 'летящая копия видна, знак шапки на месте');
    }
    if (['2-nachalo-poleta', '3-seredina', '4-priliot'].includes(label)) {
      const moved = Object.keys(base.still).filter((k) => !same(base.still[k], m.still[k]));
      ok(moved.length === 0, `${label}: слово, лозунг, кнопки, меню на своих местах`, moved.length ? `сдвинулось: ${moved}` : '');
    }
    // Вспышка шапки: ловим её отдельным заходом ниже; тут просто идём дальше.
    await page.evaluate(() => document.querySelector('.hero-bg__video').play().catch(() => {}));
  }

  // ПРИЛЁТ — по событию, а не по времени: ждём кадр, на котором копия погасла, и сразу
  // ставим видео на паузу. На нём копия стоит там, где прилетела (рамка есть, прозрачность 0).
  await seekAndHold(page, HIT + HOLD + FLIGHT - 0.4);
  const arr = await page.evaluate(() => new Promise((res) => {
    const v = document.querySelector('.hero-bg__video');
    const hero = document.querySelector('.hero-mark');
    const nav = document.querySelector('.nav-logo .logo-mark');
    const rc = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    let last = null;
    const t0 = performance.now();
    v.play();
    const tick = () => {
      const op = +getComputedStyle(hero).opacity;
      if (op > 0) last = { op, hero: rc(hero), t: v.currentTime };
      // Прилёт — кадр, где копия погасла на месте (--mark-x есть). Если шов петли пришёл раньше
      // (редкие кадры слабой машины), копия снимается переменными, но шапка всё равно принимает
      // вспышкой; тогда место прилёта — последний показанный кадр копии.
      const seam = op === 0 && last && !hero.style.getPropertyValue('--mark-x') && nav.getAnimations().length > 0;
      if (op === 0 && last && (hero.style.getPropertyValue('--mark-x') || seam)) {
        v.pause();
        res({ ok: true, seam, last, hero: seam ? last.hero : rc(hero), nav: rc(nav), t: v.currentTime });
        return;
      }
      if (performance.now() - t0 > 12000) res({ ok: false, last });
      else requestAnimationFrame(tick);
    };
    tick();
  }));
  ok(arr.ok, 'прилёт: копия погасла, шапка приняла' + (arr.ok && arr.seam ? ' (шов раньше кадра прилёта)' : ''));
  if (arr.ok) {
    const dc = [(arr.hero[0] + arr.hero[2] / 2) - (arr.nav[0] + arr.nav[2] / 2), (arr.hero[1] + arr.hero[3] / 2) - (arr.nav[1] + arr.nav[3] / 2)];
    ok(Math.abs(dc[0]) < 0.3 && Math.abs(dc[1]) < 0.3, 'место прилёта = центр знака шапки', `Δ=(${dc[0].toFixed(3)}, ${dc[1].toFixed(3)}) px`);
    ok(Math.abs(arr.hero[2] - arr.nav[2]) < 0.3, 'размер при прилёте = размер знака шапки', `${arr.hero[2].toFixed(2)} vs ${arr.nav[2].toFixed(2)}`);
    summary[name].alignDelta = dc;
    summary[name].arrival = arr;
    await page.waitForTimeout(1600); // вспышка шапки (300 мс по часам стены) отыграла
    const m = await rects(page);
    ok(m.heroOp === 0 && m.navOp === 1, 'после прилёта знак ровно один — знак шапки', `копия=${m.heroOp} шапка=${m.navOp}`);
    ok(m.navAnims === 0, 'вспышка шапки отыграла и вернулась в покой', `anims=${m.navAnims}`);
    const moved = Object.keys(base.still).filter((k) => !same(base.still[k], m.still[k]));
    ok(moved.length === 0, 'после прилёта слово, лозунг, кнопки, меню на своих местах', moved.length ? `сдвинулось: ${moved}` : '');
    await page.screenshot({ path: `${OUT}/${name}-5-shapka-posle.png` });
  }
  await ctx.close();
}

// ── Вспышка шапки. Прилёт → WAAPI-анимация на знаке шапки; замираем её на пике (40%).
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== вспышка знака шапки (390)');
  const { ctx, page } = await open({ width: 390, height: 844 });
  await seekAndHold(page, HIT + HOLD + FLIGHT - 0.5);
  await page.evaluate(() => document.querySelector('.hero-bg__video').play());
  // Ждём, пока на знаке шапки появится вспышка (она запускается кадром прилёта).
  const info = await page.evaluate(() => new Promise((res) => {
    const nav = document.querySelector('.nav-logo .logo-mark');
    const hero = document.querySelector('.hero-mark');
    const t0 = performance.now();
    const tick = () => {
      const a = nav.getAnimations();
      if (a.length) {
        const heroAtArrival = getComputedStyle(hero).opacity;
        a[0].pause(); a[0].currentTime = 120;
        const cs = getComputedStyle(nav);
        res({ ok: true, dur: a[0].effect.getTiming().duration, filter: cs.filter, transform: cs.transform, heroAtArrival });
        return;
      }
      if (performance.now() - t0 > 4000) res({ ok: false }); else requestAnimationFrame(tick);
    };
    tick();
  }));
  ok(info.ok, 'при прилёте запущена вспышка знака шапки (WAAPI)');
  if (info.ok) {
    ok(info.dur === 300, 'вспышка идёт 300 мс', `${info.dur}`);
    ok(!/drop-shadow|blur/.test(info.filter), 'вспышка не свечение: нет тени и размытия', `filter=${info.filter}`);
    ok(info.heroAtArrival === '0', 'в момент вспышки летящая копия уже погасла', `opacity=${info.heroAtArrival}`);
    console.log('  пик:', JSON.stringify(info));
    await page.screenshot({ path: `${OUT}/phone-390-4b-vspyshka-pik.png` });
  }
  await ctx.close();
}

// ── «Уменьшить движение»
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== уменьшить движение (390 и 1920)');
  for (const [w, h, n] of [[390, 844, 'phone-390'], [1920, 1080, 'desktop-1920']]) {
    const { ctx, page } = await open({ width: w, height: h }, { reduce: true });
    const m = await rects(page);
    const noVideo = await page.evaluate(() => !document.querySelector('.hero-bg__video'));
    ok(noVideo, `${n}: видео не создано`);
    ok(m.heroOp === 1, `${n}: знак по центру стоит на месте (как было)`, `opacity=${m.heroOp}`);
    ok(m.navAnims === 0, `${n}: вспышки шапки нет`);
    await page.waitForTimeout(2500);
    const m2 = await rects(page);
    ok(same(m.hero, m2.hero) && m2.navAnims === 0, `${n}: за 2.5 с ничего не двигалось`);
    await page.screenshot({ path: `${OUT}/${n}-reduce-motion.png` });
    await ctx.close();
  }
}

// ── Ролик не загрузился
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== ролик не загрузился (390 и 1920)');
  for (const [w, h, n] of [[390, 844, 'phone-390'], [1920, 1080, 'desktop-1920']]) {
    const { ctx, page } = await open({ width: w, height: h }, { blockVideo: true });
    await page.waitForTimeout(3000);
    const m = await rects(page);
    ok(m.heroOp === 0, `${n}: знака по центру нет`, `opacity=${m.heroOp}`);
    ok(m.navOp === 1 && m.nav[2] > 40, `${n}: знак шапки на месте`);
    const pageOk = await page.evaluate(() => ({
      word: !!document.querySelector('.headline .word'),
      sw: document.documentElement.scrollWidth <= window.innerWidth,
      posterOn: !!document.querySelector('.hero-bg__poster'),
    }));
    ok(pageOk.word && pageOk.sw && pageOk.posterOn, `${n}: страница целая (слово, заставка, нет горизонтальной прокрутки)`);
    await page.screenshot({ path: `${OUT}/${n}-video-failed.png` });
    await ctx.close();
  }
}

// ── Прокрутка во время полёта
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== прокрутка во время полёта (390 и 1920)');
  for (const [w, h, n] of [[390, 844, 'phone-390'], [1920, 1080, 'desktop-1920']]) {
    const { ctx, page } = await open({ width: w, height: h });
    await seekAndHold(page, HIT + HOLD + 0.35);
    await page.evaluate(() => document.querySelector('.hero-bg__video').play());
    await page.waitForTimeout(80);
    const before = await rects(page);
    ok(before.heroOp > 0.9, `${n}: перед прокруткой знак летит`, `opacity=${before.heroOp}`);
    await page.evaluate(() => window.scrollBy(0, 60));
    await page.waitForTimeout(250);
    const after = await rects(page);
    ok(after.heroOp === 0, `${n}: после прокрутки летящего знака нет`, `opacity=${after.heroOp}`);
    await page.waitForTimeout(1600);
    const end = await rects(page);
    ok(end.navOp === 1 && end.navAnims === 0, `${n}: шапка на месте, вспышки нет`, `anims=${end.navAnims}`);
    await page.screenshot({ path: `${OUT}/${n}-scroll-during-flight.png` });
    await ctx.close();
  }
}

// ── Страница прокручена вниз при загрузке: полёта нет
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== страница прокручена вниз при загрузке (390, прокрутка 120 px)');
  const { ctx, page } = await open({ width: 390, height: 844 }, { scrollY: 120 });
  await seekAndHold(page, HIT + HOLD + 0.2);
  await page.evaluate(() => document.querySelector('.hero-bg__video').play().catch(() => {}));
  const res = await page.evaluate(() => new Promise((r) => {
    const hero = document.querySelector('.hero-mark');
    const nav = document.querySelector('.nav-logo .logo-mark');
    let maxX = 0; let flash = false; const t0 = performance.now();
    const tick = () => {
      maxX = Math.max(maxX, Math.abs(parseFloat(hero.style.getPropertyValue('--mark-x') || '0')));
      if (nav.getAnimations().length) flash = true;
      if (performance.now() - t0 > 3500) r({ maxX, flash }); else requestAnimationFrame(tick);
    };
    tick();
  }));
  ok(res.maxX === 0, 'прокрутка 120 px: знак никуда не летит', `макс. сдвиг=${res.maxX}px`);
  ok(!res.flash, 'прокрутка 120 px: вспышки шапки нет');
  await ctx.close();
}

// ── Окно «Watch trailer» посреди полёта: полёт замирает вместе с петлёй, после закрытия идёт дальше
if (!ONLY || ONLY.includes('390')) {
  console.log('\n== окно трейлера посреди полёта (390)');
  const { ctx, page } = await open({ width: 390, height: 844 });
  await seekAndHold(page, HIT + HOLD + 0.45);
  await page.evaluate(() => document.querySelector('.hero-bg__video').play());
  await page.evaluate(() => document.querySelector('.btn-watch').click());
  await page.waitForSelector('.trailer', { state: 'attached' });
  await page.waitForTimeout(500);
  const x1 = await page.evaluate(() => document.querySelector('.hero-mark').style.getPropertyValue('--mark-x'));
  const paused = await page.evaluate(() => document.querySelector('.hero-bg__video').paused);
  await page.waitForTimeout(700);
  const x2 = await page.evaluate(() => document.querySelector('.hero-mark').style.getPropertyValue('--mark-x'));
  ok(paused, 'под открытым окном трейлера петля стоит на паузе');
  ok(x1 === x2 && x1 !== '', 'летящий знак замер вместе с петлёй', `${x1} → ${x2}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.querySelector('.hero-bg__video').playbackRate = 0.25; });
  const end = await page.evaluate(() => new Promise((res) => {
    const hero = document.querySelector('.hero-mark'); const nav = document.querySelector('.nav-logo .logo-mark');
    const t0 = performance.now(); let moved = false; let flash = false;
    const x0 = hero.style.getPropertyValue('--mark-x');
    const tick = () => {
      if (hero.style.getPropertyValue('--mark-x') !== x0) moved = true;
      if (nav.getAnimations().length) flash = true;
      if (performance.now() - t0 > 7000) res({ moved, flash, op: +getComputedStyle(hero).opacity }); else requestAnimationFrame(tick);
    };
    tick();
  }));
  ok(end.moved, 'после закрытия окна полёт продолжился с того же места');
  ok(end.flash, 'долетел, шапка приняла (вспышка)');
  await ctx.close();
}

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
console.log('\nошибки страницы:', errors.length ? errors : 'нет');
console.log(failed ? `\nПРОВАЛЕНО: ${failed}` : '\nВСЁ ЗЕЛЁНОЕ');
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
