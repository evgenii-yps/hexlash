## Пункт 2. Потолок шкал 0/100: старт, сумма сдвигов грани, потеря

Сдвиги осей применяются в порядке кристаллов 1…5 с зажимом 0/100 после каждого (как `resolveBehavior`). «Потеря» = |старт + сумма − итог|: сдвиг, записанный в данных и показанный на карточке, но не дошедший до бойца. Таблица по каждой грани в одиночку (полная грань, 5 из 5).

| ядро | грань | ось | старт | сумма сдвигов | без зажима | итог | потеря |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY | distance | 15 | -8 | 7 | 7 | 0 |
| ONSLAUGHT | BODY | weight | 55 | +38 | 93 | 93 | 0 |
| ONSLAUGHT | BODY | resilience | 60 | +14 | 74 | 74 | 0 |
| ONSLAUGHT | MIND | distance | 15 | -28 | -13 | 0 | **13** |
| ONSLAUGHT | MIND | initiative | 90 | +6 | 96 | 96 | 0 |
| ONSLAUGHT | MIND | stick | 85 | +42 | 127 | 100 | **27** |
| ONSLAUGHT | WILL | tempo | 80 | +42 | 122 | 100 | **22** |
| ONSLAUGHT | WILL | stick | 85 | +6 | 91 | 91 | 0 |
| RAIDER | BODY | distance | 55 | +26 | 81 | 81 | 0 |
| RAIDER | BODY | initiative | 70 | +16 | 86 | 86 | 0 |
| RAIDER | BODY | tempo | 65 | +14 | 79 | 79 | 0 |
| RAIDER | BODY | slip | 65 | +12 | 77 | 77 | 0 |
| RAIDER | MIND | tempo | 65 | +28 | 93 | 93 | 0 |
| RAIDER | WILL | distance | 55 | +12 | 67 | 67 | 0 |
| RAIDER | WILL | initiative | 70 | -2 | 68 | 68 | 0 |
| RAIDER | WILL | counter | 45 | +10 | 55 | 55 | 0 |
| BULWARK | BODY | distance | 20 | -6 | 14 | 14 | 0 |
| BULWARK | BODY | resilience | 90 | +32 | 122 | 100 | **22** |
| BULWARK | MIND | stick | 70 | +18 | 88 | 88 | 0 |
| BULWARK | MIND | counter | 60 | +42 | 102 | 100 | **2** |
| BULWARK | WILL | distance | 20 | -12 | 8 | 8 | 0 |
| BULWARK | WILL | weight | 65 | +18 | 83 | 83 | 0 |
| BULWARK | WILL | stick | 70 | +40 | 110 | 100 | **10** |
| AMBUSH | BODY | distance | 80 | +6 | 86 | 86 | 0 |
| AMBUSH | BODY | counter | 90 | +24 | 114 | 100 | **14** |
| AMBUSH | BODY | slip | 75 | +10 | 85 | 85 | 0 |
| AMBUSH | MIND | distance | 80 | +26 | 106 | 100 | **6** |
| AMBUSH | MIND | slip | 75 | +44 | 119 | 100 | **19** |
| AMBUSH | WILL | distance | 80 | +24 | 104 | 100 | **4** |
| AMBUSH | WILL | initiative | 15 | -12 | 3 | 3 | 0 |

Сгорает, по ядрам (сумма |потерь| по осям всех трёх полных граней / сумма |всех записанных сдвигов|): ONSLAUGHT 62 из 184 (34%), осей с потерей: 3; RAIDER 0 из 120 (0%), осей с потерей: 0; BULWARK 34 из 168 (20%), осей с потерей: 3; AMBUSH 43 из 146 (29%), осей с потерей: 4.

### Кристаллы, которых нет в итоговых осях полной грани (убрать — оси те же)

Всего 19 из 60 (по осям; тело и рычаги не смотрим). Перезамер называл 9 кристаллов, «бит в бит 800/800» — ниже проверка по данным.

