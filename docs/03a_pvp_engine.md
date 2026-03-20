# PvP боевой движок

Документация серверного PvP движка и его отличий от клиентского PvE.

**Файлы:**
- `backend/src/services/pvpCombatEngine.js` — серверный движок PvP
- `backend/src/services/pvpMatchManager.js` — менеджер матчей
- `backend/src/websocket/pvpHandler.js` — обработка WS-сообщений PvP
- `backend/src/config.js` — серверные константы
- `src/core/state/modules/pvpState.js` — клиентский Vuex-модуль PvP

---

## 1. PvP движок vs PvE

### Архитектурное отличие

| Аспект | PvE (клиент) | PvP (сервер) |
|--------|-------------|-------------|
| **Где работает** | Браузер (`combatEngine.js`) | Node.js (`pvpCombatEngine.js`) |
| **Модуль** | ES Module (import/export) | CommonJS (require) |
| **AI** | `ModuleAIStrategy` выбирает action | Нет AI — оба игрока реальные |
| **Действия** | 3 действия: attack/defense/position | ⚠️ **Нет выбора действий** — оба всегда атакуют |
| **Расчёт урона** | `calcAttackDamage` с dodge/crit/block | Прямой урон из `moves.js` + эффекты dice |
| **Dice** | Ручной бросок, 6 эффектов на 1 раунд | Ручной бросок, эффекты с **длительностью** (1-2 раунда) |
| **Coach** | Игрок выбирает буст действия (+25 приоритет) | Оба игрока решают принять/отклонить, буст = эффект `adrenaline` на 4 раунда |
| **Emergency** | Автоматический протокол (medkit/adrenaline/shield) | ⚠️ **Не реализован** в PvP движке |
| **Таймер раунда** | `ROUND_ANIMATION_MS` (1500ms) между раундами | `ROUND_ANIMATION_MS` (1500ms) через `setTimeout` |
| **Persistence** | localStorage | PostgreSQL (Prisma) |

### Ключевые расхождения

#### ⚠️ Нет системы действий (attack/defense/position)

В PvE каждый раунд AI выбирает `attack`, `defense` или `position`. В PvP движке **нет никакого выбора действий** — оба игрока автоматически атакуют каждый раунд. Раунд = обмен ударами приёмами из колод.

```javascript
// pvpCombatEngine.js:127-231 — simulateRound
// Нет вызова selectAction(), нет action1/action2
// Сразу damage из moveData:
let damage1 = moveData1.damage[level1 - 1] * overdriveMult;
let damage2 = moveData2.damage[level2 - 1] * overdriveMult;
```

#### ⚠️ Другая формула урона

PvE: `(baseDmg + attackBoost) * mult` с шансами dodge (22%), crit (10%), block (60%)
PvP: прямой урон из `moves.js` + множители от активных эффектов dice, **без** dodge/crit/block

```javascript
// pvpCombatEngine.js:169-170
damage1 = this.applyEffects(damage1, this.player1, this.player2);
damage2 = this.applyEffects(damage2, this.player2, this.player1);
```

#### ⚠️ Dice эффекты отличаются

| Эффект | PvE (клиент) | PvP (сервер) |
|--------|-------------|-------------|
| `heal` | +15 HP, мгновенно | +20 HP, мгновенно |
| `adrenaline` | `attackMultiplier = 2` (1 раунд) | ×1.3 урона, **2 раунда** |
| `shield` | Полный блок 1 атаки (1 раунд) | ×0.5 входящего урона, **2 раунда** |
| `blind` | Противник промахивается (1 раунд) | 50% шанс промаха, **2 раунда** |
| `rage` | Мгновенно -20 HP противнику | ×1.5 урона, **2 раунда** |
| `crit` | Мгновенно -30 HP противнику | ×2 урона, **1 раунд** |

#### ⚠️ Coach работает иначе

PvE: игрок выбирает `attack`/`defense`/`position` → +25 к приоритету AI на 4 раунда
PvP: оба игрока получают совет, принимают/отклоняют → принявший получает эффект `adrenaline` на 4 раунда

