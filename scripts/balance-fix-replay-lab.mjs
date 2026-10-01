// balance-fix-replay-lab.mjs — «ЛАБОРАТОРИЯ ПОВТОРА» (TZ_balance_fix_v2): доля решений, которые меняет кристалл, без боёв.
// Берёт записи решений голого ядра (balance-fix-replay-record.mjs → docs/balance-fix/out/<тег>/replay/<ядро>.json) и гонит их через НАСТОЯЩУЮ
// chooseIntentionSpinal дважды: «как будто кристалла нет» (оси ядра, наклонов нет) и «с кристаллом» (оси ядра + сдвиги кристалла, его наклоны).
// Доля решений, где выбор разошёлся, — тот же показатель, что chgAll в перезамере кристаллов (Ц4: ≥ 5%). Состояния взяты из боёв голого ядра,
// поэтому оценка слегка отличается от боя с самим кристаллом (тот меняет траекторию), но порядок и масштаб верны; окончательный счёт — в пересъёме.
//   использование: import { openLab } from './balance-fix-replay-lab.mjs'; const lab = await openLab(tag); lab.flipRate(core, faces | {axes, leans})
//   CLI: node scripts/balance-fix-replay-lab.mjs <тег> — таблица по всем 60 кристаллам (оценка Ц4) на текущих данных.
import { createServer } from 'vite';
import { readFileSync, existsSync } from 'node:fs';

export async function openLab(tag) {
  const root = new URL('..', import.meta.url).pathname;
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { alias: { '@': root + 'src' } } });
  const load = (p) => server.ssrLoadModule(p);
  const { chooseIntentionSpinal } = await load('/src/data/intentions.js');
  const { resolveBehavior, startProfile, AXIS_IDS } = await load('/src/data/behavior.js');
  const { CRYSTALS, CORES } = await load('/src/data/upgradeData.js');
  const n01 = (axes) => Object.fromEntries(AXIS_IDS.map((k) => [k, Math.max(0, Math.min(100, axes[k])) / 100]));
  const snaps = {};
  for (const c of CORES.map((x) => x.id)) {
    const f = `${root}docs/balance-fix/out/${tag}/replay/${c}.json`;
    if (existsSync(f)) snaps[c] = JSON.parse(readFileSync(f, 'utf8')).recs;
  }
  const mk = (rec, ax01, leans) => ({ ...rec.self, ax01, leans, side: 'player', blocking: false, staggered: false, model: null, klich: null });
  /** variant: массив кристаллов (faces) ИЛИ готовое поведение { axes, leans }. Возвращает долю изменённых решений и разложение. */
  function flipRate(core, variant, opts = {}) {
    const recs = snaps[core]; if (!recs) throw new Error('нет записи решений для ' + core);
    const beh = Array.isArray(variant) ? resolveBehavior(core, variant) : variant;
    const bareAx = n01(startProfile(core)), varAx = n01(beh.axes);
    let chg = 0, chgAx = 0, chgLn = 0, need = 0, tagOn = 0; const to = {};
    for (const r of recs) {
      const foe = r.foe, memory = r.memory, fight = r.fight;
      const bare = chooseIntentionSpinal(mk(r, bareAx, null), foe, memory, fight);
      const full = chooseIntentionSpinal(mk(r, varAx, beh.leans || []), foe, memory, fight);
      if (r.kind) need++;
      if (full !== bare) { chg++; const k = bare + '>' + full; to[k] = (to[k] || 0) + 1; }
      if (opts.split) {
        if (chooseIntentionSpinal(mk(r, varAx, null), foe, memory, fight) !== bare) chgAx++;
        if (chooseIntentionSpinal(mk(r, bareAx, beh.leans || []), foe, memory, fight) !== bare) chgLn++;
      }
    }
    const n = recs.length;
    return { n, chg: chg / n, chgAx: chgAx / n, chgLn: chgLn / n, need: need / n, to };
  }
  return { server, flipRate, snaps, load, CRYSTALS, CORES, resolveBehavior, close: () => server.close() };
}

if (process.argv[1] && process.argv[1].endsWith('balance-fix-replay-lab.mjs')) {
  const tag = process.argv[2];
  const lab = await openLab(tag);
  const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
  const rows = []; let ok = 0;
  for (const core of lab.CORES.map((c) => c.id)) for (const br of lab.CRYSTALS[core]) for (const f of br.faces) {
    const r = lab.flipRate(core, [f], { split: true });
    rows.push(`| ${NAME[core]} | ${br.name}/${f.id} ${f.name} | ${(100 * r.chg).toFixed(1)} | ${(100 * r.chgAx).toFixed(1)} | ${(100 * r.chgLn).toFixed(1)} | ${r.chg >= 0.05 ? 'да' : '**нет**'} |`);
    if (r.chg >= 0.05) ok++;
  }
  console.log('| ядро | кристалл | решений меняет, % | только оси, % | только наклон, % | ≥5% |\n| --- | --- | --- | --- | --- | --- |\n' + rows.join('\n'));
  console.log(`\n≥ 5%: ${ok} из 60`);
  await lab.close();
}
