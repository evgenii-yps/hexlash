# Auto Fight — автоматические бои

Документация по механике автоматических боёв.

**Файлы:**
- `src/core/state/modules/autoFightState.js` — Vuex-модуль автобоя
- `src/components/fragments/fight/AutoFightToggle.vue` — кнопка вкл/выкл
- `src/components/fragments/fight/AutoFightStatus.vue` — статус и таймер
- `src/core/constants.js` — константы `AUTO_FIGHT_*`

---

## 1. Механика Auto Fight

### Константы

| Константа | Значение | Описание |
|-----------|----------|----------|
| `AUTO_FIGHT_MIN_INTERVAL` | 3 600 000 мс (60 мин) | Минимальный интервал между боями |
| `AUTO_FIGHT_MAX_INTERVAL` | 3 600 000 мс (60 мин) | Максимальный интервал между боями |
| `AUTO_FIGHT_MAX_PER_DAY` | 24 | Лимит боёв в день |
| `AUTO_FIGHT_MAX_PER_SESSION` | 48 | Лимит боёв за сессию |

⚠️ `MIN_INTERVAL === MAX_INTERVAL` (оба 60 мин) — интервал **фиксированный**, рандомизации фактически нет:
```javascript
// autoFightState.js:57-59
function getRandomInterval() {
    return Math.random() * (MAX_INTERVAL - MIN_INTERVAL) + MIN_INTERVAL;
    // = Math.random() * 0 + 3600000 = 3600000 (всегда 60 мин)
}
```

### Включение (AutoFightToggle)

```javascript
// AutoFightToggle.vue:21-27
const toggle = () => {
    if (isEnabled.value) {
        store.dispatch('autoFight/disable');
    } else {
        store.dispatch('autoFight/enable');
    }
};
```

**Предусловие:** `isBuildValid` — все 3 модуля должны быть выбраны (`canToggle`).

Action `enable` (`autoFightState.js:303-318`):
```javascript
enable({ commit, state, rootGetters }) {
    const modules = rootGetters['fight/getPlayerModules'];
    if (!modules || !modules.every(m => m !== null)) return false;

    commit('setEnabled', true);
    commit('setEnabledAt', Date.now());
    commit('setNextFightAt', Date.now() + getRandomInterval());  // +60 мин
    commit('setStoppingAfterCurrent', false);
    saveState(state);

    // Запрос разрешения на push-уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    return true;
}
```

### Выключение

Два варианта:

1. **Мягкое** (`disable`) — если идёт бой, ставит флаг `stoppingAfterCurrent = true`, после завершения текущего боя выключается
2. **Жёсткое** (`forceStop`) — немедленная остановка, сброс liveFight

```javascript
// autoFightState.js:322-339
disable({ commit, state }) {
    if (state.liveFight) {
        commit('setStoppingAfterCurrent', true);  // дождаться окончания
    } else {
        commit('setEnabled', false);
        commit('setNextFightAt', null);
    }
}

forceStop({ commit, state }) {
    commit('setEnabled', false);
    commit('setNextFightAt', null);
    commit('setStoppingAfterCurrent', false);
    commit('setLiveFight', null);
}
```

### Как симулируется бой

Используется **тот же движок** что и для PvE — `CombatEngine.resolveRoundLive` + `ModuleAIStrategy`.

Функция `simulateFullFight` (`autoFightState.js:66-157`):

```
1. OpponentGenerator.generate(difficulty, playerPower)
2. Создать AI: ai1 (игрок), ai2 (противник)
3. Цикл раундов (1..TOTAL_ROUNDS):
   a. ai.selectAction(hp, MAX_HP, isOverdrive)
   b. CombatEngine.getMoveInfo(round, playerDeck, ..., opponentDeck, ...)
   c. CombatEngine.resolveRoundLive(...)
   d. Модификаторы сбрасываются каждый раунд
   e. Emergency: автоматически medkit при HP < 30%
   f. Coach: автоматически (HP < 50 → defense, иначе → attack)
4. Определение результата: win / lose / draw
```

⚠️ **Отличия от ручного боя:**
- Emergency **всегда medkit** (нет выбора протокола)
- Coach стратегия: `HP < 50 → defense, иначе → attack`
- Dice **не бросается** в `simulateFullFight` (⚠️ в офлайн-симуляции dice полностью отсутствует)

### Проверка лимитов

```javascript
// autoFightState.js:198-202
canStartAutoFight: (s) => {
    if (s.fightsToday >= AUTO_FIGHT_MAX_PER_DAY) return { allowed: false, reason: 'dailyLimit' };
    if (s.sessionFights >= AUTO_FIGHT_MAX_PER_SESSION) return { allowed: false, reason: 'sessionLimit' };
    return { allowed: true };
}
```

