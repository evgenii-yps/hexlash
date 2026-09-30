# Как повторить приёмку клича (зонд НЕ живёт в коде игры)

Зонд — журнал решений стороны 'player' внутри `chooseIntentionSpinal` (`src/data/intentions.js`) и поле `side` у бойца (`src/scene/buildFighter.js`).
Патч ставится **только в отдельной копии дерева**; на чистой копии с патчем повтор 20 зёрен совпал с сырыми данными, бой патч не меняет (пишет только журнал).

1. `git worktree add --detach /tmp/wt claude/klich-reach` и `ln -s <репо>/node_modules /tmp/wt/node_modules`
2. `cd /tmp/wt && git apply <репо>/docs/klich-reach/probe/decisions-probe.patch`
3. Свип: из репозитория `WT=/tmp/wt node scripts/klich-reach-run.mjs 0,0.1,0.15,0.2,0.3,0.4,0.5,0.6,0.7,0.8,1` (веса выше 0.5 — справка; вес 0 = прежнее поведение, только оси).
   Каждая задача «вес × ядро игрока» = 200 зёрен × 4 врага × (бой без клича + 3 клича); ≈ 10 с на 100 боёв на процесс, вся работа ≈ 25 мин на 4 ядрах.
4. Г5: `cp scripts/klich-reach-replace.mjs /tmp/wt/scripts/ && cd /tmp/wt && OUT_DIR=<репо>/docs/klich-reach/out/ node scripts/klich-reach-replace.mjs`
5. Свод по сырым данным (копия не нужна): `WEIGHT=0.4 node scripts/klich-reach-report.mjs` → `out/sweep.md`, `out/chosen_w<вес>.md`, `out/summary.json`.
6. Г2: на чистом дереве (без патча) `node scripts/fight-regression.mjs` и `node scripts/fight-regression-builds.mjs` — суммы `ec148d29…86400c` и `5b0a65d4…bd27`.
