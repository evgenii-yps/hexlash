# Как повторить перезамер кристаллов (зонд НЕ живёт в коде игры)

Зонд — счётчик решений внутри `chooseIntentionSpinal` (`src/data/intentions.js`) плюс одно поле `side` у бойца (`src/scene/buildFighter.js`).
Он ставится патчем **только в отдельной копии дерева** (`git worktree`), в `src/` игры не попадает. Проверено: с патчем (зонд выключен и включён
с контрфактами) обе регрессионные суммы те же — `ec148d29…86400c` и `5b0a65d4…bd27`.

1. `git worktree add --detach /tmp/wt cad3c631` и `ln -s <репо>/node_modules /tmp/wt/node_modules`
2. `cd /tmp/wt && git apply <репо>/docs/crystal-remeasure/probe/decisions-probe.patch`
3. Из репозитория (не из копии): `WT=/tmp/wt node scripts/crystal-remeasure-run.mjs <этап>`; драйвер сам кладёт воркер в копию, гонит 4 процесса,
   пропускает готовые задачи. Этапы по порядку:
   - `zerocheck` — 16 пар голых ядер × 200 зёрен без чередования сторон (сверка с 25.07% / 51.87 с / 83.03 с)
   - `zero` — голые ядра × 4 врага, 5 блоков по 200 зёрен (нулевой замер и шум)
   - `solo` — часть A, 60 ячеек
   - `amp` — усиление ×3 (список `out/amp-list.json` пишет `crystal-remeasure-report.mjs solo`)
   - `chan` — разложение ×3 по каналам (список `out/chan-list.json` пишет `crystal-remeasure-report.mjs amp`)
   - `build` — часть B, 12 полных ветвей + 60 «ветвь без одного»
4. `node scripts/crystal-remeasure-input.mjs` — вход каждого кристалла (запись в данных, факт после зажима, рычаги, теги).
5. Свод (без копии, по сырым данным из `out/raw`): `node scripts/crystal-remeasure-report.mjs noise | solo | amp | chan | build | final`.
   Пороги вердикта — `THRESH` в `scripts/crystal-remeasure-lib.mjs`; поменять и перезапустить шаги — новый прогон боёв не нужен.
6. Регрессии (чистое дерево): `node scripts/fight-regression.mjs`, `node scripts/fight-regression-builds.mjs`.

Сырые данные: `out/raw/*.json` — по задаче: по-зёрновые исходы (`w`, `sec`, `hp`, отпечаток траектории `tj`) и суммы по боям (тело, решения, счётчики
контрфактов), по каждому врагу. Объём прогона: ~30 мс на бой, вся работа ≈ 25 мин на 4 ядрах.