---

## 2. Офлайн и catch-up

### Что происходит когда вкладка закрыта

Автобой **не работает в реальном времени** в фоне. Когда пользователь возвращается, пропущенные бои **досимулируются мгновенно**.

### Catch-up (`checkAndRunPending`)

Вызывается:
- При монтировании `AutoFightStatus` (`onMounted`)
- Каждую секунду через `setInterval` в `AutoFightStatus` (когда `now >= nextFightAt`)
- При `visibilitychange` (возврат на вкладку)

```javascript
// autoFightState.js:346-455
checkAndRunPending({ ... }) {
    // 1. Проверка дневного ресета
    // 2. Проверка валидности модулей
    // 3. Проверка, нет ли активного ручного боя

    // 4. Досимуляция пропущенных боёв:
    let nextAt = state.nextFightAt;
    while (nextAt && now >= nextAt
           && state.fightsToday < AUTO_FIGHT_MAX_PER_DAY
           && state.sessionFights < AUTO_FIGHT_MAX_PER_SESSION) {

        const fightData = simulateFullFight(modules, difficulty, playerPower, deck, cardLevels);

        // Логирование
        commit('addFightToLog', logEntry);
        commit('incrementStats', fightData.result);
        commit('addExp', expGain);

        // Начисление XP
        dispatch('progression/onFightEnd', { result }, { root: true });

        // Синхронизация с сервером
        apiClient.post('/fight/save', { isWin, isDraw, roundsPlayed, totalDamageDealt: 0 });

        // Push-уведомление
        dispatch('sendNotification', { fight: logEntry });

        nextAt = nextAt + getRandomInterval();  // +60 мин
    }

    commit('setNextFightAt', nextAt);  // всегда в будущем
}
```

**Пример:** Вкладка была закрыта 3 часа. При возврате:
- `nextFightAt` было 3 часа назад
- Цикл while пройдёт 3 итерации (3 боя по 60 мин)
- Все 3 боя симулируются мгновенно
- `nextFightAt` ставится в будущее (+60 мин от последнего)

### XP за автобой

```javascript
const expGain = fightData.result === 'win' ? 10 : 5;
// ⚠️ Ничья тоже даёт 5 XP (нет отдельной проверки на draw)
```

### Push-уведомления

```javascript
// autoFightState.js:515-531
sendNotification(_, { fight }) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification('Hexlash Auto Fight', {
        body: fight.result === 'win'
            ? `Victory vs ${fight.opponent}! +${xp} XP`
            : fight.result === 'lose'
                ? `Defeat vs ${fight.opponent}. +${xp} XP`
                : `Draw vs ${fight.opponent}. +${xp} XP`,
        icon: '/favicon.ico',
        tag: 'autofight-' + fight.id,  // предотвращает дубликаты
    });
}
```

Используется Web Notification API. Разрешение запрашивается при включении автобоя.

---

## 3. Персистентность

### localStorage: `hexlash_autofight_state`

```javascript
// autoFightState.js:20-34
{
    enabled: boolean,
    enabledAt: number | null,        // timestamp включения
    nextFightAt: number | null,      // timestamp следующего боя
    stoppingAfterCurrent: boolean,
    difficulty: string,              // 'easy' | 'medium' | 'hard'
    fightsToday: number,
    lastFightDate: string | null,    // "YYYY-MM-DD"
    wins: number,
    losses: number,
    draws: number,
    totalExpGained: number,
    sessionFights: number,
}
```

### localStorage: `hexlash_autofight_history`

```javascript
// autoFightState.js:44-48
// Массив последних 100 записей боёв:
[{
    id: 'autofight_' + timestamp,
    timestamp: number,
    opponent: string,           // имя противника
    opponentSkin: string,
    result: 'win' | 'lose' | 'draw',
    rounds: number,
    hp1Final: number,
    hp2Final: number,
    expGained: number,          // 10 (win) или 5 (lose/draw)
}]
```

Лимит: **100 записей** (`fightLog.slice(-100)`).

### Синхронизация с сервером

```javascript
// autoFightState.js:425-430
apiClient.post('/fight/save', {
    isWin: fightData.result === 'win',
    isDraw: fightData.result === 'draw',
    roundsPlayed: fightData.rounds,
    totalDamageDealt: 0,        // ⚠️ всегда 0 — урон не передаётся
}, { authRequired: true }).catch(() => {});  // ошибки игнорируются
```

