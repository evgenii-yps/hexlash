# Dice, Coach, Emergency — спецмеханики боя

Документация по исходному коду: дайс (кубик), тренер (коуч), экстренный протокол, стейт боя.

**Файлы:**
- `src/core/state/modules/cardFightState.js` — Vuex-модуль боя (логика dice, coach, emergency, persistence)
- `src/views/CardFightView.vue` — UI боя (отображение dice/coach/emergency)
- `src/core/engine/combatEngine.js` — движок (применение модификаторов)
- `src/core/constants.js` — константы

---

## 1. Dice (Кубик судьбы)

### Общее

Игрок может вручную бросить кубик во время боя. Кубик выдаёт случайный эффект из 6 возможных.

**Константы:**

| Константа | Значение | Описание |
|-----------|----------|----------|
| `DICE_COOLDOWN_ROUNDS` | 3 | Раунды кулдауна после броска |

### Когда Dice доступен

UI-условие отображения кнопки (`CardFightView.vue:85`):
```
fightPhase === 'fighting'
&& roundNum > 0
&& !isOverdrive
&& (diceState.ready || diceState.activeItem)
```

- Доступен с 1 раунда
- **Недоступен в Overdrive** (раунды 11-12)
- После использования — кулдаун 3 раунда
- Кулдаун тикает в `computeNextRound` после каждого раунда

### Все 6 эффектов

Реализация в `cardFightState.js`, action `rollDiceManual`:

| ID | Emoji | Эффект | Реализация в коде | Длительность |
|----|-------|--------|-------------------|-------------|
| `heal` | 💊 | Лечение | `HP1 = min(MAX_HP, HP1 + 15)` | Мгновенно |
| `adrenaline` | ⚡ | Двойная атака | `attackMultiplier = 2` | 1 раунд (сбрасывается после `resetPlayerModifiers`) |
| `shield` | 🛡️ | Блокирует атаку противника | `shieldActive = true` | 1 раунд |
| `blind` | ✨ | Противник промахивается | `blindActive = true` | 1 раунд |
| `rage` | 🔥 | Мгновенный урон | `HP2 -= 20` (может нокаутировать) | Мгновенно |
| `crit` | 💀 | Мгновенный крит-урон | `HP2 -= 30` (может нокаутировать) | Мгновенно |

### Как dice выбирается

```javascript
// cardFightState.js:446 — равновероятный случайный выбор
const item = DICE_ITEMS[Math.floor(Math.random() * DICE_ITEMS.length)];
// Вероятность каждого = 1/6 ≈ 16.7%
```

### Как dice влияет на расчёт урона

Модификаторы `playerModifiers` передаются в `CombatEngine.resolveRoundLive` как `playerMods`:

```javascript
// combatEngine.js:40-45
const {
    attackMultiplier = 1,    // от adrenaline dice или emergency
    shieldActive     = false, // от shield dice или emergency
    blindActive      = false, // от blind dice
} = playerMods;
```

Применение в движке:
- **`attackMultiplier`** — множитель `mult` при вызове `calcAttackDamage` для Fighter 1 (`combatEngine.js:92`)
- **`shieldActive`** — если противник атакует, урон = 0, событие `shield` (`combatEngine.js:106-107`)
- **`blindActive`** — если противник атакует, урон = 0, событие `missed` (`combatEngine.js:104-105`)

⚠️ Модификаторы применяются **только к Fighter 1** (игроку). Fighter 2 (AI) всегда атакует с `mult = 1` и без shield/blind.

### Сброс модификаторов

```javascript
// cardFightState.js:126 — после каждого раунда
commit('resetPlayerModifiers');
// → { attackMultiplier: 1, shieldActive: false, blindActive: false }
```

Все dice-эффекты (кроме heal, rage, crit) действуют **ровно 1 раунд**.

### Кулдаун

