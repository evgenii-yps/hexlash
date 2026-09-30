# Перезамер кристаллов на новом бое

> **База `cad3c631`**, поверх `5530f904` лежат 7 коммитов зала FORGE; они меняют только `src/components/forge/ForgePanel.vue`, `src/scene/PveScene.vue`, `src/scene/forgeProps.js`, `src/styles/forge.css`, `src/views-v2/PveView.vue` (и скрипты/снимки зала) — файлы боя (`src/scene/buildFighter.js`, `instantBout.js`, `boutCore.js`, `battleField.js`, вся `src/data/`: `intentions.js`, `combatBalance.js`, `upgradeData.js`, `branchThreshold.js`, `behavior.js`) и данные кристаллов не тронуты; обе регрессионные суммы совпали.

## Главное

Замеряно: 60 ячеек «ядро × кристалл» в одиночку (48 000 боёв), 72 сборки внутри своих веток (57 600 боёв), ещё 33 ячейки с усилением ×3 (26 400 боёв) и разложение ×3 по каналам у 17 «глухих» ячеек (23 200 боёв). Везде 200 зёрен на пару «ячейка × враг», враги — все четыре ядра без кристаллов, включая своё. Код игры не менялся.

**1. Из 60 кристаллов:**

|  | сколько |
| --- | --- |
| меняют и исход боя, и поведение | 27 |
| только исход (поведение в шуме) | 5 |
| только поведение (исход в шуме) | 19 |
| не меняют ничего | 9 |

Поведение «да» у 46 ячеек, но это мягкий флаг: у 19 из них кристалл меняет не меньше 5% решений о выборе намерения, у остальных 27 сдвигается только манера тела (дистанция, темп, блоки), а выбор намерений тот же.

**2. Из 33 ячеек, где хотя бы один флаг «нет»** (всего «нет» в 42 местах):

| причина | флагов | ячеек (только эта причина) |
| --- | --- | --- |
| ПУСТОЙ — вход нулевой | 0 | 0 |
| МАЛЫЙ ВЕС — при ×3 флаг появляется | 23 | 16 |
| ГЛУХОЙ КАНАЛ — при ×3 флага нет | 19 | 16 |
| у ячейки два флага с разными причинами | — | 1 |

Пустых кристаллов нет: у каждого есть хотя бы сдвиг оси после зажима. «Глухой канал» здесь в основном значит не «ничего не происходит», а «поведение меняется, выигрыш нет» — подробности у каждой ячейки в таблице ×3.

**3. По ядрам:**

- **ONSLAUGHT** — оба 7, только исход 0, только поведение 7, ничего 1; средний сдвиг +5.7 п.п.; сильнее всех BODY/GRIND Unshaken (+38.0), слабее всех MIND/TIMING Run-Down (-5.3).
- **RAIDER** — оба 7, только исход 0, только поведение 7, ничего 1; средний сдвиг +2.4 п.п.; сильнее всех WILL/STILL Killing Run (+12.0), слабее всех MIND/WATCH Fake-In (-6.1).
- **BULWARK** — оба 5, только исход 2, только поведение 2, ничего 6; средний сдвиг +8.3 п.п.; сильнее всех BODY/ANVIL Unbreakable (+25.3), слабее всех MIND/FEINT Hard Meet (+0.9).
- **AMBUSH** — оба 8, только исход 3, только поведение 3, ничего 1; средний сдвиг +8.5 п.п.; сильнее всех BODY/ANVIL Perfect Trap (+20.8), слабее всех MIND/FEINT Run 'Em Ragged (+0.8).

**4. Метки:**

- ВРЕДИТ (значимо отрицательный сдвиг): ONSLAUGHT MIND/TIMING Run-Down (-5.3); ONSLAUGHT MIND/ADAPT Cling (-5.0); RAIDER MIND/WATCH Fake-In (-6.1)
- ПЕРЕКОС (+20 п.п. и больше): ONSLAUGHT BODY/GRIND Unshaken (+38.0); ONSLAUGHT BODY/ANVIL Breakthrough (+31.1); BULWARK BODY/ANVIL Unbreakable (+25.3); AMBUSH BODY/ANVIL Perfect Trap (+20.8)
- ЗНАК ПО ВРАГУ (против одних значимо помогает, против других значимо вредит, 99% на врага): ни одной ячейки. На 200 боях против одного врага различить знак трудно; у четырёх ячеек точечные оценки разных знаков ≥ 5 п.п., но ни одна не значима.

**5. 12 вершин:** живы в одиночку — 12 из 12; живы внутри своей ветви — 9 из 12; **поглощены веткой** (в одиночку живы, внутри ветви нет) — 6: ONSLAUGHT Breakthrough, ONSLAUGHT Rampage, RAIDER Perfect Prick, RAIDER Killing Run, BULWARK Clinch, AMBUSH Phantom.

**6. Три списка для прохода по числам:**

- *Чинить данными кристалла (пустые):* таких нет.
- *Чинить весом (малый вес, при ×3 работает) — 17:* ONSLAUGHT WILL/VOW (c3) Building Momentum — ИСХОД; RAIDER BODY/GRIND (a3) Far Bounce — ИСХОД; RAIDER BODY/ANVIL (a5) Perfect Prick — ИСХОД; BULWARK BODY/GRIND (a3) Catch Breath — ПОВЕДЕНИЕ; BULWARK BODY/BREAK (a4) Dig In — ИСХОД; BULWARK MIND/WATCH (b1) Riposte — ИСХОД + ПОВЕДЕНИЕ; BULWARK MIND/TIMING (b2) Catch & Punish — ИСХОД + ПОВЕДЕНИЕ; BULWARK MIND/FEINT (b3) Hard Meet — ИСХОД + ПОВЕДЕНИЕ; BULWARK MIND/ADAPT (b4) Retaliation — ИСХОД + ПОВЕДЕНИЕ; BULWARK MIND/COLD (b5) Sea Wall — ПОВЕДЕНИЕ; BULWARK WILL/HOLD (c1) Body Shove — ИСХОД + ПОВЕДЕНИЕ; BULWARK WILL/VOW (c3) No Way Around — ПОВЕДЕНИЕ; AMBUSH BODY/DRIVE (a2) Slip Counter — ПОВЕДЕНИЕ; AMBUSH MIND/FEINT (b3) Run 'Em Ragged — ИСХОД; AMBUSH MIND/ADAPT (b4) Open Window — ПОВЕДЕНИЕ; AMBUSH WILL/SPITE (c2) Long Charge — ИСХОД + ПОВЕДЕНИЕ; AMBUSH WILL/VOW (c3) Hit the Opening — ПОВЕДЕНИЕ.
- *Чинить проводкой (глухой канал, при ×3 флага нет) — 17:* ONSLAUGHT BODY/ROOT (a1) Heavy Hit — ИСХОД [при ×3 поведение меняется, выигрыш нет]; ONSLAUGHT MIND/WATCH (b1) Hard Entry — ИСХОД [при ×3 поведение меняется, выигрыш нет]; ONSLAUGHT MIND/FEINT (b3) Cut Off — ИСХОД + ПОВЕДЕНИЕ [при ×3 не меняется ничего]; ONSLAUGHT MIND/COLD (b5) Lockdown — ИСХОД [при ×3 поведение меняется, выигрыш нет]; ONSLAUGHT WILL/HOLD (c1) Long Combo — ИСХОД [при ×3 поведение меняется, выигрыш нет]; ONSLAUGHT WILL/SPITE (c2) No Pause — ИСХОД [при ×3 поведение меняется, выигрыш нет]; ONSLAUGHT WILL/HUNGER (c4) No Breather — ИСХОД [при ×3 поведение меняется, выигрыш нет]; RAIDER BODY/ROOT (a1) Quick Out — ИСХОД [при ×3 поведение меняется, выигрыш нет]; RAIDER BODY/BREAK (a4) Clean Exchange — ИСХОД [при ×3 поведение меняется, выигрыш нет]; RAIDER MIND/TIMING (b2) Punish Reaction — ИСХОД + ПОВЕДЕНИЕ [при ×3 не меняется ничего]; RAIDER MIND/FEINT (b3) Broken Rhythm — ИСХОД [при ×3 поведение меняется, выигрыш нет]; RAIDER MIND/ADAPT (b4) Feint to Interrupt — ИСХОД [при ×3 поведение меняется, выигрыш нет]; RAIDER MIND/COLD (b5) Setup Combo — ИСХОД [при ×3 поведение меняется, выигрыш нет]; BULWARK WILL/VOW (c3) No Way Around — ИСХОД [при ×3 поведение меняется, выигрыш нет]; BULWARK WILL/HUNGER (c4) Pin — ИСХОД [при ×3 поведение меняется, выигрыш нет]; AMBUSH BODY/GRIND (a3) Punish Aggression — ИСХОД [при ×3 поведение меняется, выигрыш нет]; AMBUSH BODY/BREAK (a4) Punish Whiff — ИСХОД [при ×3 поведение меняется, выигрыш нет].

**Отдельно, про ветки целиком:** в 9 ячейках внутри своей ветви **ни один из 800 боёв не отличается** от боя без этого кристалла (ONSLAUGHT Run-Down, ONSLAUGHT Cut Off, ONSLAUGHT Cling, ONSLAUGHT Long Combo, ONSLAUGHT No Pause, BULWARK No Way Around, AMBUSH Hard Counter, AMBUSH Long Slip, AMBUSH Hard to Reach): их сдвиги осей уже съедены зажимом 0/100, который выставили соседи по ветке и само ядро.

---

## Как читать

- ГРАНЬ = ветвь (BODY / MIND / WILL, в коде `crystal`, a / b / c). КРИСТАЛЛ = шаг 1…5 внутри грани (в коде `face`). ВЕРШИНА = шаг 5. Ячейка = ядро × кристалл; подпись `ЯДРО · ГРАНЬ/ИМЯ (a5) · имя в данных`.
- **Часть A:** ядро + ровно один кристалл (вершина тоже одна) против голых четырёх ядер. **Часть B:** 12 полных ветвей (5 из 5) и 60 сборок «ветвь без одного» (4 из 5; резонанс держится, порог 3).
- **Парное сравнение:** каждый бой T сравнивается с тем же боем того же ядра без кристалла (то же зерно, тот же враг, те же стороны плиты). Стороны плиты чередуются по зерну.
- **ИСХОД = да**, если сдвиг доли побед выходит за 95% парный интервал (±1.96·σ). **ПОВЕДЕНИЕ = да**, если кристалл изменил не меньше 5% решений выбора намерения ИЛИ хотя бы одна телесная метрика сдвинулась больше чем на 3 шума (шум — раздел 2). Пороги черновые; все сырые числа лежат в `out/raw`, пересчёт — перезапуск `crystal-remeasure-report.mjs` с другими `THRESH`.
- **«Изменил решение»:** в каждом решении бойца T выбор пересчитывается так, будто кристалл не зажжён (оси ядра без сдвигов, наклонов кристалла нет), и сравнивается с настоящим; остальное состояние то же. Рядом в json: только оси убраны / только наклоны убраны.
- **Расхождение намерений, п.п.** — формула из `grani-recon.mjs`: 50·Σ|доля_T − доля_без_кристалла| по семи намерениям, доли — по тикам бойца (пулом по всем боям ячейки).
- Телесные метрики — определения как в `reflex-sight-controls.mjs` / `motion-recon.mjs occupancy`: «вне радиуса» = дистанция ≥ 1.45, «свободное время» = нет клипа, блока, сбива, выдоха; ударов/мин = контакты в начатых атакующих клипах на минуту жизни T; попадание = падение здоровья врага за тик; CATCH = время в намерении «ловить»; «сбив/контра» = срабатывания чтения фазы врага.