| кристалл | что двигает | других каналов у него |
| --- | --- | --- |
| ONSLAUGHT · MIND/TIMING (b2) · Run-Down | stick+8 distance-6 | тег chase_strike |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | stick+10 | — |
| ONSLAUGHT · MIND/ADAPT (b4) · Cling | stick+10 distance-6 | — |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | stick+14 distance-8 | тег lockdown |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | tempo+8 | — |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | tempo+10 | — |
| ONSLAUGHT · WILL/VOW (c3) · Building Momentum | tempo+6 | тег hit_accel |
| ONSLAUGHT · WILL/STILL (c5) · Rampage | tempo+12 | тег rampage |
| BULWARK · BODY/ROOT (a1) · Tough Hide | resilience+8 | рамп toughness +4% |
| BULWARK · BODY/DRIVE (a2) · Steady Guard | resilience+10 | рамп toughness +7% |
| BULWARK · BODY/GRIND (a3) · Catch Breath | resilience+6 | рамп toughness +10%; staminaRegen +60% |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | resilience+8 | рамп toughness +22%; blockMitigation +60%; тег fortress |
| BULWARK · WILL/VOW (c3) · No Way Around | stick+10 | — |
| AMBUSH · BODY/ROOT (a1) · Hard Counter | counter+8 | — |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | counter+8 | тег punish_aggression |
| AMBUSH · MIND/WATCH (b1) · Long Slip | slip+10 distance+6 | — |
| AMBUSH · MIND/TIMING (b2) · Hard to Reach | slip+8 distance+6 | — |
| AMBUSH · MIND/ADAPT (b4) · Open Window | slip+8 | dodgeCounter +40% |
| AMBUSH · MIND/COLD (b5) · Phantom | slip+12 distance+6 | тег phantom |

## Пункт 6. 41 кристалл не меняет решения (изменено < 5% решений о выборе намерения)

Из перезамера (часть A, 60 ячеек): решений меняют < 5% — **41** ячеек (ожидалось 41). Распределение по единственному входному каналу: только тело (tempo или рычаги): 4; оси в очках намерений: 26; тег: 11.

Очки намерений (`spinalScore`) читают 7 осей из 8 — **`tempo` не читается вовсе**; сдвиг на Δ пунктов двигает очки намерения на вес×Δ/100. Для сравнения: бонус удержания текущего намерения **0.08**; разрыв между лидером и вторым в рабочих решениях — см. пункт 6а ниже. Столбец «сдвиг очков» — наибольший по модулю сдвиг очков одного намерения от осей этого кристалла (после зажима).

