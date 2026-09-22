// fight-regression.mjs — ДОКАЗАТЕЛЬСТВО «БОЙ НЕ ИЗМЕНИЛСЯ».
//
// ЗАЧЕМ. Работа по баффам вскрывает защищённые файлы боя. Обещание при этом
// одно: пока бафф не брошен, бой считается ровно как считался. Проверить это
// глазами нельзя — бой каждый раз разный. Поэтому здесь бой считается с
// ЗАЖАТЫМ зерном случайности: при одном и том же зерне он обязан повториться
// шаг в шаг, и снимок «до правки» обязан совпасть со снимком «после».
//
// ЧЕМ СЧИТАЕТСЯ. Мгновенным боём (scene/instantBout.js) — тот же боец, та же
// обвязка, те же числа, только без отрисовки. Своей арифметики здесь нет.
//
// КАК ПОЛЬЗОВАТЬСЯ:
//   node scripts/fight-regression.mjs > before.txt   (до правки)
//   node scripts/fight-regression.mjs > after.txt    (после)
//   diff before.txt after.txt                        (должно быть пусто)
//
// ⚠️ БАФФЫ ЗДЕСЬ НЕ УЧАСТВУЮТ ВОВСЕ. Прогон меряет именно «без баффов»: если
//    новые способности выключены по умолчанию, числа обязаны совпасть.
import { createServer } from 'vite';
import { createHash } from 'node:crypto';

// Зерно случайности. Свой генератор (mulberry32) подменяет Math.random на
// время прогона — иначе бой каждый раз новый и сравнивать нечего.
function seedRandom(seed) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


// Заглушка холста. Боец рисует свои картинки (плашка здоровья, искра) через
// canvas, а в Node его нет. На расчёт боя картинки не влияют ВООБЩЕ — они
// только рисуются, — поэтому здесь стоит пустышка, которая молча всё принимает.
function installCanvasStub() {
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const ctx = new Proxy({}, {
    get: (_t, k) => {
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => gradient;
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
      if (k === 'canvas') return canvasOf(1, 1);
      return typeof k === 'string' ? noop : undefined;
    },
    set: () => true,
  });
  const canvasOf = (w, h) => ({
    width: w, height: h, style: {},
    getContext: () => ctx,
    toDataURL: () => 'data:,',
  });
  globalThis.document = {
    createElement: (tag) => (tag === 'canvas' ? canvasOf(1, 1) : { style: {}, appendChild: noop }),
  };
  globalThis.window = globalThis.window || { devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) };
}
installCanvasStub();

const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
const SEEDS = [1, 7, 12345];

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  resolve: { alias: { '@': new URL('../src', import.meta.url).pathname } },
});

const { runInstantBout } = await server.ssrLoadModule('/src/scene/instantBout.js');
const { resolveBehavior } = await server.ssrLoadModule('/src/data/behavior.js');

const lines = [];
let n = 0;
for (const seed of SEEDS) {
  for (const a of CORES) {
    for (const b of CORES) {
      seedRandom(seed * 1000 + n);
      const specs = [
        { sideId: 'player', coreId: a, behavior: resolveBehavior(a), side: 'player', pos: { x: -1.2, z: 0 } },
        { sideId: 'foe', coreId: b, behavior: resolveBehavior(b), side: 'opponent', pos: { x: 1.2, z: 0 } },
      ];
      const r = runInstantBout(specs);
      const hp = r.units.map((u) => `${u.sideId}:${u.hp.toFixed(6)}`).join(' ');
      lines.push(`seed=${seed} #${n} ${a} vs ${b} -> winner=${r.winner} sec=${r.sec.toFixed(4)} capped=${r.capped} ${hp}`);
      n += 1;
    }
  }
}

const body = lines.join('\n');
console.log(body);
console.log('---');
console.log('fights:', n);
console.log('checksum:', createHash('sha256').update(body).digest('hex'));
await server.close();
