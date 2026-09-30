// TZ_apex_gate_v1, п.2 — перебор всех наборов «7 из 15» на каждое ядро: сколько допустимых (вершина
// только при четырёх нижних своей грани), сколько с двумя резонансами, сколько с вершиной.
// ГРАНЬ = ветка (crystal a/b/c), КРИСТАЛЛ = шаг (face 1..5). Только арифметика, боёв нет.
import { openHarness } from './lib/bout-harness.mjs';
const H = await openHarness(); const { load } = H;
const { CRYSTALS, CORES, RESOURCE } = await load('/src/data/upgradeData.js');
const { resolveLeans } = await load('/src/data/branchThreshold.js');
const { withoutClosedApex } = await load('/src/data/apexGate.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const TH = COMBAT_BALANCE.grani.threshold;
const out = [];
const tot = { all: 0, valid: 0, two: 0, apex: 0, apexTwo: 0, apexMulti: 0, res0: 0, res1: 0, res2: 0, clean52: 0 };
for (const core of CORES) {
  const faces = [];
  for (const cr of CRYSTALS[core.id]) for (const f of cr.faces) faces.push(f);
  const n = faces.length;
  const row = { core: core.name, all: 0, valid: 0, res0: 0, res1: 0, res2: 0, apex: 0, apexTwo: 0, apexMulti: 0, pat: {} };
  const idx = [];
  const rec = (start, left) => {
    if (left === 0) {
      row.all++;
      const set = idx.map((i) => faces[i]);
      if (withoutClosedApex(set).length !== set.length) return; // нарушает запрет
      row.valid++;
      const cnt = { a: 0, b: 0, c: 0 };
      for (const f of set) cnt[f.branch]++;
      const nres = Object.values(cnt).filter((v) => v >= TH).length;
      row['res' + nres]++;
      const apexes = set.filter((f) => f.id === 5).length;
      if (apexes) { row.apex++; if (nres >= 2) row.apexTwo++; if (apexes > 1) row.apexMulti++; }
      const key = Object.values(cnt).sort((x, y) => y - x).join('+');
      const k = key + (apexes ? '*' : '');
      row.pat[k] = (row.pat[k] || 0) + 1;
      // проверка: resolveLeans видит ту же картину резонансов
      const r = resolveLeans(core.id, set);
      if ((r.resonance?.length ?? nres) !== nres && r.resonance) row.mismatch = (row.mismatch || 0) + 1;
      return;
    }
    for (let i = start; i <= n - left; i++) { idx.push(i); rec(i + 1, left - 1); idx.pop(); }
  };
  rec(0, RESOURCE);
  out.push(row);
  for (const k of ['all', 'valid', 'apex', 'apexTwo', 'apexMulti', 'res0', 'res1', 'res2']) tot[k] += row[k];
}
console.log(JSON.stringify({ RESOURCE, TH, rows: out, tot }, null, 1));
await H.server.close();