| кристалл | оси (факт после зажима) | рычаги силы | тег (наклон) | где участвует в выборе | сдвиг очков (макс.) | решений изменено | условие тега верно / переворот |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit | weight+14 | strikePower+4% | — | очки: только оси | strike +0.049 | 0.6% | — |
| ONSLAUGHT · BODY/DRIVE (a2) · Guard Crush | weight+8 | strikePower+7% blockPenetration+40% | — | очки: только оси | strike +0.028 | 0.3% | — |
| ONSLAUGHT · BODY/GRIND (a3) · Unshaken | resilience+14 | strikePower+10% interruptResist+70% | — | очки: только оси | hold +0.056 | 0.0% | — |
| ONSLAUGHT · MIND/WATCH (b1) · Hard Entry | distance-8 initiative+6 | — | — | очки: только оси | press +0.046 | 2.2% | — |
| ONSLAUGHT · MIND/TIMING (b2) · Run-Down | distance-6 stick+8 | — | chase_strike→press [longFight] +0.12 | очки: оси + наклон тега | press +0.036 | 2.5% | 40% / 0.1% |
| ONSLAUGHT · MIND/FEINT (b3) · Cut Off | stick+10 | — | — | очки: только оси | press +0.030 | 2.4% | — |
| ONSLAUGHT · MIND/ADAPT (b4) · Cling | distance-6 stick+10 | — | — | очки: только оси | press +0.042 | 2.3% | — |
| ONSLAUGHT · MIND/COLD (b5) · Lockdown | distance-8 stick+14 | — | lockdown→hold [close] +0.2 | очки: оси + наклон тега | press +0.058 | 2.4% | 91% / 0.0% |
| ONSLAUGHT · WILL/HOLD (c1) · Long Combo | tempo+8 | — | — | в выбор намерения не входит (tempo/рычаги — только тело) | 0 | 0.0% | — |
| ONSLAUGHT · WILL/SPITE (c2) · No Pause | tempo+10 | — | — | в выбор намерения не входит (tempo/рычаги — только тело) | 0 | 0.0% | — |
| ONSLAUGHT · WILL/HUNGER (c4) · No Breather | tempo+6 stick+6 | — | no_breather→press [foeHpLow] +0.12 | очки: оси + наклон тега | press +0.018 | 1.6% | 13% / 0.1% |
| RAIDER · BODY/DRIVE (a2) · Pinpoint Entry | initiative+6 | accuracy+35% | — | очки: только оси | press +0.030 | 3.0% | — |
| RAIDER · MIND/WATCH (b1) · Fake-In | tempo+4 | feintChance+20% | — | в выбор намерения не входит (tempo/рычаги — только тело) | 0 | 0.0% | — |
| RAIDER · MIND/TIMING (b2) · Punish Reaction | tempo+4 | feintPayoff+50% | — | в выбор намерения не входит (tempo/рычаги — только тело) | 0 | 0.0% | — |
| RAIDER · WILL/HOLD (c1) · Read the Tell | initiative-6 | strikePower+4% accuracy+30% | — | очки: только оси | press -0.030 | 4.2% | — |
| RAIDER · WILL/SPITE (c2) · Strike the Open | initiative+4 | strikePower+7% | punish_exhausted→strike [foeWindLow] +0.12 | очки: оси + наклон тега | press +0.020 | 2.7% | 6% / 0.1% |
| BULWARK · BODY/ROOT (a1) · Tough Hide | resilience+8 | toughness+4% | — | очки: только оси | hold +0.032 | 0.7% | — |
| BULWARK · BODY/DRIVE (a2) · Steady Guard | resilience+10 | toughness+7% | — | очки: только оси | hold +0.040 | 0.7% | — |
| BULWARK · BODY/GRIND (a3) · Catch Breath | resilience+6 | toughness+10% staminaRegen+60% | — | очки: только оси | hold +0.024 | 0.5% | — |
| BULWARK · BODY/ANVIL (a5) · Unbreakable | resilience+8 | toughness+22% blockMitigation+60% | fortress→hold [selfHpLow] +0.2 | очки: оси + наклон тега | hold +0.032 | 3.5% | 9% / 2.9% |
| BULWARK · MIND/WATCH (b1) · Riposte | stick+6 counter+8 | toughness+4% blockCounter+50% | — | очки: только оси | catch +0.036 | 1.1% | — |
| BULWARK · MIND/TIMING (b2) · Catch & Punish | counter+8 | toughness+7% interruptBonus+50% | — | очки: только оси | catch +0.036 | 0.8% | — |
| BULWARK · MIND/FEINT (b3) · Hard Meet | stick+6 counter+10 | toughness+10% | — | очки: только оси | catch +0.045 | 1.1% | — |
| BULWARK · MIND/ADAPT (b4) · Retaliation | counter+8 | toughness+14% | retaliate_ramp→strike [hpDropped] +0.12 | очки: оси + наклон тега | catch +0.036 | 0.8% | 12% / 0.0% |
| BULWARK · MIND/COLD (b5) · Sea Wall | stick+6 counter+8 | toughness+22% blockCounter+100% interruptBonus+100% | counter_trap→catch [longFight] +0.2 | очки: оси + наклон тега | catch +0.036 | 2.1% | 45% / 1.0% |
| BULWARK · WILL/HOLD (c1) · Body Shove | distance-6 stick+8 | — | — | очки: только оси | press +0.036 | 1.2% | — |
| BULWARK · WILL/SPITE (c2) · Heavy Slam | weight+10 | blockPenetration+35% | — | очки: только оси | strike +0.035 | 0.7% | — |
| BULWARK · WILL/VOW (c3) · No Way Around | stick+10 | — | — | очки: только оси | press +0.030 | 1.1% | — |
| AMBUSH · BODY/ROOT (a1) · Hard Counter | counter+8 | — | — | очки: только оси | catch +0.036 | 2.0% | — |
| AMBUSH · BODY/DRIVE (a2) · Slip Counter | slip+6 | dodgeCounter+50% | — | очки: только оси | break +0.030 | 0.5% | — |
| AMBUSH · BODY/GRIND (a3) · Punish Aggression | counter+8 | — | punish_aggression→catch [hpDropped] +0.12 | очки: оси + наклон тега | catch +0.036 | 2.3% | 17% / 0.3% |
| AMBUSH · BODY/BREAK (a4) · Punish Whiff | distance+6 | missCounter+50% | — | очки: только оси | sting +0.027 | 1.3% | — |
| AMBUSH · BODY/ANVIL (a5) · Perfect Trap | counter+8 slip+4 | dodgeCounter+100% missCounter+100% | perfect_trap→strike [foeHpLow&foeQuiet] +0.2 | очки: оси + наклон тега | catch +0.036 | 2.3% | 2% / 0.2% |
| AMBUSH · MIND/WATCH (b1) · Long Slip | distance+6 slip+10 | — | — | очки: только оси | sting +0.057 | 4.1% | — |
| AMBUSH · MIND/TIMING (b2) · Hard to Reach | distance+6 slip+8 | — | — | очки: только оси | sting +0.051 | 4.0% | — |
| AMBUSH · MIND/ADAPT (b4) · Open Window | slip+8 | dodgeCounter+40% | — | очки: только оси | break +0.040 | 1.0% | — |
| AMBUSH · WILL/HOLD (c1) · Loaded Hit | distance+6 | strikePower+4% chargePower+50% | — | очки: только оси | sting +0.027 | 1.3% | — |
| AMBUSH · WILL/SPITE (c2) · Long Charge | distance+6 initiative-6 | strikePower+7% chargeMax+60% | — | очки: только оси | press -0.042 | 1.5% | — |
| AMBUSH · WILL/VOW (c3) · Hit the Opening | initiative-6 | strikePower+10% | vulnerable_strike→strike [foeOpen] +0.12 | очки: оси + наклон тега | press -0.030 | 1.6% | 23% / 0.3% |
| AMBUSH · WILL/HUNGER (c4) · Pierce | distance+6 | strikePower+14% chargePen+60% | — | очки: только оси | sting +0.027 | 1.4% | — |
| AMBUSH · WILL/STILL (c5) · Execution | distance+6 | strikePower+22% chargePower+80% | execute→strike [foeHpLow] +0.2 | очки: оси + наклон тега | sting +0.027 | 2.2% | 13% / 0.8% |