```javascript
// cardFightState.js:371-373 — тик кулдауна после каждого раунда
if (state.diceState.cooldownLeft > 0) {
    const newCd = state.diceState.cooldownLeft - 1;
    commit('setDiceState', { cooldownLeft: newCd, ready: newCd <= 0 });
}
```

Цикл: бросок → кулдаун 3 раунда → снова доступен → бросок → ...

### AI и Dice

AI-противник **не бросает кубик** в PvE бою. Метод `shouldPickupDiceItem` из `aiStrategy.js` существует, но в `cardFightState.js` не вызывается для AI-противника.

⚠️ `shouldPickupDiceItem` используется только в PvP-контексте (серверная логика). В PvE-бою dice — привилегия игрока.

### Auto-fight Dice

При включённом автобое кубик бросается автоматически (`CardFightView.vue:684-691`):

```javascript
watch([() => diceState.value.ready, fightPhase], ([ready, phase]) => {
  if (isAutoFightEnabled.value && ready && phase === 'fighting' && roundNum.value > 0) {
    setTimeout(() => {
      store.dispatch('fight/rollDiceManual');
    }, 800);  // задержка 800ms
  }
});
```

### Overdrive: dice отключён

В Overdrive (раунды 11-12):
- UI не показывает кнопку dice (`!isOverdrive`)
- `rollDiceManual` проверяет: `if (state.roundNum > MAX_ROUNDS) return;`
- `computeNextRound`: модификаторы принудительно сбрасываются:

```javascript
const modsToUse = isOverdrive
    ? { attackMultiplier: 1, shieldActive: false, blindActive: false }
    : state.playerModifiers;
```

---

## 2. Coach (Тренер)

### Условия активации

```javascript
// cardFightState.js:388
if (!state.coachAdvice.used
    && state.roundNum >= COACH_MIN_ROUND      // >= 6
    && Math.random() < COACH_TRIGGER_CHANCE)   // < 1.0 (= 100%)
```

| Константа | Значение | Описание |
|-----------|----------|----------|
| `COACH_MIN_ROUND` | 6 | Минимальный раунд для срабатывания |
| `COACH_TRIGGER_CHANCE` | 1.0 | Шанс срабатывания (100%) |
| `COACH_BOOST_ROUNDS` | 4 | Длительность бонуса в раундах |

**Итого:** Coach **всегда** срабатывает ровно на раунде 6 (chance = 100%, used = false).
Срабатывает **один раз за бой** (флаг `used`).

### Что происходит при активации

1. Бой **ставится на паузу**: `fightPhase` меняется на `'coach'`
2. Таймер боя останавливается (`stopFightTimer()`)
3. Показывается оверлей с 3 кнопками выбора
4. Запускается таймер обратного отсчёта: **15 секунд** (`adviceTimer = 15`)
5. Если время истекло — coach автоматически пропускается (`skipCoachAdvice`)

### UI оверлея Coach

Полноэкранный оверлей (`CardFightView.vue:120-152`) с тремя опциями:

