# Сверка граней и тегов (выгрузка из `main` = 1ea3cef9)

Только выгрузка: код не менялся. Числа наклонов — ЧЕРНОВЫЕ (`combatBalance.grani`): тег 0.12, вершина 0.2, резонанс 0.3 / 0.15, порог 3.
Словарь: ГРАНЬ = ветка (в коде `crystal`, id a/b/c = BODY/MIND/WILL), КРИСТАЛЛ = шаг ветки (в коде `face`, 1…5).
Тег на один кристалл; у `punish_aggression` два вхождения (RAIDER HUNT, шаг 4 · AMBUSH TRAP, шаг 3).

## 1. Теги → наклон → условие → где висит → текст игрока
Колонка «срабатывало» — доля решений о выборе намерения (раз в ~1 с), где условие было истинно, при полной ветке из 5 кристаллов, 200 зёрен: «против ядра без кристаллов · против такой же сборки». Замер на инструментированной КОПИИ (счётчик в `intentions.js` копии); в репозитории код не менялся.

| тег | наклон | условие срабатывания | ядро | ветка | кристалл (в коде) | текст игрока: effect / CHARACTER | срабатывало |
| --- | --- | --- | --- | --- | --- | --- | --- |
| close_damage_ramp | STRIKE +0.12 | close: враг в радиусе удара | ONSLAUGHT | a BODY · RAM | 4: Close Power (в игре: BREAK) | Finds the moment an opponent tips, and pushes through it. / Greedy for the finish. Forgets his guard when he smells weakness. | 92.5% · 88.9% |
| overload_strike | STRIKE +0.2 (вершина) | charged: заряд хлёсткого удара ≥ 0.5 | ONSLAUGHT | a BODY · RAM | 5: Breakthrough (в игре: ANVIL) | The body takes a hit and returns it through movement. / Calm under pressure. He no longer panics in the corner. | 0.0% · 0.1% |
| chase_strike | PRESS +0.12 | far: враг заметно дальше желаемой дистанции (> дистанция + 0.7) | ONSLAUGHT | b MIND · CHASE | 2: Run-Down (в игре: TIMING) | Lands in the gaps between the opponent's movements. / Deliberate. Throws fewer blind punches. | 4.5% · 4.1% |
| lockdown | PRESS +0.2 (вершина) | close: враг в радиусе удара | ONSLAUGHT | b MIND · CHASE | 5: Lockdown (в игре: COLD) | Another man's success does not knock him off his plan. / Cold. Never rattled, and never lit up when a spark is what he needs. | 95.8% · 96.0% |
| hit_accel | STRIKE +0.12 | always: всегда | ONSLAUGHT | c WILL · FRENZY | 3: Building Momentum (в игре: VOW) | Holds the order he was given to the end instead of drifting off it. / Loyal to the order. Improvises worse. | 100.0% · 100.0% |
| no_breather | PRESS +0.12 | always: всегда | ONSLAUGHT | c WILL · FRENZY | 4: No Breather (в игре: HUNGER) | Learns faster from what is done to him inside the fight. / Eager. Probes where he should not. | 100.0% · 100.0% |
| rampage | STRIKE +0.2 (вершина) | always: всегда | ONSLAUGHT | c WILL · FRENZY | 5: Rampage (в игре: STILL) | Slows down inside at the deciding moment and acts clean. / Ice. His overall liveliness drops. | 100.0% · 100.0% |
| clean_chain | STING +0.12 | always: всегда | RAIDER | a BODY · JAB | 4: Clean Exchange (в игре: BREAK) | Finds the moment an opponent tips, and pushes through it. / Greedy for the finish. Forgets his guard when he smells weakness. | 100.0% · 100.0% |
| perfect_jab | STING +0.2 (вершина) | far: враг заметно дальше желаемой дистанции (> дистанция + 0.7) | RAIDER | a BODY · JAB | 5: Perfect Prick (в игре: ANVIL) | The body takes a hit and returns it through movement. / Calm under pressure. He no longer panics in the corner. | 3.0% · 5.0% |
| rhythm_break | BREAK +0.12 | close: враг в радиусе удара | RAIDER | b MIND · FEINT | 3: Broken Rhythm (в игре: FEINT) | Lies with the body and punishes the answer. / Sly. Starts playing with the opponent and loses tempo. | 61.5% · 60.5% |
| feint_interrupt | STING +0.12 | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | RAIDER | b MIND · FEINT | 4: Feint to Interrupt (в игре: ADAPT) | Stops repeating what has already failed twice. / Flexible. Changes the plan even where holding it would have paid. | 42.6% · 45.6% |
| feint_combo | STRIKE +0.2 (вершина) | close: враг в радиусе удара | RAIDER | b MIND · FEINT | 5: Setup Combo (в игре: COLD) | Another man's success does not knock him off his plan. / Cold. Never rattled, and never lit up when a spark is what he needs. | 61.5% · 60.5% |
| punish_exhausted | STRIKE +0.12 | foeOpen: враг открыт (восстановление / сбив по прочтению) | RAIDER | c WILL · HUNT | 2: Strike the Open (в игре: SPITE) | The worse it goes for him, the more dangerous he becomes. / Angry. Dull in an even fight. | 23.3% · 22.6% |
| punish_aggression | CATCH +0.12 | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | RAIDER | c WILL · HUNT | 4: Punish Aggression (в игре: HUNGER) | Learns faster from what is done to him inside the fight. / Eager. Probes where he should not. | 37.5% · 40.6% |
| lethal_entry | PRESS +0.2 (вершина) | far: враг заметно дальше желаемой дистанции (> дистанция + 0.7) | RAIDER | c WILL · HUNT | 5: Killing Run (в игре: STILL) | Slows down inside at the deciding moment and acts clean. / Ice. His overall liveliness drops. | 5.2% · 4.9% |
| dig_in | HOLD +0.12 | close: враг в радиусе удара | BULWARK | a BODY · BASTION | 4: Dig In (в игре: BREAK) | Finds the moment an opponent tips, and pushes through it. / Greedy for the finish. Forgets his guard when he smells weakness. | 71.3% · 71.9% |
| fortress | HOLD +0.2 (вершина) | always: всегда | BULWARK | a BODY · BASTION | 5: Unbreakable (в игре: ANVIL) | The body takes a hit and returns it through movement. / Calm under pressure. He no longer panics in the corner. | 100.0% · 100.0% |
| retaliate_ramp | CATCH +0.12 | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | BULWARK | b MIND · BREAKER | 4: Retaliation (в игре: ADAPT) | Stops repeating what has already failed twice. / Flexible. Changes the plan even where holding it would have paid. | 1.9% · 2.3% |
| counter_trap | CATCH +0.2 (вершина) | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | BULWARK | b MIND · BREAKER | 5: Sea Wall (в игре: COLD) | Another man's success does not knock him off his plan. / Cold. Never rattled, and never lit up when a spark is what he needs. | 1.9% · 2.3% |
| pin | HOLD +0.12 | close: враг в радиусе удара | BULWARK | c WILL · VICE | 4: Pin (в игре: HUNGER) | Learns faster from what is done to him inside the fight. / Eager. Probes where he should not. | 70.8% · 68.5% |
| clinch | PRESS +0.2 (вершина) | close: враг в радиусе удара | BULWARK | c WILL · VICE | 5: Clinch (в игре: STILL) | Slows down inside at the deciding moment and acts clean. / Ice. His overall liveliness drops. | 70.8% · 68.5% |
| punish_aggression | CATCH +0.12 | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | AMBUSH | a BODY · TRAP | 3: Punish Aggression (в игре: GRIND) | He does not fade in a long exchange. / Takes punishment well. Stays in an exchange past the point where it pays. | 2.3% · 1.5% |
| perfect_trap | CATCH +0.2 (вершина) | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | AMBUSH | a BODY · TRAP | 5: Perfect Trap (в игре: ANVIL) | The body takes a hit and returns it through movement. / Calm under pressure. He no longer panics in the corner. | 2.3% · 1.5% |
| exhaust | STING +0.12 | far: враг заметно дальше желаемой дистанции (> дистанция + 0.7) | AMBUSH | b MIND · SHADOW | 3: Run 'Em Ragged (в игре: FEINT) | Lies with the body and punishes the answer. / Sly. Starts playing with the opponent and loses tempo. | 4.7% · 6.3% |
| phantom | BREAK +0.2 (вершина) | foeSwing: враг замахивается (windup/commit) или бил за последние 1.5 с | AMBUSH | b MIND · SHADOW | 5: Phantom (в игре: COLD) | Another man's success does not knock him off his plan. / Cold. Never rattled, and never lit up when a spark is what he needs. | 2.7% · 1.9% |
| vulnerable_strike | STRIKE +0.12 | foeOpen: враг открыт (восстановление / сбив по прочтению) | AMBUSH | c WILL · STING | 3: Hit the Opening (в игре: VOW) | Holds the order he was given to the end instead of drifting off it. / Loyal to the order. Improvises worse. | 11.1% · 7.5% |
| execute | STRIKE +0.2 (вершина) | foeOpen: враг открыт (восстановление / сбив по прочтению) | AMBUSH | c WILL · STING | 5: Execution (в игре: STILL) | Slows down inside at the deciding moment and acts clean. / Ice. His overall liveliness drops. | 11.1% · 7.5% |