```javascript
// pvpCombatEngine.js:393-396
applyCoachAdvice(player) {
    player.activeEffects.push({ type: 'adrenaline', roundsLeft: COACH_BOOST_ROUNDS }); // 4
}
```

Совет зависит от HP:
```javascript
// pvpCombatEngine.js:386-391
generateCoachAdvice(player) {
    if (player.hp <= EMERGENCY_HP_THRESHOLD) {  // <= 30
        return { type: 'use_dice', message: 'coach_advice_low_hp' };
    }
    return { type: 'keep_fighting', message: 'coach_advice_keep_going' };
}
```

### Серверная симуляция — что считает сервер

Сервер (`PvPCombatEngine`) полностью управляет боем:

1. **HP обоих игроков** — авторитативно на сервере
2. **Урон** — считается из `moves.js` на сервере
3. **Speed / порядок ударов** — определяется сервером
4. **Dice эффекты** — применяются и тикают на сервере
5. **Результат** — определяется сервером
6. **ELO рейтинг** — обновляется сервером

Клиент получает только **результаты** через WebSocket и отображает их.

### Speed-based KO (одинаково)

```javascript
// pvpCombatEngine.js:190-200
if (firstAttacker === 'player1') {
    this.player2.hp = Math.max(0, this.player2.hp - firstDamage);
    if (this.player2.hp > 0) {
        this.player1.hp = Math.max(0, this.player1.hp - secondDamage);
    }
} else { /* аналогично */ }
```

Как и в PvE — быстрый бьёт первым, может нокаутировать до ответного удара.

---

## 2. WebSocket протокол боя

### Полная последовательность сообщений

```
КЛИЕНТ                          СЕРВЕР                          КЛИЕНТ
  P1                                                              P2
   |                                                               |
   |-- MatchmakingStartMsg --->                                    |
   |                           <--- MatchmakingQueueMsg           |
   |                                                   MatchmakingStartMsg --|
   |                           MatchmakingQueueMsg --->            |
   |                                                               |
   |                     [матч найден]                             |
   |                                                               |
   |<-- MatchFoundMsg ------                                       |
   |                           ------ MatchFoundMsg -->            |
   |                                                               |
   |-- pvp_ready (deck) --->                                       |
   |                                            pvp_ready (deck) --|
   |                                                               |
   |                     [оба ready → start]                       |
   |                                                               |
   |<-- fight_start --------                                       |
   |                           -------- fight_start -->            |
   |                                                               |
   |                     [COUNTDOWN_MS = 3000ms]                   |
   |                                                               |
   |           === ЦИКЛ РАУНДОВ (1..TOTAL_ROUNDS) ===             |
   |                                                               |
   |<-- dice_available -----  (если кулдаун прошёл)               |
   |                           ----- dice_available -->            |
   |                                                               |
   |-- dice_roll ---------->                                       |
   |<-- dice_rolled --------                                       |
   |                                                               |
   |                     [simulateRound]                           |
   |                                                               |
   |<-- round_result -------                                       |
   |                           ------- round_result -->            |
   |                                                               |
   |                     [ROUND_ANIMATION_MS = 1500ms]             |
   |                                                               |
   |           === РАУНД >= COACH_MIN_ROUND (6) ===               |
   |                                                               |
   |<-- coach_pause --------                                       |
   |                           -------- coach_pause -->            |
   |                                                               |
   |-- coach_choice -------->                                      |
   |                                          coach_choice --------|
   |                                                               |
   |                     [оба ответили ИЛИ таймаут]               |
   |                                                               |
   |<-- coach_result -------                                       |
   |                           ------- coach_result -->            |
   |                                                               |
   |           === КОНЕЦ БОЯ ===                                   |
   |                                                               |
   |<-- fight_end ----------                                       |
   |                           ---------- fight_end -->            |
```

### Обработка в pvpHandler.js

```javascript
// pvpHandler.js:13-68 — три типа сообщений
switch (data.type) {
    case 'pvp_ready':     // Игрок готов, отправляет колоду
    case 'dice_roll':     // Игрок бросает кубик
    case 'coach_choice':  // Игрок принимает/отклоняет коуча
}
```