На сервере `POST /fight/save` инкрементирует:
- `pveWins` / `pveLosses` / `pveDraws` (+1)
- `pveTotalFights` (+1)

⚠️ **Fire-and-forget:** ошибки при отправке на сервер игнорируются (`.catch(() => {})`). Если сервер недоступен — бои считаются только локально.

---

## 4. Дневной ресет

### Когда срабатывает

При вызове `init` (загрузка приложения) или `checkAndRunPending` (каждый тик):

```javascript
// autoFightState.js:283-296 (init) и 351-361 (checkAndRunPending)
const today = getTodayDate();  // "YYYY-MM-DD"
if (state.lastFightDate && state.lastFightDate !== today) {
    commit('setFightsToday', 0);
    commit('setWins', 0);
    commit('setLosses', 0);
    commit('setDraws', 0);
    commit('setTotalExpGained', 0);
    commit('setLastFightDate', today);
    commit('setFightLog', []);     // очистка лога
    saveHistory([]);               // очистка localStorage
}
```

### Что сбрасывается

| Поле | Сбрасывается | Новое значение |
|------|-------------|---------------|
| `fightsToday` | Да | 0 |
| `wins` | Да | 0 |
| `losses` | Да | 0 |
| `draws` | Да | 0 |
| `totalExpGained` | Да | 0 |
| `lastFightDate` | Обновляется | Сегодняшняя дата |
| `fightLog` | Очищается | [] |
| `enabled` | **Нет** | Остаётся как есть |
| `sessionFights` | **Нет** | Остаётся как есть |

### Ручная кнопка сброса

⚠️ **Ручной кнопки сброса нет.** Дневной ресет происходит **только автоматически** при смене даты. В UI есть только кнопка "View Fight Log" — нет кнопки очистки лога или сброса счётчиков.

Есть action `clearHistory`, но он **не вызывается** ни из какого UI-компонента:
```javascript
clearHistory({ commit }) {
    commit('setFightLog', []);
    saveHistory([]);
}
```

---

## 5. AutoFightStatus UI

### Что показывает

Компонент `AutoFightStatus.vue` — карточка состояния автобоя:

| Элемент | Данные | Источник |
|---------|--------|----------|
| Заголовок | "AUTO FIGHT ACTIVE" (i18n) | `t.autoFight.lblAutoFightActive` |
| Таймер | `MM:SS` до следующего боя | Вычисляется из `nextFightAt - now` |
| Бои сегодня | Число | `fightsToday` |
| Победы | Зелёное число | `wins` |
| Поражения | Красное число | `losses` |
| "Останавливается..." | Жёлтый мигающий текст | `stoppingAfterCurrent` |
| Кнопка "View Fight Log" | Навигация на `/arena/autofight-log` | — |

### Обновление в реальном времени

```javascript
// AutoFightStatus.vue:55-71
onMounted(() => {
    // Проверка пропущенных боёв при монтировании
    if (isEnabled.value) {
        store.dispatch('autoFight/checkAndRunPending');
    }

    // Таймер обновления каждую секунду
    timerInterval = setInterval(() => {
        now.value = Date.now();

        // Триггер автобоя когда таймер дошёл до 0
        if (isEnabled.value && nextFightAt.value && now.value >= nextFightAt.value && !fightTriggered) {
            fightTriggered = true;
            store.dispatch('autoFight/checkAndRunPending')
                .then(() => { fightTriggered = false; });
        }
    }, 1000);
});
```

### Формат таймера

```javascript
// AutoFightStatus.vue:83-90
const timeDisplay = computed(() => {
    if (!nextFightAt.value) return '--:--';
    const diff = Math.max(0, Math.ceil((nextFightAt.value - now.value) / 1000));
    if (diff <= 0) return '--:--';
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
});
```

Пример: `59:42`, `0:05`, `--:--` (нет следующего боя).

### Защита от двойного срабатывания

```javascript
let fightTriggered = false;
// Ставится true перед dispatch, false после завершения
// watch на nextFightAt сбрасывает флаг при новом расписании
watch(nextFightAt, () => { fightTriggered = false; });
```

### Блокировка при ручном бое

Если идёт ручной бой (`fightPhase === 'fighting' || 'coach'`), автобой **не запускается** — `checkAndRunPending` просто переносит `nextFightAt` в будущее:

```javascript
// autoFightState.js:375-383
const fightPhase = rootGetters['fight/getFightPhase'];
if (fightPhase === 'fighting' || fightPhase === 'coach') {
    if (state.nextFightAt && now >= state.nextFightAt) {
        commit('setNextFightAt', now + getRandomInterval());
    }
    return;
}
```
