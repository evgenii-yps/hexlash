/* ────────────────────────────────────────────────────────────────────────────
   Петля на фоне первого экрана лендинга — всё, что привязано К ФАЙЛАМ ПЕТЛИ.

   Файлы лежат в public/landing-trailer/. Все три раскладки (компьютер, 720p,
   телефон-вертикаль) собраны на ОДНОЙ временной шкале, поэтому момент удара и
   длина петли у них общие. Перемонтировали петлю — правится ЭТОТ файл, и
   только он: ни в разметке, ни в стилях времени петли нет.

   Шкала петли (секунды от начала файла):
     0.0 … 16.2   дуэль → зал → остров, остров уходит в темноту
     16.2 … 17.9  тёмная пауза: в ней лежит удар (HIT_S), потом знак летит в шапку
     17.9 … 18.7  дуэль проявляется из темноты — это и есть шов петли
   ──────────────────────────────────────────────────────────────────────────── */

export const LOOP_BASE = '/landing-trailer';

/** Время удара внутри петли, секунды. Знак появляется и слово бьёт ровно тут. */
export const HIT_S = 16.45;

/* Знак над словом. Появление быстрое, потом держится и улетает в знак шапки.
   Числа появления — из утверждённого превью варианта B.

   ⚠️ ВРЕМЯ НА КРУГЕ ПОДСЧИТАНО И ТЕСНОЕ. Удар в 16.45, конец файла 18.7: на
   всё про всё 2.25 с. Раньше знак держался 1.45 с и гас ещё полсекунды (до
   17.9 + 0.5) — но гашение заканчивалось внутри круга. Полёт ~1.1 с с той же
   паузой (1.45 + 1.1 = 2.55) в круг не влезает на 0.3 с, поэтому пауза урезана до
   1.0: 1.0 + 1.1 = 2.1 → прилёт в 18.55, запас до шва 0.15 с.
   Отдать паузе обратно её 0.45 с можно только за счёт полёта (≈0.75 с) или
   выходом полёта за шов петли — это решение владельца, не техническое. */
export const MARK_FADE_IN_S = 0.08;   // за сколько знак становится видимым
export const MARK_HOLD_S = 1.0;       // сколько держится после удара, до отрыва
export const MARK_FLIGHT_S = 1.1;     // полёт в знак шапки
export const MARK_FADE_OUT_S = 0.5;   // гашение на месте — только когда лететь некуда

/* Прилёт: вспышка знака шапки. Яркость и масштаб, свечения нет. Идёт сама по
   времени стены (не по времени петли): 0.3 с, шов петли ей не помеха. */
export const ARRIVE_FLASH_MS = 300;
export const ARRIVE_FLASH_SCALE = 1.1;
export const ARRIVE_FLASH_BRIGHT = 1.25;

/* Дуга полёта: боковое отклонение от прямой в долях длины пути. 0 — прямая.
   Минус — дуга вниз-влево: на телефоне знак обходит меню шапки снизу, на низком
   окне не вылезает за верхний край (плюс — вверх-вправо — делал и то, и другое).
   Сравнение трёх вариантов — docs/landing-trailer/mark-flight/arc/. */
export const FLIGHT_ARC = -0.12;

/* Кривая полёта — токен лендинга, а не своя: тяжёлый разгон и торможение,
   как у плит и хрома. Читается из tokens.css во время полёта. */
export const FLIGHT_EASE_TOKEN = '--e-weight';

/* Кривые удара: [секунды от удара, масштаб]. Между точками — линейно.
   Знак: влетает крупным, сжимается, выбрасывается за 100 %, садится.
   Слово: короткое сжатие к центру → выброс ≈108 % → 100 %. Новых свечений нет:
   масштабируется сам заголовок вместе со своим обычным ореолом. */
const MARK_CURVE = [[0, 1.5], [0.10, 0.95], [0.20, 1.08], [0.40, 1.0]];
const WORD_CURVE = [[0, 1.0], [0.10, 0.93], [0.20, 1.08], [0.40, 1.0]];

function along(curve, u) {
  if (u <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i += 1) {
    const [u1, v1] = curve[i];
    if (u <= u1) {
      const [u0, v0] = curve[i - 1];
      return v0 + (v1 - v0) * ((u - u0) / (u1 - u0));
    }
  }
  return curve[curve.length - 1][1];
}

const FLIGHT_START_S = MARK_HOLD_S;
const FLIGHT_END_S = MARK_HOLD_S + MARK_FLIGHT_S;