## 1. Сверка нулевого замера и регрессия

Голые ядра, 16 пар × 200 зёрен, **без чередования сторон** (так были сняты прежние 25.07 / 51.87 / 83.03 — `reflex-sight-controls.mjs MODE=pairs NOSWAP=1`). Тот же боец, та же обвязка, зонд включён.

| метрика | сейчас | известное (reflex-sight REPORT §2.4) |
| --- | --- | --- |
| вне радиуса удара | 25.1% | 25.07% |
| свободное время | 34.5% | 34.45% |
| скорость | 0.3189 | 0.3189 |
| медиана длины боя, с | 51.87 | 51.87 |
| максимум, с | 83.03 | 83.03 |
| таймаутов | 0 | 0 |
| боёв | 3200 | 3200 |

**Воспроизвелось точно.**



**Регрессионные суммы (обе, до и после):**

| проверка | до (старт, база cad3c631) | после (конец работы) | ожидание ТЗ |
| --- | --- | --- | --- |
| голые ядра, 48 боёв | `ec148d29dba29092ab735e129779a37e60bcb1b124b79cc093da79ff9e86400c` | `ec148d29dba29092ab735e129779a37e60bcb1b124b79cc093da79ff9e86400c` | `ec148d29…86400c` |
| бои со сборками, 36 боёв | `5b0a65d4e0481cdc834c89a1dc89610e79011cd10695b11c679755bdb52bbd27` | `5b0a65d4e0481cdc834c89a1dc89610e79011cd10695b11c679755bdb52bbd27` | `5b0a65d4…bd27` |

## 2. Шум: два нулевых замера одного ядра на разных зёрнах

Пять блоков по 200 зёрен (1–200, 201–400, … 801–1000), каждый — голое ядро против всех четырёх голых ядер (800 боёв), стороны чередуются по зерну. «Шум» = σ разности двух таких замеров = √2 × стандартное отклонение блоков. Порог телесной метрики в вердикте — **3 шума**.

| метрика | ядро | блок 1 | блок 2 | блок 3 | блок 4 | блок 5 | шум (σ разности) | порог 3 шума |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| вне радиуса удара (≥1.45), доля времени | ONSLAUGHT | 13.14 | 13.31 | 13.21 | 13.33 | 12.89 | 0.25 | 0.74 |
| вне радиуса удара (≥1.45), доля времени | RAIDER | 31.78 | 31.45 | 32.17 | 31.35 | 31.80 | 0.46 | 1.37 |
| вне радиуса удара (≥1.45), доля времени | BULWARK | 21.85 | 22.66 | 22.51 | 22.16 | 22.45 | 0.46 | 1.37 |
| вне радиуса удара (≥1.45), доля времени | AMBUSH | 33.27 | 33.63 | 33.06 | 33.07 | 33.21 | 0.33 | 0.98 |
| свободное время (нет клипа/блока/сбива/выдоха) | ONSLAUGHT | 18.83 | 18.86 | 18.74 | 18.84 | 18.81 | 0.06 | 0.19 |
| свободное время (нет клипа/блока/сбива/выдоха) | RAIDER | 40.53 | 40.52 | 41.28 | 40.29 | 40.89 | 0.55 | 1.65 |
| свободное время (нет клипа/блока/сбива/выдоха) | BULWARK | 32.94 | 33.84 | 33.61 | 33.25 | 33.71 | 0.52 | 1.57 |
| свободное время (нет клипа/блока/сбива/выдоха) | AMBUSH | 45.16 | 45.26 | 44.83 | 44.39 | 44.90 | 0.48 | 1.44 |
| средняя дистанция до врага | ONSLAUGHT | 1.152 | 1.153 | 1.152 | 1.153 | 1.145 | 0.005 | 0.014 |
| средняя дистанция до врага | RAIDER | 1.441 | 1.440 | 1.444 | 1.441 | 1.446 | 0.004 | 0.011 |
| средняя дистанция до врага | BULWARK | 1.275 | 1.289 | 1.286 | 1.278 | 1.284 | 0.008 | 0.025 |
| средняя дистанция до врага | AMBUSH | 1.478 | 1.485 | 1.479 | 1.480 | 1.479 | 0.004 | 0.013 |
| средняя скорость | ONSLAUGHT | 0.203 | 0.200 | 0.198 | 0.203 | 0.201 | 0.003 | 0.008 |
| средняя скорость | RAIDER | 0.440 | 0.438 | 0.442 | 0.433 | 0.436 | 0.005 | 0.015 |
| средняя скорость | BULWARK | 0.272 | 0.277 | 0.279 | 0.272 | 0.277 | 0.004 | 0.013 |
| средняя скорость | AMBUSH | 0.363 | 0.365 | 0.360 | 0.358 | 0.364 | 0.004 | 0.013 |
| ударов (контактов в замахах) в минуту | ONSLAUGHT | 27.047 | 27.181 | 27.240 | 27.092 | 27.227 | 0.120 | 0.359 |
| ударов (контактов в замахах) в минуту | RAIDER | 19.808 | 19.600 | 19.466 | 19.839 | 19.752 | 0.222 | 0.665 |
| ударов (контактов в замахах) в минуту | BULWARK | 19.072 | 18.921 | 18.864 | 19.078 | 18.950 | 0.134 | 0.401 |
| ударов (контактов в замахах) в минуту | AMBUSH | 15.701 | 15.848 | 15.903 | 16.038 | 15.835 | 0.173 | 0.518 |
| доля попаданий (попал / ударов) | ONSLAUGHT | 64.57 | 64.42 | 64.08 | 65.05 | 64.73 | 0.51 | 1.54 |
| доля попаданий (попал / ударов) | RAIDER | 66.12 | 65.71 | 65.71 | 66.21 | 65.58 | 0.40 | 1.19 |
| доля попаданий (попал / ударов) | BULWARK | 66.54 | 66.73 | 66.73 | 66.43 | 66.00 | 0.43 | 1.29 |
| доля попаданий (попал / ударов) | AMBUSH | 69.49 | 69.83 | 69.65 | 69.41 | 68.88 | 0.51 | 1.53 |
| время в блоке | ONSLAUGHT | 17.87 | 17.78 | 17.40 | 17.93 | 17.65 | 0.30 | 0.91 |
| время в блоке | RAIDER | 5.92 | 5.90 | 5.70 | 5.87 | 5.64 | 0.18 | 0.54 |
| время в блоке | BULWARK | 27.58 | 27.35 | 27.59 | 27.40 | 27.28 | 0.19 | 0.58 |
| время в блоке | AMBUSH | 16.79 | 16.53 | 16.75 | 17.16 | 16.64 | 0.34 | 1.01 |
| подъёмов блока в минуту | ONSLAUGHT | 7.573 | 7.529 | 7.354 | 7.588 | 7.460 | 0.136 | 0.407 |
| подъёмов блока в минуту | RAIDER | 2.511 | 2.503 | 2.420 | 2.497 | 2.396 | 0.075 | 0.226 |
| подъёмов блока в минуту | BULWARK | 11.714 | 11.619 | 11.722 | 11.644 | 11.587 | 0.084 | 0.251 |
| подъёмов блока в минуту | AMBUSH | 7.114 | 7.011 | 7.095 | 7.263 | 7.050 | 0.136 | 0.408 |
| время в намерении CATCH (ловля) | ONSLAUGHT | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| время в намерении CATCH (ловля) | RAIDER | 6.15 | 5.81 | 5.79 | 6.17 | 5.59 | 0.35 | 1.06 |
| время в намерении CATCH (ловля) | BULWARK | 59.14 | 58.68 | 58.24 | 58.66 | 58.06 | 0.60 | 1.80 |
| время в намерении CATCH (ловля) | AMBUSH | 71.33 | 70.75 | 71.43 | 71.14 | 70.72 | 0.46 | 1.39 |
| сбив/контра по чтению в минуту | ONSLAUGHT | 21.263 | 21.286 | 21.373 | 21.217 | 21.234 | 0.087 | 0.260 |
| сбив/контра по чтению в минуту | RAIDER | 14.532 | 14.408 | 14.170 | 14.751 | 14.437 | 0.298 | 0.894 |
| сбив/контра по чтению в минуту | BULWARK | 18.933 | 18.689 | 18.564 | 18.767 | 18.632 | 0.201 | 0.602 |
| сбив/контра по чтению в минуту | AMBUSH | 14.996 | 15.003 | 15.198 | 15.349 | 15.129 | 0.208 | 0.624 |

**Доля побед и медиана голого ядра против всех четырёх (800 боёв в блоке):**

| ядро | доля побед по блокам, % | шум, п.п. | медиана по блокам, с | шум, с |
| --- | --- | --- | --- | --- |
| ONSLAUGHT | 48.8 / 45.1 / 44.4 / 45.0 / 45.9 | 2.43 | 50.0 / 49.9 / 49.9 / 50.0 / 49.7 | 0.14 |
| RAIDER | 40.6 / 38.6 / 37.5 / 37.9 / 36.9 | 2.04 | 49.9 / 49.6 / 49.6 / 49.2 / 49.7 | 0.37 |
| BULWARK | 70.5 / 73.0 / 70.4 / 74.0 / 73.0 | 2.32 | 58.2 / 57.2 / 57.5 / 57.5 / 57.8 | 0.52 |
| AMBUSH | 42.1 / 43.9 / 43.4 / 41.9 / 43.3 | 1.21 | 51.6 / 53.1 / 51.8 / 52.2 / 52.3 | 0.78 |


## 3. Часть A — 60 ячеек (кристалл в одиночку)

Часть A: ядро + ровно один кристалл (вершина тоже зажигается одна) против голых четырёх ядер (включая своё), 4 врага × 200 зёрен = 800 боёв на ячейку, стороны чередуются по зерну. Парное сравнение: тот же бой без кристалла, те же зёрна и стороны.
Пороги: ИСХОД = сдвиг доли побед вне 95% парного интервала. ПОВЕДЕНИЕ = изменено ≥ 5% решений ИЛИ телесная метрика сдвинулась > 3 шумов (шум — noise.md).