| Кнопка | Action | Цвет | Описание |
|--------|--------|------|----------|
| Attack | `'attack'` | Красный (#e74c3c) | Бонус к атаке |
| Defense | `'defense'` | Синий (#3498db) | Бонус к защите |
| Position | `'position'` | Фиолетовый (#9b59b6) | Бонус к позиционированию |

### Механика бонуса

При выборе (`applyCoachAdvice`):

```javascript
// cardFightState.js:486-489
if (_ai1) _ai1.setCoachBoost(action, COACH_BOOST_ROUNDS);  // 4 раунда
commit('setCoachAdvice', { used: true, active: true, action, roundsLeft: COACH_BOOST_ROUNDS });
commit('setFightPhase', 'fighting');  // бой продолжается
```

В AI-стратегии (`aiStrategy.js:53-55`):
```javascript
// +25 к приоритету выбранного действия
if (this.coachBoost && this.coachBoost.roundsLeft > 0) {
    combined[this.coachBoost.action] += 25;
}
```

**Пример:** Если AI игрока имеет приоритеты `{ attack: 52, defense: 24, position: 24 }` и выбран coach `'attack'`:
```
attack:   52 + 25 = 77  → 77/125 = 61.6%
defense:  24            → 24/125 = 19.2%
position: 24            → 24/125 = 19.2%
```

### Тик Coach Boost

Каждый раунд (`computeNextRound`):
```javascript
// cardFightState.js:377-385
if (state.coachAdvice.active && state.coachAdvice.roundsLeft > 0) {
    const newLeft = state.coachAdvice.roundsLeft - 1;
    if (_ai1) _ai1.tickCoachBoost();  // уменьшает roundsLeft в AI
    if (newLeft <= 0) {
        commit('setCoachAdvice', { active: false, roundsLeft: 0, action: null });
    } else {
        commit('setCoachAdvice', { roundsLeft: newLeft });
    }
}
```

### UI индикатор активного Coach

Когда буст активен (`CardFightView.vue:112-116`):
```html
<div class="coach-active-bar">
  <img :src="iconTrainer" />
  <span>{{ coachActionLabel }}</span>  <!-- "ATK +", "DEF +", или "POS +" -->
  <span>{{ coachAdvice.roundsLeft }}R</span>  <!-- оставшиеся раунды -->
</div>
```

### При пропуске Coach

```javascript
// cardFightState.js:492-495
skipCoachAdvice({ commit }) {
    commit('setCoachAdvice', { used: true, active: false, action: null, roundsLeft: 0 });
    commit('setFightPhase', 'fighting');
}
```

Coach помечается как `used` — повторно не появится.

### Auto-fight Coach

При автобое coach обрабатывается автоматически (`CardFightView.vue:614-618`):
```javascript
if (isAutoFightEnabled.value) {
    const autoAction = liveHP1.value < 50 ? 'defense' : 'attack';
    setTimeout(() => {
        store.dispatch('fight/applyCoachAdvice', autoAction);
    }, 500);
}
```

Стратегия автобоя: HP < 50 → defense, иначе → attack.

### Overdrive: coach отключён

В Overdrive (раунды 11-12) блок coach/dice/emergency пропускается:
```javascript
// cardFightState.js:365-366
if (!isOverdrive) {
    // Check Emergency, Dice, Coach
}
```

---

## 3. Emergency Protocol (Экстренный протокол)

### Общее

Одноразовая механика спасения. Игрок **до боя** выбирает тип экстренного протокола. Срабатывает автоматически при определённых условиях.

### Состояние

```javascript
// cardFightState.js:158
emergencyProtocol: { type: 'medkit', used: false }
```

- `type` — выбранный протокол: `'medkit'` | `'adrenaline'` | `'shield'`
- `used` — использован ли (одноразовый за бой)
- По умолчанию: `'medkit'`

### Три протокола

| Протокол | Условие срабатывания | Эффект | Код |
|----------|---------------------|--------|-----|
| `medkit` | HP игрока < 30% | Лечение +25 HP | `HP1 = min(100, HP1 + 25)` |
| `adrenaline` | HP игрока < 20% **И** HP противника < 30% | Двойная атака | `attackMultiplier = 2` |
| `shield` | Последние 3 раунда — игрок получал урон каждый раунд | Блок следующей атаки | `shieldActive = true` |

### Реализация (`checkEmergencyProtocol`)

```javascript
// cardFightState.js:401-437
checkEmergencyProtocol({ commit, state }) {
    if (state.emergencyProtocol.used) return;

    const hpPercent = (state.liveHP1 / MAX_HP) * 100;
    let shouldTrigger = false;

    switch (protocol.type) {
        case 'medkit':
            shouldTrigger = hpPercent < EMERGENCY_HP_THRESHOLD;  // < 30
            break;
        case 'adrenaline':
            shouldTrigger = hpPercent < 20
                && (state.liveHP2 / MAX_HP) * 100 < 30;
            break;
        case 'shield': {
            const lastRounds = state.roundLog.slice(-3);
            shouldTrigger = lastRounds.length >= 3
                && lastRounds.every(r => r.damage1 > 0);
            break;
        }
    }

    if (shouldTrigger) {
        // Применить эффект...
        commit('setEmergencyUsed', true);
        commit('setEventTitle', {
            title: t.value.fight.lblEventEmergency,
            cls: 'event-emergency',
            image: PROTOCOL_IMAGES[protocol.type]
        });
    }
}
```

### Порядок проверки в раунде

```
computeNextRound:
  1. _simulateOneRound()           — раунд отыгрывается
  2. checkEmergencyProtocol()      — проверка emergency (после урона)
  3. Tick dice cooldown            — тик кулдауна кубика
  4. Tick coach boost              — тик буста тренера
  5. Check coach trigger           — проверка появления тренера
```

Emergency проверяется **после** получения урона в раунде, что позволяет среагировать на только что полученный урон.

### Связь с колодой/билдом

⚠️ Emergency protocol **не связан** с колодой или модулями. Тип протокола задаётся через `setEmergencyProtocol` action и хранится в стейте. Выбор делается на экране подготовки к бою (PreparationView).

### Overdrive: emergency отключён

Как и dice/coach — emergency не проверяется в Overdrive раундах.

### Emergency-эффекты vs Dice-эффекты

| Свойство | Emergency medkit | Dice heal |
|----------|-----------------|-----------|
| Лечение | +25 HP | +15 HP |
| Триггер | Автоматически при HP < 30% | Ручной бросок |
| Разовость | 1 раз за бой | Каждые 3 раунда |

| Свойство | Emergency adrenaline | Dice adrenaline |
|----------|---------------------|-----------------|
| Эффект | `attackMultiplier = 2` | `attackMultiplier = 2` |
| Условие | HP < 20% И HP противника < 30% | Случайный бросок |

| Свойство | Emergency shield | Dice shield |
|----------|-----------------|-------------|
| Эффект | `shieldActive = true` | `shieldActive = true` |
| Условие | 3 раунда подряд получал урон | Случайный бросок |

---

## 4. Стейт боя (`cardFightState`)

### Vuex-модуль `fight`

Namespace: `fight` (namespaced: true)

### Все данные стейта

```javascript
// cardFightState.js:148-180
{
    playerModules: ['predator', 'analyst', 'ghost'],  // 3 архетипа
    opponent: null,                                    // объект противника

    playerDeck: [],           // массив move ID
    playerCardLevels: {},     // { moveId: level }
    opponentDeck: [],
    opponentCardLevels: {},

    emergencyProtocol: { type: 'medkit', used: false },

    liveHP1: 100,             // HP игрока
    liveHP2: 100,             // HP противника
    roundNum: 0,              // текущий раунд
    roundLog: [],             // массив RoundResult

    playerModifiers: {
        attackMultiplier: 1,
        shieldActive: false,
        blindActive: false
    },
    diceState: {
        activeItem: null,      // текущий выброшенный предмет
        cooldownLeft: 0,       // раунды до следующего броска
        ready: true            // можно ли бросать
    },
    coachAdvice: {
        used: false,           // использован ли за бой
        active: false,         // активен ли буст
        action: null,          // 'attack'|'defense'|'position'
        roundsLeft: 0          // оставшиеся раунды буста
    },

    eventTitle: null,          // текст события (dice pickup, emergency)
    eventTitleClass: '',       // CSS-класс события
    eventImage: null,          // иконка события

    fightPhase: 'idle',        // idle | preparation | fighting | coach | results
    difficulty: 'medium',      // easy | medium | hard

    fightStats: {
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        dicePickedUp: 0,
        diceIgnored: 0,
        criticalHits: 0
    },

    xpEarned: null,            // { speed, power, technique } или null
    xpAwarded: false           // предотвращает двойное начисление XP
}
```

### Фазы боя (`fightPhase`)

```
idle → preparation → fighting ⇄ coach → results
                          ↓
                       results
```

| Фаза | Описание |
|------|----------|
| `idle` | Начальное состояние |
| `preparation` | Выбор модулей и подготовка |
| `fighting` | Активный бой (раунды тикают) |
| `coach` | Пауза: ожидание выбора тренера |
| `results` | Бой завершён, показ результатов |

### Что персистится в localStorage

Ключ: `hexlash_current_fight`

Функция `saveFightState` сохраняет (`cardFightState.js:36-61`):

| Поле | Описание |
|------|----------|
| `playerModules` | 3 архетипа игрока |
| `opponent` | Полный объект противника |
| `playerDeck`, `playerCardLevels` | Колода и уровни игрока |
| `opponentDeck`, `opponentCardLevels` | Колода и уровни противника |
| `liveHP1`, `liveHP2` | Текущие HP |
| `roundNum` | Текущий раунд |
| `roundLog` | Лог всех раундов |
| `playerModifiers` | Активные модификаторы |
| `diceState` | Состояние кубика (без анимации) |
| `coachAdvice` | Состояние тренера |
| `emergencyProtocol` | Тип и статус использования |
| `fightStats` | Статистика боя |
| `fightPhase` | Текущая фаза |
| `difficulty` | Сложность |
| `xpEarned`, `xpAwarded` | XP данные |
| `lastUpdateAt` | Timestamp последнего обновления |

⚠️ При сохранении dice-анимация сбрасывается: `activeItem` всегда `null`, `ready` вычисляется из `cooldownLeft`.

### Отдельно в localStorage

| Ключ | Данные |
|------|--------|
| `hexlash_player_modules` | Массив из 3 ID архетипов игрока |

### Восстановление боя при перезагрузке (`initFromStorage`)

Вызывается при монтировании `CardFightView` (`cardFightState.js:503-568`):

```
1. Загрузить JSON из localStorage
2. Если fightPhase = 'idle' или 'preparation' → очистить, вернуть false
3. Восстановить все поля стейта через commit
4. Если fightPhase = 'results':
   → показать результаты, AI не нужен
5. Пересоздать AI-экземпляры:
   → _ai1 = new ModuleAIStrategy(saved.playerModules)
   → _ai2 = new ModuleAIStrategy(saved.opponent.modules)
6. Восстановить coach boost в AI, если был активен
7. Если fightPhase = 'coach':
   → показать оверлей тренера, ждать выбора
8. Если fightPhase = 'fighting':
   → досимулировать пропущенные раунды:
   missedRounds = min(
       floor((Date.now() - lastUpdateAt) / ROUND_ANIMATION_MS),
       TOTAL_ROUNDS - savedRoundNum
   )
   → для каждого пропущенного — _simulateOneRound()
```

### Досимуляция при возврате на вкладку

`CardFightView.vue` слушает `visibilitychange`:

```javascript
// CardFightView.vue:587-590
if (document.visibilityState === 'visible' && fightPhase.value === 'fighting') {
    store.dispatch('fight/resumeMissedRounds');
}
```

`resumeMissedRounds` (`cardFightState.js:575-590`):
```javascript
const elapsed = Date.now() - _fightLastUpdateAt;
const missedRounds = min(
    floor(elapsed / ROUND_ANIMATION_MS),   // 1500ms per round
    TOTAL_ROUNDS - state.roundNum
);
// Досимулировать каждый пропущенный раунд
```

⚠️ Досимулированные раунды **не показывают** dice/coach/emergency — используется `_simulateOneRound`, который не вызывает эти механики. Это значит: пропущенные раунды = чистый бой без спецмеханик.

### Предупреждение при уходе со страницы

```javascript
// CardFightView.vue:594-598
if (fightPhase === 'fighting' || fightPhase === 'coach') {
    e.preventDefault();     // стандартное предупреждение браузера
    e.returnValue = '';
}
```
