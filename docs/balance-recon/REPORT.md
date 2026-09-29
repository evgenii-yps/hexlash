# Замер системы прокачки и боя — отчёт (TZ_balance_recon_v1)

**Дата:** 29.09.2026 · **Ветка:** `claude/blissful-brahmagupta-mpx51k` (от `1d1461c`, `main` не тронут) · **Игровую логику не менял** — добавлены только `scripts/balance-recon.mjs` и эта папка.

**Как это доказано.** Контрольная сумма регрессии боя `scripts/fight-regression.mjs` до и после работы одна и та же: `017fb79b01a86b5953c04d13232f3d7fada96216a4c03df2791961d929f67b13` (48 боёв). Проверка баффов `scripts/buffs-check.mjs` — «ВСЁ СОШЛОСЬ». `git status` — только два новых пути.

**Что НЕ сделано намеренно.** Шесть защищённых файлов (`buildFighter.js`, `ArenaScene.vue`, `buildArena.js`, `arenaTextures.js`, `arenaPresence.js`, `hpIndicator.js`) не открывались (граница ТЗ). Поэтому всё, что живёт только внутри бойца — скорость атаки, скорость хода, «рабочая дистанция», отображение осей на движения, лимиты думающей модели, точки выхода рейда — в п.1 отмечено как **не прочитано** и вместо ключей дано **измерение в бою**.

---

## Главное одним экраном

1. **BULWARK доминирует.** Без кристаллов, усреднив стороны и порядок (100 боёв на ячейку): BULWARK бьёт ONSLAUGHT 78%, RAIDER 86%, AMBUSH 77%. Остальные три между собой в коридоре 45–55%. Длина боёв — 45 с (без BULWARK) … 63 с (зеркало BULWARK); таймаутов 0, боёв дольше 100 с — 0.
2. **Из 60 кристаллов заметно влияют на исход 20, и все — в плюс; ещё 40 неотличимы от шума** (200 зёрен на ячейку; сдвиг винрейта против боя без кристалла ≥10 п.п. — это 2σ разности замеров, σ≈5 п.п.). Ни один кристалл не вредит. Разброс огромный: от 0 до +44 п.п. (BULWARK ANVIL). На 50 зёрнах (как в ТЗ) «значимых» выходит 35 из 60 — шум раздувает картину, верить нужно таблице на 200 зёрнах (п.4.3б).
3. **Пять кристаллов ONSLAUGHT MIND (Hard Entry / Run-Down / Cut Off / Cling / Lockdown) не меняют ничего**: 198–199 из 200 боёв совпадают с боем без кристалла бит в бит. Причина видна в замере осей: ось `distance` и `initiative` у ONSLAUGHT в диапазоне ±20 не меняет бой вовсе (0 из 20), `stick` вверх — тоже. Ядро стоит «на упоре».
4. **Текст кристалла и механика расходятся почти везде.** Игрок видит ОДИН набор из 15 текстов (BODY/MIND/WILL) на все 4 ядра, а механика у каждого ядра своя (60 разных). По моему чтению текстов: совпало полностью 0, частично 9, не совпало 26, **прямо наоборот 5**, у текста нет соответствующей оси/рычага 20. Пример наоборот: MIND/WATCH обещает «Waits a little longer before he enters», а у ONSLAUGHT под ним лежит Hard Entry (initiative +6, distance −8 — входит раньше).
5. **Теги граней мертвы, как и заявлено:** все 26 тегов навешены сразу — 0 изменённых боёв из 80. Рычаги-бонусы все живые, но `feintPayoff` (7/80 боёв меняются) и `chargePen` (8/80) — почти мёртвые.
6. **Баффы.** DICE — самый сильный рычаг: +17 п.п. (случайная грань), разброс по граням от +1.5 (грань 1) до +34 (грань 6). TOWEL: +20 п.п. по правилу бота (когда HP < 40%), +8.5 при броске в 10 с (на грани шума). **BUCKET ≈ 0** (−2…+4, шум ±10): бойцы почти не ходят (средняя скорость 0.07 ед./с), ускорять нечего. Бафф при этом работает как написано (`buffs-check`: сход 16.1 → 12.1 с).
7. **Клич почти ничего не делает в числах.** Винрейт −1…+5 п.п. при 95% шуме ±10 п.п. (на одном ядре BULWARK три PUSH подряд дают −18 п.п., FALLBACK −16/−10 при n=50, где 95% шум ±20 п.п. — сигнал слабый, нужен перемер); в окне действия дистанция до цели меняется на 0.01–0.07 ед., темп атак — на 0.01–0.06/с. FALLBACK («рвёт контакт») даёт дистанцию 1.14 → 1.15. Заряды и откат 6 с на исход не влияют.
8. **RAID.** Граней 0 → 7/20 побед (35%), 1–3 грани → 70%, 4 → 80%, 5 → 20/20 (100%). Ступенька от «нет граней» к «одна грань» — +35 п.п. Медиана 59–73 с; хвост дольше 100 с — 1–3 боя из 20; таймаутов 0. Числа из комментария в `combatBalance.raid.escalateStartSec` («12 из 20, медиана 65, максимум 82») **не воспроизводятся** (у меня без граней 7/20, 72.8 и 124.9 с) — вероятная причина в п.6.
9. **Найдено в самом движке (не правил):** первый бой процесса не совпадает с тем же боем, посчитанным позже (43.50 с против 44.50 с; причина не выяснена — файл бойца не открывался) — харнесс прогревается; порядок бойцов в списке даёт малый перекос (первый в списке выигрывает 46.9%, 1600 боёв).
10. **Числа, которых нет в `combatBalance.js`, и дубли** — список в п.1.9.

---

## Словарь (важно для чтения)

В ТЗ и в показываемых игроку текстах (`crystalTexts.js`, `coreFacets.js`): **грань** = ветка BODY / MIND / WILL (3), **кристалл** = один из 5 шагов внутри грани (15). В `upgradeData.js` и в скиле `hexlash-combat` названия **перевёрнуты**: там `crystal` = ветка (a/b/c), `face` = шаг. Ниже — словарь ТЗ. Соответствие: `natisk`=ONSLAUGHT, `nalet`=RAIDER, `skala`=BULWARK, `zasada`=AMBUSH; ветка `a`=BODY, `b`=MIND, `c`=WILL; шаг 1–5 = кристалл (a1…c5). Расхождение словарей — само по себе находка.

---

## 1. Где живут числа

⚠️ Всё, что помечено 🔒, лежит в защищённом файле и **не читалось**; вместо значения — замер из п.3–4 или пометка «не проверено». Полный плоский список 392 числовых ключей (значения прочитаны из живых модулей) — `docs/balance-recon/out/inventory_full.md`.

### 1.1 Метрики бойца

| параметр | файл | ключ | значение |
| --- | --- | --- | --- |
| HP | `src/data/combatBalance.js` | `maxHp` | 100 |
| Урон: доля max HP цели за нейтральный панч (до защиты) | `combatBalance.js` | `damageFracBase` | 0.045 |
| Сила удара (читаемая) | `combatBalance.js` | `strikePower` | 100 |
| Множители приёмов | `combatBalance.js` | `moveMult.*` | punch 1.0 · doubleEach 1.33 · combo 3.67 · hook 1.7 · uppercut 1.9 · bodyShot 1.2 · frontKick 2.2 · teep 1.6 · knee 2.6 |
| Разброс удара | `combatBalance.js` | `jitter` | ±0.10 |
| Бонус граней по глубине | `combatBalance.js` | `gradeBonusRamp` | [0.04, 0.07, 0.10, 0.14, 0.22] |
| Скорость атаки | 🔒 `buildFighter.js` (ось `tempo`) + `combatBalance.js` (`staminaCadenceStretchMax` 1.8, `staminaCost{Punch,Double,Combo}` 6/11/16, `staminaRegenPerSec` 14, `staminaMoveDrainPerSec` 6, `staminaPowerFloor` 0.55) | — | ключа скорости нет. **Замер:** 0.5–0.6 начатых атак/с у всех ядер |
| Скорость перемещения | 🔒 `buildFighter.js` (ось `weight` → `speedMul`); `combatBalance.js` `mobilityBase` 100; `src/data/intentionMotion.js` `speedMul` по намерению (STING 1.35, BREAK 1.30, HOLD 0.55, CATCH 0.65, BREATHE 0.45); `footwork.*`; `dodge.speed` 2.6 | — | **Замер:** `mobility = 100 × lerp(1.4 → 0.6, weight/100)` (weight 0 → 140, 50 → 100, 100 → 60). Скорость на ходу 0.8–1.1 ед./с, средняя за бой 0.07–0.1 |
| Стойкость | `combatBalance.js` | `toughness` 200 · `toughnessK` 1200 · `blockMitigation` 0.5 · `blockTendency{ResWeight 0.55, StickWeight 0.15, Max 0.65}` · `blockHoldSec` 1.4 · `dodgeChanceMax` 0.55 · `dodgeChanceCurve` 1.5 · `staggerDurationSec` 0.5 · `interruptWindowFrac` 0.5 | как указано |
| Точность / промах | `combatBalance.js` | `accuracy` 50 · `missChanceBase` 0.1 · `accuracyMissSwing` 0.2 · `missChanceCap` 0.35 | как указано |
| Рабочая дистанция | `combatBalance.js` | `strikeReach.*` (punch 1.0 … teep 1.5, knee 0.85) · `reachHitTol` 0.45 · `reachStepMax` 1.3 · `field.bodyGap` 0.74 · `kicks.{kneeMaxGap 1.05, frontKickMaxGap 1.55, teepMaxGap 2.0}` · `hands.{closeMaxGap 1.0, hookMaxGap 1.3}` · `breath.{breakDist 2.6, breakWide 1.1}` | предпочитаемая дистанция каждого ядра (`range`, константы STRIKE/RANGE/CONTACT/FAR) — 🔒 не проверено. **Замер:** средняя дистанция до цели в бою 1.0–1.2 |
| Стартовые характеристики (замер `buildFighter().stats`) | — | — | все 4 ядра: HP 100, strikePower 100, toughness 200, accuracy 50, blockMitigation 0.5, chargeMax 100, chargeGain 12/с. Отличие только в mobility: ONSLAUGHT 96 · RAIDER 112 · BULWARK 88 · AMBUSH 80 |

### 1.2 Оси поведения

8 осей, каждая 0–100, нейтраль 50, кламп в `clampAxis` (`src/data/behavior.js`: `AXES`, `AXIS_MIN/MAX/NEUTRAL`). Читает их в выборе намерения `src/data/intentions.js` (`spinalScore`, `hardNeed`); в тело (🔒 `buildFighter.js`) уходят через `refreshAxes` (базовая ось + дельта намерения).