/**
 * Состояние эффектов для момента петли `t`. Чистая функция времени: никакого
 * накопленного состояния, поэтому после любого числа кругов и после паузы вне
 * экрана рассинхрона быть не может — кадр сам говорит, где он.
 * `active: false` — эффектов нет, страница снимает свои переменные.
 *
 * Знак: `flying` — отрыв начался, `flight` — доля пути 0…1 по времени (кривую
 * и сам путь считает страница: они зависят от раскладки). `arrived` — путь
 * пройден, летящая копия гаснет. `fly: false` — лететь некуда (шапки не видно),
 * тогда знак гаснет на месте, как было до полёта.
 */
export function loopFx(t, { fly = true } = {}) {
  const u = t - HIT_S;
  const end = fly ? FLIGHT_END_S : MARK_HOLD_S + MARK_FADE_OUT_S;
  if (u < 0 || u > end + 0.05) return { active: false };
  let alpha = Math.min(1, u / MARK_FADE_IN_S);
  const out = { active: true, word: along(WORD_CURVE, u), mark: along(MARK_CURVE, u) };
  if (fly) {
    out.flying = u > FLIGHT_START_S && u < FLIGHT_END_S;
    out.arrived = u >= FLIGHT_END_S;
    out.flight = Math.min(1, Math.max(0, (u - FLIGHT_START_S) / MARK_FLIGHT_S));
    if (out.arrived) alpha = 0;
  } else if (u > MARK_HOLD_S) {
    alpha = Math.max(0, 1 - (u - MARK_HOLD_S) / MARK_FADE_OUT_S);
  }
  out.alpha = alpha;
  return out;
}

/** Кубическая кривая Безье (как CSS cubic-bezier) → функция 0…1 → 0…1. */
export function bezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1; const bx = 3 * (x2 - x1) - cx; const ax = 1 - cx - bx;
  const cy = 3 * y1; const by = 3 * (y2 - y1) - cy; const ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 6; i += 1) {            // Ньютон — почти всегда хватает
      const e = X(s) - x;
      if (Math.abs(e) < 1e-5) return Y(s);
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
    }
    let lo = 0; let hi = 1; s = x;              // запасной путь — деление пополам
    for (let i = 0; i < 24; i += 1) {
      const e = X(s) - x;
      if (Math.abs(e) < 1e-5) break;
      if (e > 0) hi = s; else lo = s;
      s = (lo + hi) / 2;
    }
    return Y(s);
  };
}

/** Кривая из токена стилей (`cubic-bezier(a,b,c,d)`); без неё — плавная по умолчанию. */
export function easeFromToken(name, el = document.documentElement) {
  const raw = getComputedStyle(el).getPropertyValue(name);
  const m = /cubic-bezier\(([^)]+)\)/.exec(raw || '');
  const n = m ? m[1].split(',').map(Number) : [];
  if (n.length === 4 && n.every(Number.isFinite)) return bezierEase(n[0], n[1], n[2], n[3]);
  return bezierEase(0.55, 0, 0.12, 1);
}

/* Какая раскладка файла нужна экрану.
   phone — вертикальный кадр: бойцы стоят в верхней полосе между шапкой и
   заголовком, а не под кнопками, поэтому панели Safari их не закрывают.
   Только узкий портрет: планшет в портрете получает обычный кадр. */
export const PHONE_QUERY = '(max-width: 680px) and (orientation: portrait)';
export const MID_QUERY = '(max-width: 1280px)';

export function pickLoopName(win = window) {
  if (win.matchMedia(PHONE_QUERY).matches) return 'phone';
  if (win.matchMedia(MID_QUERY).matches) return '720';
  return '1080';
}

/* MP4 первым: H.264 есть везде и декодируется железом (экономит батарею).
   WebM — запасной путь для браузеров без H.264. */
export function loopSources(name) {
  return [
    { src: `${LOOP_BASE}/loop-${name}.mp4`, type: 'video/mp4; codecs="avc1.640028"' },
    { src: `${LOOP_BASE}/loop-${name}.webm`, type: 'video/webm; codecs="vp9"' },
  ];
}

/* Заставка — первый кадр петли. Тот же кадр, что у видео, поэтому подмена не
   заметна. Размеры отдаёт браузер через srcset. */
export const POSTER = {
  phone: `${LOOP_BASE}/poster-phone.jpg`,
  srcset: `${LOOP_BASE}/poster-1280.jpg 1280w, ${LOOP_BASE}/poster-1920.jpg 1920w`,
  src: `${LOOP_BASE}/poster-1920.jpg`,
};

/** Полный трейлер со звуком. Тянется ТОЛЬКО по нажатию кнопки. */
export const TRAILER_SRC = `${LOOP_BASE}/trailer-1080.mp4`;
