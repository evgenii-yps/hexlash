# Ядро боевой системы Hexlash

Документация по исходному коду боевой механики.

**Файлы:**
- `src/core/engine/combatEngine.js` — движок боя
- `src/core/engine/aiStrategy.js` — AI-стратегия (выбор действий)
- `src/core/engine/opponentGenerator.js` — генерация AI-противника
- `src/core/constants.js` — константы
- `src/data/moves.js` — данные приёмов (18 шт.)
- `src/data/branches.js` — ветки развития (3 шт.)
- `src/data/cardPower.js` — базовая сила карт для матчмейкинга

---

## 1. Общий флоу боя

### Константы

| Константа | Значение | Описание |
|-----------|----------|----------|
| `MAX_HP` | 100 | Стартовое HP каждого бойца |
| `MAX_ROUNDS` | 10 | Основные раунды |
| `EXTRA_ROUNDS` | 2 | Дополнительные раунды (Overdrive) |
| `TOTAL_ROUNDS` | 12 | `MAX_ROUNDS + EXTRA_ROUNDS` |
| `EXTRA_ROUND_DAMAGE_MULTIPLIER` | 2 | Множитель урона в Overdrive-раундах |
| `COUNTDOWN` | 3 | Секунды до начала боя |
| `ROUND_ANIMATION_MS` | 1500 | Длительность анимации раунда (мс) |

### Цикл боя (`CombatEngine.runCombat`)

```
1. Оба бойца получают HP = MAX_HP (100)
2. Создаются AI-стратегии: ai1 = new ModuleAIStrategy(modules1), ai2 = new ModuleAIStrategy(modules2)
3. Цикл раундов (1..TOTAL_ROUNDS = 12):
   a. AI выбирает действие: ai.selectAction(currentHP, MAX_HP)
   b. Определяется moveInfo — приём из колоды для текущего раунда
   c. Раунд разрешается через resolveRoundLive()
   d. HP обновляется
   e. Если HP любого бойца <= 0 → бой прерывается
4. buildResult() определяет победителя
```

### Определение победителя (`CombatEngine.buildResult`)

```javascript
if (finalHP1 <= 0 && finalHP2 <= 0) → НИЧЬЯ
else if (finalHP1 <= 0)             → Победа fighter2
else if (finalHP2 <= 0)             → Победа fighter1
else if (finalHP1 > finalHP2)       → Победа fighter1 (по HP)
else if (finalHP2 > finalHP1)       → Победа fighter2 (по HP)
else                                → НИЧЬЯ (HP равны)
```

**Ничья** возникает в двух случаях:
1. Оба нокаутированы в одном раунде (HP обоих <= 0)
2. После 12 раундов HP равны

Если после 12 раундов HP не равны — побеждает боец с большим HP.

### Overdrive (раунды 11-12)

Раунды с номером > `MAX_ROUNDS` (10) считаются Overdrive:
- Весь урон умножается на `EXTRA_ROUND_DAMAGE_MULTIPLIER` (×2)
- AI получает агрессивный бонус: `attack += 30`, `position = max(5, position - 15)`

---

## 2. Механика одного раунда

### Действия бойца

Каждый раунд боец выбирает одно из трёх действий:

| Действие | Эффект |
|----------|--------|
| `attack` | Наносит урон противнику |
| `defense` | Блокирует 60% входящего урона |
| `position` | Не наносит урон, но даёт `POSITION_BONUS` (+5) к следующей атаке |

### Пошаговая логика раунда (`resolveRoundLive`)

```
1. Определяется Overdrive-множитель:
   overdriveMult = (roundNum > MAX_ROUNDS) ? 2 : 1

2. Рассчитывается урон приёмов:
   moveDmg = (moveData.damage ?? BASE_DAMAGE) * overdriveMult
   moveSpeed = moveData.speed ?? 1.0

3. Если оба атакуют — определяется порядок по speed:
   fighter1First = (moveSpeed1 >= moveSpeed2)

4. Fighter 1 действует:
   - attack → наносит урон
   - position → получает бафф +POSITION_BONUS к следующей атаке
   - defense → ничего активного

5. Fighter 2 действует:
   - Если blindActive → промах (missed)
   - Если shieldActive → урон заблокирован (shield)
   - Иначе → аналогично Fighter 1

6. Speed-based KO: если оба атакуют — более быстрый может нокаутировать
   до ответного удара медленного
```

### Формула расчёта урона (`calcAttackDamage`)

Входные параметры:
- `baseDmg` — урон приёма из `moves.js` (с учётом уровня и Overdrive)
- `attackerAi.consumeAttackBoost()` — накопленный бонус от `position` (расходуется)
- `mult` — внешний множитель (например, от дайса Adrenaline/Rage)

#### Атака vs Атака (или vs Position)

