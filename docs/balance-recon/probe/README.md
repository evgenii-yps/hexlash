# Как повторить разведку баланса (зонд НЕ живёт в коде игры)

Зонд (`need-probe.patch`) — наблюдатель решений бойца-игрока внутри `chooseIntentionSpinal` (`src/data/intentions.js`): виды жёсткой нужды, очки всех
намерений с отметкой сработавших наклонов, контрфакты — плюс одно поле `side` у бойца (`src/scene/buildFighter.js`). Патч ставится **только в отдельной
копии дерева** (`git worktree`), в `src/` игры не попадает. Проверено: с патчем (зонд выключен и включён) обе регрессионные суммы те же —
`ec148d29…86400c` и `5b0a65d4…bd27`; включённый зонд побитово не меняет исходы боёв (сверка `naked` и `need` на одних зёрнах).

1. `git worktree add --detach /tmp/wt d9327e02` и `ln -s <репо>/node_modules /tmp/wt/node_modules`
2. `cd /tmp/wt && git apply <репо>/docs/balance-recon/probe/need-probe.patch`
3. Из репозитория (не из копии): `WT=/tmp/wt node scripts/balance-recon-run.mjs <этап> [--conc=4] [--seeds=1-200,201-400] [--only=подстрока]`. Этапы:
   - без зонда (идут в самом репозитории): `naked` · `buff` · `combo` · `timing` · `skew` · `harm` · `negbranch` · `builds`
   - с зондом (идут в копии): `need` · `gap` · `klichwin` · `replace`
   Драйвер кладёт воркер в копию сам, пропускает готовые задачи (можно продолжать после обрыва). Сырьё — `docs/balance-recon/out/raw/*.json`.
4. Свод (копия не нужна): `node scripts/balance-recon-static.mjs` (пп. 2, 5, 6, 8, 9: данные кристаллов + данные перезамера),
   `node scripts/balance-recon-report-a.mjs` (пп. 1, 3), `…-report-b.mjs` (пп. 4, 6а, 7, 8, 9, 10), `…-report-c.mjs` (пп. 11–14),
   `node scripts/balance-recon-assemble.mjs` (склейка `REPORT.md` из `REPORT.template.md` и `out/*.md`; ничего не считает).
5. Какие рычаги меняют контрольные суммы: `python3 <скрипт> <копия> <выход>` — см. `out/lever-sums.json` (каждая правка накладывается на копию и откатывается).
6. Регрессии (чистое дерево): `node scripts/fight-regression.mjs`, `node scripts/fight-regression-builds.mjs`.

Объём: бой ≈ 25 мс; весь прогон ≈ 450 тыс. боёв ≈ 3 ч процессорного времени (≈ 1 ч на 4 процессах).