## 2. Резонансы веток (порог 3 кристалла одной ветки)
| ядро | ветка | что даёт (наклон к выбору намерения) | когда включается | условие |
| --- | --- | --- | --- | --- |
| ONSLAUGHT | a BODY · RAM | STRIKE +0.3, PRESS +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| ONSLAUGHT | b MIND · CHASE | HOLD +0.3, PRESS +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| ONSLAUGHT | c WILL · FRENZY | STRIKE +0.3, PRESS +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| RAIDER | a BODY · JAB | STING +0.3 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| RAIDER | b MIND · FEINT | STING +0.3, BREAK +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| RAIDER | c WILL · HUNT | STRIKE +0.3, STING +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| BULWARK | a BODY · BASTION | HOLD +0.3, CATCH +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| BULWARK | b MIND · BREAKER | CATCH +0.3 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| BULWARK | c WILL · VICE | HOLD +0.3, PRESS +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| AMBUSH | a BODY · TRAP | CATCH +0.3 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| AMBUSH | b MIND · SHADOW | BREAK +0.3, STING +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |
| AMBUSH | c WILL · STING | STING +0.3, CATCH +0.15 | любые 3 кристалла этой ветки (порог 3) | всегда, пока порог собран |

Замечание: ONSLAUGHT CHASE (`b`) при пороге даёт HOLD +0.3 — ядро жмёт PRESS в 99% тиков, поэтому эта грань не меняет бой (0 из 200; принятый долг).