| ось (в коде) | смысл 0 … 100 | кто читает при выборе намерения (вес) | ещё |
| --- | --- | --- | --- |
| `distance` | вплотную … далеко | PRESS 0.20·(1−d) · STING 0.45·d · BREATHE 0.10·d | тело: дистанция |
| `initiative` | ждёт … идёт вперёд | PRESS 0.50 · STRIKE 0.30 · CATCH 0.20·(1−i) | тело: агрессия |
| `tempo` | редкие одиночные … серии | **не читается выбором намерения вообще** | тело: частота атак (по комментарию `behavior.js`; 🔒 не проверено) |
| `weight` | лёгкий … тяжёлый | STRIKE 0.35 · STING 0.20·(1−w) | тело: `speedMul`, стиль удара (**замер:** mobility) |
| `stick` | ударил и ушёл … цепляется | PRESS 0.30 · HOLD 0.30 · BREAK 0.20·(1−s) | тело: сцепка |
| `resilience` | стекло … несгибаем | HOLD 0.40 · CATCH 0.25 | тело: склонность к блоку |
| `counter` | пассив … наказывает | CATCH 0.45 · hardNeed CATCH (>0.55) · readPounce 0.35/0.22 | скорость и точность «чтения» боя `read.*` |
| `slip` | легко попасть … неуловим | STING 0.30 · BREAK 0.50 | тело: шанс уклона `dodgeChance*` |

### 1.3 Стартовые значения осей по ядрам (`src/data/behavior.js` → `CORE_PROFILES`)

| ядро | distance | initiative | tempo | weight | stick | resilience | counter | slip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT (`natisk`) | 15 | 90 | 80 | 55 | 85 | 60 | 30 | 20 |
| RAIDER (`nalet`) | 55 | 70 | 65 | 35 | 15 | 35 | 45 | 65 |
| BULWARK (`skala`) | 20 | 25 | 30 | 65 | 70 | 90 | 60 | 15 |
| AMBUSH (`zasada`) | 80 | 15 | 20 | 75 | 20 | 35 | 90 | 75 |

Профили намерений (дельты осей, `src/data/intentions.js` → `INTENTION_PROFILES`): PRESS distance −35, initiative +30, stick +20 · STRIKE distance −25, initiative +20, tempo +15 · STING distance +30, initiative +10, tempo −10, stick −25 · HOLD — · BREAK distance +35, initiative −25, stick −30 · BREATHE distance +45, initiative −35, stick −25 · CATCH distance +10, initiative −20.

### 1.4 Дельты от кристаллов

Все 60 записаны в `src/data/upgradeData.js` → `CRYSTALS[ядро]` (шаги через `mkBranch`, сдвиги `s(axis, delta)`, бонусы `b(stat, pct)` → значения из `combatBalance.js`: `ramGuardCrushPen` 0.4, `ramBreakthroughPen` 0.95, `ramUnshakenInterruptResist` 0.7, `jabPinpointAccuracy` 0.35, `feintFakeInChance` 0.2, `feintPunishPayoff` 0.5, `feintSetupPayoff` 1.2, `huntReadAccuracy` 0.3, `huntChargedGain` 0.6, `huntKillingPower` 0.6, `bastionBreathRegen` 0.6, `bastionFortressMitigation` 0.6, `breakerRiposteBonus` 0.5, `breakerInterruptBonus` 0.5, `breakerTrapRiposte` 1.0, `breakerTrapInterrupt` 1.0, `viceSlamPen` 0.35, `viceClinchPen` 0.5, `trapDodgeCounter` 0.5, `trapMissCounter` 0.5, `trapPerfectDodge/Miss` 1.0, `shadowDodgeWindow` 0.4, `stingLoadedPower` 0.5, `stingLongChargeMax` 0.6, `stingPiercePen` 0.6, `stingExecutionPower` 0.8). Полная таблица «ядро × кристалл → фактическая дельта» — п.4.1.

### 1.5 Баффы (`src/data/buffBalance.js`)

| бафф | ключ | значение |
| --- | --- | --- |
| TOWEL | `towel.durationSec` / `healFracOfMax` / `staggerRecoverMul` | 5 с · 0.20 полного HP за всё время · выход из сбива ×0.5 |
| BUCKET | `bucket.durationSec` / `paceMul` | 5 с · ×1.30 к скорости ПЕРЕДВИЖЕНИЯ (частоту ударов не трогает) |
| DICE — грани | `dice.faces` | 1: 1 удар ×1.5 · 2: 2×1.5 · 3: 2×2.0 · 4: 3×2.0 · 5: 3×2.5 · 6: 3×3.0 (+вспышка), `bigFace` 6 |
| DICE — бросок | функция `rollDie()` (`buffBalance.js`) | `1 + floor(Math.random()·6)`, равновероятно |
| Откат | `cooldownSec` | 8 с на вид, общий на сторону игрока |
| Бот | `bot.*` | `towelHpBelow` 0.40 · `bucketNearDist` 2.2 · `diceFoeHpBelow` 0.50 · `diceLateSec` 20 · `minGapSec` 6 |
| Запас | `kitSlots` 3 · `starterStock` 2/2/2 (бой не читает) | — |

### 1.6 Клич (`src/data/klichBalance.js`)

| ключ | значение |
| --- | --- |
| `holdSec` / `fadeSec` | 6 с полная сила + 2 с линейный сход (итого 8) |
| `chargesPerKlich` | 3 на клич за бой |
| `cooldownSec` | 6 с, общий на сторону, свой у каждого клича |
| `axes.push` (ВПЕРЁД) | distance −40 · initiative +35 · tempo +10 · stick +25 |
| `axes.fallback` (ОТХОД) | distance +45 · initiative −30 · tempo −10 · stick −35 |
| `axes.hold` (ДЕРЖАТЬ) | distance −5 · initiative −25 · tempo −20 · stick +40 |

Применение — `applyKlich` бойца (🔒 внутри), вызывает `src/services/klich.js` (замена клича новым, заряд списывается в момент броска).

### 1.7 Таймауты и капы боя

| что | где | значение |
| --- | --- | --- |
| Жёсткий потолок боя (мгновенный прогон) | `src/scene/instantBout.js` `MAX_SEC` | 240 с (не достигался ни разу: `capped` = 0) |
| Шаг времени мгновенного боя | `instantBout.js` `INSTANT_DT` | 1/60 с |
| Накал по длине: порог / рамп / потолок урона | `combatBalance.js` `escalateStartSec` / `escalateLengthRampSec` / `escalateMax` | 25 с / 20 с / ×6 |
| Накал по тишине: порог / рамп | `escalateSilenceSec` / `escalateRampSec` | 5 с / 12 с |
| Добавка агрессии / тяги вперёд на полном накале | `escalateAggroMax` / `escalateForwardMax` | 0.5 / 30 |
| Порог накала рейда | `combatBalance.raid.escalateStartSec` | 18 с |
| Рейд | `raid.*` | `allies` 3 · `guards` 2 · `bossDurability` 3 · `bossPowerBonus` 0 · `bossScale` 1.35 · `bossBodyGap` 1.0 |
| Забег / турнир | `chain.roundBonus` / `chain.healBetweenRounds` / `collapse.healBetweenWaves` | [−0.5, −0.4, −0.25] / 0.25 / 0.25 |
| Командование легенды | `src/data/commandBalance.js` | `quietStartSec` 5 · `minGapSec` 3 · `hurtHp01` 0.35 · `foeWeakHp01` 0.25 · `pusherHp01` 0.60 · `nearDist` 2.4 · `lineHoldSec` 4 · `brain.maxPerFight` 5 · `brain.minGapSec` 8 · `brain.answerTtlSec` 1.5 |
| Думающая модель бойца (лимиты обращений: кулдаун 3 с, потолок 12, таймаут 1.5 с) | 🔒 `buildFighter.js` | не проверено; по скилу. Бэк: `backend/src/services/fighterIntentionService.js` `MAX_TOKENS` 120 |
| Прочие капы | `combatBalance.js` | `dodgeChanceMax` 0.55 · `missChanceCap` 0.35 · `blockTendencyMax` 0.65 · `staminaCadenceStretchMax` 1.8 · `staminaPowerFloor` 0.55 |

### 1.8 Числа вне `combatBalance.js` (правило проекта: все числа боя — в одном файле)

- `src/data/intentions.js`: порог одышки 0.22, порог «контрударник» 0.55, порог заряженного удара 0.85, окно угрозы 1.5 с, `ESC_ATTACK_PUSH` 0.7, `ESC_PASSIVE_DAMP` 0.5, бонус удержания намерения 0.08, `readPounce` 0.35/0.22 и все веса `spinalScore` (§1.2).
- `src/scene/instantBout.js`: `MAX_SEC` 240, `NAV_MARGIN` 0.5.
- `src/services/command.js:345`: пороги слов о здоровье 0.66 / 0.35.

### 1.9 Захардкожено в нескольких местах (расходятся молча)

| что | места |
| --- | --- |
| Порог «своё здоровье критично» 0.35 | `commandBalance.hurtHp01` = 0.35, `commandBalance.brain.selfHurtHp01` = 0.35 (две записи), `services/command.js:345` (третья, литерал) |
| Порог «противник при смерти» 0.25 | `commandBalance.foeWeakHp01` и `commandBalance.brain.foeWeakHp01` (две записи) |
| Порог «заряд готов» | `combatBalance.chargeReleaseThreshold` = **0.8** (тело разряжает), `intentions.js hardNeed` = **0.85** (намерение STRIKE) — **два близких порога одного понятия, лежат в разных файлах и различаются** |
| «Близко» | `buffBalance.bot.bucketNearDist` 2.2, `commandBalance.nearDist` 2.4 (осознанно, но два числа), + `combatBalance.field.ambushSwitchReach` 1.7 (в комментарии «на уровне STRIKE = 1.7», а скил называет STRIKE = 2.0 — не проверено, 🔒) |
| Просвет тел | `combatBalance.field.bodyGap` = 0.74 = константа CONTACT внутри бойца 🔒 (сказано в комментарии; две записи) |
| Границы плиты | `instantBout.js` (`PLATFORM.width/2 − NAV_MARGIN`) «те же, что считает сцена» 🔒 — вторая копия правила |
| HP 100 | `combatBalance.maxHp` и `src/core/constants.js MAX_HP` (устаревшая, боем не читается; из этого файла читают только `DECIMALS`) |
| Стартовые оси ядер ↔ ключи ядер | `behavior.js CORE_PROFILES`, `upgradeData.js CORES` и `CRYSTALS` — id ядер повторяются в трёх местах |
| Что делает кристалл | **два параллельных источника**: механика — `upgradeData.js` (60 записей, у каждого ядра своя), показ — `crystalTexts.js` (15 текстов, общие). Между собой не связаны (п.4.1) |
| Число на карточке | `facetReadout.js AXIS_PCT_PER_DELTA = 1`: сдвиг оси в пунктах показывается как «%» (weight +14 → «14%»), а реальный эффект — mobility −11 (п.4.1) |
| «Восемь секунд» клича | текст в комментариях `klichBalance.js` («holdSec + fadeSec = 8») — производное от двух чисел |

---