⚠️ В `handler.js:118` для PvP сообщений используется `dice_choice`, но в `pvpHandler.js:53` обрабатывается `dice_roll`. Расхождение в именовании — `handler.js` маршрутизирует `dice_choice` в pvpHandler, но pvpHandler ожидает `dice_roll`.

### pvp_ready — старт боя

```javascript
// pvpHandler.js:15-50
case 'pvp_ready': {
    // Привязать колоду и сокет к игроку
    match.player1.deck = data.deck;    // [{id, level}, ...]
    match.player1.socket = ws;
    match.player1.ready = true;
    // Когда оба ready → match.start()
    if (match.player1.ready && match.player2.ready) {
        match.start();
    }
}
```

### Таймауты

| Константа | Значение | Где используется |
|-----------|----------|-----------------|
| `COUNTDOWN_MS` | 3000 ms | Пауза перед первым раундом (`pvpCombatEngine.js:73-75`) |
| `ROUND_ANIMATION_MS` | 1500 ms | Пауза между раундами (`pvpCombatEngine.js:228-230`) |
| `DICE_PAUSE_TIMEOUT_MS` | 10000 ms | ⚠️ **Объявлен в config.js, но НЕ используется** в pvpCombatEngine — dice бросается мгновенно без паузы |
| `COACH_PAUSE_TIMEOUT_MS` | 10000 ms | Таймаут ожидания выбора обоих игроков (`pvpCombatEngine.js:344-348`) |

### Дисконнект

```javascript
// pvpCombatEngine.js:441-465
onPlayerDisconnect(odId) {
    this.status = 'finished';
    // Победитель = оставшийся игрок
    const winner = odId === this.player1.odId ? this.player2 : this.player1;
    // Отправить fight_end с reason: 'opponent_disconnected'
    this.sendToPlayer(winner, 'fight_end', { ...result, reason: 'opponent_disconnected' });
    this.saveFightResult(result);
}
```

```javascript
// pvpHandler.js:71-77
function handlePvPDisconnect(odId) {
    const match = pvpMatchManager.getMatchByPlayer(odId);
    if (match && match.status !== 'finished') {
        match.onPlayerDisconnect(odId);
        pvpMatchManager.removeMatch(match.matchId);
    }
}
```

Вызывается из `handler.js:73` при событии `ws.on('close')`.

---

## 3. Управление матчем (`pvpMatchManager`)

### Структура

```javascript
// pvpMatchManager.js — Singleton
class PvPMatchManager {
    activeMatches: Map<matchId, PvPCombatEngine>
}
module.exports = new PvPMatchManager();
```

### Жизненный цикл матча

```
1. createMatch(matchId, player1, player2)
   → new PvPCombatEngine(matchId, player1, player2)
   → activeMatches.set(matchId, engine)
   → status = 'waiting'

2. pvp_ready от обоих игроков
   → привязка deck и socket
   → player.ready = true
   → когда оба ready → engine.start()
   → status = 'running'

3. Цикл раундов (автоматический, по таймеру)
   → nextRound() каждые ROUND_ANIMATION_MS
   → simulateRound() → emit('round_result')

4. Coach пауза (раунд >= 6, один раз)
   → status = 'paused_coach'
   → ожидание coach_choice от обоих (или таймаут 10с)
   → resolveCoachPause() → status = 'running'

5. Завершение
   → endFight() → status = 'finished'
   → saveFightResult() → Prisma → PostgreSQL
   → pvpMatchManager.removeMatch(matchId)
```

### Состояние матча на сервере

```javascript
// PvPCombatEngine — полное состояние
{
    matchId: string,
    status: 'waiting' | 'running' | 'paused_coach' | 'finished',
    currentRound: number,
    maxRounds: TOTAL_ROUNDS (12),
    roundResults: [],
    pauseTimer: setTimeout ref,
    pendingChoices: { player1: null, player2: null },

    player1/player2: {
        odId: string,
        username: string,
        deck: [{id, level}, ...],
        hp: number,
        diceUsedRound: number,      // для кулдауна dice
        coachUsed: false,
        coachTriggered: false,
        activeEffects: [{type, roundsLeft}, ...],
        socket: WebSocket,
        ready: boolean,
    }
}
```