## Пункт 8. Шесть вершин, поглощённых гранью

«Поглощена» по правилу перезамера: вершина в одиночку меняет исход (или ≥ 5% решений), а внутри своей полной грани — нет. Колонка «что поглощено» — какая половина флага пропала. Разбор по каналам вершины: оси (есть ли упор в полной грани), рычаги силы (они складываются и не поглощаются), тег (наклон +0.2 «по условию» против наклонов резонанса +0.3/+0.15 «всегда» и теги соседей того же намерения).

| вершина | что поглощено | в одиночку: сдвиг п.п. / решений | в грани: сдвиг п.п. / решений | оси | рычаги | тег (наклон) | в грани: условие верно / переворот | чем поглощена |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT · BODY/ANVIL (a5) · Breakthrough | РЕШЕНИЯ | +31.1 / 13.5% | +2.8 / 0.04% | weight+10: без него 83 → с ним 93 | strikePower +22%, blockPenetration +95% | overload_strike→strike [foeHpLow] +0.2 | 22% / 0.01% | тег дублирует резонанс ветви (дом ветви: strike + press; +0.3/0.15 «всегда» против +0.2 «по условию»); тег перекрыт соседним наклоном к тому же намерению: a4 close_damage_ramp [close] |
| ONSLAUGHT · WILL/STILL (c5) · Rampage | ИСХОД + РЕШЕНИЯ | +4.5 / 10.9% | +0.8 / 0.55% | tempo+12: без него 100 → с ним 100 (упор) | — | rampage→strike [selfHpLow] +0.2 | 16% / 0.55% | ось на упоре (итог оси не меняется); тег дублирует резонанс ветви (дом ветви: strike + press; +0.3/0.15 «всегда» против +0.2 «по условию»); тег перекрыт соседним наклоном к тому же намерению: c3 hit_accel [longFight] |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | РЕШЕНИЯ | +1.1 / 13.2% | +3.0 / 2.47% | initiative+10: без него 76 → с ним 86; distance+8: без него 73 → с ним 81; slip+6: без него 71 → с ним 77 | — | perfect_jab→sting [foeQuiet] +0.2 | 30% / 0.87% | тег дублирует резонанс ветви (дом ветви: sting; +0.3/0.15 «всегда» против +0.2 «по условию»); тег перекрыт соседним наклоном к тому же намерению: a4 clean_chain [always] |
| RAIDER · WILL/STILL (c5) · Killing Run | РЕШЕНИЯ | +12.0 / 18.1% | +14.0 / 1.06% | distance+6: без него 61 → с ним 67 | strikePower +22%, chargePower +60% | lethal_entry→press [foeHpLow] +0.2 | 17% / 0.51% | резонанс ветви тянет к ДРУГОМУ намерению (дом: strike + sting «всегда» +0.3/0.15) и поднимает его над намерением тега (press); см. пункт 8 по очкам |
| BULWARK · WILL/STILL (c5) · Clinch | РЕШЕНИЯ | +8.0 / 16.5% | +5.9 / 4.44% | stick+14: без него 96 → с ним 100; weight+8: без него 75 → с ним 83 | blockPenetration +50% | clinch→press [close] +0.2 | 83% / 5.07% | тег дублирует резонанс ветви (дом ветви: hold + press; +0.3/0.15 «всегда» против +0.2 «по условию») |
| AMBUSH · MIND/COLD (b5) · Phantom | ИСХОД + РЕШЕНИЯ | +13.6 / 9.3% | -1.4 / 1.16% | slip+12: без него 100 → с ним 100 (упор); distance+6: без него 100 → с ним 100 (упор) | — | phantom→break [hpDropped] +0.2 | 13% / 1.16% | ось на упоре (итог оси не меняется); тег дублирует резонанс ветви (дом ветви: break + sting; +0.3/0.15 «всегда» против +0.2 «по условию») |