## 2. Харнесс

`scripts/balance-recon.mjs` — батч, только чтение. Движок — существующий `src/scene/instantBout.js` (тот же `buildFighter`, `battleField`, `boutCore`, те же числа; без рендера, шаг 1/60 с, мозг спинной, модель не вызывается). Своей арифметики боя нет.

- Запуск: `node scripts/balance-recon.mjs [раздел ...]`, разделы `det inventory metrics axes cores bias table effect levers raid` (или `all`). `SEEDS=200` / `RAID_SEEDS=20` меняют число зёрен. Скорость: пара ≈ 40–100 мс.
- Выход: `docs/balance-recon/out/<раздел>.md` и `.json`.
- Зёрна: `Math.random` подменяется генератором mulberry32 (как в `fight-regression.mjs`). **Детерминизм проверен**: 48 боёв, два прогона подряд и два разных процесса — один и тот же SHA-256 `d1a9eed4…29eb50` (раздел `det`).
- **Прогрев.** Первый бой процесса не совпадает с тем же боем, посчитанным позже (43.50 с против 44.50 с). Причина не выяснена (файл бойца не открывался); гипотеза — ленивая инициализация, берущая числа из `Math.random`. Харнесс прогоняет 16 пар на зерне 999 до любого замера. Существующий `fight-regression.mjs` прогрева не делает; его сумма от прогона к прогону стабильна (проверено дважды), потому что порядок боёв в нём фиксирован.
- Баффы и клич вешаются теми же вызовами бойца, что в игре (`heal`, `shortenStagger`, `setBuffPace`, `armDiceCharge`, `applyKlich`) и теми же числами. Логика тиков `services/buffs.js` воспроизведена в харнессе — сам файл не импортируется (тянет Vue и трёхмерные предметы).
- **Перекос сторон.** Зеркала слева выигрывают 34–42% (по 50 боёв). Раздел `bias` (1600 боёв) развёл причины: «первый в списке бойцов» выигрывает 46.9%, «слева» — 48.8% (σ 1.3 п.п.). Небольшой, но реальный минус первому в списке. Во всех замерах с рычагом стороны и порядок **чередуются по чётности зерна**; в матрице ядер усреднены оба порядка.

Ограничения: (1) рейд — состав и ядра как в игре (`composeRaid`), но точки выхода взяты из `collapseSpawnPos(4, …)`, а не из `ArenaScene.vue` 🔒, масштаб босса `bossScale` мгновенный бой не передаёт, боец игрока — «бот с теми же гранями» со случайным ядром; (2) пары ядер — без кристаллов; (3) выбор ядра игроком, живой клич пальцем и правильный момент броска в замере заменены фиксированными правилами.

---

## Список зёрен

| раздел | зёрна |
| --- | --- |
| п.3 ядра (16 пар) | 1…50 на пару |
| п.4.1 таблица дельт | без зёрен (чтение данных + `buildFighter().stats`); проводка рычагов и тегов — 1…20 × 4 ядра (зеркало) |
| п.4.3 вклад кристалла | 1…50 (как в ТЗ) **и** 1…200 (подтверждение); T слева при нечётном зерне, справа при чётном |
| п.5 клич и баффы | 1…50 × 4 ядра = 200 боёв на строку; та же чередование |
| п.6 RAID | 1…20 на каждое число граней 0…5 |
| оси, перекос сторон | оси: 1…20; bias: 1…100 × 4 комбинации × 4 ядра |
| прогрев | 999 (результат отбрасывается) |

---

## 3. Замер: ядра (16 пар × 50 зёрен)

Пары: 16 упорядоченных (A слева, B справа), зёрна 1..50. Начальные позиции x=∓1.2. Ядра без зажжённых кристаллов.

| A (слева, player) | B (справа, foe) | мед. с | p10 с | p90 с | макс. с | победы A | винрейт A | HP победителя (ср.) | упёрлись в таймаут (240 с) | дольше 100 с |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT (зеркало) | ONSLAUGHT | 45.4 | 42.9 | 50.4 | 52.3 | 17/50 | 34% | 27% | 0 | 0 |
| ONSLAUGHT | RAIDER | 45.1 | 43.3 | 49.2 | 52.3 | 26/50 | 52% | 25% | 0 | 0 |
| ONSLAUGHT | BULWARK | 52.6 | 48.4 | 59.7 | 67.9 | 9/50 | 18% | 29% | 0 | 0 |
| ONSLAUGHT | AMBUSH | 48.9 | 44.9 | 54.1 | 59.5 | 23/50 | 46% | 25% | 0 | 0 |
| RAIDER | ONSLAUGHT | 45.5 | 41.2 | 49.4 | 52.0 | 21/50 | 42% | 25% | 0 | 0 |
| RAIDER (зеркало) | RAIDER | 45.2 | 40.6 | 48.4 | 53.2 | 18/50 | 36% | 28% | 0 | 0 |
| RAIDER | BULWARK | 53.3 | 45.1 | 62.5 | 66.5 | 5/50 | 10% | 32% | 0 | 0 |
| RAIDER | AMBUSH | 49.6 | 42.4 | 56.8 | 68.1 | 25/50 | 50% | 34% | 0 | 0 |
| BULWARK | ONSLAUGHT | 52.2 | 47.2 | 60.8 | 68.6 | 37/50 | 74% | 34% | 0 | 0 |
| BULWARK | RAIDER | 52.7 | 45.3 | 58.7 | 64.9 | 41/50 | 82% | 33% | 0 | 0 |
| BULWARK (зеркало) | BULWARK | 63.5 | 57.7 | 67.7 | 71.7 | 21/50 | 42% | 22% | 0 | 0 |
| BULWARK | AMBUSH | 53.2 | 46.9 | 63.5 | 76.5 | 40/50 | 80% | 33% | 0 | 0 |
| AMBUSH | ONSLAUGHT | 49.6 | 45.1 | 55.0 | 58.3 | 27/50 | 54% | 23% | 0 | 0 |
| AMBUSH | RAIDER | 49.7 | 44.6 | 52.9 | 72.3 | 26/50 | 52% | 28% | 0 | 0 |
| AMBUSH | BULWARK | 55.9 | 47.9 | 63.3 | 69.2 | 13/50 | 26% | 30% | 0 | 0 |
| AMBUSH (зеркало) | AMBUSH | 51.5 | 47.2 | 57.1 | 65.9 | 21/50 | 42% | 31% | 0 | 0 |

**Сводный винрейт ядра против трёх других (обе стороны плиты, без зеркал):**

| ядро | победы | винрейт |
| --- | --- | --- |
| ONSLAUGHT | 123/300 | 41.0% |
| RAIDER | 108/300 | 36.0% |
| BULWARK | 241/300 | 80.3% |
| AMBUSH | 128/300 | 42.7% |

**Матрица винрейта «строка бьёт столбец», обе стороны и оба порядка усреднены (100 боёв на ячейку):**

|  | ONSLAUGHT | RAIDER | BULWARK | AMBUSH |
| --- | --- | --- | --- | --- |
| ONSLAUGHT | — | 55% | 22% | 46% |
| RAIDER | 45% | — | 14% | 49% |
| BULWARK | 78% | 86% | — | 77% |
| AMBUSH | 54% | 51% | 23% | — |

**Перекос в зеркалах (должно быть ≈50%):** ONSLAUGHT: победы «слева» 17/50 · RAIDER: победы «слева» 18/50 · BULWARK: победы «слева» 21/50 · AMBUSH: победы «слева» 21/50. Разбор перекоса (порядок в списке против точки выхода) — раздел bias.

**Перекос сторон (раздел `bias`):**

Зеркальные бои (одно ядро с обеих сторон), 100 зёрен на каждую из 4 комбинаций «кто первым в списке × кто слева», 4 ядра = 1600 боёв. Считаются победы того, кто ПЕРВЫМ в списке бойцов (обновляется в кадре раньше), и того, кто СЛЕВА.

| ядро | победы «первого в списке» | винрейт «первого» | победы «слева» | винрейт «слева» |
| --- | --- | --- | --- | --- |
| ONSLAUGHT | 185/400 | 46.3% | 193/400 | 48.3% |
| RAIDER | 191/400 | 47.8% | 193/400 | 48.3% |
| BULWARK | 180/400 | 45.0% | 188/400 | 47.0% |
| AMBUSH | 194/400 | 48.5% | 206/400 | 51.5% |

**Итого (1600 боёв):** «первый в списке» выигрывает 46.9%, «слева» выигрывает 48.8%. Честно — 50%; σ ≈ 1.3 п.п.

---

## 4. Замер: кристаллы поштучно

### 4.1 Таблица «ядро × кристалл → фактическая дельта» (60 ячеек) и строка CHARACTER

«Кристалл» = один из 5 шагов внутри грани (в коде `face` в ветке a|b|c). 15 кристаллов × 4 ядра = 60 ячеек.
Δ осей — фактическая (после зажима 0..100) при зажжённом ЭТОМ кристалле одном, относительно стартового профиля ядра.
Δ stats — замер у живого бойца (`buildFighter().stats`): strikePower / toughness / mobility / accuracy / blockMitigation / blockPenetration / chargeMax…
Рычаги, которых нет в `stats` (feintChance, feintPayoff, staminaRegen, blockCounter, interruptBonus, dodgeCounter, missCounter, interruptResist), видны только в колонке «бонусы» — как записано в данных.

