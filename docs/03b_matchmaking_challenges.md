# Матчмейкинг и челленджи

Документация по подбору соперников и системе вызовов друзей.

**Файлы:**
- `backend/src/services/matchmaking.js` — сервис матчмейкинга
- `backend/src/websocket/handler.js` — WebSocket: challenge_send/accept/decline, matchmaking
- `src/core/state/modules/friendsState.js` — Vuex-модуль друзей и челленджей
- `src/components/pvp/ChallengeNotification.vue` — UI входящего челленджа

---

## 1. Матчмейкинг

### Алгоритм подбора

**По рейтингу.** ⚠️ Гео-матчмейкинг **не реализован** — нет никакого учёта региона/пинга.

```javascript
// matchmaking.js:76-110 — tryFindMatch
for (const [oppId, opponent] of this.queue) {
    if (oppId === odId) continue;
    const ratingDiff = Math.abs(player.rating - opponent.rating);
    const maxRange = Math.max(player.searchRange, opponent.searchRange);
    if (ratingDiff <= maxRange && ratingDiff < bestDiff) {
        bestMatch = opponent;
        bestDiff = ratingDiff;
    }
}
```

Алгоритм:
1. Перебор всех игроков в очереди
2. Сравнение разницы рейтингов с допустимым диапазоном
3. Выбирается ближайший по рейтингу противник
4. Диапазон = `max(searchRange игрока, searchRange противника)`

### Константы матчмейкинга

| Константа | Значение | Описание |
|-----------|----------|----------|
| `SEARCH_RANGE_INITIAL` | 300 | Начальный диапазон поиска по рейтингу |
| `SEARCH_RANGE_STEP` | 100 | Расширение диапазона за шаг |
| `SEARCH_RANGE_MAX` | 1000 | Максимальный диапазон |
| `SEARCH_EXPAND_INTERVAL_MS` | 5000 | Интервал расширения (5 сек) |
| `SEARCH_TIMEOUT_MS` | 120000 | Таймаут поиска (2 мин) |

### Расширение поиска со временем

```
0с  → диапазон 300 (±300 рейтинга)
5с  → диапазон 400
10с → диапазон 500
15с → диапазон 600
...
35с → диапазон 1000 (максимум)
...
120с → таймаут, игрок удаляется из очереди
```

Расширение реализовано через `setInterval` для каждого игрока:
```javascript
// matchmaking.js:40-57
const expandTimer = setInterval(() => {
    p.searchRange = Math.min(p.searchRange + SEARCH_RANGE_STEP, SEARCH_RANGE_MAX);
    if (Date.now() - p.searchingSince > SEARCH_TIMEOUT_MS) {
        this.removeFromQueue(player.odId);
    }
}, SEARCH_EXPAND_INTERVAL_MS);
```

### Периодическая проверка

Помимо проверки при добавлении в очередь, сервер каждые 3 секунды пытается найти пары:

```javascript
// handler.js:589-596
setInterval(() => {
    for (const [odId] of matchmaking.queue) {
        const match = matchmaking.tryFindMatch(odId);
        if (match) notifyMatch(match);
    }
}, 3000);
```

### Данные в очереди

```javascript
// matchmaking.js:25-33
entry = {
    odId: string,           // ID пользователя
    username: string,
    rating: number,         // default 1000
    skin: string | null,
    avatarUrl: string | null,
    searchRange: 300,       // расширяется со временем
    searchingSince: Date.now(),
}
```

### WebSocket протокол матчмейкинга

```
Клиент                                Сервер
  |                                      |
  |-- MatchmakingStartMsg ----------->   |
  |   { matchmakingRequest:             |
  |     { username, rating,             |
  |       skin, avatarUrl } }           |
  |                                      |
  |<-- MatchmakingQueueMsg ----------   |
  |   { queueSize: N }                  |
  |                                      |
  |      [ожидание... расширение]        |
  |                                      |
  |<-- MatchFoundMsg ----------------   |
  |   { matchId, opponent:               |
  |     { odId, username, rating,        |
  |       skin, avatarUrl } }            |
  |                                      |
  |          ИЛИ                         |
  |                                      |
  |-- MatchmakingCancelMsg ---------->   |
  |<-- MatchmakingCancelledMsg ------   |
```

### Создание матча при нахождении пары

```javascript
// matchmaking.js:113-136
createMatch(player1, player2) {
    const matchId = `match_${Date.now()}_${random}`;
    // Удалить обоих из очереди
    this.removeFromQueue(player1.odId);
    this.removeFromQueue(player2.odId);
    // Зарегистрировать матч (колоды пока пустые — придут через pvp_ready)
    pvpMatchManager.createMatch(matchId, {
        odId: player1.odId, username: player1.username, deck: []
    }, {
        odId: player2.odId, username: player2.username, deck: []
    });
}
```

⚠️ Колоды (`deck`) при создании матча **пустые** — они передаются позже через `pvp_ready`.

### Что реализовано vs заявлено

| Фича | Статус |
|------|--------|
| Подбор по рейтингу | Реализован |
| Расширение диапазона поиска | Реализован |
| Таймаут 2 мин | Реализован |
| Гео-матчмейкинг | ⚠️ Не реализован |
| Ping-based матчмейкинг | ⚠️ Не реализован |
| Учёт уровня карт / power rating | ⚠️ Не реализован — только ELO рейтинг |

---

## 2. Челленджи (друзья)

### Полный флоу