## Пункт 9. Полные грани (5 из 5) против голых четырёх ядер

Пересчёт из сырых данных перезамера (`docs/crystal-remeasure/out/raw`, 800 боёв на грань, парный сдвиг к голому ядру на тех же зёрнах).

| ядро | грань | доля побед, % | сдвиг к голому, п.п. [95%] | медиана, с | дольше 100 с | максимум, с |
| --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY (RAM) | 98.1 | +49.4 [+45.8…+53.0] | 42.2 | 0 | 69.1 |
| ONSLAUGHT | MIND (CHASE) | 46.4 | -2.4 [-7.1…+2.4] | 49.7 | 0 | 72.5 |
| ONSLAUGHT | WILL (FRENZY) | 54.0 | +5.3 [+0.4…+10.1] | 49.2 | 0 | 68.9 |
| RAIDER | BODY (JAB) | 44.0 | +3.4 [-1.2…+8.0] | 50.5 | 0 | 77.5 |
| RAIDER | MIND (FEINT) | 36.1 | -4.5 [-9.1…+0.1] | 49.0 | 0 | 72.2 |
| RAIDER | WILL (HUNT) | 78.4 | +37.8 [+33.5…+42.0] | 44.3 | 0 | 63.4 |
| BULWARK | BODY (BASTION) | 97.9 | +27.4 [+24.1…+30.7] | 59.0 | 1 | 106.5 |
| BULWARK | MIND (BREAKER) | 92.1 | +21.6 [+18.0…+25.3] | 53.4 | 0 | 77.8 |
| BULWARK | WILL (VICE) | 84.0 | +13.5 [+9.5…+17.5] | 55.6 | 0 | 88.9 |
| AMBUSH | BODY (TRAP) | 71.5 | +29.4 [+25.0…+33.7] | 50.2 | 0 | 88.6 |
| AMBUSH | MIND (SHADOW) | 67.6 | +25.5 [+20.9…+30.1] | 55.9 | 0 | 91.3 |
| AMBUSH | WILL (STING) | 70.4 | +28.2 [+23.7…+32.8] | 48.6 | 0 | 78.9 |