| ячейка | вход (запись в данных; факт после зажима) | доля побед T, % (сдвиг п.п. [95% интервал]) | ИСХОД | Δ медианы, с | бит в бит как без кристалла | решений изменено | тег: условие истинно / переворачивает выбор | расхождение намерений, п.п. | телесные метрики за 3 шума | ПОВЕДЕНИЕ | метки |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit | оси: weight+14 · рычаги: strikePower+4% · тег: — | 47.0 (-1.8 [-6.4…+2.9]) | нет | -0.2 | 0/800 | 0.6% | 0.0% / 0.0% | 1.3 | far,free,swingsPerMin,readsPerMin | да | — |
| ONSLAUGHT · BODY/DRIVE (a2) · Guard Crush | оси: weight+8 · рычаги: strikePower+7% blockPenetration+40% · тег: — | 60.4 (+11.6 [+6.7…+16.6]) | да | -1.1 | 0/800 | 0.3% | 0.0% / 0.0% | 0.6 | far,free | да | — |
| ONSLAUGHT · BODY/GRIND (a3) · Unshaken | оси: resilience+14 · рычаги: strikePower+10% interruptResist+70% · тег: — | 86.8 (+38.0 [+34.0…+42.0]) | да | -1.2 | 0/800 | 0.0% | 0.0% / 0.0% | 0.1 | free,spd,hitRate,blkShare,blkPerMin,readsPerMin | да | ПЕРЕКОС |
| ONSLAUGHT · BODY/BREAK (a4) · Close Power | оси: distance-8 weight+6 · рычаги: strikePower+14% · тег: close_damage_ramp→STRIKE [close] | 59.1 (+10.4 [+5.7…+15.1]) | да | -1.5 | 0/800 | 17.5% | 90.3% / 17.5% | 18.6 | far,free,spd,blkShare,blkPerMin,readsPerMin | да | — |
| ONSLAUGHT · BODY/ANVIL (a5) · Breakthrough | оси: weight+10 · рычаги: strikePower+22% blockPenetration+95% · тег: overload_strike→STRIKE★ [foeHpLow] | 79.9 (+31.1 [+26.6…+35.7]) | да | -4.2 | 0/800 | 13.5% | 16.9% / 12.7% | 14.4 | far,free,dist,blkShare,blkPerMin | да | ПЕРЕКОС |
| ONSLAUGHT · MIND/WATCH (b1) · Hard Entry | оси: distance-8 initiative+6 · рычаги: — · тег: — | 48.1 (-0.6 [-5.4…+4.1]) | нет | -0.0 | 0/800 | 2.2% | 0.0% / 0.0% | 0.4 | dist,readsPerMin | да | — |
| ONSLAUGHT · MIND/TIMING (b2) · Run-Down | оси: stick+8 distance-6 · рычаги: — · тег: chase_strike→PRESS [longFight] | 43.5 (-5.3 [-10.2…-0.3]) | да | -0.3 | 0/800 | 2.5% | 39.6% / 0.1% | 0.4 | dist,readsPerMin | да | ВРЕДИТ |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | оси: stick+10 · рычаги: — · тег: — | 46.1 (-2.6 [-5.7…+0.4]) | нет | -0.2 | 443/800 | 2.4% | 0.0% / 0.0% | 0.3 | — | нет | — |
| ONSLAUGHT · MIND/ADAPT (b4) · Cling | оси: stick+10 distance-6 · рычаги: — · тег: — | 43.8 (-5.0 [-9.9…-0.1]) | да | -0.3 | 0/800 | 2.3% | 0.0% / 0.0% | 0.3 | dist,readsPerMin | да | ВРЕДИТ |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | оси: stick+14 distance-8 · рычаги: — · тег: lockdown→HOLD★ [close] | 47.6 (-1.1 [-5.9…+3.6]) | нет | -0.4 | 0/800 | 2.4% | 91.5% / 0.0% | 0.4 | dist,readsPerMin | да | — |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | оси: tempo+8 · рычаги: — · тег: — | 50.4 (+1.6 [-2.7…+5.9]) | нет | -0.8 | 90/800 | 0.0% | 0.0% / 0.0% | 0.2 | free,swingsPerMin,readsPerMin | да | — |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | оси: tempo+10 · рычаги: — · тег: — | 49.5 (+0.8 [-3.7…+5.2]) | нет | -0.2 | 73/800 | 0.0% | 0.0% / 0.0% | 0.1 | free,swingsPerMin,readsPerMin | да | — |
| ONSLAUGHT · WILL/VOW (c3) · Building Momentum | оси: tempo+6 · рычаги: — · тег: hit_accel→STRIKE [longFight] | 52.1 (+3.4 [-1.2…+7.9]) | нет | -0.3 | 75/800 | 12.7% | 39.7% / 12.7% | 13.9 | free,readsPerMin | да | — |
| ONSLAUGHT · WILL/HUNGER (c4) · No Breather | оси: tempo+6 stick+6 · рычаги: — · тег: no_breather→PRESS [foeHpLow] | 49.9 (+1.1 [-3.3…+5.6]) | нет | -0.6 | 71/800 | 1.6% | 13.4% / 0.1% | 0.3 | free,readsPerMin | да | — |
| ONSLAUGHT · WILL/STILL (c5) · Rampage | оси: tempo+12 · рычаги: — · тег: rampage→STRIKE★ [selfHpLow] | 53.3 (+4.5 [+0.1…+8.9]) | да | -1.1 | 19/800 | 10.9% | 15.5% / 10.9% | 12.2 | swingsPerMin,readsPerMin | да | — |
| RAIDER · BODY/ROOT (a1) · Quick Out | оси: distance+8 tempo+6 · рычаги: — · тег: — | 38.9 (-1.8 [-6.3…+2.8]) | нет | -0.5 | 0/800 | 6.5% | 0.0% / 0.0% | 10.7 | dist,catchShare | да | — |
| RAIDER · BODY/DRIVE (a2) · Pinpoint Entry | оси: initiative+6 · рычаги: accuracy+35% · тег: — | 46.4 (+5.8 [+1.5…+10.0]) | да | -0.5 | 83/800 | 3.0% | 0.0% / 0.0% | 4.6 | hitRate,catchShare | да | — |
| RAIDER · BODY/GRIND (a3) · Far Bounce | оси: distance+10 slip+6 · рычаги: — · тег: — | 42.4 (+1.8 [-2.9…+6.4]) | нет | +0.5 | 0/800 | 10.6% | 0.0% / 0.0% | 12.5 | dist,swingsPerMin,catchShare | да | — |
| RAIDER · BODY/BREAK (a4) · Clean Exchange | оси: tempo+8 · рычаги: — · тег: clean_chain→STING [always] | 38.9 (-1.8 [-6.4…+2.9]) | нет | -0.3 | 1/800 | 25.4% | 100.0% / 25.4% | 33.5 | free,dist,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | — |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | оси: initiative+10 distance+8 slip+6 · рычаги: — · тег: perfect_jab→STING★ [foeQuiet] | 41.8 (+1.1 [-3.4…+5.7]) | нет | +0.3 | 0/800 | 13.2% | 29.1% / 6.6% | 15.4 | dist,spd,swingsPerMin,catchShare | да | — |
| RAIDER · MIND/WATCH (b1) · Fake-In | оси: tempo+4 · рычаги: feintChance+20% · тег: — | 34.5 (-6.1 [-10.0…-2.2]) | да | -0.1 | 149/800 | 0.0% | 0.0% / 0.0% | 0.5 | swingsPerMin | да | ВРЕДИТ |
| RAIDER · MIND/TIMING (b2) · Punish Reaction | оси: tempo+4 · рычаги: feintPayoff+50% · тег: — | 39.5 (-1.1 [-4.6…+2.3]) | нет | -0.2 | 218/800 | 0.0% | 0.0% / 0.0% | 0.3 | — | нет | — |
| RAIDER · MIND/FEINT (b3) · Broken Rhythm | оси: tempo+8 · рычаги: — · тег: rhythm_break→BREAK [close] | 42.1 (+1.5 [-2.8…+5.8]) | нет | +0.0 | 14/800 | 8.1% | 70.9% / 8.1% | 15.2 | far,free,dist,spd,swingsPerMin,catchShare,readsPerMin | да | — |
| RAIDER · MIND/ADAPT (b4) · Feint to Interrupt | оси: tempo+6 · рычаги: — · тег: feint_interrupt→STING [foeSwing] | 42.1 (+1.5 [-2.6…+5.6]) | нет | -0.5 | 62/800 | 10.4% | 49.8% / 10.4% | 15.8 | free,swingsPerMin,blkShare,blkPerMin,catchShare | да | — |
| RAIDER · MIND/COLD (b5) · Setup Combo | оси: tempo+6 · рычаги: feintPayoff+120% · тег: feint_combo→STRIKE★ [close] | 38.5 (-2.1 [-6.6…+2.4]) | нет | -0.5 | 3/800 | 16.4% | 75.3% / 16.4% | 19.4 | far,free,dist,spd,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | — |
| RAIDER · WILL/HOLD (c1) · Read the Tell | оси: initiative-6 · рычаги: strikePower+4% accuracy+30% · тег: — | 45.5 (+4.9 [+0.5…+9.3]) | да | -0.9 | 19/800 | 4.2% | 0.0% / 0.0% | 5.2 | dist,spd,swingsPerMin,hitRate | да | — |
| RAIDER · WILL/SPITE (c2) · Strike the Open | оси: initiative+4 · рычаги: strikePower+7% · тег: punish_exhausted→STRIKE [foeWindLow] | 44.4 (+3.8 [+0.0…+7.5]) | да | -0.9 | 44/800 | 2.7% | 6.2% / 0.1% | 4.2 | catchShare | да | — |
| RAIDER · WILL/VOW (c3) · Charged Run | оси: distance+6 · рычаги: strikePower+10% chargeGain+60% · тег: — | 45.5 (+4.9 [+0.2…+9.5]) | да | -1.2 | 0/800 | 6.2% | 0.0% / 0.0% | 9.3 | dist | да | — |
| RAIDER · WILL/HUNGER (c4) · Punish Aggression | оси: counter+10 · рычаги: strikePower+14% · тег: hunt_reply→STRIKE [foeSwing] | 51.6 (+11.0 [+6.4…+15.6]) | да | -1.7 | 0/800 | 10.3% | 49.7% / 7.9% | 13.3 | far,free,dist,spd,swingsPerMin,catchShare,readsPerMin | да | — |
| RAIDER · WILL/STILL (c5) · Killing Run | оси: distance+6 · рычаги: strikePower+22% chargePower+60% · тег: lethal_entry→PRESS★ [foeHpLow] | 52.6 (+12.0 [+7.4…+16.6]) | да | -2.4 | 0/800 | 18.1% | 14.4% / 12.0% | 21.3 | dist,spd,swingsPerMin | да | — |
| BULWARK · BODY/ROOT (a1) · Tough Hide | оси: resilience+8 · рычаги: toughness+4% · тег: — | 85.4 (+14.9 [+11.9…+17.9]) | да | +1.2 | 9/800 | 0.7% | 0.0% / 0.0% | 0.6 | blkShare,blkPerMin | да | — |
| BULWARK · BODY/DRIVE (a2) · Steady Guard | оси: resilience+10 · рычаги: toughness+7% · тег: — | 89.3 (+18.8 [+15.6…+21.9]) | да | +1.2 | 4/800 | 0.7% | 0.0% / 0.0% | 0.6 | blkShare,blkPerMin | да | — |
| BULWARK · BODY/GRIND (a3) · Catch Breath | оси: resilience+6 · рычаги: toughness+10% staminaRegen+60% · тег: — | 84.5 (+14.0 [+10.8…+17.2]) | да | -0.0 | 0/800 | 0.5% | 0.0% / 0.0% | 0.6 | — | нет | — |
| BULWARK · BODY/BREAK (a4) · Dig In | оси: distance-6 · рычаги: toughness+14% · тег: dig_in→HOLD [close] | 73.6 (+3.1 [-1.1…+7.3]) | нет | -1.0 | 0/800 | 7.4% | 84.4% / 7.3% | 8.1 | catchShare | да | — |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | оси: resilience+8 · рычаги: toughness+22% blockMitigation+60% · тег: fortress→HOLD★ [selfHpLow] | 95.8 (+25.3 [+22.1…+28.4]) | да | +1.4 | 0/800 | 3.5% | 9.0% / 2.9% | 3.1 | blkShare,blkPerMin,catchShare | да | ПЕРЕКОС |
| BULWARK · MIND/WATCH (b1) · Riposte | оси: counter+8 stick+6 · рычаги: toughness+4% blockCounter+50% · тег: — | 74.1 (+3.6 [-0.5…+7.7]) | нет | -1.5 | 0/800 | 1.1% | 0.0% / 0.0% | 1.1 | — | нет | — |
| BULWARK · MIND/TIMING (b2) · Catch & Punish | оси: counter+8 · рычаги: toughness+7% interruptBonus+50% · тег: — | 74.4 (+3.9 [-0.2…+8.0]) | нет | -1.2 | 0/800 | 0.8% | 0.0% / 0.0% | 0.6 | — | нет | — |
| BULWARK · MIND/FEINT (b3) · Hard Meet | оси: counter+10 stick+6 · рычаги: toughness+10% · тег: — | 71.4 (+0.9 [-3.3…+5.1]) | нет | -0.6 | 0/800 | 1.1% | 0.0% / 0.0% | 0.9 | — | нет | — |
| BULWARK · MIND/ADAPT (b4) · Retaliation | оси: counter+8 · рычаги: toughness+14% · тег: retaliate_ramp→STRIKE [hpDropped] | 73.1 (+2.6 [-1.5…+6.7]) | нет | -0.3 | 0/800 | 0.8% | 11.9% / 0.0% | 0.3 | — | нет | — |
| BULWARK · MIND/COLD (b5) · Sea Wall | оси: counter+8 stick+6 · рычаги: toughness+22% blockCounter+100% interruptBonus+100% · тег: counter_trap→CATCH★ [longFight] | 83.3 (+12.8 [+9.0…+16.5]) | да | -3.7 | 0/800 | 2.1% | 45.3% / 1.0% | 2.0 | — | нет | — |
| BULWARK · WILL/HOLD (c1) · Body Shove | оси: stick+8 distance-6 · рычаги: — · тег: — | 72.6 (+2.1 [-2.1…+6.4]) | нет | -0.6 | 0/800 | 1.2% | 0.0% / 0.0% | 1.8 | — | нет | — |
| BULWARK · WILL/SPITE (c2) · Heavy Slam | оси: weight+10 · рычаги: blockPenetration+35% · тег: — | 79.4 (+8.9 [+4.8…+13.0]) | да | -1.3 | 0/800 | 0.7% | 0.0% / 0.0% | 1.8 | catchShare | да | — |
| BULWARK · WILL/VOW (c3) · No Way Around | оси: stick+10 · рычаги: — · тег: — | 73.1 (+2.6 [-0.6…+5.8]) | нет | -0.0 | 277/800 | 1.1% | 0.0% / 0.0% | 1.6 | — | нет | — |
| BULWARK · WILL/HUNGER (c4) · Pin | оси: stick+8 distance-6 · рычаги: — · тег: pin→HOLD [close] | 73.0 (+2.5 [-1.8…+6.8]) | нет | -0.6 | 0/800 | 16.9% | 85.0% / 15.1% | 17.8 | far,blkShare,blkPerMin,catchShare | да | — |
| BULWARK · WILL/STILL (c5) · Clinch | оси: stick+14 weight+8 · рычаги: blockPenetration+50% · тег: clinch→PRESS★ [close] | 78.5 (+8.0 [+3.8…+12.2]) | да | -0.9 | 0/800 | 16.5% | 83.7% / 15.6% | 18.7 | blkShare,blkPerMin | да | — |
| AMBUSH · BODY/ROOT (a1) · Hard Counter | оси: counter+8 · рычаги: — · тег: — | 46.8 (+4.6 [+0.1…+9.2]) | да | +0.9 | 7/800 | 2.0% | 0.0% / 0.0% | 1.5 | readsPerMin | да | — |
| AMBUSH · BODY/DRIVE (a2) · Slip Counter | оси: slip+6 · рычаги: dodgeCounter+50% · тег: — | 53.1 (+11.0 [+7.4…+14.6]) | да | +0.5 | 141/800 | 0.5% | 0.0% / 0.0% | 0.5 | — | нет | — |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | оси: counter+8 · рычаги: — · тег: punish_aggression→CATCH [hpDropped] | 45.8 (+3.6 [-0.9…+8.1]) | нет | +1.0 | 6/800 | 2.3% | 17.3% / 0.3% | 1.7 | readsPerMin | да | — |
| AMBUSH · BODY/BREAK (a4) · Punish Whiff | оси: distance+6 · рычаги: missCounter+50% · тег: — | 43.1 (+1.0 [-3.6…+5.6]) | нет | +0.6 | 0/800 | 1.3% | 0.0% / 0.0% | 1.6 | dist | да | — |
| AMBUSH · BODY/ANVIL (a5) · Perfect Trap | оси: counter+8 slip+4 · рычаги: dodgeCounter+100% missCounter+100% · тег: perfect_trap→STRIKE★ [foeHpLow&foeQuiet] | 62.9 (+20.8 [+16.2…+25.3]) | да | -0.8 | 2/800 | 2.3% | 1.6% / 0.2% | 1.3 | far,free,dist,swingsPerMin,readsPerMin | да | ПЕРЕКОС |
| AMBUSH · MIND/WATCH (b1) · Long Slip | оси: slip+10 distance+6 · рычаги: — · тег: — | 51.7 (+9.6 [+5.1…+14.2]) | да | +2.3 | 0/800 | 4.1% | 0.0% / 0.0% | 12.0 | far,free,spd,swingsPerMin,blkPerMin,catchShare | да | — |
| AMBUSH · MIND/TIMING (b2) · Hard to Reach | оси: slip+8 distance+6 · рычаги: — · тег: — | 50.7 (+8.6 [+4.1…+13.2]) | да | +2.1 | 0/800 | 4.0% | 0.0% / 0.0% | 11.9 | far,free,spd,swingsPerMin,blkShare,blkPerMin,catchShare | да | — |
| AMBUSH · MIND/FEINT (b3) · Run 'Em Ragged | оси: distance+8 slip+6 · рычаги: — · тег: exhaust→STING [longFight] | 42.9 (+0.8 [-3.9…+5.4]) | нет | +2.0 | 0/800 | 5.3% | 43.9% / 1.2% | 13.2 | far,free,spd,swingsPerMin,catchShare | да | — |
| AMBUSH · MIND/ADAPT (b4) · Open Window | оси: slip+8 · рычаги: dodgeCounter+40% · тег: — | 54.3 (+12.1 [+8.2…+16.1]) | да | +0.6 | 89/800 | 1.0% | 0.0% / 0.0% | 1.2 | — | нет | — |
| AMBUSH · MIND/COLD (b5) · Phantom | оси: slip+12 distance+6 · рычаги: — · тег: phantom→BREAK★ [hpDropped] | 55.8 (+13.6 [+9.0…+18.3]) | да | +2.2 | 0/800 | 9.3% | 16.1% / 5.2% | 18.0 | far,free,spd,swingsPerMin,blkShare,blkPerMin,catchShare | да | — |
| AMBUSH · WILL/HOLD (c1) · Loaded Hit | оси: distance+6 · рычаги: strikePower+4% chargePower+50% · тег: — | 47.5 (+5.4 [+0.8…+9.9]) | да | +0.2 | 0/800 | 1.3% | 0.0% / 0.0% | 1.6 | dist | да | — |
| AMBUSH · WILL/SPITE (c2) · Long Charge | оси: initiative-6 distance+6 · рычаги: strikePower+7% chargeMax+60% · тег: — | 45.9 (+3.8 [-1.0…+8.5]) | нет | +0.7 | 0/800 | 1.5% | 0.0% / 0.0% | 1.6 | — | нет | — |
| AMBUSH · WILL/VOW (c3) · Hit the Opening | оси: initiative-6 · рычаги: strikePower+10% · тег: vulnerable_strike→STRIKE [foeOpen] | 47.6 (+5.5 [+2.0…+9.0]) | да | -0.3 | 66/800 | 1.6% | 22.9% / 0.3% | 0.9 | — | нет | — |
| AMBUSH · WILL/HUNGER (c4) · Pierce | оси: distance+6 · рычаги: strikePower+14% chargePen+60% · тег: — | 51.7 (+9.6 [+5.1…+14.2]) | да | -0.6 | 0/800 | 1.4% | 0.0% / 0.0% | 1.8 | dist | да | — |
| AMBUSH · WILL/STILL (c5) · Execution | оси: distance+6 · рычаги: strikePower+22% chargePower+80% · тег: execute→STRIKE★ [foeHpLow] | 59.0 (+16.9 [+12.3…+21.4]) | да | -2.0 | 0/800 | 2.2% | 13.2% / 0.8% | 1.8 | far,dist | да | — |