```javascript
dmg = (baseDmg + attackerAi.consumeAttackBoost()) * mult
// 10% шанс крита:
if (Math.random() < CRIT_CHANCE) {  // 0.10
    finalDmg = Math.floor(dmg * CRIT_MULT)  // × 1.5
}
```

⚠️ Если защитник в `position` — есть дополнительный шанс уклонения:
```javascript
DODGE_CHANCE = 0.12  // базовый шанс
dodgeChanceBonus = 0.1  // передаётся в calcAttackDamage
// Итого: 22% шанс уклонения при position
if (Math.random() < 0.12 + 0.1) → dodge (0 урона)
```

#### Атака vs Защита (defense)

```javascript
dmg = (baseDmg + attackerAi.consumeAttackBoost()) * mult
blocked = Math.floor(dmg * 0.6)    // блокируется 60%
finalDmg = Math.max(0, dmg - blocked)  // проходит ~40%
```

#### Пример расчёта

Приём: `hook` уровня 3, damage = 24, speed = 0.85
Противник в `defense`, position бонус = 5 (от предыдущего раунда):

```
dmg = (24 + 5) * 1 = 29
blocked = floor(29 * 0.6) = 17
finalDmg = max(0, 29 - 17) = 12
```

### Дополнительные механики раунда

| Механика | Константа | Значение |
|----------|-----------|----------|
| Шанс уклонения (dodge) | `DODGE_CHANCE` | 12% (+ 10% бонус при position) |
| Шанс крита | `CRIT_CHANCE` | 10% |
| Множитель крита | `CRIT_MULT` | ×1.5 |
| Блок при defense | — | 60% урона блокируется |
| Position бонус | `POSITION_BONUS` | +5 к следующей атаке |

### Speed-based KO (нокаут по скорости)

Когда оба бойца атакуют одновременно:

```
1. Сравниваются speed приёмов: fighter1First = (speed1 >= speed2)
2. Быстрый бьёт первым
3. Если быстрый нокаутирует (HP противника → 0):
   → медленный НЕ наносит ответный удар
   → события урона медленного удаляются из лога
```

### Роль speed приёма

Speed определяет **приоритет атаки** при обоюдной атаке (attack vs attack):
- Боец с большим speed бьёт первым
- При равном speed — первым бьёт Fighter 1 (игрок)
- Быстрый может нокаутировать до ответного удара
- Speed НЕ влияет на урон, только на порядок ударов

---

## 3. AI-стратегия (`ModuleAIStrategy`)

### Архетипы (модули)

Каждый боец имеет 3 модуля-архетипа с весами по слотам:

| Слот | Вес |
|------|-----|
| slot1 | 0.50 (50%) |
| slot2 | 0.30 (30%) |
| slot3 | 0.20 (20%) |

6 архетипов:

| ID | Имя | High HP (>70%) | Low HP (<=70%) | Стиль |
|----|-----|----------------|----------------|-------|
| `predator` | Хищник | atk:80 def:10 pos:10 | atk:90 def:5 pos:5 | Ультра-агрессивный |
| `sentinel` | Страж | atk:20 def:50 pos:30 | atk:10 def:70 pos:20 | Оборонительный |
| `ghost` | Призрак | atk:30 def:20 pos:50 | atk:40 def:10 pos:50 | Позиционный |
| `analyst` | Аналитик | atk:35 def:30 pos:35 | atk:30 def:30 pos:40 | Сбалансированный |
| `maverick` | Непредсказуемый | atk:33 def:33 pos:34 | **random** | Хаотичный |
| `juggernaut` | Неостановимый | atk:50 def:35 pos:15 | atk:50 def:35 pos:15 | Агрессивно-стабильный |

### Расчёт приоритетов (`calculatePriorities`)

```javascript
hpPercent = (currentHP / maxHP) * 100
hpState = hpPercent > 70 ? 'high' : 'low'

// Взвешенная сумма приоритетов трёх модулей:
combined.attack   = module1.attack * 0.5 + module2.attack * 0.3 + module3.attack * 0.2
combined.defense  = module1.defense * 0.5 + module2.defense * 0.3 + module3.defense * 0.2
combined.position = module1.position * 0.5 + module2.position * 0.3 + module3.position * 0.2

// Если есть коуч-буст:
combined[coachBoost.action] += 25
```

### Maverick при low HP

Особый случай — при `hpState = 'low'` приоритеты = `'random'`:

```javascript
spike = Math.random() < 0.3  // 30% шанс "вспышки"
if (spike) {
    // Один случайный тип действия получает 80
    priorities = { attack: 33, defense: 33, position: 34 }
    priorities[randomType] = 80
} else {
    priorities = { attack: 33, defense: 33, position: 34 }  // равномерно
}
```

### Выбор действия (`selectAction`)

