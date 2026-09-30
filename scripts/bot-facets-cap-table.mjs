// bot-facets-cap-table.mjs — сводная таблица «до/после» из двух прогонов bot-facets-cap-recon.mjs.
// ЗАПУСК: node scripts/bot-facets-cap-table.mjs > docs/bot-facets-cap/out/table.md
import { readFileSync } from 'node:fs';

const D = new URL('../docs/bot-facets-cap/out/', import.meta.url).pathname;
const b = JSON.parse(readFileSync(D + 'bot-cap-before.json', 'utf8'));
const a = JSON.parse(readFileSync(D + 'bot-cap-after.json', 'utf8'));
const f = (x) => (100 * x).toFixed(1);
const s = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const flag = (v) => (v > 0.8 || v < 0.2 ? ' ⚠' : '');
let out = `botFacetsMax: ${b.botFacetsMax} → ${a.botFacetsMax} · боёв на ядро: ${b.seeds} · ⚠ = доля за пределами 80/20\n`;

for (const tier of [7, 5]) {
  out += `\n**Игрок: ${tier} зажжённых кристаллов**\n\n`;
  out += '| Ядро игрока | Победы до, % | Победы после, % | Δ п.п. | Длина до, с | Длина после, с | Δ с | Бои >100 с до/после |\n|---|---|---|---|---|---|---|---|\n';
  for (const x of b.sets.filter((r) => r.playerTier === tier)) {
    const y = a.sets.find((r) => r.playerTier === tier && r.core === x.core);
    out += `| ${x.name} | ${f(x.winRate)}${flag(x.winRate)} | ${f(y.winRate)}${flag(y.winRate)} | ${s(100 * (y.winRate - x.winRate))} | ${x.meanSec.toFixed(1)} | ${y.meanSec.toFixed(1)} | ${s(y.meanSec - x.meanSec)} | ${x.capped}/${y.capped} |\n`;
  }
}
const avg = (d, t) => { const r = d.sets.filter((x) => x.playerTier === t); return r.reduce((q, x) => q + x.winRate, 0) / r.length; };
out += `\nСреднее по четырём ядрам: игрок 7 — ${f(avg(b, 7))} → ${f(avg(a, 7))}; игрок 5 — ${f(avg(b, 5))} → ${f(avg(a, 5))}\n`;

for (const [lab, d] of [['до', b], ['после', a]]) {
  const agg = {};
  for (const r of d.sets.filter((x) => x.playerTier === 7)) {
    for (const [k, v] of Object.entries(r.byBotLit)) {
      agg[k] = agg[k] || { n: 0, w: 0 };
      agg[k].n += v.n; agg[k].w += v.n * v.winRate;
    }
  }
  out += `\nПобеды игрока(7) по числу кристаллов у бота, ${lab}: ` +
    Object.entries(agg).map(([k, v]) => `${k}: ${(100 * v.w / v.n).toFixed(0)}% (n=${v.n})`).join(' · ') + '\n';
}
console.log(out);