*Разбивка по врагам — `out/partA_by_foe.md` (и `partA.json`).*

## 4. Усиление ×3 там, где вход есть, а флаг «нет»

Усиление ×3 (сдвиги осей, бонусы, вес наклона — только у этого кристалла), ячейки, где вход есть, а флаг «нет». Те же 800 боёв, те же зёрна, тот же нулевой замер.

| ячейка | флаги ×1 (ИСХОД / ПОВЕДЕНИЕ) | сдвиг доли побед при ×3 [95%] | ИСХОД ×3 | решений изменено ×3 | метрики за 3 шума ×3 | ПОВЕДЕНИЕ ×3 | причина | что кристалл двигает | пояснение к «глухому» |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit | нет / да | -1.0 [-5.9…+3.9] | нет | 31.4% | far,free,dist,swingsPerMin,blkShare,blkPerMin,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось weight +14; рычаг strikePower +4% | канал не глухой: при ×3 поведение меняется (решений изменено 31.4%, телесных метрик за 3 шума: 7), а исход остаётся в шуме |
| ONSLAUGHT · MIND/WATCH (b1) · Hard Entry | нет / да | -2.6 [-7.4…+2.1] | нет | 1.9% | far,free,dist,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось distance -8 — при ×3 ось упирается в зажим; ось initiative +6 — при ×3 ось упирается в зажим | канал не глухой: при ×3 поведение меняется (решений изменено 1.9%, телесных метрик за 3 шума: 4), а исход остаётся в шуме |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | нет / нет | -3.0 [-6.1…+0.1] | нет | 2.8% | — | нет | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: ГЛУХОЙ КАНАЛ | ось stick +10 — при ×3 ось упирается в зажим | при ×3 не меняются ни решения, ни тело |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | нет / да | -2.3 [-7.1…+2.6] | нет | 55.7% | far,free,dist,spd,swingsPerMin,blkShare,blkPerMin,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось stick +14 — при ×3 ось упирается в зажим; ось distance -8 — при ×3 ось упирается в зажим; наклон lockdown→HOLD при «close»: условие истинно 88.1%, переворачивает 53.2% решений (×3: вес 0.60) | канал не глухой: при ×3 поведение меняется (решений изменено 55.7%, телесных метрик за 3 шума: 8), а исход остаётся в шуме |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | нет / да | +3.0 [-1.6…+7.6] | нет | 0.0% | free,swingsPerMin,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +8 — при ×3 ось упирается в зажим | канал не глухой: при ×3 поведение меняется (решений изменено 0.0%, телесных метрик за 3 шума: 3), а исход остаётся в шуме |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | нет / да | +3.0 [-1.6…+7.6] | нет | 0.0% | free,swingsPerMin,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +10 — при ×3 ось упирается в зажим | канал не глухой: при ×3 поведение меняется (решений изменено 0.0%, телесных метрик за 3 шума: 3), а исход остаётся в шуме |
| ONSLAUGHT · WILL/VOW (c3) · Building Momentum | нет / да | +5.5 [+0.7…+10.3] | да | 34.0% | far,free,dist,swingsPerMin,blkShare,blkPerMin,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: — | ось tempo +6; наклон hit_accel→STRIKE при «longFight»: условие истинно 38.9%, переворачивает 34.0% решений (×3: вес 0.36) | — |
| ONSLAUGHT · WILL/HUNGER (c4) · No Breather | нет / да | +1.3 [-3.3…+5.8] | нет | 2.4% | free,swingsPerMin,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +6; ось stick +6 — при ×3 ось упирается в зажим; наклон no_breather→PRESS при «foeHpLow»: условие истинно 13.7%, переворачивает 0.0% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 2.4%, телесных метрик за 3 шума: 3), а исход остаётся в шуме |
| RAIDER · BODY/ROOT (a1) · Quick Out | нет / да | -0.1 [-4.7…+4.5] | нет | 25.4% | dist,blkShare,blkPerMin,catchShare | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось distance +8; ось tempo +6 | канал не глухой: при ×3 поведение меняется (решений изменено 25.4%, телесных метрик за 3 шума: 4), а исход остаётся в шуме |
| RAIDER · BODY/GRIND (a3) · Far Bounce | нет / да | +11.9 [+7.3…+16.5] | да | 30.6% | dist,hitRate,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: — | ось distance +10; ось slip +6 | — |
| RAIDER · BODY/BREAK (a4) · Clean Exchange | нет / да | -3.3 [-7.8…+1.3] | нет | 42.2% | dist,blkShare,blkPerMin,catchShare | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +8; наклон clean_chain→STING при «always»: условие истинно 100.0%, переворачивает 42.2% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 42.2%, телесных метрик за 3 шума: 4), а исход остаётся в шуме |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | нет / да | +7.2 [+2.6…+11.9] | да | 28.9% | free,dist,hitRate,blkShare,blkPerMin,catchShare | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: — | ось initiative +10; ось distance +8; ось slip +6; наклон perfect_jab→STING при «foeQuiet»: условие истинно 29.2%, переворачивает 10.0% решений (×3: вес 0.60) | — |
| RAIDER · MIND/TIMING (b2) · Punish Reaction | нет / нет | +1.0 [-2.7…+4.7] | нет | 0.0% | — | нет | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: ГЛУХОЙ КАНАЛ | ось tempo +4; рычаг feintPayoff +50% | при ×3 не меняются ни решения, ни тело |
| RAIDER · MIND/FEINT (b3) · Broken Rhythm | нет / да | +3.5 [-1.2…+8.2] | нет | 18.5% | far,free,dist,spd,swingsPerMin,hitRate,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +8; наклон rhythm_break→BREAK при «close»: условие истинно 69.7%, переворачивает 18.5% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 18.5%, телесных метрик за 3 шума: 10), а исход остаётся в шуме |
| RAIDER · MIND/ADAPT (b4) · Feint to Interrupt | нет / да | -3.0 [-7.5…+1.5] | нет | 26.7% | free,spd,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +6; наклон feint_interrupt→STING при «foeSwing»: условие истинно 49.8%, переворачивает 26.7% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 26.7%, телесных метрик за 3 шума: 7), а исход остаётся в шуме |
| RAIDER · MIND/COLD (b5) · Setup Combo | нет / да | +1.6 [-3.0…+6.2] | нет | 16.4% | far,free,dist,spd,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось tempo +6; рычаг feintPayoff +120%; наклон feint_combo→STRIKE при «close»: условие истинно 75.3%, переворачивает 16.4% решений (×3: вес 0.60) | канал не глухой: при ×3 поведение меняется (решений изменено 16.4%, телесных метрик за 3 шума: 9), а исход остаётся в шуме |
| BULWARK · BODY/GRIND (a3) · Catch Breath | да / нет | +21.6 [+18.4…+24.9] | да | 0.7% | blkShare,blkPerMin | да | ИСХОД: —; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось resilience +6 — при ×3 ось упирается в зажим; рычаг toughness +10%; рычаг staminaRegen +60% | — |
| BULWARK · BODY/BREAK (a4) · Dig In | нет / да | +5.6 [+1.5…+9.7] | да | 60.5% | far,free,dist,spd,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: — | ось distance -6; рычаг toughness +14%; наклон dig_in→HOLD при «close»: условие истинно 87.4%, переворачивает 60.0% решений (×3: вес 0.36) | — |
| BULWARK · MIND/WATCH (b1) · Riposte | нет / нет | +13.4 [+9.6…+17.2] | да | 17.5% | far,free,dist,swingsPerMin,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось counter +8; ось stick +6; рычаг toughness +4%; рычаг blockCounter +50% | — |
| BULWARK · MIND/TIMING (b2) · Catch & Punish | нет / нет | +13.5 [+9.6…+17.4] | да | 17.9% | far,free,dist,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось counter +8; рычаг toughness +7%; рычаг interruptBonus +50% | — |
| BULWARK · MIND/FEINT (b3) · Hard Meet | нет / нет | +8.9 [+4.8…+12.9] | да | 17.8% | far,free,dist,swingsPerMin,hitRate,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось counter +10; ось stick +6; рычаг toughness +10% | — |
| BULWARK · MIND/ADAPT (b4) · Retaliation | нет / нет | +11.0 [+7.0…+15.0] | да | 17.1% | far,free,dist,swingsPerMin,hitRate,catchShare,readsPerMin | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось counter +8; рычаг toughness +14%; наклон retaliate_ramp→STRIKE при «hpDropped»: условие истинно 10.5%, переворачивает 0.1% решений (×3: вес 0.36) | — |
| BULWARK · MIND/COLD (b5) · Sea Wall | да / нет | +21.6 [+18.1…+25.2] | да | 25.4% | far,free,dist,swingsPerMin,catchShare,readsPerMin | да | ИСХОД: —; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось counter +8; ось stick +6; рычаг toughness +22%; рычаг blockCounter +100%; рычаг interruptBonus +100%; наклон counter_trap→CATCH при «longFight»: условие истинно 41.2%, переворачивает 6.6% решений (×3: вес 0.60) | — |
| BULWARK · WILL/HOLD (c1) · Body Shove | нет / нет | +4.8 [+0.6…+8.9] | да | 14.2% | far,free,dist,swingsPerMin,blkShare,blkPerMin,catchShare | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось stick +8; ось distance -6 | — |
| BULWARK · WILL/VOW (c3) · No Way Around | нет / нет | +3.1 [-1.1…+7.3] | нет | 14.8% | far,free,swingsPerMin,blkShare,blkPerMin,catchShare | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось stick +10 | канал не глухой: при ×3 поведение меняется (решений изменено 14.8%, телесных метрик за 3 шума: 6), а исход остаётся в шуме |
| BULWARK · WILL/HUNGER (c4) · Pin | нет / да | +2.0 [-2.2…+6.2] | нет | 67.8% | far,free,dist,spd,swingsPerMin,blkShare,blkPerMin,catchShare,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось stick +8; ось distance -6; наклон pin→HOLD при «close»: условие истинно 87.7%, переворачивает 38.0% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 67.8%, телесных метрик за 3 шума: 9), а исход остаётся в шуме |
| AMBUSH · BODY/DRIVE (a2) · Slip Counter | да / нет | +29.9 [+25.3…+34.4] | да | 4.1% | far,free,spd,swingsPerMin,catchShare | да | ИСХОД: —; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось slip +6; рычаг dodgeCounter +50% | — |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | нет / да | +3.6 [-0.9…+8.1] | нет | 3.1% | free,swingsPerMin,catchShare,readsPerMin | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось counter +8 — при ×3 ось упирается в зажим; наклон punish_aggression→CATCH при «hpDropped»: условие истинно 16.9%, переворачивает 0.8% решений (×3: вес 0.36) | канал не глухой: при ×3 поведение меняется (решений изменено 3.1%, телесных метрик за 3 шума: 4), а исход остаётся в шуме |
| AMBUSH · BODY/BREAK (a4) · Punish Whiff | нет / да | +4.0 [-0.7…+8.7] | нет | 5.6% | free,spd,swingsPerMin,catchShare | да | ИСХОД: ГЛУХОЙ КАНАЛ; ПОВЕДЕНИЕ: — | ось distance +6; рычаг missCounter +50% | канал не глухой: при ×3 поведение меняется (решений изменено 5.6%, телесных метрик за 3 шума: 4), а исход остаётся в шуме |
| AMBUSH · MIND/FEINT (b3) · Run 'Em Ragged | нет / да | +12.9 [+8.3…+17.5] | да | 16.6% | far,free,spd,swingsPerMin,blkShare,blkPerMin,catchShare | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: — | ось distance +8 — при ×3 ось упирается в зажим; ось slip +6; наклон exhaust→STING при «longFight»: условие истинно 46.5%, переворачивает 5.5% решений (×3: вес 0.36) | — |
| AMBUSH · MIND/ADAPT (b4) · Open Window | да / нет | +33.3 [+28.9…+37.6] | да | 4.4% | free,spd,swingsPerMin,blkShare,blkPerMin,catchShare | да | ИСХОД: —; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось slip +8; рычаг dodgeCounter +40% | — |
| AMBUSH · WILL/SPITE (c2) · Long Charge | нет / нет | +5.9 [+1.2…+10.6] | да | 6.2% | free,spd,catchShare | да | ИСХОД: МАЛЫЙ ВЕС; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось initiative -6 — при ×3 ось упирается в зажим; ось distance +6; рычаг strikePower +7%; рычаг chargeMax +60% | — |
| AMBUSH · WILL/VOW (c3) · Hit the Opening | да / нет | +18.6 [+14.3…+23.0] | да | 4.1% | dist,catchShare | да | ИСХОД: —; ПОВЕДЕНИЕ: МАЛЫЙ ВЕС | ось initiative -6 — при ×3 ось упирается в зажим; рычаг strikePower +10%; наклон vulnerable_strike→STRIKE при «foeOpen»: условие истинно 22.7%, переворачивает 1.0% решений (×3: вес 0.36) | — |