```javascript
// В Overdrive: attack += 30, position = max(5, position - 15)
total = attack + defense + position
roll = Math.random() * total

if (roll < attack)            → 'attack'
if (roll < attack + defense)  → 'defense'
else                          → 'position'
```

### Пример: predator + sentinel + ghost (high HP)

```
attack:   80*0.5 + 20*0.3 + 30*0.2 = 40 + 6 + 6 = 52
defense:  10*0.5 + 50*0.3 + 20*0.2 = 5 + 15 + 4 = 24
position: 10*0.5 + 30*0.3 + 50*0.2 = 5 + 9 + 10 = 24
total = 100

→ 52% attack, 24% defense, 24% position
```

### Dice preferences (дайс-предпочтения)

AI решает, подбирать ли дайс-предмет через `shouldPickupDiceItem`:

```javascript
combinedChance = module1.pref * 0.5 + module2.pref * 0.3 + module3.pref * 0.2
pickup = Math.random() * 100 < combinedChance
```

Эффекты дайсов:
- `heal` — лечение
- `shield` — блокирует следующую атаку противника
- `blind` — противник промахивается следующей атакой
- `rage` — множитель атаки
- `crit` — критический удар
- `adrenaline` — множитель атаки

### Коуч (Coach Boost)

```javascript
// Активируется с раунда COACH_MIN_ROUND (6)
// Шанс срабатывания: COACH_TRIGGER_CHANCE (1.0 = 100%)
// Длительность: COACH_BOOST_ROUNDS (4 раунда)
// Эффект: +25 к приоритету выбранного действия
```

---

## 4. Генерация противника (`OpponentGenerator`)

### Параметры генерации

```javascript
OpponentGenerator.generate(difficulty, playerPower)
// difficulty: 'easy' | 'medium' | 'hard'
// playerPower: силовой рейтинг игрока (опционально)
```

### Что рандомизируется

| Параметр | Источник |
|----------|----------|
| Имя | Случайное из 20 имён (Shadow, Viper, Thunder...) + префикс по сложности |
| Скин | Случайный из 3 скинов (`skin_m_1/2/3.png`) |
| Модули (3 шт.) | Случайные архетипы без повторов из пула сложности |
| Колода | Генерируется через `generateDeckForPower()` под силу игрока |
| Уровни карт | Рассчитываются для соответствия целевой силе |

### Пулы архетипов по сложности

| Сложность | Префикс | Предпочтительные архетипы |
|-----------|---------|--------------------------|
| `easy` | "Rookie " | analyst, sentinel, maverick |
| `medium` | "" | все 6 архетипов |
| `hard` | "Elite " | predator, juggernaut, ghost, analyst |

### Power-based матчмейкинг

Если передан `playerPower`:

```javascript
// Целевая сила противника зависит от сложности:
// easy:   playerPower * [0.70 .. 0.85]
// medium: playerPower * [0.90 .. 1.10]
// hard:   playerPower * [1.15 .. 1.30]

targetPower = clamp(randomInRange, MIN_OPPONENT_POWER=25, MAX_OPPONENT_POWER=200)
```

### Генерация колоды (`generateDeckForPower`)

```javascript
deckSize = random(3, 5)

// Бюджет силы на карты:
cardsPowerBudget = targetPower - MODULE_BASE_POWER(15) - bonusPower(5)
powerPerCard = cardsPowerBudget / deckSize

// Для каждой карты:
// Выбирается случайный приём (без повторов)
// Рассчитывается уровень:
level = round(((powerPerCard / basePower) - 1) / 0.2 + 1)
level = clamp(level, 1, 5)
```

---

## 5. Колода и модули

### Ограничения колоды

| Константа | Значение |
|-----------|----------|
| `MIN_DECK_SIZE` | 4 |
| `MAX_DECK_SIZE` | 8 |

### Выбор приёма из колоды в бою

В каждом раунде приём определяется циклически:

```javascript
moveId = deck[(roundNum - 1) % deck.length]
```

Колода из 5 карт в бою на 12 раундов:
```
Раунд:  1  2  3  4  5  6  7  8  9  10  11  12
Индекс: 0  1  2  3  4  0  1  2  3   4   0   1
```

### Уровень приёма (1-5)

Уровень берётся из `cardLevels[moveId]` и влияет на значения damage и speed из массивов `moves.js`:

```javascript
const level = clamp(cardLevels[moveId] || 1, 1, 5)
damage = moveData.damage[level - 1]
speed = moveData.speed[level - 1]
```

### cardPower.js — система силового рейтинга

Используется для матчмейкинга, НЕ для боевых расчётов.

**Формула силового рейтинга (`calculatePowerRating`):**

