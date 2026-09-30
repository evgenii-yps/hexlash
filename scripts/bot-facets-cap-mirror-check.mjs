// bot-facets-cap-mirror-check.mjs — у копии «ЗЕРКАЛО» столько же зажжённых, сколько у бойца (строка presetMirror из SparView).
// ЗАПУСК: node scripts/bot-facets-cap-mirror-check.mjs
import { openHarness, seedRandom } from './lib/bout-harness.mjs';
const H = await openHarness();
const { buildTree, litIdsOf, countLit } = await H.load('/src/data/upgradeTree.js');
const { randomLitIds } = await H.load('/src/data/foeCompose.js');
const { CORES, RESOURCE } = await H.load('/src/data/upgradeData.js');
const { COMBAT_BALANCE } = await H.load('/src/data/combatBalance.js');
console.log('RESOURCE', RESOURCE, 'botFacetsMax', COMBAT_BALANCE.collapse.botFacetsMax);
seedRandom(5);
for (const c of CORES) {
  const mine = buildTree(c.id, randomLitIds(c.id, 7, Math.random));
  const mirror = buildTree(c.id, litIdsOf(mine));   // ровно строка presetMirror() из SparView
  console.log(c.id, 'игрок', countLit(mine), 'зеркало', countLit(mirror), JSON.stringify(litIdsOf(mine)) === JSON.stringify(litIdsOf(mirror)) ? 'тот же набор' : 'НАБОР РАЗЛИЧАЕТСЯ');
}
await H.server.close();