## 5. Часть B — кристалл внутри своей ветви

Часть B: 12 полных ветвей (5 из 5) и 60 сборок «ветвь без одного кристалла» (4 из 5, резонанс держится: порог 3), против голых четырёх ядер, 4 врага × 200 зёрен = 800 боёв на сборку. Сдвиг — парный: тот же враг, то же зерно, полная ветвь против ветви без этого кристалла. «Решений изменено» — доля решений в полной ветви, которые были бы другими без этого кристалла (оси и наклоны, резонанс остаётся).
В части B телесные метрики не считались — «ПОВЕДЕНИЕ» здесь только по решениям; для метки ПОГЛОЩЁН в одиночку берётся тоже только эта половина флага (ИСХОД сравнивается с ИСХОДОМ, решения с решениями).

| ячейка | в одиночку: сдвиг п.п. / ИСХОД / решений изменено | в ветви: сдвиг «полная ветвь − ветвь без него», п.п. [95%] | ИСХОД в ветви | решений изменено в ветви | ПОВЕДЕНИЕ по решениям в ветви | тег: условие истинно / переворачивает (в полной ветви) | бит в бит как без него | метка |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit | -1.8 нет / 0.6% | -0.5 [-1.7…+0.7] | нет | 0.0% | нет | — | 0/800 | — |
| ONSLAUGHT · BODY/DRIVE (a2) · Guard Crush | +11.6 да / 0.3% | -0.3 [-1.5…+1.0] | нет | 0.0% | нет | — | 0/800 | ПОГЛОЩЁН |
| ONSLAUGHT · BODY/GRIND (a3) · Unshaken | +38.0 да / 0.0% | +11.8 [+9.2…+14.3] | да | 0.0% | нет | — | 0/800 | — |
| ONSLAUGHT · BODY/BREAK (a4) · Close Power | +10.4 да / 17.5% | +0.3 [-1.1…+1.6] | нет | 0.2% | нет | 84.6% / 0.2% | 0/800 | ПОГЛОЩЁН |
| ONSLAUGHT · BODY/ANVIL (a5) · Breakthrough | +31.1 да / 13.5% | +2.8 [+1.0…+4.5] | да | 0.0% | нет | 21.6% / 0.0% | 0/800 | ПОГЛОЩЁН |
| ONSLAUGHT · MIND/WATCH (b1) · Hard Entry | -0.6 нет / 2.2% | -1.8 [-5.2…+1.7] | нет | 1.7% | нет | — | 344/800 | — |
| ONSLAUGHT · MIND/TIMING (b2) · Run-Down | -5.3 да / 2.5% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | 39.8% / 0.0% | 800/800 | ПОГЛОЩЁН |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | -2.6 нет / 2.4% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | — |
| ONSLAUGHT · MIND/ADAPT (b4) · Cling | -5.0 да / 2.3% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | ПОГЛОЩЁН |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | -1.1 нет / 2.4% | -2.6 [-7.3…+2.0] | нет | 43.5% | да | 88.7% / 43.5% | 0/800 | — |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | +1.6 нет / 0.0% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | — |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | +0.8 нет / 0.0% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | — |
| ONSLAUGHT · WILL/VOW (c3) · Building Momentum | +3.4 нет / 12.7% | +0.5 [-3.4…+4.4] | нет | 4.9% | нет | 39.0% / 4.9% | 155/800 | ПОГЛОЩЁН |
| ONSLAUGHT · WILL/HUNGER (c4) · No Breather | +1.1 нет / 1.6% | +3.5 [+0.0…+7.0] | да | 5.3% | да | 13.9% / 0.5% | 357/800 | — |
| ONSLAUGHT · WILL/STILL (c5) · Rampage | +4.5 да / 10.9% | +0.8 [-0.5…+2.0] | нет | 0.6% | нет | 16.4% / 0.6% | 666/800 | ПОГЛОЩЁН |
| RAIDER · BODY/ROOT (a1) · Quick Out | -1.8 нет / 6.5% | +0.0 [-4.5…+4.5] | нет | 1.8% | нет | — | 26/800 | ПОГЛОЩЁН |
| RAIDER · BODY/DRIVE (a2) · Pinpoint Entry | +5.8 да / 3.0% | +1.8 [-1.6…+5.1] | нет | 0.9% | нет | — | 305/800 | ПОГЛОЩЁН |
| RAIDER · BODY/GRIND (a3) · Far Bounce | +1.8 нет / 10.6% | +2.9 [-1.5…+7.2] | нет | 3.3% | нет | — | 15/800 | ПОГЛОЩЁН |
| RAIDER · BODY/BREAK (a4) · Clean Exchange | -1.8 нет / 25.4% | -2.6 [-6.5…+1.2] | нет | 5.8% | да | 100.0% / 5.8% | 71/800 | — |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | +1.1 нет / 13.2% | +3.0 [-1.7…+7.7] | нет | 2.5% | нет | 29.7% / 0.9% | 16/800 | ПОГЛОЩЁН |
| RAIDER · MIND/WATCH (b1) · Fake-In | -6.1 да / 0.0% | +0.3 [-3.1…+3.6] | нет | 0.0% | нет | — | 288/800 | ПОГЛОЩЁН |
| RAIDER · MIND/TIMING (b2) · Punish Reaction | -1.1 нет / 0.0% | +3.0 [+0.5…+5.5] | да | 0.0% | нет | — | 425/800 | — |
| RAIDER · MIND/FEINT (b3) · Broken Rhythm | +1.5 нет / 8.1% | +0.4 [-2.7…+3.5] | нет | 0.0% | нет | 71.9% / 0.0% | 380/800 | ПОГЛОЩЁН |
| RAIDER · MIND/ADAPT (b4) · Feint to Interrupt | +1.5 нет / 10.4% | -3.8 [-8.3…+0.8] | нет | 17.1% | да | 49.1% / 17.1% | 13/800 | — |
| RAIDER · MIND/COLD (b5) · Setup Combo | -2.1 нет / 16.4% | +5.6 [+1.7…+9.5] | да | 7.5% | да | 71.9% / 7.5% | 60/800 | — |
| RAIDER · WILL/HOLD (c1) · Read the Tell | +4.9 да / 4.2% | +2.4 [-0.6…+5.3] | нет | 0.3% | нет | — | 225/800 | ПОГЛОЩЁН |
| RAIDER · WILL/SPITE (c2) · Strike the Open | +3.8 да / 2.7% | +4.4 [+1.6…+7.1] | да | 0.8% | нет | 4.3% / 0.1% | 270/800 | — |
| RAIDER · WILL/VOW (c3) · Charged Run | +4.9 да / 6.2% | +11.1 [+7.0…+15.2] | да | 0.6% | нет | — | 8/800 | ПОГЛОЩЁН |
| RAIDER · WILL/HUNGER (c4) · Punish Aggression | +11.0 да / 10.3% | +7.8 [+3.9…+11.6] | да | 0.6% | нет | 46.5% / 0.4% | 26/800 | ПОГЛОЩЁН |
| RAIDER · WILL/STILL (c5) · Killing Run | +12.0 да / 18.1% | +14.0 [+9.9…+18.1] | да | 1.1% | нет | 17.5% / 0.5% | 4/800 | ПОГЛОЩЁН |
| BULWARK · BODY/ROOT (a1) · Tough Hide | +14.9 да / 0.7% | +0.5 [+0.0…+1.0] | да | 0.0% | нет | — | 16/800 | — |
| BULWARK · BODY/DRIVE (a2) · Steady Guard | +18.8 да / 0.7% | +0.5 [+0.0…+1.0] | да | 0.0% | нет | — | 15/800 | — |
| BULWARK · BODY/GRIND (a3) · Catch Breath | +14.0 да / 0.5% | +0.1 [-0.5…+0.8] | нет | 0.0% | нет | — | 0/800 | ПОГЛОЩЁН |
| BULWARK · BODY/BREAK (a4) · Dig In | +3.1 нет / 7.4% | +0.6 [-0.8…+2.0] | нет | 23.4% | да | 82.9% / 23.3% | 0/800 | — |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | +25.3 да / 3.5% | +9.5 [+7.4…+11.6] | да | 0.5% | нет | 7.6% / 0.5% | 1/800 | — |
| BULWARK · MIND/WATCH (b1) · Riposte | +3.6 нет / 1.1% | +5.4 [+2.5…+8.3] | да | 0.7% | нет | — | 2/800 | — |
| BULWARK · MIND/TIMING (b2) · Catch & Punish | +3.9 нет / 0.8% | +5.4 [+2.5…+8.3] | да | 0.7% | нет | — | 2/800 | — |
| BULWARK · MIND/FEINT (b3) · Hard Meet | +0.9 нет / 1.1% | +5.3 [+2.4…+8.1] | да | 0.8% | нет | — | 2/800 | — |
| BULWARK · MIND/ADAPT (b4) · Retaliation | +2.6 нет / 0.8% | +6.0 [+3.0…+9.0] | да | 0.8% | нет | 8.1% / 0.2% | 2/800 | — |
| BULWARK · MIND/COLD (b5) · Sea Wall | +12.8 да / 2.1% | +9.3 [+6.1…+12.4] | да | 3.2% | нет | 44.1% / 2.9% | 2/800 | — |
| BULWARK · WILL/HOLD (c1) · Body Shove | +2.1 нет / 1.2% | -2.8 [-6.1…+0.6] | нет | 0.1% | нет | — | 0/800 | — |
| BULWARK · WILL/SPITE (c2) · Heavy Slam | +8.9 да / 0.7% | +4.6 [+0.8…+8.4] | да | 0.0% | нет | — | 0/800 | — |
| BULWARK · WILL/VOW (c3) · No Way Around | +2.6 нет / 1.1% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | — |
| BULWARK · WILL/HUNGER (c4) · Pin | +2.5 нет / 16.9% | -2.9 [-6.2…+0.5] | нет | 1.7% | нет | 83.0% / 1.6% | 0/800 | ПОГЛОЩЁН |
| BULWARK · WILL/STILL (c5) · Clinch | +8.0 да / 16.5% | +5.9 [+2.1…+9.7] | да | 4.4% | нет | 83.0% / 5.1% | 0/800 | ПОГЛОЩЁН |
| AMBUSH · BODY/ROOT (a1) · Hard Counter | +4.6 да / 2.0% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | ПОГЛОЩЁН |
| AMBUSH · BODY/DRIVE (a2) · Slip Counter | +11.0 да / 0.5% | +5.3 [+2.2…+8.3] | да | 0.2% | нет | — | 278/800 | — |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | +3.6 нет / 2.3% | +0.0 [-1.0…+1.0] | нет | 0.2% | нет | 14.0% / 0.2% | 748/800 | — |
| AMBUSH · BODY/BREAK (a4) · Punish Whiff | +1.0 нет / 1.3% | -1.8 [-5.9…+2.4] | нет | 0.3% | нет | — | 0/800 | — |
| AMBUSH · BODY/ANVIL (a5) · Perfect Trap | +20.8 да / 2.3% | +10.1 [+7.2…+13.1] | да | 0.3% | нет | 1.9% / 0.2% | 193/800 | — |
| AMBUSH · MIND/WATCH (b1) · Long Slip | +9.6 да / 4.1% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | ПОГЛОЩЁН |
| AMBUSH · MIND/TIMING (b2) · Hard to Reach | +8.6 да / 4.0% | +0.0 [+0.0…+0.0] | нет | 0.0% | нет | — | 800/800 | ПОГЛОЩЁН |
| AMBUSH · MIND/FEINT (b3) · Run 'Em Ragged | +0.8 нет / 5.3% | +1.6 [-1.6…+4.8] | нет | 2.1% | нет | 46.9% / 1.7% | 213/800 | ПОГЛОЩЁН |
| AMBUSH · MIND/ADAPT (b4) · Open Window | +12.1 да / 1.0% | +4.9 [+3.4…+6.4] | да | 0.0% | нет | — | 293/800 | — |
| AMBUSH · MIND/COLD (b5) · Phantom | +13.6 да / 9.3% | -1.4 [-3.3…+0.6] | нет | 1.2% | нет | 13.4% / 1.2% | 533/800 | ПОГЛОЩЁН |
| AMBUSH · WILL/HOLD (c1) · Loaded Hit | +5.4 да / 1.3% | +2.1 [-0.5…+4.7] | нет | 0.2% | нет | — | 235/800 | ПОГЛОЩЁН |
| AMBUSH · WILL/SPITE (c2) · Long Charge | +3.8 нет / 1.5% | +0.0 [-3.4…+3.4] | нет | 0.4% | нет | — | 123/800 | — |
| AMBUSH · WILL/VOW (c3) · Hit the Opening | +5.5 да / 1.6% | +2.3 [-0.3…+4.8] | нет | 0.5% | нет | 22.8% / 0.3% | 239/800 | ПОГЛОЩЁН |
| AMBUSH · WILL/HUNGER (c4) · Pierce | +9.6 да / 1.4% | +5.5 [+2.7…+8.3] | да | 0.2% | нет | — | 147/800 | — |
| AMBUSH · WILL/STILL (c5) · Execution | +16.9 да / 2.2% | +11.1 [+8.0…+14.2] | да | 0.4% | нет | 14.4% / 0.2% | 65/800 | — |