```javascript
power = 0

// 1. Сила карт в колоде
deck.forEach(cardId => {
    power += CARD_BASE_POWER[cardId] * LEVEL_MULTIPLIERS[level]
})

// 2. Сила модулей (с позиционными весами)
modules.forEach((moduleId, index) => {
    power += MODULE_BASE_POWER(15) * POSITION_WEIGHTS[index]
    // POSITION_WEIGHTS = [0.5, 0.3, 0.2]
    // Итого от модулей: 15 * (0.5 + 0.3 + 0.2) = 15
})

// 3. Бонус за открытые карты (+1 за каждую)
power += unlockedCards.length

return Math.round(power)
```

**Базовая сила карт (`CARD_BASE_POWER`):**

| Ветка | Карты (от слабой к сильной) |
|-------|---------------------------|
| Speed | jab:8, double_jab:10, rapid_fire:12, combo_strike:14, flurry:16, hurricane:18 |
| Power | straight:10, hook:13, uppercut:16, haymaker:19, hammer_fist:22, knockout_blow:25 |
| Technique | block_strike:9, counter_jab:11, feint_cross:13, parry_punish:15, slip_counter:17, precision_strike:20 |

**Множители уровня (`LEVEL_MULTIPLIERS`):**

| Уровень | Множитель |
|---------|-----------|
| 1 | ×1.0 |
| 2 | ×1.2 |
| 3 | ×1.4 |
| 4 | ×1.6 |
| 5 | ×1.8 |

---

## 6. Таблица приёмов

### Speed (Скорость)

| ID | Damage (1→5) | Speed (1→5) |
|----|-------------|-------------|
| `jab` | 8 → 10 → 12 → 15 → 18 | 1.20 → 1.30 → 1.40 → 1.50 → 1.60 |
| `double_jab` | 12 → 15 → 18 → 22 → 26 | 1.10 → 1.20 → 1.30 → 1.40 → 1.50 |
| `rapid_fire` | 15 → 18 → 22 → 27 → 32 | 1.00 → 1.10 → 1.20 → 1.30 → 1.40 |
| `combo_strike` | 20 → 24 → 29 → 35 → 42 | 0.90 → 1.00 → 1.10 → 1.20 → 1.30 |
| `flurry` | 25 → 30 → 36 → 43 → 52 | 0.80 → 0.90 → 1.00 → 1.10 → 1.20 |
| `hurricane` | 32 → 38 → 46 → 55 → 66 | 0.70 → 0.80 → 0.90 → 1.00 → 1.10 |

### Power (Сила)

| ID | Damage (1→5) | Speed (1→5) |
|----|-------------|-------------|
| `straight` | 12 → 15 → 18 → 22 → 27 | 0.80 → 0.85 → 0.90 → 0.95 → 1.00 |
| `hook` | 16 → 20 → 24 → 29 → 35 | 0.75 → 0.80 → 0.85 → 0.90 → 0.95 |
| `uppercut` | 20 → 25 → 30 → 36 → 44 | 0.70 → 0.75 → 0.80 → 0.85 → 0.90 |
| `haymaker` | 26 → 32 → 38 → 46 → 56 | 0.60 → 0.65 → 0.70 → 0.75 → 0.80 |
| `hammer_fist` | 32 → 40 → 48 → 58 → 70 | 0.50 → 0.55 → 0.60 → 0.65 → 0.70 |
| `knockout_blow` | 42 → 52 → 62 → 75 → 90 | 0.40 → 0.45 → 0.50 → 0.55 → 0.60 |

### Technique (Техника)

| ID | Damage (1→5) | Speed (1→5) |
|----|-------------|-------------|
| `block_strike` | 10 → 12 → 15 → 18 → 22 | 1.00 → 1.05 → 1.10 → 1.15 → 1.20 |
| `counter_jab` | 14 → 17 → 21 → 25 → 30 | 0.95 → 1.00 → 1.05 → 1.10 → 1.15 |
| `feint_cross` | 18 → 22 → 27 → 32 → 39 | 0.90 → 0.95 → 1.00 → 1.05 → 1.10 |
| `parry_punish` | 22 → 27 → 33 → 40 → 48 | 0.85 → 0.90 → 0.95 → 1.00 → 1.05 |
| `slip_counter` | 28 → 34 → 41 → 50 → 60 | 0.80 → 0.85 → 0.90 → 0.95 → 1.00 |
| `precision_strike` | 35 → 43 → 52 → 63 → 76 | 0.75 → 0.80 → 0.85 → 0.90 → 0.95 |

### Закономерности

- **Внутри ветки:** чем сильнее приём, тем выше урон, но ниже скорость
- **Между ветками (на одном уровне сложности):** Power > Technique > Speed по урону, Speed > Technique > Power по скорости
- **Прокачка (уровни 1→5):** урон растёт примерно ×2–2.2, скорость растёт примерно на +0.20
