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