### Персистенция результата (`saveFightResult`)

```javascript
// pvpCombatEngine.js:469-561
await prisma.fight.create({
    data: {
        mode: 'pvp',
        matchId, fighterOneId, fighterTwoId,
        player1Id, player2Id,
        player1Hp, player2Hp,
        winner, winnerId,
        reason: 'normal' | 'disconnect',
        rounds, roundLog,
        isCompleted: true,
    },
});
```

### ELO рейтинг

```javascript
// pvpCombatEngine.js:579-594
calculateElo(winnerRating, loserRating, isDraw = false) {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    // Победа:
    winnerNew = Math.round(winnerRating + K * (1 - expected));
    loserNew = Math.round(loserRating + K * (0 - (1 - expected)));
    // Ничья:
    winnerNew = Math.round(winnerRating + K * (0.5 - expected));
    loserNew = Math.round(loserRating + K * (0.5 - (1 - expected)));
}
```

Стандартная формула ELO с K=32, начальный рейтинг 1000.

### XP за PvP

```javascript
// pvpCombatEngine.js:563-577
const BASE_XP = 5;
const WIN_BONUS = 5;
const DRAW_BONUS = 2;
// Победа: 10 XP, Поражение: 5 XP, Ничья: 7 XP
```

### Обновление статистики

При завершении боя обновляются поля в User:
- `rating` (ELO)
- `pvpTotalFights` (+1)
- `pvpWins` / `pvpLosses` / `pvpDraws` (+1)
- `totalFights` (+1)
- `wins` / `losses` / `draws` (+1)

---

## 4. Клиентский Vuex-модуль (`pvpState`)

### Состояние

```javascript
{
    currentPvPFight: null,   // объект текущего боя
    pvpStats: {
        rating: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
    },
    status: 'idle',           // idle | searching | in_fight | finished
    currentMatchId: null,
    pvpFightStatus: 'idle',   // idle | ready | fighting | paused | finished
    opponentInfo: null,
    isPlayer1: false,
}
```

### Лиги (рейтинговые)

```javascript
// pvpState.js:83-91
if (rating >= 3000) → Champion  👑
if (rating >= 2500) → Diamond   💠
if (rating >= 2000) → Platinum  💎
if (rating >= 1500) → Gold      🥇
if (rating >= 1000) → Silver    🥈
else                → Bronze    🥉
```

### ⚠️ Расхождение фронт/бэкенд: расчёт рейтинга

Клиент (`pvpState.js:40-53`):
```javascript
// base = 25, с бонусом/штрафом от разницы рейтингов
const bonus = Math.round(diff / 20);
return Math.max(10, base + bonus);  // победа: min +10
return Math.min(-10, -base + penalty);  // поражение: max -10
```

Сервер (`pvpCombatEngine.js:579-594`):
```javascript
// Стандартная ELO с K=32
```

⚠️ **Разные формулы** — клиент использует упрощённую линейную формулу, сервер — стандартную ELO. Серверная является авторитативной.

### ⚠️ Mock-данные противника

`pvpState.js:22-37` содержит `generateOpponentFighter` с захардкоженными mock-данными:
```javascript
modules: ['Predator', 'Guardian', 'Ghost', ...] // ⚠️ Неправильные имена (не совпадают с ARCHETYPES)
deck: [{ id: 'jab', damage: 8, speed: 9 }, { id: 'cross', ... }] // ⚠️ 'cross' не существует в moves.js
```

Это legacy-код для fallback PvP (без серверного матча). В server-driven PvP (`pvpMatchId`) эти данные не используются.

### localStorage

Ключ: `hexlash_pvp`

Сохраняется: `pvpStats` и `currentPvPFight`.

При загрузке приложения восстанавливаются из localStorage, затем перезаписываются данными с сервера через `restoreFromServer`.