| ядро | грань/кристалл | имя в данных | Δ осей (факт, от старта ядра) | бонусы (% к рычагу) | Δ stats у бойца (замер) | теги (мертвы) | CHARACTER, что видит игрок | текст vs механика |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY/ROOT (a1) | Heavy Hit | wt+14 | strikePower +4% | strikePower +4, mobility -11 | — | Stubborn. He backs off less often than he should. | не совпало (оси resilience,stick,distance не двигаются) |
| ONSLAUGHT | BODY/DRIVE (a2) | Guard Crush | wt+8 | strikePower +7%, blockPenetration +40% | strikePower +7, blockPenetration +0.4, mobility -6 | — | Impatient. He opens the exchange first. | частично |
| ONSLAUGHT | BODY/GRIND (a3) | Unshaken | res+14 | strikePower +10%, interruptResist +70% | strikePower +10 | — | Takes punishment well. Stays in an exchange past the point where it pays. | частично |
| ONSLAUGHT | BODY/BREAK (a4) | Close Power | dist−8 wt+6 | strikePower +14% | strikePower +14, mobility -5 | close_damage_ramp | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| ONSLAUGHT | BODY/ANVIL (a5) | Breakthrough | wt+10 | strikePower +22%, blockPenetration +95% | strikePower +22, blockPenetration +0.95, mobility -8 | overload_strike | Calm under pressure. He no longer panics in the corner. | не совпало (оси resilience,counter не двигаются) |
| ONSLAUGHT | MIND/WATCH (b1) | Hard Entry | dist−8 init+6 | — | — | — | Careful. Waits a little longer before he enters. | ПРОТИВОПОЛОЖНО (initiative) |
| ONSLAUGHT | MIND/TIMING (b2) | Run-Down | dist−6 stick+8 | — | — | chase_strike | Deliberate. Throws fewer blind punches. | не совпало (оси tempo,counter не двигаются) |
| ONSLAUGHT | MIND/FEINT (b3) | Cut Off | stick+10 | — | — | — | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| ONSLAUGHT | MIND/ADAPT (b4) | Cling | dist−6 stick+10 | — | — | — | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | MIND/COLD (b5) | Lockdown | dist−8 stick+14 | — | — | lockdown | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| ONSLAUGHT | WILL/HOLD (c1) | Long Combo | tempo+8 | — | — | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/SPITE (c2) | No Pause | tempo+10 | — | — | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/VOW (c3) | Building Momentum | tempo+6 | — | — | hit_accel | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/HUNGER (c4) | No Breather | tempo+6 stick+6 | — | — | no_breather | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/STILL (c5) | Rampage | tempo+12 | — | — | rampage | Ice. His overall liveliness drops. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | BODY/ROOT (a1) | Quick Out | dist+8 tempo+6 | — | — | — | Stubborn. He backs off less often than he should. | ПРОТИВОПОЛОЖНО (distance) |
| RAIDER | BODY/DRIVE (a2) | Pinpoint Entry | init+6 | accuracy +35% | accuracy +18 | — | Impatient. He opens the exchange first. | частично |
| RAIDER | BODY/GRIND (a3) | Far Bounce | dist+10 slip+6 | — | — | — | Takes punishment well. Stays in an exchange past the point where it pays. | не совпало (оси resilience,stick не двигаются) |
| RAIDER | BODY/BREAK (a4) | Clean Exchange | tempo+8 | — | — | clean_chain | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| RAIDER | BODY/ANVIL (a5) | Perfect Prick | dist+8 init+10 slip+6 | — | — | perfect_jab | Calm under pressure. He no longer panics in the corner. | не совпало (оси resilience,counter не двигаются) |
| RAIDER | MIND/WATCH (b1) | Fake-In | tempo+4 | feintChance +20% | — | — | Careful. Waits a little longer before he enters. | не совпало (оси counter,initiative не двигаются) |
| RAIDER | MIND/TIMING (b2) | Punish Reaction | tempo+4 | feintPayoff +50% | — | — | Deliberate. Throws fewer blind punches. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | MIND/FEINT (b3) | Broken Rhythm | tempo+8 | — | — | rhythm_break | Sly. Starts playing with the opponent and loses tempo. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | MIND/ADAPT (b4) | Feint to Interrupt | tempo+6 | — | — | feint_interrupt | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | MIND/COLD (b5) | Setup Combo | tempo+6 | feintPayoff +120% | — | feint_combo | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| RAIDER | WILL/HOLD (c1) | Read the Tell | init−6 | strikePower +4%, accuracy +30% | strikePower +4, accuracy +15 | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/SPITE (c2) | Strike the Open | init+4 | strikePower +7% | strikePower +7 | punish_exhausted | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/VOW (c3) | Charged Run | dist+6 | strikePower +10%, chargeGain +60% | strikePower +10, chargeGain/с +7.2 | — | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/HUNGER (c4) | Punish Aggression | ctr+10 | strikePower +14% | strikePower +14 | punish_aggression | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/STILL (c5) | Killing Run | dist+6 | strikePower +22%, chargePower +60% | strikePower +22, chargePowerMax +0.36 | lethal_entry | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |
| BULWARK | BODY/ROOT (a1) | Tough Hide | res+8 | toughness +4% | toughness +8 | — | Stubborn. He backs off less often than he should. | частично |
| BULWARK | BODY/DRIVE (a2) | Steady Guard | res+10 | toughness +7% | toughness +14 | — | Impatient. He opens the exchange first. | не совпало (оси weight,initiative не двигаются) |
| BULWARK | BODY/GRIND (a3) | Catch Breath | res+6 | toughness +10%, staminaRegen +60% | toughness +20 | — | Takes punishment well. Stays in an exchange past the point where it pays. | частично |
| BULWARK | BODY/BREAK (a4) | Dig In | dist−6 | toughness +14% | toughness +28 | dig_in | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| BULWARK | BODY/ANVIL (a5) | Unbreakable | res+8 | toughness +22%, blockMitigation +60% | toughness +44, blockMitigation +0.3 | fortress | Calm under pressure. He no longer panics in the corner. | частично |
| BULWARK | MIND/WATCH (b1) | Riposte | stick+6 ctr+8 | toughness +4%, blockCounter +50% | toughness +8 | — | Careful. Waits a little longer before he enters. | частично |
| BULWARK | MIND/TIMING (b2) | Catch & Punish | ctr+8 | toughness +7%, interruptBonus +50% | toughness +14 | — | Deliberate. Throws fewer blind punches. | частично |
| BULWARK | MIND/FEINT (b3) | Hard Meet | stick+6 ctr+10 | toughness +10% | toughness +20 | — | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| BULWARK | MIND/ADAPT (b4) | Retaliation | ctr+8 | toughness +14% | toughness +28 | retaliate_ramp | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | MIND/COLD (b5) | Sea Wall | stick+6 ctr+8 | toughness +22%, blockCounter +100%, interruptBonus +100% | toughness +44 | counter_trap | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| BULWARK | WILL/HOLD (c1) | Body Shove | dist−6 stick+8 | — | — | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/SPITE (c2) | Heavy Slam | wt+10 | blockPenetration +35% | blockPenetration +0.35, mobility -8 | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/VOW (c3) | No Way Around | stick+10 | — | — | — | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/HUNGER (c4) | Pin | dist−6 stick+8 | — | — | pin | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/STILL (c5) | Clinch | wt+8 stick+14 | blockPenetration +50% | blockPenetration +0.5, mobility -6 | clinch | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |
| AMBUSH | BODY/ROOT (a1) | Hard Counter | ctr+8 | — | — | — | Stubborn. He backs off less often than he should. | не совпало (оси resilience,stick,distance не двигаются) |
| AMBUSH | BODY/DRIVE (a2) | Slip Counter | slip+6 | dodgeCounter +50% | — | — | Impatient. He opens the exchange first. | не совпало (оси weight,initiative не двигаются) |
| AMBUSH | BODY/GRIND (a3) | Punish Aggression | ctr+8 | — | — | punish_aggression | Takes punishment well. Stays in an exchange past the point where it pays. | не совпало (оси resilience,stick не двигаются) |
| AMBUSH | BODY/BREAK (a4) | Punish Whiff | dist+6 | missCounter +50% | — | — | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| AMBUSH | BODY/ANVIL (a5) | Perfect Trap | ctr+8 slip+4 | dodgeCounter +100%, missCounter +100% | — | perfect_trap | Calm under pressure. He no longer panics in the corner. | частично |
| AMBUSH | MIND/WATCH (b1) | Long Slip | dist+6 slip+10 | — | — | — | Careful. Waits a little longer before he enters. | не совпало (оси counter,initiative не двигаются) |
| AMBUSH | MIND/TIMING (b2) | Hard to Reach | dist+6 slip+8 | — | — | — | Deliberate. Throws fewer blind punches. | не совпало (оси tempo,counter не двигаются) |
| AMBUSH | MIND/FEINT (b3) | Run 'Em Ragged | dist+8 slip+6 | — | — | exhaust | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| AMBUSH | MIND/ADAPT (b4) | Open Window | slip+8 | dodgeCounter +40% | — | — | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | MIND/COLD (b5) | Phantom | dist+6 slip+12 | — | — | phantom | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| AMBUSH | WILL/HOLD (c1) | Loaded Hit | dist+6 | strikePower +4%, chargePower +50% | strikePower +4, chargePowerMax +0.3 | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/SPITE (c2) | Long Charge | dist+6 init−6 | strikePower +7%, chargeMax +60% | strikePower +7, chargeMax +60 | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/VOW (c3) | Hit the Opening | init−6 | strikePower +10% | strikePower +10 | vulnerable_strike | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/HUNGER (c4) | Pierce | dist+6 | strikePower +14%, chargePen +60% | strikePower +14, chargePenetrationMax +0.42 | — | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/STILL (c5) | Execution | dist+6 | strikePower +22%, chargePower +80% | strikePower +22, chargePowerMax +0.48 | execute | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |

Сводка сверки текста с механикой (по моему чтению CLAIMS в скрипте): {"не совпало":26,"частично":9,"противоположно":5,"нет оси у механики":20}

### 4.2 Нулевые и почти нулевые кристаллы

**4.2а. Проводка рычагов-бонусов.** Каждому рычагу ставилось +100% (бонус кристалла), 4 ядра × 20 зёрен, зеркало; сравнение с нулевым боем бит в бит. «Изменилось» — сколько боёв из 80 отличаются.

| рычаг | боёв изменилось | вывод |
| --- | --- | --- |
| strikePower | 80/80 | живой |
| blockPenetration | 72/80 | живой |
| interruptResist | 80/80 | живой |
| accuracy | 74/80 | живой |
| feintChance | 19/80 | живой |
| feintPayoff | 7/80 | живой |
| chargeGain | 31/80 | живой |
| chargePower | 25/80 | живой |
| toughness | 71/80 | живой |
| staminaRegen | 71/80 | живой |
| blockMitigation | 61/80 | живой |
| blockCounter | 29/80 | живой |
| interruptBonus | 47/80 | живой |
| dodgeCounter | 38/80 | живой |
| missCounter | 39/80 | живой |
| chargeMax | 26/80 | живой |
| chargePen | 8/80 | живой |
| (теги: все 26 сразу) | 0/80 | **ЛОЖЬ: бой не меняется вовсе** |

**4.2б. Кристаллы, чей ЕДИНСТВЕННЫЙ бонус — мёртвый рычаг (осевой сдвиг, если он есть, остаётся):** нет.

**4.2в. Малая дельта: Σ|Δ осей| ≤ 6 в изоляции и нет ни одного живого рычага-бонуса** (кристалл почти ничего не меняет в бойце сам по себе):

| ядро | кристалл | имя | Δ осей факт | бонусы | теги |
| --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | WILL/VOW (c3) | Building Momentum | tempo+6 | — | hit_accel |
| RAIDER | MIND/ADAPT (b4) | Feint to Interrupt | tempo+6 | — | feint_interrupt |

**4.2г. Ось насыщается: при зажжённых предыдущих кристаллах той же грани записанный сдвиг съедается зажимом 0..100 (факт < записанного).**

| ядро | кристалл | записано | предельный вклад (факт) |
| --- | --- | --- | --- |
| ONSLAUGHT | MIND/ADAPT (b4) | stick+10 distance−6 | dist−1 |
| ONSLAUGHT | MIND/COLD (b5) | stick+14 distance−8 | — |
| ONSLAUGHT | WILL/HUNGER (c4) | tempo+6 stick+6 | stick+6 |
| ONSLAUGHT | WILL/STILL (c5) | tempo+12 | — |
| BULWARK | BODY/GRIND (a3) | resilience+6 | — |
| BULWARK | BODY/ANVIL (a5) | resilience+8 | — |
| AMBUSH | BODY/ANVIL (a5) | counter+8 slip+4 | slip+4 |
| AMBUSH | MIND/COLD (b5) | slip+12 distance+6 | — |

