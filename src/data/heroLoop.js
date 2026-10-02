/* ────────────────────────────────────────────────────────────────────────────
   Петля на фоне первого экрана лендинга — всё, что привязано К ФАЙЛАМ ПЕТЛИ.

   Файлы лежат в public/landing-trailer/. Все три раскладки (компьютер, 720p,
   телефон-вертикаль) собраны на ОДНОЙ временной шкале, поэтому момент удара и
   длина петли у них общие. Перемонтировали петлю — правится ЭТОТ файл, и
   только он: ни в разметке, ни в стилях времени петли нет.

   Шкала петли (секунды от начала файла):
     0.0 … 16.2   дуэль → зал → остров, остров уходит в темноту
     16.2 … 17.9  тёмная пауза: в ней лежит удар (HIT_S)
     17.9 … 18.7  дуэль проявляется из темноты — это и есть шов петли
   ──────────────────────────────────────────────────────────────────────────── */

export const LOOP_BASE = '/landing-trailer';

/** Время удара внутри петли, секунды. Знак появляется и слово бьёт ровно тут. */
export const HIT_S = 16.45;

/* Знак над словом. Появление быстрое, потом держится и гаснет, пока
   проявляется дуэль. Числа — из утверждённого превью варианта B. */
export const MARK_FADE_IN_S = 0.08;   // за сколько знак становится видимым
export const MARK_HOLD_S = 1.45;      // сколько держится после удара, до начала гашения
export const MARK_FADE_OUT_S = 0.5;   // гашение

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

const FX_END_S = MARK_HOLD_S + MARK_FADE_OUT_S;

/**
 * Состояние эффектов для момента петли `t`. Чистая функция времени: никакого
 * накопленного состояния, поэтому после любого числа кругов и после паузы вне
 * экрана рассинхрона быть не может — кадр сам говорит, где он.
 * `active: false` — эффектов нет, страница снимает свои переменные.
 */
export function loopFx(t) {
  const u = t - HIT_S;
  if (u < 0 || u > FX_END_S + 0.05) return { active: false };
  let alpha = Math.min(1, u / MARK_FADE_IN_S);
  if (u > MARK_HOLD_S) alpha = Math.max(0, 1 - (u - MARK_HOLD_S) / MARK_FADE_OUT_S);
  return {
    active: true,
    word: along(WORD_CURVE, u),
    mark: along(MARK_CURVE, u),
    alpha,
  };
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
