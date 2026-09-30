# Как повторить замер (зонд НЕ живёт в коде игры)

Зонд — это счётчик внутри `chooseIntentionSpinal` (`src/data/intentions.js`). Он подмешивается патчем **только в отдельной копии дерева**
(`git worktree add --detach /tmp/wt HEAD`), в `src/` игры не попадает ни при каких условиях.

1. `git worktree add --detach /tmp/wt <коммит>` + `ln -s <репо>/node_modules /tmp/wt/node_modules`
2. `cd /tmp/wt && patch -p0 < docs/reflex-sight/probe/intentions-probe.patch` (или `git apply`)
3. Зонд решений: `SEEDS=200 LABEL=x SECTIONS=blind,foes node scripts/reflex-sight-probe.mjs` (`BEND=0.25` — другая сила изгиба)
4. Зонд клича: `SEEDS=200 LABEL=x node scripts/reflex-sight-klich.mjs`
5. Без патча (чистое дерево): `scripts/reflex-sight-controls.mjs` (MODE=pairs NOSWAP=1 / seven / wins), `scripts/reflex-sight-extremes.mjs`,
   `scripts/fight-regression.mjs`, `scripts/fight-regression-builds.mjs`, `scripts/motion-recon.mjs <метка> occupancy`.
6. Гипотеза «82.8% держались на жёсткой ловле»: патч + `node --import flags-nocatch.mjs scripts/bot-facets-cap-recon.mjs <метка>`, где
   `flags-nocatch.mjs` = `globalThis.__PROBE = { on: false, noHardCatch: true };` (выключает жёсткую ловлю у всех бойцов).
7. Сводка «до / после»: `node scripts/reflex-sight-report.mjs before after`.
