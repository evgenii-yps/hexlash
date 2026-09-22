// buffs-e2e.mjs — ПРОВЕРКА В НАСТОЯЩЕМ БРАУЗЕРЕ. Кликает пальцем, как игрок.
//
// Соседние проверки считают бой без картинки. Здесь — собранная игра: панель
// показалась, карточка нажалась, цель подсветилась, тап по бойцу сработал,
// значок встал над головой. Плюс снимки экрана на трёх размерах.
//
//   npx vite preview --port 4173 &   (или npm run build && preview)
//   node scripts/buffs-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/buffs-shots';
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1440, height: 900 },
];

let failed = 0;
const ok = (cond, name, detail = '') => {
  if (cond) console.log(`  ✓ ${name}${detail ? '  ' + detail : ''}`);
  else { failed += 1; console.log(`  ✗ ${name}${detail ? '  ' + detail : ''}`); }
};

const browser = await chromium.launch();

for (const size of SIZES) {
  console.log(`\n── ${size.name} (${size.width}×${size.height}) ──────────────`);
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { failed += 1; console.log('  ✗ ошибка на странице:', e.message); });

  // 1. Первый заход: игра сама заводит стартовый ростер в память вкладки.
  await page.goto(`${BASE}/play?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 2. Ставим состав напрямую в память вкладки — по той же дороге, какой его
  //    кладут ворота. Кликать по трёхмерным островам из скрипта ненадёжно, а
  //    проверяем мы не ворота, а баффы в бою.
  const seeded = await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    if (!list.length) return null;
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'duel', n: 1 };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
    return { id: list[0].id, core: list[0].core, buffs: raw.buffs || null };
  });
  ok(!!seeded, 'стартовый ростер завёлся сам', seeded ? `(боец ${seeded.core})` : '');
  if (!seeded) { await ctx.close(); continue; }

  // 3. Ворота: слоты «В бой» — на шаге выбора бойца.
  await page.goto(`${BASE}/play/gate?step=squad&dev=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const slots = await page.locator('.bks-slot').count();
  ok(slots === 3, 'в воротах три слота «В бой»', `(нашлось ${slots})`);
  const slotNames = await page.locator('.bks-slot .bks-name').allTextContents();
  ok(slotNames.filter((x) => x !== 'EMPTY').length === 3,
     'слоты заполнены из запаса сами', `(${slotNames.join(' · ')})`);
  await page.screenshot({ path: `${OUT}/${size.name}-1-gate-slots.png` });

  // 4. Арена. Бой заводится сам через полторы секунды после сборки сцены.
  await page.goto(`${BASE}/play/arena?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 30000 }).catch(() => {});
  const cards = await page.locator('.bfo-cards .bc-card').count();
  ok(cards === 3, 'в бою панель из трёх карточек', `(нашлось ${cards})`);
  const counts = await page.locator('.bfo-cards .bc-count').allTextContents();
  ok(counts.join(' ') === '×1 ×1 ×1', 'на каждой видно, сколько осталось', `(${counts.join(' ')})`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${size.name}-2-fight-panel.png` });

  // 5. Тап по карточке → подсветка цели.
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(400);
  const marks = await page.locator('.bfo-mark').count();
  ok(marks >= 1, 'выбрана карточка — свой боец подсветился', `(меток ${marks})`);
  const selected = await page.locator('.bfo-cards .bc-card.is-selected').count();
  ok(selected === 1, 'карточка показывает, что она выбрана');
  await page.screenshot({ path: `${OUT}/${size.name}-3-armed.png` });

  // 6. Тап по бойцу → бафф сработал, над головой встал значок.
  const box = await page.locator('.bfo-mark').first().boundingBox();
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  // ⚠️ СПРАШИВАЕМ ВИДИМЫЕ, а не «есть в разметке». Скрытый значок в разметке
  //    остаётся, и первая версия этой проверки прошла на пустом экране — ошибку
  //    поймал снимок, а не замер. Больше так не считаем.
  const badges = await page.locator('.bb-badge:visible').count();
  ok(badges >= 1, 'бафф применён — над бойцом ВИДИМЫЙ значок', `(значков ${badges})`);
  const ring = await page.locator('.bb-badge:visible .bb-ring__fg.is-driven').count();
  ok(ring >= 1, 'кольцо значка ведёт бой, а не своя петля');
  const left = await page.locator('.bfo-cards .bc-count').allTextContents();
  ok(left.includes('×0'), 'бафф сгорел — на карточке стало ×0', `(${left.join(' ')})`);
  const marksAfter = await page.locator('.bfo-mark').count();
  ok(marksAfter === 0, 'подсветка погасла вместе с выбором');
  await page.screenshot({ path: `${OUT}/${size.name}-4-applied.png` });

  // 7. Второй бафф на того же бойца — нельзя (правило 2).
  await page.locator('.bfo-cards .bc-card').nth(1).click();
  await page.waitForTimeout(400);
  const marksLocked = await page.locator('.bfo-mark').count();
  ok(marksLocked === 0, 'на бойца под баффом второй не бросается — целей нет');
  await page.screenshot({ path: `${OUT}/${size.name}-5-locked.png` });

  // 8. Панель не перекрывает бойцов: она прижата к низу и сквозная.
  const barBox = await page.locator('.bfo-bar').boundingBox();
  ok(barBox && barBox.y + barBox.height >= size.height - 2, 'панель прижата к низу экрана');
  ok(barBox && barBox.height < size.height * 0.34, 'панель занимает меньше трети высоты',
     barBox ? `(${Math.round(barBox.height)} из ${size.height})` : '');

  await ctx.close();
}