## 3. Текст 15 кристаллов, который видит игрок
Набор один на все четыре ядра (`crystalTexts.js`), поэтому в таблице 15 строк, не 60. Строка CHARACTER сегодня ничего не делает в бою (текст).

| грань | шаг | название | строка эффекта | строка CHARACTER |
| --- | --- | --- | --- | --- |
| a BODY | 1 | ROOT | Holds his ground. He no longer gives way when pressed. | Stubborn. He backs off less often than he should. |
| a BODY | 2 | DRIVE | The weight moves with the punch, not just the arm. | Impatient. He opens the exchange first. |
| a BODY | 3 | GRIND | He does not fade in a long exchange. | Takes punishment well. Stays in an exchange past the point where it pays. |
| a BODY | 4 | BREAK | Finds the moment an opponent tips, and pushes through it. | Greedy for the finish. Forgets his guard when he smells weakness. |
| a BODY | 5 | ANVIL | The body takes a hit and returns it through movement. | Calm under pressure. He no longer panics in the corner. |
| b MIND | 1 | WATCH | Sees where the opponent is going sooner. | Careful. Waits a little longer before he enters. |
| b MIND | 2 | TIMING | Lands in the gaps between the opponent's movements. | Deliberate. Throws fewer blind punches. |
| b MIND | 3 | FEINT | Lies with the body and punishes the answer. | Sly. Starts playing with the opponent and loses tempo. |
| b MIND | 4 | ADAPT | Stops repeating what has already failed twice. | Flexible. Changes the plan even where holding it would have paid. |
| b MIND | 5 | COLD | Another man's success does not knock him off his plan. | Cold. Never rattled, and never lit up when a spark is what he needs. |
| c WILL | 1 | HOLD | Recovers faster between exchanges. | Composed. Asks for fewer pauses. |
| c WILL | 2 | SPITE | The worse it goes for him, the more dangerous he becomes. | Angry. Dull in an even fight. |
| c WILL | 3 | VOW | Holds the order he was given to the end instead of drifting off it. | Loyal to the order. Improvises worse. |
| c WILL | 4 | HUNGER | Learns faster from what is done to him inside the fight. | Eager. Probes where he should not. |
| c WILL | 5 | STILL | Slows down inside at the deciding moment and acts clean. | Ice. His overall liveliness drops. |

## 4. Теги, у которых наклон не сработал ни разу (условие не наступает)
Полная ветка из 5 кристаллов, 200 зёрен, оба режима (против ядра без кристаллов · против такой же сборки). Формат ячейки: сработало/проверено.

_Таких тегов нет._

### Почти не срабатывающие (< 5% решений хотя бы в одном режиме)
| тег | ядро | ветка | шаг | условие | доля (без кристаллов · такая же сборка) |
| --- | --- | --- | --- | --- | --- |
| overload_strike | ONSLAUGHT | a RAM | 5 | charged | 0.0% · 0.1% |
| chase_strike | ONSLAUGHT | b CHASE | 2 | far | 4.5% · 4.1% |
| perfect_jab | RAIDER | a JAB | 5 | far | 3.0% · 5.0% |
| lethal_entry | RAIDER | c HUNT | 5 | far | 5.2% · 4.9% |
| retaliate_ramp | BULWARK | b BREAKER | 4 | foeSwing | 1.9% · 2.3% |
| counter_trap | BULWARK | b BREAKER | 5 | foeSwing | 1.9% · 2.3% |
| punish_aggression | AMBUSH | a TRAP | 3 | foeSwing | 2.3% · 1.5% |
| perfect_trap | AMBUSH | a TRAP | 5 | foeSwing | 2.3% · 1.5% |
| exhaust | AMBUSH | b SHADOW | 3 | far | 4.7% · 6.3% |
| phantom | AMBUSH | b SHADOW | 5 | foeSwing | 2.7% · 1.9% |