### Вершины

Вершины (шаг 5 каждой ветви): в одиночку и внутри своей ветви. «Жива» = хотя бы один флаг «да» (в одиночку: ИСХОД или ПОВЕДЕНИЕ; в ветви: ИСХОД или ≥5% решений).

| вершина | тег | в одиночку: сдвиг п.п. / решений изменено | в одиночку | в ветви: сдвиг п.п. / решений изменено | в ветви | итог |
| --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ANVIL (a5) · Breakthrough | overload_strike | +31.1 / 13.5% | жива | +2.8 / 0.0% | жива | ПОГЛОЩЕНА |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | lockdown | -1.1 / 2.4% | жива | -2.6 / 43.5% | жива | жива везде |
| ONSLAUGHT · WILL/STILL (c5) · Rampage | rampage | +4.5 / 10.9% | жива | +0.8 / 0.6% | мертва | ПОГЛОЩЕНА |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | perfect_jab | +1.1 / 13.2% | жива | +3.0 / 2.5% | мертва | ПОГЛОЩЕНА |
| RAIDER · MIND/COLD (b5) · Setup Combo | feint_combo | -2.1 / 16.4% | жива | +5.6 / 7.5% | жива | жива везде |
| RAIDER · WILL/STILL (c5) · Killing Run | lethal_entry | +12.0 / 18.1% | жива | +14.0 / 1.1% | жива | ПОГЛОЩЕНА |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | fortress | +25.3 / 3.5% | жива | +9.5 / 0.5% | жива | жива везде |
| BULWARK · MIND/COLD (b5) · Sea Wall | counter_trap | +12.8 / 2.1% | жива | +9.3 / 3.2% | жива | жива везде |
| BULWARK · WILL/STILL (c5) · Clinch | clinch | +8.0 / 16.5% | жива | +5.9 / 4.4% | жива | ПОГЛОЩЕНА |
| AMBUSH · BODY/ANVIL (a5) · Perfect Trap | perfect_trap | +20.8 / 2.3% | жива | +10.1 / 0.3% | жива | жива везде |
| AMBUSH · MIND/COLD (b5) · Phantom | phantom | +13.6 / 9.3% | жива | -1.4 / 1.2% | мертва | ПОГЛОЩЕНА |
| AMBUSH · WILL/STILL (c5) · Execution | execute | +16.9 / 2.2% | жива | +11.1 / 0.4% | жива | жива везде |