// ── Запас: подарок, трата, возврат, переживание обновления ────────────────
{
  console.log('\n── ЗАПАС БАФФОВ ──────────────────────────────────────────');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const stockNow = () => page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    return raw.buffs ? raw.buffs.stock : null;
  });

  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'duel', n: 1 };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  });

  await page.goto(`${BASE}/play/gate?step=squad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const gift = await stockNow();
  ok(gift && gift.towel === 2 && gift.bucket === 2 && gift.dice === 2,
     'стартовый подарок выдан: по два каждого', gift ? JSON.stringify(gift) : '');

  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 30000 });
  const inFight = await stockNow();
  ok(inFight && inFight.towel === 2 && inFight.bucket === 2 && inFight.dice === 2,
     'на входе в бой запас не тронут — бафф списывается в момент броска',
     inFight ? JSON.stringify(inFight) : '');

  // Бросаем один — списался ровно он.
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(400);
  const mk = await page.locator('.bfo-mark').first().boundingBox();
  if (mk) await page.mouse.click(mk.x + mk.width / 2, mk.y + mk.height / 2);
  await page.waitForTimeout(600);
  const spent = await stockNow();
  ok(spent && spent.towel === 1 && spent.bucket === 2 && spent.dice === 2,
     'брошенный бафф списан, остальные целы', spent ? JSON.stringify(spent) : '');

  // ⚠️ САМАЯ ВАЖНАЯ ПРОВЕРКА ЗДЕСЬ. Обновление страницы посреди боя не должно
  //    съедать запас. Первая версия съедала: набор списывался на старте боя, а
  //    вернуть его было некому — 1·1·1 превращалось в 0·0·0 за одно нажатие F5.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const afterReload = await stockNow();
  ok(afterReload && afterReload.towel === 1 && afterReload.bucket === 2 && afterReload.dice === 2,
     'обновление страницы в бою запас НЕ съедает', afterReload ? JSON.stringify(afterReload) : '');

  // Ушёл с арены — небрсошенные на месте.
  await page.goto(`${BASE}/play/gate?step=squad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const back = await stockNow();
  ok(back && back.towel + back.bucket + back.dice === 5,
     'небро́шенные баффы остались в запасе', back ? JSON.stringify(back) : '');

  // Пустой запас — ряд пустой, бой идёт как обычно.
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    raw.buffs = { stock: { towel: 0, bucket: 0, dice: 0 }, kit: [null, null, null], gifted: true };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  });
  await page.goto(`${BASE}/play/gate?step=squad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const emptyNames = await page.locator('.bks-slot .bks-name').allTextContents();
  ok(emptyNames.every((x) => x === 'EMPTY'), 'пустой запас — ряд пустой', `(${emptyNames.join(' · ')})`);
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const cardsEmpty = await page.locator('.bfo-cards .bc-card').count();
  ok(cardsEmpty === 0, 'без баффов панели нет, бой идёт как обычно');
  const alive = await page.locator('canvas').count();
  ok(alive === 1, 'арена собралась и работает');
  await ctx.close();
}

// ── Три одинаковых · отмена выбора · страница-макет цела ─────────────────
{
  console.log('\n── КРАЙНИЕ СЛУЧАИ ────────────────────────────────────────');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { failed += 1; console.log('  ✗ ошибка на странице:', e.message); });

  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'duel', n: 1 };
    raw.buffs = { stock: { towel: 3, bucket: 0, dice: 0 }, kit: ['towel', 'towel', 'towel'], gifted: true };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  });
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 30000 });
  const cards = await page.locator('.bfo-cards .bc-card').count();
  const count = await page.locator('.bfo-cards .bc-count').first().textContent();
  ok(cards === 1 && count === '×3', 'три одинаковых складываются в одну карточку ×3',
     `(карточек ${cards}, счётчик ${count})`);

  // Отмена: тап мимо бойца ничего не тратит.
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(300);
  ok(await page.locator('.bfo-mark').count() >= 1, 'цель подсветилась');
  await page.mouse.click(60, 120); // заведомо пустой угол плиты
  await page.waitForTimeout(300);
  const afterMiss = await page.locator('.bfo-cards .bc-count').first().textContent();
  ok(afterMiss === '×3', 'тап мимо бойца ничего не потратил', `(счётчик ${afterMiss})`);
  ok(await page.locator('.bfo-mark').count() === 0, 'и снял выбор');

  // Повторный тап по карточке — тоже отмена.
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(250);
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(250);
  ok(await page.locator('.bfo-mark').count() === 0, 'повторный тап по карточке снимает выбор');

  // Страница-макет работы 1 не пострадала: карточка и значок переехали, но
  // остались теми же.
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/dev/buffs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const mockCards = await page.locator('.bc-card').count();
  const mockBadges = await page.locator('.bb-badge').count();
  ok(mockCards >= 12 && mockBadges >= 4, 'страница-макет /dev/buffs цела',
     `(карточек ${mockCards}, значков ${mockBadges})`);
  await page.screenshot({ path: `${OUT}/dev-buffs-page.png`, fullPage: false });
  await ctx.close();
}

await browser.close();
console.log(`\nСнимки: ${OUT}`);
console.log(failed === 0 ? '✓ ВСЁ СОШЛОСЬ' : `✗ НЕ СОШЛОСЬ: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