Кристаллов без единого движения осей в изоляции: 0 из 60 (все имеют ось или бонус).
Кристаллов, у которых предельный вклад по осям нулевой и живого рычага нет: 3 — ONSLAUGHT COLD, ONSLAUGHT STILL, AMBUSH COLD.

### 4.2д Чувствительность боя к осям (где ось «на упоре»)

Ось сдвигается на −20/−10/+10/+20 от стартового значения ядра (с зажимом 0..100; «—» = ось уже на границе); мерится, в скольких из 20 зеркальных боёв исход отличается от нулевого БИТ В БИТ. 0/20 — бой к сдвигу нечувствителен.

| ядро | ось | старт | −20 | −10 | +10 | +20 |
| --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | distance | 15 | 0/20 | 0/20 | 0/20 | 0/20 |
| ONSLAUGHT | initiative | 90 | 0/20 | 0/20 | 0/20 | 0/20 |
| ONSLAUGHT | tempo | 80 | 14/20 | 13/20 | 16/20 | 16/20 |
| ONSLAUGHT | weight | 55 | 20/20 | 20/20 | 20/20 | 20/20 |
| ONSLAUGHT | stick | 85 | 16/20 | 11/20 | 0/20 | 0/20 |
| ONSLAUGHT | resilience | 60 | 20/20 | 20/20 | 20/20 | 20/20 |
| ONSLAUGHT | counter | 30 | 20/20 | 20/20 | 20/20 | 20/20 |
| ONSLAUGHT | slip | 20 | 20/20 | 15/20 | 14/20 | 17/20 |
| RAIDER | distance | 55 | 20/20 | 20/20 | 20/20 | 20/20 |
| RAIDER | initiative | 70 | 20/20 | 20/20 | 17/20 | 20/20 |
| RAIDER | tempo | 65 | 12/20 | 12/20 | 14/20 | 16/20 |
| RAIDER | weight | 35 | 20/20 | 20/20 | 20/20 | 20/20 |
| RAIDER | stick | 15 | 18/20 | 16/20 | 20/20 | 20/20 |
| RAIDER | resilience | 35 | 18/20 | 18/20 | 20/20 | 20/20 |
| RAIDER | counter | 45 | 20/20 | 20/20 | 20/20 | 20/20 |
| RAIDER | slip | 65 | 20/20 | 20/20 | 20/20 | 20/20 |
| BULWARK | distance | 20 | 13/20 | 13/20 | 15/20 | 18/20 |
| BULWARK | initiative | 25 | 20/20 | 20/20 | 16/20 | 19/20 |
| BULWARK | tempo | 30 | 11/20 | 11/20 | 8/20 | 10/20 |
| BULWARK | weight | 65 | 20/20 | 20/20 | 20/20 | 20/20 |
| BULWARK | stick | 70 | 20/20 | 9/20 | 13/20 | 19/20 |
| BULWARK | resilience | 90 | 20/20 | 20/20 | 20/20 | 20/20 |
| BULWARK | counter | 60 | 20/20 | 20/20 | 20/20 | 20/20 |
| BULWARK | slip | 15 | 20/20 | 10/20 | 16/20 | 19/20 |
| AMBUSH | distance | 80 | 20/20 | 19/20 | 20/20 | 20/20 |
| AMBUSH | initiative | 15 | 9/20 | 8/20 | 12/20 | 20/20 |
| AMBUSH | tempo | 20 | 6/20 | 6/20 | 8/20 | 8/20 |
| AMBUSH | weight | 75 | 20/20 | 20/20 | 20/20 | 20/20 |
| AMBUSH | stick | 20 | 17/20 | 16/20 | 12/20 | 15/20 |
| AMBUSH | resilience | 35 | 20/20 | 20/20 | 19/20 | 20/20 |
| AMBUSH | counter | 90 | 20/20 | 20/20 | 20/20 | 20/20 |
| AMBUSH | slip | 75 | 20/20 | 13/20 | 13/20 | 20/20 |

### 4.3 Вклад каждого кристалла в исход — 50 зёрен (как в ТЗ)

Зеркальный бой, 50 зёрен на ячейку, стороны плиты чередуются. T = сторона с ОДНИМ зажжённым кристаллом. «Δ к 50%» — сдвиг винрейта T от честной ничьей; «Δ к нулю» — от замера того же зеркала без кристаллов (перекос сторон вычтен).
**Шум:** при n=50 стандартное отклонение винрейта ≈ 7.1 п.п. Колонка «Δ к нулю» — РАЗНОСТЬ двух замеров (кристалл и нулевой), поэтому её σ ≈ 10.0 п.п., а 95% интервал ≈ ±20 п.п.: сдвиги «к нулю» меньше ~20 п.п. от шума не отличимы. Столбец «Δ к 50%» несёт ещё и перекос зеркала — смотреть на «Δ к нулю».

**Нулевой замер (зеркало без кристаллов; T = сторона, помеченная в чётные/нечётные зёрна):**

| ядро | победы T | винрейт T | мед. длительность, с |
| --- | --- | --- | --- |
| ONSLAUGHT | 22/50 | 44% | 46.1 |
| RAIDER | 20/50 | 40% | 45.3 |
| BULWARK | 26/50 | 52% | 61.9 |
| AMBUSH | 24/50 | 48% | 51.0 |

| ядро | кристалл | имя в данных | победы T | винрейт T | Δ к 50%, п.п. | Δ к нулю, п.п. | мед. с | Δ мед. с | боёв бит-в-бит как без кристалла |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY/ROOT (a1) | Heavy Hit | 27/50 | 54% | +4.0 | +10.0 | 45.6 | -0.5 | 0/50 |
| ONSLAUGHT | BODY/DRIVE (a2) | Guard Crush | 33/50 | 66% | +16.0 | +22.0 | 44.5 | -1.6 | 0/50 |
| ONSLAUGHT | BODY/GRIND (a3) | Unshaken | 40/50 | 80% | +30.0 | +36.0 | 44.9 | -1.2 | 0/50 |
| ONSLAUGHT | BODY/BREAK (a4) | Close Power | 29/50 | 58% | +8.0 | +14.0 | 45.3 | -0.7 | 0/50 |
| ONSLAUGHT | BODY/ANVIL (a5) | Breakthrough | 45/50 | 90% | +40.0 | +46.0 | 42.4 | -3.7 | 0/50 |
| ONSLAUGHT | MIND/WATCH (b1) | Hard Entry | 22/50 | 44% | -6.0 | +0.0 | 46.1 | +0.0 | 49/50 |
| ONSLAUGHT | MIND/TIMING (b2) | Run-Down | 22/50 | 44% | -6.0 | +0.0 | 46.1 | +0.0 | 49/50 |
| ONSLAUGHT | MIND/FEINT (b3) | Cut Off | 22/50 | 44% | -6.0 | +0.0 | 46.1 | +0.0 | 50/50 |
| ONSLAUGHT | MIND/ADAPT (b4) | Cling | 22/50 | 44% | -6.0 | +0.0 | 46.1 | +0.0 | 49/50 |
| ONSLAUGHT | MIND/COLD (b5) | Lockdown | 22/50 | 44% | -6.0 | +0.0 | 46.1 | +0.0 | 49/50 |
| ONSLAUGHT | WILL/HOLD (c1) | Long Combo | 27/50 | 54% | +4.0 | +10.0 | 46.8 | +0.8 | 12/50 |
| ONSLAUGHT | WILL/SPITE (c2) | No Pause | 23/50 | 46% | -4.0 | +2.0 | 45.9 | -0.2 | 11/50 |
| ONSLAUGHT | WILL/VOW (c3) | Building Momentum | 28/50 | 56% | +6.0 | +12.0 | 46.3 | +0.2 | 20/50 |
| ONSLAUGHT | WILL/HUNGER (c4) | No Breather | 28/50 | 56% | +6.0 | +12.0 | 46.3 | +0.2 | 20/50 |
| ONSLAUGHT | WILL/STILL (c5) | Rampage | 22/50 | 44% | -6.0 | +0.0 | 47.2 | +1.1 | 11/50 |
| RAIDER | BODY/ROOT (a1) | Quick Out | 22/50 | 44% | -6.0 | +4.0 | 44.9 | -0.3 | 0/50 |
| RAIDER | BODY/DRIVE (a2) | Pinpoint Entry | 27/50 | 54% | +4.0 | +14.0 | 44.3 | -1.0 | 3/50 |
| RAIDER | BODY/GRIND (a3) | Far Bounce | 26/50 | 52% | +2.0 | +12.0 | 45.0 | -0.3 | 0/50 |
| RAIDER | BODY/BREAK (a4) | Clean Exchange | 19/50 | 38% | -12.0 | -2.0 | 44.3 | -1.0 | 11/50 |
| RAIDER | BODY/ANVIL (a5) | Perfect Prick | 23/50 | 46% | -4.0 | +6.0 | 45.4 | +0.1 | 0/50 |
| RAIDER | MIND/WATCH (b1) | Fake-In | 14/50 | 28% | -22.0 | -12.0 | 45.2 | -0.1 | 11/50 |
| RAIDER | MIND/TIMING (b2) | Punish Reaction | 20/50 | 40% | -10.0 | +0.0 | 44.7 | -0.6 | 14/50 |
| RAIDER | MIND/FEINT (b3) | Broken Rhythm | 19/50 | 38% | -12.0 | -2.0 | 44.3 | -1.0 | 11/50 |
| RAIDER | MIND/ADAPT (b4) | Feint to Interrupt | 20/50 | 40% | -10.0 | +0.0 | 44.2 | -1.1 | 14/50 |
| RAIDER | MIND/COLD (b5) | Setup Combo | 20/50 | 40% | -10.0 | +0.0 | 44.2 | -1.1 | 14/50 |
| RAIDER | WILL/HOLD (c1) | Read the Tell | 33/50 | 66% | +16.0 | +26.0 | 44.7 | -0.5 | 1/50 |
| RAIDER | WILL/SPITE (c2) | Strike the Open | 34/50 | 68% | +18.0 | +28.0 | 44.4 | -0.9 | 6/50 |
| RAIDER | WILL/VOW (c3) | Charged Run | 27/50 | 54% | +4.0 | +14.0 | 44.1 | -1.2 | 0/50 |
| RAIDER | WILL/HUNGER (c4) | Punish Aggression | 37/50 | 74% | +24.0 | +34.0 | 43.6 | -1.6 | 0/50 |
| RAIDER | WILL/STILL (c5) | Killing Run | 27/50 | 54% | +4.0 | +14.0 | 43.7 | -1.6 | 0/50 |
| BULWARK | BODY/ROOT (a1) | Tough Hide | 38/50 | 76% | +26.0 | +24.0 | 65.0 | +3.1 | 0/50 |
| BULWARK | BODY/DRIVE (a2) | Steady Guard | 40/50 | 80% | +30.0 | +28.0 | 65.6 | +3.7 | 0/50 |
| BULWARK | BODY/GRIND (a3) | Catch Breath | 36/50 | 72% | +22.0 | +20.0 | 62.8 | +0.9 | 0/50 |
| BULWARK | BODY/BREAK (a4) | Dig In | 23/50 | 46% | -4.0 | -6.0 | 61.0 | -0.8 | 7/50 |
| BULWARK | BODY/ANVIL (a5) | Unbreakable | 47/50 | 94% | +44.0 | +42.0 | 65.6 | +3.7 | 0/50 |
| BULWARK | MIND/WATCH (b1) | Riposte | 30/50 | 60% | +10.0 | +8.0 | 60.3 | -1.6 | 0/50 |
| BULWARK | MIND/TIMING (b2) | Catch & Punish | 31/50 | 62% | +12.0 | +10.0 | 62.6 | +0.7 | 0/50 |
| BULWARK | MIND/FEINT (b3) | Hard Meet | 32/50 | 64% | +14.0 | +12.0 | 62.6 | +0.7 | 0/50 |
| BULWARK | MIND/ADAPT (b4) | Retaliation | 31/50 | 62% | +12.0 | +10.0 | 63.5 | +1.6 | 0/50 |
| BULWARK | MIND/COLD (b5) | Sea Wall | 39/50 | 78% | +28.0 | +26.0 | 59.1 | -2.7 | 0/50 |
| BULWARK | WILL/HOLD (c1) | Body Shove | 24/50 | 48% | -2.0 | -4.0 | 61.6 | -0.3 | 10/50 |
| BULWARK | WILL/SPITE (c2) | Heavy Slam | 32/50 | 64% | +14.0 | +12.0 | 59.5 | -2.4 | 0/50 |
| BULWARK | WILL/VOW (c3) | No Way Around | 27/50 | 54% | +4.0 | +2.0 | 60.9 | -0.9 | 18/50 |
| BULWARK | WILL/HUNGER (c4) | Pin | 24/50 | 48% | -2.0 | -4.0 | 61.6 | -0.3 | 10/50 |
| BULWARK | WILL/STILL (c5) | Clinch | 39/50 | 78% | +28.0 | +26.0 | 58.4 | -3.5 | 0/50 |
| AMBUSH | BODY/ROOT (a1) | Hard Counter | 29/50 | 58% | +8.0 | +10.0 | 51.5 | +0.6 | 0/50 |
| AMBUSH | BODY/DRIVE (a2) | Slip Counter | 30/50 | 60% | +10.0 | +12.0 | 50.0 | -1.0 | 12/50 |
| AMBUSH | BODY/GRIND (a3) | Punish Aggression | 29/50 | 58% | +8.0 | +10.0 | 51.5 | +0.6 | 0/50 |
| AMBUSH | BODY/BREAK (a4) | Punish Whiff | 29/50 | 58% | +8.0 | +10.0 | 50.5 | -0.5 | 3/50 |
| AMBUSH | BODY/ANVIL (a5) | Perfect Trap | 38/50 | 76% | +26.0 | +28.0 | 49.0 | -1.9 | 0/50 |
| AMBUSH | MIND/WATCH (b1) | Long Slip | 24/50 | 48% | -2.0 | +0.0 | 52.1 | +1.2 | 0/50 |
| AMBUSH | MIND/TIMING (b2) | Hard to Reach | 27/50 | 54% | +4.0 | +6.0 | 52.2 | +1.2 | 1/50 |
| AMBUSH | MIND/FEINT (b3) | Run 'Em Ragged | 28/50 | 56% | +6.0 | +8.0 | 52.6 | +1.6 | 0/50 |
| AMBUSH | MIND/ADAPT (b4) | Open Window | 32/50 | 64% | +14.0 | +16.0 | 50.4 | -0.5 | 11/50 |
| AMBUSH | MIND/COLD (b5) | Phantom | 27/50 | 54% | +4.0 | +6.0 | 52.9 | +2.0 | 0/50 |
| AMBUSH | WILL/HOLD (c1) | Loaded Hit | 33/50 | 66% | +16.0 | +18.0 | 49.7 | -1.3 | 2/50 |
| AMBUSH | WILL/SPITE (c2) | Long Charge | 33/50 | 66% | +16.0 | +18.0 | 50.6 | -0.3 | 2/50 |
| AMBUSH | WILL/VOW (c3) | Hit the Opening | 27/50 | 54% | +4.0 | +6.0 | 50.5 | -0.4 | 12/50 |
| AMBUSH | WILL/HUNGER (c4) | Pierce | 37/50 | 74% | +24.0 | +26.0 | 49.2 | -1.8 | 2/50 |
| AMBUSH | WILL/STILL (c5) | Execution | 37/50 | 74% | +24.0 | +26.0 | 48.4 | -2.5 | 0/50 |

