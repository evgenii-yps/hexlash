# База регрессии боя (с 29.09.2026)

`node scripts/fight-regression.mjs` → **`ec148d29dba29092ab735e129779a37e60bcb1b124b79cc093da79ff9e86400c`** (48 боёв). Полный вывод — `fight-regression-baseline.txt` рядом.

Прежняя сумма `017fb79b01a86b5953c04d13232f3d7fada96216a4c03df2791961d929f67b13` **больше не действует**: бой изменён намеренно (TZ_combat_distance_v1, коммит `d27d6de`). Сравнивать с ней бессмысленно.

Проверка: `node scripts/fight-regression.mjs > after.txt && diff docs/combat-distance/fight-regression-baseline.txt after.txt` — пусто, пока бой не менялся.