## Пункт 5. 17 слабых кристаллов (при тройной силе эффект появляется)

Пересчёт по `partA.json` (поле `cause`): ячеек с причиной «МАЛЫЙ ВЕС» — **17** (флагов 23); ячеек с «ГЛУХОЙ КАНАЛ» — **17** (флагов 19). Сводка перезамера: флагов МАЛЫЙ ВЕС 23, ГЛУХОЙ КАНАЛ 19; ячеек только с одной причиной — 16 и 16, одна смешанная (1). **Суммы сошлись.**

По ядрам: ONSLAUGHT 1, RAIDER 2, BULWARK 9, AMBUSH 5.

| кристалл | что не дотягивает | сдвиг ×1 → ×3, п.п. | что меняет |
| --- | --- | --- | --- |
| ONSLAUGHT · WILL/VOW (c3) · Building Momentum | ИСХОД | +3.4 → +5.5 | tempo+6  |
| RAIDER · BODY/GRIND (a3) · Far Bounce | ИСХОД | +1.8 → +11.9 | distance+10 slip+6  |
| RAIDER · BODY/ANVIL (a5) · Perfect Prick | ИСХОД | +1.1 → +7.2 | distance+8 initiative+10 slip+6  |
| BULWARK · BODY/GRIND (a3) · Catch Breath | ПОВЕДЕНИЕ | +14.0 → +21.6 | resilience+6 toughness+10% staminaRegen+60% |
| BULWARK · BODY/BREAK (a4) · Dig In | ИСХОД | +3.1 → +5.6 | distance-6 toughness+14% |
| BULWARK · MIND/WATCH (b1) · Riposte | ИСХОД + ПОВЕДЕНИЕ | +3.6 → +13.4 | stick+6 counter+8 toughness+4% blockCounter+50% |
| BULWARK · MIND/TIMING (b2) · Catch & Punish | ИСХОД + ПОВЕДЕНИЕ | +3.9 → +13.5 | counter+8 toughness+7% interruptBonus+50% |
| BULWARK · MIND/FEINT (b3) · Hard Meet | ИСХОД + ПОВЕДЕНИЕ | +0.9 → +8.9 | stick+6 counter+10 toughness+10% |
| BULWARK · MIND/ADAPT (b4) · Retaliation | ИСХОД + ПОВЕДЕНИЕ | +2.6 → +11.0 | counter+8 toughness+14% |
| BULWARK · MIND/COLD (b5) · Sea Wall | ПОВЕДЕНИЕ | +12.8 → +21.6 | stick+6 counter+8 toughness+22% blockCounter+100% interruptBonus+100% |
| BULWARK · WILL/HOLD (c1) · Body Shove | ИСХОД + ПОВЕДЕНИЕ | +2.1 → +4.8 | distance-6 stick+8  |
| BULWARK · WILL/VOW (c3) · No Way Around | ПОВЕДЕНИЕ | +2.6 → +3.1 | stick+10  |
| AMBUSH · BODY/DRIVE (a2) · Slip Counter | ПОВЕДЕНИЕ | +11.0 → +29.9 | slip+6 dodgeCounter+50% |
| AMBUSH · MIND/FEINT (b3) · Run 'Em Ragged | ИСХОД | +0.8 → +12.9 | distance+8 slip+6  |
| AMBUSH · MIND/ADAPT (b4) · Open Window | ПОВЕДЕНИЕ | +12.1 → +33.3 | slip+8 dodgeCounter+40% |
| AMBUSH · WILL/SPITE (c2) · Long Charge | ИСХОД + ПОВЕДЕНИЕ | +3.8 → +5.9 | distance+6 initiative-6 strikePower+7% chargeMax+60% |
| AMBUSH · WILL/VOW (c3) · Hit the Opening | ПОВЕДЕНИЕ | +5.5 → +18.6 | initiative-6 strikePower+10% |

