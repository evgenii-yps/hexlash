// bout-harness.mjs — ОБЩИЙ ПРЕЛЮД ДЛЯ ЗАМЕРОВ БОЯ. Мгновенный бой без рендера, зерно,
// заглушка холста, прогрев, дуэль из НАСТОЯЩИХ точек выхода.
//
// ТОЧКИ ВЫХОДА ДУЭЛИ — те же, что в ArenaScene (`HISTORIC_POS`): игрок (0.45, 1.3),
// соперник (−0.65, −1.4), то есть 2.9 ед. по глубине плиты. Прежний
// scripts/balance-recon.mjs ставил бойцов на (∓1.2, 0) — не как в игре.
//
// ПРОГРЕВ обязателен: первый бой процесса не совпадает с тем же боем позже.
import { createServer } from 'vite';

export function seedRandom(seed) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function installCanvasStub() {
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const ctx = new Proxy({}, {
    get: (_t, k) => {
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => gradient;
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
      return typeof k === 'string' ? noop : undefined;
    },
    set: () => true,
  });
  const canvasOf = (w, h) => ({ width: w, height: h, style: {}, getContext: () => ctx, toDataURL: () => 'data:,' });
  globalThis.document = { createElement: (tag) => (tag === 'canvas' ? canvasOf(1, 1) : { style: {}, appendChild: noop }) };
  globalThis.window = globalThis.window || { devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) };
}

export const GAME_DUEL_POS = { player: { x: 0.45, z: 1.3 }, foe: { x: -0.65, z: -1.4 } };

export async function openHarness() {
  installCanvasStub();
  const server = await createServer({
    configFile: false, appType: 'custom', logLevel: 'error',
    resolve: { alias: { '@': new URL('../../src', import.meta.url).pathname } },
  });
  const load = (p) => server.ssrLoadModule(p);
  const { runInstantBout, INSTANT_DT } = await load('/src/scene/instantBout.js');
  const { resolveBehavior } = await load('/src/data/behavior.js');
  const strike = await load('/src/services/buffStrike.js');
  const { CORES } = await load('/src/data/upgradeData.js');
  const CORE_IDS = CORES.map((c) => c.id);

  /** Одна дуэль. Игрок — coreA (sideId 'player'), соперник — coreB ('foe'). swap меняет
   *  порядок в списке и точки выхода местами. */
  function duel({ seed, coreA, coreB, behA = null, behB = null, swap = false, onStep = null, posA = GAME_DUEL_POS.player, posB = GAME_DUEL_POS.foe }) {
    seedRandom(seed);
    const a = { sideId: 'player', coreId: coreA, behavior: behA || resolveBehavior(coreA), side: 'player', pos: swap ? posB : posA };
    const b = { sideId: 'foe', coreId: coreB, behavior: behB || resolveBehavior(coreB), side: 'opponent', pos: swap ? posA : posB };
    const r = runInstantBout(swap ? [b, a] : [a, b], onStep ? { onStep } : {});
    strike.clearAllDiceCharges();
    const win = r.units.find((u) => u.sideId === r.winner);
    return { winner: r.winner, sec: r.sec, capped: r.capped, winHp01: win ? win.hp / win.maxHp : 0 };
  }

  // ПРОГРЕВ.
  for (const a of CORE_IDS) for (const b of CORE_IDS) duel({ seed: 999, coreA: a, coreB: b });
  strike.clearAllDiceCharges();

  return { server, load, duel, CORE_IDS, INSTANT_DT, resolveBehavior, strike, runInstantBout };
}

export const sorted = (xs) => [...xs].sort((a, b) => a - b);
export function quantile(xs, q) {
  if (!xs.length) return NaN;
  const s = sorted(xs); const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (xs) => quantile(xs, 0.5);
export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
