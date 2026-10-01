// balance-fix-ceiling-check.mjs — СТОРОЖ ПОТОЛКА ШКАЛ (TZ_balance_fix_v2, А3). Для каждой полной грани (5 из 5) считает старт + сумму сдвигов по каждой оси
// без зажима и с зажимом 0/100: «потеря» = то, что записано в данных и показано на карточке, но не дошло до бойца. Должно быть 0 везде.
// ЗАПУСК: node scripts/balance-fix-ceiling-check.mjs   (код выхода 1, если где-то есть потеря)
import { createServer } from 'vite';
const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { alias: { '@': new URL('../src', import.meta.url).pathname } } });
const { CRYSTALS, CORES } = await server.ssrLoadModule('/src/data/upgradeData.js');
const { startProfile, AXIS_IDS, resolveBehavior } = await server.ssrLoadModule('/src/data/behavior.js');
let bad = 0; const rows = [];
for (const c of CORES) for (const br of CRYSTALS[c.id]) {
  const start = startProfile(c.id); const sum = {};
  for (const f of br.faces) for (const sh of f.shifts) sum[sh.axis] = (sum[sh.axis] || 0) + sh.delta;
  const fin = resolveBehavior(c.id, br.faces).axes;
  for (const ax of AXIS_IDS) if (sum[ax]) {
    const raw = start[ax] + sum[ax]; const loss = Math.abs(raw - fin[ax]);
    rows.push(`${c.name.padEnd(10)} ${br.name.padEnd(8)} ${ax.padEnd(10)} старт ${String(start[ax]).padStart(3)}  Σ ${String(sum[ax]).padStart(4)}  без зажима ${String(raw).padStart(4)}  итог ${String(fin[ax]).padStart(3)}  потеря ${loss}`);
    if (loss > 0) bad++;
  }
}
console.log(rows.join('\n'));
console.log(bad ? `\nПОТЕРЯ в ${bad} осях` : '\nпотерь нет');
await server.close();
process.exit(bad ? 1 : 0);