```
Игрок A (отправитель)                    Сервер                    Игрок B (получатель)
       |                                    |                              |
       |-- challenge_send ----------------->|                              |
       |   { targetUserId, username,        |                              |
       |     rating }                       |                              |
       |                                    |                              |
       |                                    |-- challenge_received ------->|
       |                                    |   { from: { odId, username,  |
       |                                    |     rating }, challengeId }  |
       |                                    |                              |
       |<-- challenge_sent -----------------|                              |
       |   { targetUserId }                 |                              |
       |                                    |                              |
       |              [10 секунд на ответ]                                 |
       |                                    |                              |
       |                                    |<-- challenge_accepted -------|
       |                                    |   { challengerOdId,          |
       |                                    |     challengerUsername,       |
       |                                    |     challengerRating }       |
       |                                    |                              |
       |                     [создание матча через pvpMatchManager]        |
       |                                    |                              |
       |<-- challenge_start ----------------|                              |
       |   { matchId, opponent }            |-- challenge_start ---------->|
       |                                    |   { matchId, opponent }      |
       |                                    |                              |
       |   [оба навигируются на /fight?mode=pvp&matchId=...]              |
```

### Отклонение

```
Игрок B                     Сервер                    Игрок A
   |                           |                          |
   |-- challenge_declined --->|                          |
   |   { challengerOdId }     |                          |
   |                           |-- challenge_declined -->|
   |                           |   { declinedBy }       |
```

### Таймер 10 секунд

**На клиенте отправителя** (`friendsState.js:250-256`):
```javascript
// Автоматическая очистка через 10с
challengeTimeout = setTimeout(() => {
    if (s.challenge.outgoing?.odId === friend.id) {
        commit('clearOutgoingChallenge');
    }
}, 10000);
```

Также в `sendChallenge`: `expiresAt: Date.now() + 10000`

**На клиенте получателя** (`ChallengeNotification.vue:41,108-116`):
```javascript
const CHALLENGE_DURATION = 10;
timer.value = CHALLENGE_DURATION;

function startTimer() {
    timerInterval = setInterval(() => {
        timer.value--;
        if (timer.value <= 0) {
            declineChallenge();  // автоматический отказ
        }
    }, 1000);
}
```

⚠️ **На сервере таймера нет** — сервер не отслеживает истечение челленджа. Таймер только на клиентах.

### Проверка онлайн-статуса

```javascript
// handler.js:414-426
function handleChallengeSend(ws, userId, msg) {
    const targetSocket = clients.get(targetUserId);
    if (!targetSocket) {
        sendMessage(ws, {
            type: 'challenge_error',
            message: 'friend_offline',
        });
        return;
    }
    // ...
}
```

Проверка: есть ли WebSocket-соединение у целевого игрока в `clients` Map.

При accept тоже проверяется:
```javascript
// handler.js:450-458
const challengerSocket = clients.get(challengerOdId);
if (!challengerSocket) {
    sendMessage(ws, { type: 'challenge_error', message: 'challenger_offline' });
    return;
}
```

### Создание матча при accept

```javascript
// handler.js:466-498
// 1. Получить данные принявшего из БД
const acceptor = await prisma.user.findUnique({ where: { id: userId } });

// 2. Создать матч (колоды пустые — придут через pvp_ready)
const matchId = `match_${Date.now()}_${random}`;
pvpMatchManager.createMatch(matchId,
    { odId: challengerOdId, username: challengerUsername, deck: [] },
    { odId: userId, username: acceptorUsername, deck: [] }
);

// 3. Отправить challenge_start обоим
// Challenger:
sendMessage(challengerSocket, {
    type: 'challenge_start',
    matchId,
    opponent: { odId: userId, username: acceptorUsername, rating: acceptorRating }
});
// Acceptor:
sendMessage(ws, {
    type: 'challenge_start',
    matchId,
    opponent: { odId: challengerOdId, username: challengerUsername, rating: challengerRating }
});
```

### Навигация на бой

**Получатель (acceptor)** — в `ChallengeNotification.vue:53-67`:
```javascript
function onChallengeStart(event) {
    const data = event.detail;
    store.commit('pvp/SET_PVP_MATCH', {
        matchId: data.matchId,
        opponent: data.opponent,
        isPlayer1: false,      // acceptor = player2
    });
    router.push({
        path: '/fight',
        query: { mode: 'pvp', matchId: data.matchId },
    });
}
```

**Отправитель (challenger)** — аналогичная логика в обработчике `challenge_start` события (в webSocketState или AppVue), навигация на `/fight?mode=pvp&matchId=...` с `isPlayer1: true`.

### Ошибки челленджа

| Событие | Сообщение | Причина |
|---------|-----------|---------|
| `challenge_error` | `friend_offline` | Целевой игрок не подключён к WS |
| `challenge_error` | `challenger_offline` | Отправитель отключился до accept |
| `challenge_error` | `match_creation_failed` | Ошибка при создании матча в БД |

### UI ChallengeNotification

- **Позиция:** `position: fixed; top: 0; z-index: 9999`
- **Анимация:** slide-down (300ms вход, 200ms выход)
- **Содержимое:** иконка мечей (SVG), имя + рейтинг вызывающего, таймер в секундах
- **Кнопки:** Accept (розовый) / Decline (серый)
- **Слушает события:** `challenge-received`, `challenge-start`, `challenge-sent`, `challenge-declined-response`, `challenge-error`

### Предусловия отправки челленджа

```javascript
// friendsState.js:224-258
sendChallenge({ ... }, friend) {
    if (friend.status === 'offline') return false;   // друг офлайн
    if (s.challenge.outgoing) return false;           // уже есть активный вызов
    // ...
}
```