### Ветвь целиком против голого ядра (справка)

| ядро | ветвь | доля побед, % | сдвиг к голому, п.п. | медиана, с | дольше 100 с | максимум, с |
| --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | a | 98.1 | +49.4 | 42.2 | 0 | 69.1 |
| ONSLAUGHT | b | 46.4 | -2.4 | 49.7 | 0 | 72.5 |
| ONSLAUGHT | c | 54.0 | +5.3 | 49.2 | 0 | 68.9 |
| RAIDER | a | 44.0 | +3.4 | 50.5 | 0 | 77.5 |
| RAIDER | b | 36.1 | -4.5 | 49.0 | 0 | 72.2 |
| RAIDER | c | 78.4 | +37.8 | 44.3 | 0 | 63.4 |
| BULWARK | a | 97.9 | +27.4 | 59.0 | 1 | 106.5 |
| BULWARK | b | 92.1 | +21.6 | 53.4 | 0 | 77.8 |
| BULWARK | c | 84.0 | +13.5 | 55.6 | 0 | 88.9 |
| AMBUSH | a | 71.5 | +29.4 | 50.2 | 0 | 88.6 |
| AMBUSH | b | 67.6 | +25.5 | 55.9 | 0 | 91.3 |
| AMBUSH | c | 70.4 | +28.2 | 48.6 | 0 | 78.9 |

## 6. Сравнение с `effect_200` (зеркало)

Корреляция старого и нового сдвига по 60 ячейкам: **0.98**. Ячеек, где знак большого старого сдвига перевернулся: 0. Ячеек, где сдвиг изменился на 15 п.п. и больше: 0. Полная таблица — `out/effect_compare.md`. Шум одной ячейки в зеркале (n=200) на сдвиг ≈ ±10 п.п., поэтому мелкие расхождения — не находка.

## 6а. Разбивка по врагам там, где знак или размер сильно зависит от врага

Сдвиг доли побед T против каждого врага (п.п., 200 парных боёв; «*» — значим на 99%). Включены ячейки, где оценки разных знаков ≥ 5 п.п. по модулю либо разброс между врагами ≥ 20 п.п.

| ячейка | против ONSLAUGHT | против RAIDER | против BULWARK | против AMBUSH |
| --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ANVIL (a5) · Breakthrough | +30.0* | +14.0* | +52.0* | +28.5* |
| RAIDER · BODY/GRIND (a3) · Far Bounce | +1.5 | -5.0 | +1.0 | +9.5 |
| RAIDER · MIND/COLD (b5) · Setup Combo | -9.5 | -5.5 | -0.5 | +7.0 |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | +26.0* | +18.0* | +39.5* | +17.5* |
| BULWARK · MIND/FEINT (b3) · Hard Meet | +9.5 | +0.0 | -5.0 | -1.0 |
| AMBUSH · MIND/FEINT (b3) · Run 'Em Ragged | +9.0 | -5.5 | +3.5 | -4.0 |

## 6б. Глухие каналы: что кристалл двигает и как это читается при ×3 по каналам