**Кристаллы, НИЧЕГО не меняющие в бою (все 50 боёв совпали с нулевым бит в бит):** ONSLAUGHT MIND/FEINT

**Почти ничего не меняющие (≥80% боёв совпали бит-в-бит, но не все):** ONSLAUGHT MIND/WATCH (49/50), ONSLAUGHT MIND/TIMING (49/50), ONSLAUGHT MIND/ADAPT (49/50), ONSLAUGHT MIND/COLD (49/50)

**Средний сдвиг по ядрам (знак / средний модуль):**

| ядро | средний Δ | средний |Δ| |
| --- | --- | --- |
| ONSLAUGHT | +4.9 | +10.3 |
| RAIDER | -0.9 | +10.5 |
| BULWARK | +15.7 | +16.8 |
| AMBUSH | +11.3 | +11.6 |

**По граням:** BODY +13.0 · MIND +0.4 · WILL +9.9

**По глубине (шаг в грани):** шаг 1 +3.8 · шаг 2 +8.7 · шаг 3 +6.8 · шаг 4 +5.2 · шаг 5 +14.3

**Топ-5 плюс:** BULWARK ANVIL +44.0, ONSLAUGHT ANVIL +40.0, ONSLAUGHT GRIND +30.0, BULWARK DRIVE +30.0, BULWARK COLD +28.0

**Топ-5 минус:** RAIDER WATCH -22.0, RAIDER FEINT -12.0, RAIDER BREAK -12.0, RAIDER COLD -10.0, RAIDER ADAPT -10.0

### 4.3б То же на 200 зёрнах (подтверждение; σ ≈ 3.5 п.п., порог значимости ±7)

Зеркальный бой, 200 зёрен на ячейку, стороны плиты чередуются. T = сторона с ОДНИМ зажжённым кристаллом. «Δ к 50%» — сдвиг винрейта T от честной ничьей; «Δ к нулю» — от замера того же зеркала без кристаллов (перекос сторон вычтен).
**Шум:** при n=200 стандартное отклонение винрейта ≈ 3.5 п.п. Колонка «Δ к нулю» — РАЗНОСТЬ двух замеров (кристалл и нулевой), поэтому её σ ≈ 5.0 п.п., а 95% интервал ≈ ±10 п.п.: сдвиги «к нулю» меньше ~10 п.п. от шума не отличимы. Столбец «Δ к 50%» несёт ещё и перекос зеркала — смотреть на «Δ к нулю».

**Нулевой замер (зеркало без кристаллов; T = сторона, помеченная в чётные/нечётные зёрна):**

| ядро | победы T | винрейт T | мед. длительность, с |
| --- | --- | --- | --- |
| ONSLAUGHT | 93/200 | 47% | 46.2 |
| RAIDER | 93/200 | 47% | 44.4 |
| BULWARK | 101/200 | 51% | 62.0 |
| AMBUSH | 110/200 | 55% | 50.5 |

