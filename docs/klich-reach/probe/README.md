# Как повторить приёмку клича (зонд НЕ живёт в коде игры)

Зонд — журнал решений стороны 'player' внутри `chooseIntentionSpinal` (`src/data/intentions.js`) и поле `side` у бойца (`src/scene/buildFighter.js`).
Патч ставится **только в отдельной копии дерева**; на чистой копии с патчем повтор 20 зёрен совпал с сырыми данными, бой патч не меняет (пишет только журнал).

1. `git worktree add --detach /tmp/wt claude/klich-reach` и `ln -s <репо>/node_modules /tmp/wt/node_modules`
2. `cd /tmp/wt && git apply <репо>/docs/klich-reach/probe/decisions-probe.patch`
3. Свип: из репозитория `WT=/tmp/wt node scripts/klich-reach-run.mjs 0,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9` (вес 0 = прежнее поведение, только оси; потолки: PUSH/HOLD 0.5, FALL BACK 0.9 — остальное справка).
   Свежие зёрна с выбранными весами: `node scripts/klich-reach-run.mjs final --seeds=201-400 --pick=push:0.45,fallback:0.75,hold:0.3`.
   Каждая задача «вес × ядро игрока» = 200 зёрен × 4 врага × (бой без клича + 3 клича); ≈ 10 с на 100 боёв на процесс, вся работа ≈ 25 мин на 4 ядрах.
4. Г5: `cp scripts/klich-reach-replace.mjs /tmp/wt/scripts/ && cd /tmp/wt && OUT_DIR=<репо>/docs/klich-reach/out/ node scripts/klich-reach-replace.mjs`
5. Клич против тегов: копия с `probe/tags-probe.patch` (вместо `decisions-probe.patch`), `WT=… node scripts/klich-reach-tags-run.mjs push:0.45,fallback:0.75,hold:0.3`.
6. Свод по сырым данным (копия не нужна): `KLICH_W=push:0.45 PICK_LABEL=final2 node scripts/klich-reach-report.mjs` → `out/sweep_perklich.md`, `final_set1.md`, `final_set2.md`, `combined.md`, `tags.md`, `summary.json`.
7. Г2: на чистом дереве (без патча) `node scripts/fight-regression.mjs` и `node scripts/fight-regression-builds.mjs` — суммы `ec148d29…86400c` и `5b0a65d4…bd27`.