| ячейка | что кристалл двигает | разложение ×3 по каналам |
| --- | --- | --- |
| ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit | ось weight +14; рычаг strikePower +4% | ИСХОД: по отдельности ×3 даёт флаг «оси» -7.6 п.п., «рычаги/показатели» +6.5 п.п. — каналы тянут в разные стороны и гасят друг друга; не читается: — |
| ONSLAUGHT · MIND/WATCH (b1) · Hard Entry | ось distance -8 — при ×3 ось упирается в зажим; ось initiative +6 — при ×3 ось упирается в зажим | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси) |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | ось stick +10 — при ×3 ось упирается в зажим | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси); ПОВЕДЕНИЕ: ни один канал ×3 по отдельности флага не даёт (оси) |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | ось stick +14 — при ×3 ось упирается в зажим; ось distance -8 — при ×3 ось упирается в зажим; наклон lockdown→HOLD при «close»: условие истинно 88.1%, переворачивает 53.2% решений (×3: вес 0.60) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, наклон тега) |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | ось tempo +8 — при ×3 ось упирается в зажим | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси) |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | ось tempo +10 — при ×3 ось упирается в зажим | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси) |
| ONSLAUGHT · WILL/HUNGER (c4) · No Breather | ось tempo +6; ось stick +6 — при ×3 ось упирается в зажим; наклон no_breather→PRESS при «foeHpLow»: условие истинно 13.7%, переворачивает 0.0% решений (×3: вес 0.36) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, наклон тега) |
| RAIDER · BODY/ROOT (a1) · Quick Out | ось distance +8; ось tempo +6 | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси) |
| RAIDER · BODY/BREAK (a4) · Clean Exchange | ось tempo +8; наклон clean_chain→STING при «always»: условие истинно 100.0%, переворачивает 42.2% решений (×3: вес 0.36) | ИСХОД: по отдельности ×3 даёт флаг «наклон тега» -7.2 п.п. — усиление вредит, а не помогает; не читается: оси |
| RAIDER · MIND/TIMING (b2) · Punish Reaction | ось tempo +4; рычаг feintPayoff +50% | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, рычаги/показатели); ПОВЕДЕНИЕ: ни один канал ×3 по отдельности флага не даёт (оси, рычаги/показатели) |
| RAIDER · MIND/FEINT (b3) · Broken Rhythm | ось tempo +8; наклон rhythm_break→BREAK при «close»: условие истинно 69.7%, переворачивает 18.5% решений (×3: вес 0.36) | ИСХОД: по отдельности ×3 даёт флаг «оси» +4.6 п.п.; не читается: наклон тега |
| RAIDER · MIND/ADAPT (b4) · Feint to Interrupt | ось tempo +6; наклон feint_interrupt→STING при «foeSwing»: условие истинно 49.8%, переворачивает 26.7% решений (×3: вес 0.36) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, наклон тега) |
| RAIDER · MIND/COLD (b5) · Setup Combo | ось tempo +6; рычаг feintPayoff +120%; наклон feint_combo→STRIKE при «close»: условие истинно 75.3%, переворачивает 16.4% решений (×3: вес 0.60) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, рычаги/показатели, наклон тега) |
| BULWARK · WILL/VOW (c3) · No Way Around | ось stick +10 | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси) |
| BULWARK · WILL/HUNGER (c4) · Pin | ось stick +8; ось distance -6; наклон pin→HOLD при «close»: условие истинно 87.7%, переворачивает 38.0% решений (×3: вес 0.36) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, наклон тега) |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | ось counter +8 — при ×3 ось упирается в зажим; наклон punish_aggression→CATCH при «hpDropped»: условие истинно 16.9%, переворачивает 0.8% решений (×3: вес 0.36) | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, наклон тега) |
| AMBUSH · BODY/BREAK (a4) · Punish Whiff | ось distance +6; рычаг missCounter +50% | ИСХОД: ни один канал ×3 по отдельности флага не даёт (оси, рычаги/показатели) |

*Полные прогоны по каналам — `out/partA_channels.md`.*

## 7. Контроль по всей выборке

| выборка | боёв | медиана, с | дольше 100 с | таймаутов | максимум, с |
| --- | --- | --- | --- | --- | --- |
| часть A (60 ячеек) | 48000 | 51.6 | 0 | 0 | 92.0 |
| часть B (72 сборки) | 57600 | 50.6 | 4 | 0 | 106.5 |

Медиана голого ядра против четырёх (блок 1): ONSLAUGHT 50.0, RAIDER 49.9, BULWARK 58.2, AMBUSH 51.6 с — у BULWARK она выше 55 с уже без кристаллов, поэтому метка у его ячеек от ядра, не от кристалла.

**Часть A — ячейки с таймаутами или медианой > 55 с:** BULWARK Tough Hide 59.4; BULWARK Steady Guard 59.4; BULWARK Catch Breath 58.1; BULWARK Dig In 57.2; BULWARK Unbreakable 59.6; BULWARK Riposte 56.7; BULWARK Catch & Punish 56.9; BULWARK Hard Meet 57.6; BULWARK Retaliation 57.9; BULWARK Body Shove 57.5; BULWARK Heavy Slam 56.8; BULWARK No Way Around 58.1; BULWARK Pin 57.6; BULWARK Clinch 57.3; таймаутов нет ни у одной.

**Часть B — сборки с таймаутом или боем дольше 100 с:** build-skala-a-full (макс 106.5 с, дольше 100 с: 1, таймаутов 0); build-skala-a-no1 (макс 106.5 с, дольше 100 с: 1, таймаутов 0); build-skala-a-no2 (макс 106.5 с, дольше 100 с: 1, таймаутов 0); build-skala-a-no3 (макс 106.5 с, дольше 100 с: 1, таймаутов 0) — четыре сборки BULWARK BODY несут один и тот же долгий бой (одно зерно против одного врага).

**Часть B — полные ветви с медианой > 55 с:** skala-a (59.0 с); skala-c (55.6 с); zasada-b (55.9 с) (у BULWARK это от ядра: оно и голое держит бой дольше 55 с).

## 8. Найдено, не чинилось

1. **9 кристаллов невидимы внутри своей ветви.** При удалении любого из них из полной ветви все 800 боёв совпадают бит в бит: ONSLAUGHT Run-Down (MIND/TIMING; stick без него уже 100, distance без него уже 0); ONSLAUGHT Cut Off (MIND/FEINT; stick без него уже 100); ONSLAUGHT Cling (MIND/ADAPT; stick без него уже 100, distance без него уже 0); ONSLAUGHT Long Combo (WILL/HOLD; tempo без него уже 100); ONSLAUGHT No Pause (WILL/SPITE; tempo без него уже 100); BULWARK No Way Around (WILL/VOW; stick без него уже 100); AMBUSH Hard Counter (BODY/ROOT; counter без него уже 100); AMBUSH Long Slip (MIND/WATCH; slip без него уже 100, distance без него уже 100); AMBUSH Hard to Reach (MIND/TIMING; slip без него уже 100, distance без него уже 100). Причина одна: ось, которую кристалл двигает, уже упёрлась в 0 или 100 из-за стартового профиля ядра и остальных четырёх кристаллов ветки. Сдвиг записан в данных и показан на карточке, но в бою ничего не делает.
2. **Доля решений, которые решает жёсткая нужда** (запас сил, ответ на замах, заряд; до очков), часть A: ONSLAUGHT 0.4%, RAIDER 3.5%, BULWARK 51.0%, AMBUSH 46.8%. У BULWARK и AMBUSH это заметная часть выбора: там кристалл влияет на решение только через ответ на замах (выбор из CATCH / BREAK / HOLD), а пороги нужд по запасу сил и заряду от осей сейчас не зависят (bend = 0).
3. **Тег «срабатывает», но выбор не меняет** (условие верно ≥ 10% решений, переворот < 1%): ONSLAUGHT Run-Down (chase_strike: условие 39.6%, переворот 0.1%); ONSLAUGHT Lockdown (lockdown: условие 91.5%, переворот 0.0%); ONSLAUGHT No Breather (no_breather: условие 13.4%, переворот 0.1%); BULWARK Retaliation (retaliate_ramp: условие 11.9%, переворот 0.0%); BULWARK Sea Wall (counter_trap: условие 45.3%, переворот 1.0%); AMBUSH Punish Aggression (punish_aggression: условие 17.3%, переворот 0.3%); AMBUSH Hit the Opening (vulnerable_strike: условие 22.9%, переворот 0.3%); AMBUSH Execution (execute: условие 13.2%, переворот 0.8%).
4. **Ветви, которые целиком хуже голого ядра** (сдвиг к голому ядру < 0, часть B, справка): ONSLAUGHT MIND -2.4; RAIDER MIND -4.5. При этом внутри ONSLAUGHT MIND кристалл Lockdown меняет 43.5% решений — поведение ветки меняется сильно, выигрыш нет.
5. **Глухой канал чаще «не доходит до исхода», чем «не читается»:** при ×3 у 15 из 17 ячеек с глухим каналом решения и тело меняются, а доля побед нет. Отдельно: ONSLAUGHT Heavy Hit при ×3 — оси (вес) −7.6 п.п. и рычаг силы +6.5 п.п. гасят друг друга; RAIDER Clean Exchange при ×3 — наклон «всегда» вредит (−7.2).
6. **Формально значимые, практически нулевые:** BULWARK Tough Hide в ветви: +0.5 п.п. (перевернулось 4 боя из 800 в одну сторону); BULWARK Steady Guard в ветви: +0.5 п.п. (перевернулось 4 боя из 800 в одну сторону) — флаг ИСХОД «да» по правилу интервала, по смыслу ноль.
7. **Долгие бои:** BULWARK BODY (полная ветвь): боёв дольше 100 с — 1, максимум 106.5 с; полный список — раздел 7.

## 9. Не сделано и оговорки

- **Мягкий флаг ПОВЕДЕНИЕ.** Порог «3 шума» по телесным метрикам очень низкий (шум 0.1–0.6 п.п. на 800 боёв), поэтому почти любой сдвиг оси его пересекает: из 46 ячеек с флагом только 19 меняют ≥ 5% решений. Жёсткая половина флага (решения) показана отдельной колонкой; пороги пересчитываются без нового прогона.
- **Шум оценён по 5 блокам** (стандартное отклонение по 5 точкам ± ~35% само по себе); пороги по телу считаются от σ разности двух нулевых замеров, а сами ячейки сравниваются с блоком 1 парно — это консервативно (парное сравнение шумит меньше).
- **Часть B: телесные метрики не считались**, ПОВЕДЕНИЕ там — только по решениям; метка ПОГЛОЩЁН сравнивает ИСХОД с ИСХОДОМ и решения с решениями.
- **Вершина в одиночку зажигается без условий порядка** (разрешено ТЗ: условия снесены 30.09). Сборки из двух веток (5+2) и россыпь не мерились — они на `claude/resonance-seven`.
- **«Как будто кристалла нет» в решении** — подмена входа выбора (оси ядра и наклоны) при том же состоянии боя; дальность `range` и прочее состояние бойца берутся настоящие (как у зонда рефлекса). Решение, которое изменилось бы только из-за другого состояния по ходу боя (цепочка последствий), этим счётчиком не ловится — её видно по исходу и по телу.
- **Вердикт «ГЛУХОЙ КАНАЛ» — по правилу ТЗ (флага нет и при ×3).** Из разложения по каналам (раздел 6б) видно, что часто это не глухота проводки, а отсутствие связи «поведение → победа»; чинить это весом или данными бесполезно.
- **×3 — одинаковый множитель на все каналы сразу** (сдвиги осей, рамп силы/прочности и добавочные бонусы, вес наклона). Если ось при ×3 упёрлась в зажим, это не скрыто: колонка «что кристалл двигает» в разделе 4 помечает такие оси.
- **Зал FORGE** (7 коммитов поверх `5530f904`) на бой не влияет — проверено списком изменённых путей и регрессионными суммами.

## 10. Как повторить

См. `docs/crystal-remeasure/probe/README.md`: копия дерева с патчем зонда (`decisions-probe.patch`), затем `crystal-remeasure-run.mjs` (этапы zerocheck / zero / solo / amp / chan / build) и `crystal-remeasure-report.mjs` (noise / solo / amp / chan / build / final).