| ядро | кристалл | имя в данных | победы T | винрейт T | Δ к 50%, п.п. | Δ к нулю, п.п. | мед. с | Δ мед. с | боёв бит-в-бит как без кристалла |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY/ROOT (a1) | Heavy Hit | 105/200 | 53% | +2.5 | +6.0 | 45.9 | -0.3 | 0/200 |
| ONSLAUGHT | BODY/DRIVE (a2) | Guard Crush | 140/200 | 70% | +20.0 | +23.5 | 44.6 | -1.6 | 0/200 |
| ONSLAUGHT | BODY/GRIND (a3) | Unshaken | 165/200 | 83% | +32.5 | +36.0 | 44.9 | -1.3 | 0/200 |
| ONSLAUGHT | BODY/BREAK (a4) | Close Power | 127/200 | 64% | +13.5 | +17.0 | 45.6 | -0.6 | 0/200 |
| ONSLAUGHT | BODY/ANVIL (a5) | Breakthrough | 172/200 | 86% | +36.0 | +39.5 | 42.2 | -4.0 | 0/200 |
| ONSLAUGHT | MIND/WATCH (b1) | Hard Entry | 93/200 | 47% | -3.5 | +0.0 | 46.2 | -0.0 | 198/200 |
| ONSLAUGHT | MIND/TIMING (b2) | Run-Down | 93/200 | 47% | -3.5 | +0.0 | 46.2 | -0.0 | 198/200 |
| ONSLAUGHT | MIND/FEINT (b3) | Cut Off | 93/200 | 47% | -3.5 | +0.0 | 46.2 | -0.0 | 199/200 |
| ONSLAUGHT | MIND/ADAPT (b4) | Cling | 93/200 | 47% | -3.5 | +0.0 | 46.2 | -0.0 | 198/200 |
| ONSLAUGHT | MIND/COLD (b5) | Lockdown | 93/200 | 47% | -3.5 | +0.0 | 46.2 | -0.0 | 198/200 |
| ONSLAUGHT | WILL/HOLD (c1) | Long Combo | 86/200 | 43% | -7.0 | -3.5 | 46.3 | +0.1 | 48/200 |
| ONSLAUGHT | WILL/SPITE (c2) | No Pause | 90/200 | 45% | -5.0 | -1.5 | 46.1 | -0.1 | 44/200 |
| ONSLAUGHT | WILL/VOW (c3) | Building Momentum | 88/200 | 44% | -6.0 | -2.5 | 46.2 | -0.0 | 59/200 |
| ONSLAUGHT | WILL/HUNGER (c4) | No Breather | 88/200 | 44% | -6.0 | -2.5 | 46.2 | -0.0 | 59/200 |
| ONSLAUGHT | WILL/STILL (c5) | Rampage | 90/200 | 45% | -5.0 | -1.5 | 46.4 | +0.1 | 39/200 |
| RAIDER | BODY/ROOT (a1) | Quick Out | 101/200 | 51% | +0.5 | +4.0 | 45.0 | +0.6 | 0/200 |
| RAIDER | BODY/DRIVE (a2) | Pinpoint Entry | 103/200 | 52% | +1.5 | +5.0 | 44.2 | -0.2 | 19/200 |
| RAIDER | BODY/GRIND (a3) | Far Bounce | 102/200 | 51% | +1.0 | +4.5 | 45.2 | +0.8 | 0/200 |
| RAIDER | BODY/BREAK (a4) | Clean Exchange | 91/200 | 46% | -4.5 | -1.0 | 44.6 | +0.2 | 54/200 |
| RAIDER | BODY/ANVIL (a5) | Perfect Prick | 100/200 | 50% | +0.0 | +3.5 | 45.6 | +1.2 | 0/200 |
| RAIDER | MIND/WATCH (b1) | Fake-In | 87/200 | 44% | -6.5 | -3.0 | 44.6 | +0.3 | 48/200 |
| RAIDER | MIND/TIMING (b2) | Punish Reaction | 102/200 | 51% | +1.0 | +4.5 | 44.4 | -0.0 | 60/200 |
| RAIDER | MIND/FEINT (b3) | Broken Rhythm | 91/200 | 46% | -4.5 | -1.0 | 44.6 | +0.2 | 54/200 |
| RAIDER | MIND/ADAPT (b4) | Feint to Interrupt | 94/200 | 47% | -3.0 | +0.5 | 44.2 | -0.1 | 58/200 |
| RAIDER | MIND/COLD (b5) | Setup Combo | 94/200 | 47% | -3.0 | +0.5 | 44.2 | -0.1 | 58/200 |
| RAIDER | WILL/HOLD (c1) | Read the Tell | 113/200 | 57% | +6.5 | +10.0 | 44.4 | +0.0 | 3/200 |
| RAIDER | WILL/SPITE (c2) | Strike the Open | 111/200 | 56% | +5.5 | +9.0 | 44.3 | -0.1 | 23/200 |
| RAIDER | WILL/VOW (c3) | Charged Run | 119/200 | 60% | +9.5 | +13.0 | 43.9 | -0.5 | 0/200 |
| RAIDER | WILL/HUNGER (c4) | Punish Aggression | 136/200 | 68% | +18.0 | +21.5 | 43.4 | -0.9 | 0/200 |
| RAIDER | WILL/STILL (c5) | Killing Run | 137/200 | 69% | +18.5 | +22.0 | 43.1 | -1.2 | 0/200 |
| BULWARK | BODY/ROOT (a1) | Tough Hide | 143/200 | 72% | +21.5 | +21.0 | 65.0 | +2.9 | 2/200 |
| BULWARK | BODY/DRIVE (a2) | Steady Guard | 151/200 | 76% | +25.5 | +25.0 | 65.1 | +3.1 | 2/200 |
| BULWARK | BODY/GRIND (a3) | Catch Breath | 151/200 | 76% | +25.5 | +25.0 | 62.8 | +0.8 | 0/200 |
| BULWARK | BODY/BREAK (a4) | Dig In | 103/200 | 52% | +1.5 | +1.0 | 62.2 | +0.1 | 33/200 |
| BULWARK | BODY/ANVIL (a5) | Unbreakable | 189/200 | 95% | +44.5 | +44.0 | 65.8 | +3.8 | 0/200 |
| BULWARK | MIND/WATCH (b1) | Riposte | 109/200 | 55% | +4.5 | +4.0 | 61.1 | -0.9 | 0/200 |
| BULWARK | MIND/TIMING (b2) | Catch & Punish | 112/200 | 56% | +6.0 | +5.5 | 61.5 | -0.5 | 0/200 |
| BULWARK | MIND/FEINT (b3) | Hard Meet | 99/200 | 50% | -0.5 | -1.0 | 62.9 | +0.9 | 0/200 |
| BULWARK | MIND/ADAPT (b4) | Retaliation | 109/200 | 55% | +4.5 | +4.0 | 62.5 | +0.5 | 0/200 |
| BULWARK | MIND/COLD (b5) | Sea Wall | 150/200 | 75% | +25.0 | +24.5 | 58.3 | -3.8 | 0/200 |
| BULWARK | WILL/HOLD (c1) | Body Shove | 95/200 | 48% | -2.5 | -3.0 | 61.9 | -0.1 | 51/200 |
| BULWARK | WILL/SPITE (c2) | Heavy Slam | 143/200 | 72% | +21.5 | +21.0 | 59.1 | -3.0 | 0/200 |
| BULWARK | WILL/VOW (c3) | No Way Around | 101/200 | 51% | +0.5 | +0.0 | 62.6 | +0.5 | 78/200 |
| BULWARK | WILL/HUNGER (c4) | Pin | 95/200 | 48% | -2.5 | -3.0 | 61.9 | -0.1 | 51/200 |
| BULWARK | WILL/STILL (c5) | Clinch | 151/200 | 76% | +25.5 | +25.0 | 58.7 | -3.4 | 0/200 |
| AMBUSH | BODY/ROOT (a1) | Hard Counter | 108/200 | 54% | +4.0 | -1.0 | 51.3 | +0.7 | 0/200 |
| AMBUSH | BODY/DRIVE (a2) | Slip Counter | 132/200 | 66% | +16.0 | +11.0 | 49.6 | -0.9 | 33/200 |
| AMBUSH | BODY/GRIND (a3) | Punish Aggression | 108/200 | 54% | +4.0 | -1.0 | 51.3 | +0.7 | 0/200 |
| AMBUSH | BODY/BREAK (a4) | Punish Whiff | 113/200 | 57% | +6.5 | +1.5 | 50.3 | -0.2 | 22/200 |
| AMBUSH | BODY/ANVIL (a5) | Perfect Trap | 140/200 | 70% | +20.0 | +15.0 | 48.8 | -1.7 | 0/200 |
| AMBUSH | MIND/WATCH (b1) | Long Slip | 107/200 | 54% | +3.5 | -1.5 | 51.7 | +1.1 | 1/200 |
| AMBUSH | MIND/TIMING (b2) | Hard to Reach | 109/200 | 55% | +4.5 | -0.5 | 51.7 | +1.2 | 4/200 |
| AMBUSH | MIND/FEINT (b3) | Run 'Em Ragged | 116/200 | 58% | +8.0 | +3.0 | 51.7 | +1.2 | 4/200 |
| AMBUSH | MIND/ADAPT (b4) | Open Window | 130/200 | 65% | +15.0 | +10.0 | 50.3 | -0.3 | 32/200 |
| AMBUSH | MIND/COLD (b5) | Phantom | 121/200 | 61% | +10.5 | +5.5 | 52.4 | +1.8 | 1/200 |
| AMBUSH | WILL/HOLD (c1) | Loaded Hit | 120/200 | 60% | +10.0 | +5.0 | 50.3 | -0.2 | 14/200 |
| AMBUSH | WILL/SPITE (c2) | Long Charge | 119/200 | 60% | +9.5 | +4.5 | 50.4 | -0.1 | 11/200 |
| AMBUSH | WILL/VOW (c3) | Hit the Opening | 121/200 | 61% | +10.5 | +5.5 | 50.2 | -0.4 | 33/200 |
| AMBUSH | WILL/HUNGER (c4) | Pierce | 139/200 | 70% | +19.5 | +14.5 | 49.1 | -1.4 | 8/200 |
| AMBUSH | WILL/STILL (c5) | Execution | 151/200 | 76% | +25.5 | +20.5 | 48.4 | -2.1 | 2/200 |

**Кристаллы, НИЧЕГО не меняющие в бою (все 200 боёв совпали с нулевым бит в бит):** нет

**Почти ничего не меняющие (≥80% боёв совпали бит-в-бит, но не все):** ONSLAUGHT MIND/WATCH (198/200), ONSLAUGHT MIND/TIMING (198/200), ONSLAUGHT MIND/FEINT (199/200), ONSLAUGHT MIND/ADAPT (198/200), ONSLAUGHT MIND/COLD (198/200)

**Средний сдвиг по ядрам (знак / средний модуль):**

| ядро | средний Δ | средний |Δ| |
| --- | --- | --- |
| ONSLAUGHT | +3.9 | +10.1 |
| RAIDER | +2.7 | +5.6 |
| BULWARK | +13.4 | +14.1 |
| AMBUSH | +11.1 | +11.1 |

**По граням:** BODY +13.6 · MIND +2.4 · WILL +7.3

**По глубине (шаг в грани):** шаг 1 +2.8 · шаг 2 +8.5 · шаг 3 +6.4 · шаг 4 +4.9 · шаг 5 +16.2

**Топ-5 плюс:** BULWARK ANVIL +44.5, ONSLAUGHT ANVIL +36.0, ONSLAUGHT GRIND +32.5, BULWARK DRIVE +25.5, BULWARK GRIND +25.5

**Топ-5 минус:** ONSLAUGHT HOLD -7.0, RAIDER WATCH -6.5, ONSLAUGHT HUNGER -6.0, ONSLAUGHT VOW -6.0, ONSLAUGHT STILL -5.0

---

## 5. Замер: клич и бафф

Зеркальный бой (одно и то же ядро с обеих сторон), по 50 зёрен на ядро × 4 ядра = 200 боёв на строку. T — сторона с рычагом, стороны плиты чередуются по чётности зерна. Второй стороне рычага нет.
Нулевой замер (те же зёрна, рычага нет): винрейт T = 46.0% (92/200), мед. длительность = 49.0 с.
**Шум:** σ винрейта одного замера ≈ 3.5 п.п. на строку (n=200) и ≈ 7.1 п.п. на одно ядро (n=50). Колонка Δ — РАЗНОСТЬ двух замеров (с рычагом и без), её σ ≈ 5.0 п.п. на строку, 95% интервал ≈ ±10 п.п. (на одно ядро ±20 п.п.).

**Правила применения (фиксированные, одинаковы для всех ядер и зёрен).** `fixed` — безусловно в t=10 с. `bot` — по порогам бота из buffBalance.bot (полотенце: своё HP < 40%; ведро: цель ближе 2.2; кубик: HP цели < 50% или t ≥ 20 с). Клич: один в t=5 с либо три подряд (5, 11, 17 с — заряды и откат 6 с из klichBalance). «Применено» — в скольких боях правило вообще сработало.

**Что рычаг делает с бойцом T в окне наблюдения** (среднее по всем боям «до → после»; окно — фиксированное, у клича 5–13 с, у баффов 10–15 с; строка «нулевой» — те же бои без рычага в то же окно). Колонки: дистанция до цели, скорость хода (ед./с), начатых атак/с, снятое у цели HP/с, полученное HP/с, вылеченное HP/с.

