// Общая цветокоррекция ролика: ОДНА на все игровые кадры, параметры — данные в сценарии (plan.grade).
// Работает в RGB до перехода в YUV (ffmpeg: lutrgb + colorchannelmixer, 16 бит — без двойного округления тёмных тонов).
//
// Модель (значения v — как в кадре, sRGB 0…1):
//   1) баланс:      v_c  *= balance[c]
//   2) тон:         v    = pivot * ((v / pivot) ^ gamma)  для v ≤ pivot… нет — проще: v = v ^ gamma (чёрный и белый остаются на месте)
//   3) контраст:    v    = pivot + (v − pivot) * contrast
//   4) яркость:     v   += brightness          (чёрный сдвигается — по умолчанию 0: фон остаётся «почти чёрным»)
//   5) насыщенность: v   = L + sat * (v − L),  L = 0,2126 R + 0,7152 G + 0,0722 B
export function isIdentity(g) {
  return !g || (g.gamma === 1 && g.contrast === 1 && g.brightness === 0 && g.saturation === 1 && g.balance.every((x) => x === 1));
}

/** Применение к одному пикселю — то же, что делает ffmpeg (нужно замеру и «до/после» по цифрам). */
export function applyGrade(g, [r, gg, b]) {
  if (isIdentity(g)) return [r, gg, b];
  const ch = (v, k) => {
    v = Math.min(1, Math.max(0, v * g.balance[k]));
    v = Math.pow(v, g.gamma);
    v = g.pivot + (v - g.pivot) * g.contrast;
    v = v + g.brightness;
    return Math.min(1, Math.max(0, v));
  };
  const R = ch(r, 0), G = ch(gg, 1), B = ch(b, 2);
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B, s = g.saturation;
  const cl = (v) => Math.min(1, Math.max(0, v));
  return [cl(L + s * (R - L)), cl(L + s * (G - L)), cl(L + s * (B - L))];
}

/** Фрагмент цепочки фильтров ffmpeg (с лидирующей запятой) или '' для тождественной коррекции. */
export function gradeFilter(g) {
  if (isIdentity(g)) return '';
  const f = (x) => Number(x.toFixed(6));
  const lut = (k) => `${'rgb'[k]}='clip((${f(g.pivot)}+(pow(clip(val/maxval*${f(g.balance[k])},0,1),${f(g.gamma)})-${f(g.pivot)})*${f(g.contrast)}+${f(g.brightness)})*maxval,0,maxval)'`;
  const s = g.saturation, [wr, wg, wb] = [0.2126, 0.7152, 0.0722];
  const m = (row) => [0, 1, 2].map((c) => f((c === row ? s : 0) + (1 - s) * [wr, wg, wb][c]));
  const [rr, rg, rb] = m(0), [gr, gg, gb] = m(1), [br, bg, bb] = m(2);
  // lutrgb работает с GBRP; 16 бит — чтобы тёмные тона не округлялись дважды
  return `,format=gbrp16le,lutrgb=${lut(0)}:${lut(1)}:${lut(2)},colorchannelmixer=rr=${rr}:rg=${rg}:rb=${rb}:gr=${gr}:gg=${gg}:gb=${gb}:br=${br}:bg=${bg}:bb=${bb}`;
}