| рычаг | окно | дистанция | скорость | атак/с | снято/с | получено/с | лечение/с |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TOWEL · фикс. t=10 с | 10–15 с | 1.12 → 1.12 | 0.07 → 0.07 | 0.51 → 0.51 | 0.80 → 0.80 | 0.72 → 0.70 | 0.00 → 1.99 |
| BUCKET · фикс. t=10 с | 10–15 с | 1.12 → 1.12 | 0.07 → 0.07 | 0.51 → 0.50 | 0.80 → 0.77 | 0.72 → 0.74 | 0.00 → 0.00 |
| DICE · фикс. t=10 с, случайная грань | 10–15 с | 1.12 → 1.12 | 0.07 → 0.07 | 0.51 → 0.49 | 0.80 → 1.63 | 0.72 → 0.70 | 0.00 → 0.00 |
| КЛИЧ PUSH · один, t=5 с | 5–13 с | 1.14 → 1.12 | 0.08 → 0.09 | 0.49 → 0.47 | 0.76 → 0.73 | 0.69 → 0.73 | 0.00 → 0.00 |
| КЛИЧ PUSH · три подряд (t=5, +6, +12) | 5–13 с | 1.14 → 1.12 | 0.08 → 0.09 | 0.49 → 0.47 | 0.76 → 0.73 | 0.69 → 0.73 | 0.00 → 0.00 |
| КЛИЧ FALLBACK · один, t=5 с | 5–13 с | 1.14 → 1.15 | 0.08 → 0.07 | 0.49 → 0.50 | 0.76 → 0.67 | 0.69 → 0.71 | 0.00 → 0.00 |
| КЛИЧ FALLBACK · три подряд (t=5, +6, +12) | 5–13 с | 1.14 → 1.15 | 0.08 → 0.07 | 0.49 → 0.50 | 0.76 → 0.67 | 0.69 → 0.71 | 0.00 → 0.00 |
| КЛИЧ HOLD · один, t=5 с | 5–13 с | 1.14 → 1.14 | 0.08 → 0.07 | 0.49 → 0.48 | 0.76 → 0.74 | 0.69 → 0.66 | 0.00 → 0.00 |
| КЛИЧ HOLD · три подряд (t=5, +6, +12) | 5–13 с | 1.14 → 1.14 | 0.08 → 0.07 | 0.49 → 0.48 | 0.76 → 0.74 | 0.69 → 0.66 | 0.00 → 0.00 |

**Клич по ядрам** (окно 5–13 с; в ячейке: дистанция до цели «нулевой→с кличем» · атак/с «нулевой→с кличем»):

| клич | ONSLAUGHT | RAIDER | BULWARK | AMBUSH |
| --- | --- | --- | --- | --- |
| КЛИЧ PUSH · один, t=5 с | 0.98→0.98 · 0.55→0.55 | 1.24→1.17 · 0.49→0.47 | 1.03→1.02 · 0.45→0.45 | 1.33→1.31 · 0.48→0.42 |
| КЛИЧ FALLBACK · один, t=5 с | 0.98→0.97 · 0.55→0.55 | 1.24→1.22 · 0.49→0.50 | 1.03→1.05 · 0.45→0.44 | 1.33→1.35 · 0.48→0.51 |
| КЛИЧ HOLD · один, t=5 с | 0.98→0.97 · 0.55→0.54 | 1.24→1.22 · 0.49→0.48 | 1.03→1.03 · 0.45→0.44 | 1.33→1.32 · 0.48→0.47 |

| рычаг · правило | применено | мед. t применения, с | боёв изменилось (бит-в-бит) к нулевому | победы T | винрейт T | Δ винрейта, п.п. | мед. длит., с | Δ мед., с | Δ п.п. ONSLAUGHT | Δ п.п. RAIDER | Δ п.п. BULWARK | Δ п.п. AMBUSH |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TOWEL · правило бота (здоровье < 40%) | 175/200 | 41.2 | 167/200 | 132/200 | 66.0% | +20.0 | 50.7 | +1.7 | +20.0 | +28.0 | +26.0 | +6.0 |
| TOWEL · фикс. t=10 с | 200/200 | 10.0 | 165/200 | 109/200 | 54.5% | +8.5 | 50.3 | +1.3 | +10.0 | +16.0 | +6.0 | +2.0 |
| BUCKET · правило бота (цель ближе 2.2) | 200/200 | 0.2 | 200/200 | 100/200 | 50.0% | +4.0 | 48.9 | -0.2 | +0.0 | +14.0 | -2.0 | +4.0 |
| BUCKET · фикс. t=10 с | 200/200 | 10.0 | 88/200 | 88/200 | 44.0% | -2.0 | 48.7 | -0.3 | +2.0 | -6.0 | -2.0 | -2.0 |
| DICE · правило бота (цель < 50% HP или t ≥ 20 с), случайная грань | 200/200 | 20.0 | 198/200 | 139/200 | 69.5% | +23.5 | 47.9 | -1.2 | +20.0 | +28.0 | +18.0 | +28.0 |
| DICE · фикс. t=10 с, случайная грань | 200/200 | 10.0 | 198/200 | 126/200 | 63.0% | +17.0 | 46.8 | -2.2 | +10.0 | +24.0 | +10.0 | +24.0 |
| DICE · фикс. t=10 с, грань 1 (1×1.5) | 200/200 | 10.0 | 132/200 | 95/200 | 47.5% | +1.5 | 48.6 | -0.4 | +2.0 | +2.0 | +0.0 | +2.0 |
| DICE · фикс. t=10 с, грань 2 (2×1.5) | 200/200 | 10.0 | 149/200 | 99/200 | 49.5% | +3.5 | 48.4 | -0.6 | +2.0 | +6.0 | +4.0 | +2.0 |
| DICE · фикс. t=10 с, грань 3 (2×2) | 200/200 | 10.0 | 179/200 | 108/200 | 54.0% | +8.0 | 47.4 | -1.7 | +2.0 | +16.0 | +6.0 | +8.0 |
| DICE · фикс. t=10 с, грань 4 (3×2) | 200/200 | 10.0 | 189/200 | 126/200 | 63.0% | +17.0 | 46.4 | -2.6 | +12.0 | +20.0 | +16.0 | +20.0 |
| DICE · фикс. t=10 с, грань 5 (3×2.5) | 200/200 | 10.0 | 195/200 | 149/200 | 74.5% | +28.5 | 45.5 | -3.6 | +26.0 | +28.0 | +26.0 | +34.0 |
| DICE · фикс. t=10 с, грань 6 (3×3) | 200/200 | 10.0 | 198/200 | 160/200 | 80.0% | +34.0 | 44.3 | -4.7 | +28.0 | +42.0 | +30.0 | +36.0 |
| КЛИЧ PUSH · один, t=5 с | 200/200 | 5.0 | 136/200 | 99/200 | 49.5% | +3.5 | 49.3 | +0.2 | +4.0 | +10.0 | -2.0 | +2.0 |
| КЛИЧ PUSH · три подряд (t=5, +6, +12) | 200/200 | 5.0 | 165/200 | 90/200 | 45.0% | -1.0 | 49.3 | +0.2 | +6.0 | +10.0 | -18.0 | -2.0 |
| КЛИЧ FALLBACK · один, t=5 с | 200/200 | 5.0 | 127/200 | 94/200 | 47.0% | +1.0 | 49.2 | +0.1 | +4.0 | +6.0 | -16.0 | +10.0 |
| КЛИЧ FALLBACK · три подряд (t=5, +6, +12) | 200/200 | 5.0 | 185/200 | 102/200 | 51.0% | +5.0 | 49.2 | +0.1 | +10.0 | +14.0 | -10.0 | +6.0 |
| КЛИЧ HOLD · один, t=5 с | 200/200 | 5.0 | 87/200 | 98/200 | 49.0% | +3.0 | 49.0 | -0.0 | +4.0 | +10.0 | -4.0 | +2.0 |
| КЛИЧ HOLD · три подряд (t=5, +6, +12) | 200/200 | 5.0 | 139/200 | 102/200 | 51.0% | +5.0 | 49.1 | +0.0 | +4.0 | +6.0 | -4.0 | +14.0 |

---

## 6. Замер: RAID (20 зёрен на каждое число граней)

Рейд: игрок + 3 союзника против босса (живучесть ×3, надбавка силы 0) + 2 охраны. Порог накала рейда 18 с. Зёрна 1..20, состав и ядра берутся из seeded composeRaid.

| граней | победы игрока | винрейт | мед. с | p10 с | p90 с | макс. с | таймаут 240 с | дольше 100 с | ср. доживает у игрока | …в выигранных | ср. доживает у босса в проигранных | сам боец игрока жив |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (у игрока и союзников) | 7/20 | 35% | 72.8 | 61.5 | 98.1 | 124.9 | 0 | 2 | 0.8 из 4 | 2.4 | 2.2 из 3 | 1/20 |
| 1 (у игрока и союзников) | 14/20 | 70% | 69.6 | 59.6 | 94.5 | 108.2 | 0 | 1 | 1.6 из 4 | 2.3 | 2.3 из 3 | 4/20 |
| 2 (у игрока и союзников) | 14/20 | 70% | 70.1 | 57.5 | 94.0 | 121.6 | 0 | 2 | 1.8 из 4 | 2.5 | 2.3 из 3 | 7/20 |
| 3 (у игрока и союзников) | 14/20 | 70% | 67.5 | 54.4 | 94.5 | 132.5 | 0 | 2 | 1.9 из 4 | 2.8 | 2.3 из 3 | 8/20 |
| 4 (у игрока и союзников) | 16/20 | 80% | 66.4 | 50.1 | 105.9 | 114.7 | 0 | 3 | 2.6 из 4 | 3.3 | 2.8 из 3 | 12/20 |
| 5 (у игрока и союзников) | 20/20 | 100% | 59.2 | 53.0 | 96.0 | 107.6 | 0 | 2 | 3.0 из 4 | 3.0 | — | 12/20 |

- граней 0: доживших на стороне игрока (0..4) = 0:13 1:1 2:3 3:2 4:1
- граней 1: доживших на стороне игрока (0..4) = 0:6 1:4 2:2 3:8 4:0
- граней 2: доживших на стороне игрока (0..4) = 0:6 1:2 2:5 3:5 4:2
- граней 3: доживших на стороне игрока (0..4) = 0:6 1:1 2:4 3:6 4:3
- граней 4: доживших на стороне игрока (0..4) = 0:4 1:1 2:0 3:9 4:6
- граней 5: доживших на стороне игрока (0..4) = 0:0 1:1 2:3 3:11 4:5

---

## Что дальше (предложение, не сделано)

Правок логики здесь нет намеренно. Чтобы двигаться к балансу, я бы начал с пяти вещей: (1) прочитать (не править) `buildFighter.js`, чтобы закрыть п.1 по скорости атаки/хода и дистанции и понять, почему у ONSLAUGHT `distance`/`initiative` «на упоре»; (2) решить, что первично для кристалла — текст или механика, и связать их одним источником; (3) решить судьбу BUCKET и клича — при почти неподвижном бое им нечем работать; (4) разобраться с BULWARK (77–86% против всех); (5) перемерить рейд с настоящими точками выхода из арены и `bossScale`, чтобы сверить с числами в комментарии.
