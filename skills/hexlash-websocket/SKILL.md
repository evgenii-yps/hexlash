---
name: hexlash-websocket
description: WebSocket-протокол Hexlash — real-time коммуникация. Триггерится на WebSocket, ws, real-time, матчмейкинг, matchmaking, challenge, fight message, dice_roll, coach_choice, ping, pong, MatchFoundMsg, broadcast, online status, reconnect, socket, spectate, punch batch. Грузить вместе с hexlash-dev. Для PvP боя — hexlash-combat. Для backend — hexlash-api. Для UI — hexlash-vue.
---

# hexlash-websocket — WebSocket Protocol

## Главное правило

WebSocket-протокол — **контракт между фронтом и бэком**. Любое изменение требует синхронной правки обеих сторон + обновления таблицы в CLAUDE.md. Запрещено добавлять "временное" сообщение только на одной стороне.

---

## Архитектура

- **Backend WS:** библиотека `ws`, тот же HTTP-сервер что Express (shared port)
- **Точка входа:** `/backend/src/index.js` поднимает WebSocket поверх httpServer
- **Аутентификация:** JWT в protocol при handshake (`Bearer_<token>`), валидируется до регистрации клиента. Без валидного токена — connection отклонён.
- **Handlers:**
  - `/backend/src/websocket/handler.js` — общий: punches, achievements, challenges, matchmaking
  - `/backend/src/websocket/pvpHandler.js` — PvP бой (dice_roll, coach_choice, round messaging)
- **Frontend клиент:** `/src/core/websocket/`
- **Vuex модуль:** `webSocketState` — connection status, real-time messages
- **Heartbeat:** ping каждые `WS_PING_INTERVAL_MS` (30s), pong timeout `WS_PONG_TIMEOUT_MS` (10s)

---

## Контракт сообщений

Сообщения сериализуются в JSON. Формат:
```json
{ "type": "MessageTypeName", ...payload }
```

Имена: **PascalCase для legacy** (`MatchFoundMsg`, `PunchInfoRequestMsg`) и **snake_case для новых** (`challenge_send`, `dice_roll`). Исторически сложилось — **не унифицировать** без явного запроса. Новые сообщения — snake_case.

**Полная карта сообщений → CLAUDE.md секция "WebSocket Protocol"** (источник правды).

---

## Категории сообщений

| Категория | Назначение | Файл-обработчик |
|-----------|------------|-----------------|
| Punches | Rate-limit info, batch submit | `handler.js` |
| Fight tickets (legacy) | Старый flow создания боя | `handler.js` |
| Friend challenges | Вызов друга на PvP, accept/decline | `handler.js` |
| Matchmaking | Очередь PvP, поиск соперника | `handler.js` |
| PvP combat | Ready, dice, coach, round, end | `pvpHandler.js` |
| Achievements | Авто-награды (punch milestones) | `handler.js` |
| Errors | Стандартный ErrorMsg | оба |

---

## Friend Challenge Flow

```
Player A                    Server                    Player B
    |                         |                         |
    |-- challenge_send ------>|                         |
    |                         |-- (check online) ------>|
    |<-- challenge_sent ------|                         |
    |                         |-- challenge_received -->|
    |                         |                         |
    |                         |     (10s auto-decline)  |
    |                         |                         |
    |                         |<-- challenge_accepted --|
    |                         |-- (create match via     |
    |                         |    pvpMatchManager)     |
    |<-- challenge_start -----|-- challenge_start ----->|
    |                         |                         |
    | (navigate to /fight?mode=pvp&matchId=...)         |
```

Если B жмёт decline или таймаут → `challenge_declined`. На ошибке (B offline, B в бою) → `challenge_error`.

---

## PvP Combat Flow

```
1. MatchFoundMsg / challenge_start → оба знают matchId
2. pvp_ready          → оба шлют колоду
3. fight_start        ← сервер подтверждает, бой начинается
4. round_result       ← каждый раунд обоим
5. dice_available     ← кубик off cooldown (after round 1, cooldown 3)
6. dice_roll          → игрок жмёт
7. dice_rolled        ← эффект + oppHp + killed flag
8. coach_pause        ← пауза на coach (round ≥6, 10s timer)
9. coach_choice       → каждый выбирает attack/defense/position
10. coach_result      ← оба выбрали или таймаут, бой продолжается
11. coach_opponent_ready ← соперник выбрал раньше
12. overdrive_start   ← если раунды > MAX_ROUNDS (кубик отключён)
13. fight_end         ← winner, reason, XP
```

**Важно:** PvP fight state на клиенте **очищается из localStorage** на `fight_end` через `clearSavedFight` — иначе stale restore.

---

## Matchmaking Flow

1. `MatchmakingStartMsg` с колодой + скином → попадает в очередь
2. `MatchmakingQueueMsg` ← позиция / поиск
3. Найден соперник → `MatchFoundMsg` обоим (opponent data + matchId + skin)
4. Отмена → `MatchmakingCancelMsg` → `MatchmakingCancelledMsg`
5. После `MatchFoundMsg` → PvP combat flow

---

## Punches (rate-limit batch)

- Клиент батчит таппы → `PunchBatchRequestMsg` каждые `BATCH_SEND_INTERVAL_MS` (11s)
- Сервер валидирует: `PUNCH_MAX_PER_BATCH=10000`, `PUNCH_MAX_PER_INTERVAL=10000` за час
- Ответ: `UserResponseMsg` или `ErrorMsg`
- На milestones (100, 1k, 5k, 10k) → `AchievementResponseMsg` автоматически
- `PunchInfoRequestMsg` → `PunchInfoResponseMsg` — текущий лимит

---

## Server-pushed сообщения (без request)

Сервер присылает **без явного запроса** — клиент должен иметь обработчики:
- `challenge_received` — входящий вызов
- `MatchFoundMsg` — найден соперник
- `dice_available` — кубик off cooldown
- `coach_pause` — пауза на coach
- `coach_opponent_ready` — соперник уже выбрал
- `round_result`, `overdrive_start`, `fight_end` — из боя
- `match_cancelled` — матч отменён (ready_timeout)
- `AchievementResponseMsg` — авто-награда
- `ErrorMsg` — ошибка

---

## Heartbeat и reconnect

- Сервер ping каждые `WS_PING_INTERVAL_MS` (30s)
- Pong timeout: `WS_PONG_TIMEOUT_MS` (10s) — нет pong → сервер закрывает
- Клиент reconnect с exponential backoff (10s → 20s → 40s → ... → max 300s, ±20% jitter)
- При reconnect: старый socket помечается `_replaced`, close handler не триггерит PvP disconnect
- Новый socket ре-биндится к активному матчу если есть

---

## Запрещено

- Открывать WebSocket напрямую из Vue компонента — через `/src/core/websocket/`
- Добавлять сообщение только на одной стороне
- Менять имя существующего сообщения без обеих сторон + CLAUDE.md
- Унифицировать PascalCase legacy и snake_case новые без запроса
- Слать сообщения без `type` поля
- Доверять данным с клиента без серверной валидации (особенно PvP)
- Не очищать `hexlash_pvp` localStorage на `fight_end`
- Игнорировать ping/pong — утечка соединений
- Создавать второй WebSocket-сервер на отдельном порту

---

## Чеклист изменения протокола

- [ ] Определена сторона: клиент / сервер / обе
- [ ] Если обе — обе изменены в одном коммите
- [ ] Имя сообщения: snake_case для нового
- [ ] Добавлен обработчик на принимающей стороне
- [ ] Обновлена таблица "WebSocket Protocol" в CLAUDE.md
- [ ] Если PvP combat — синхронно с `hexlash-combat`
- [ ] Auth защита проверена
- [ ] Heartbeat не сломан
- [ ] Reconnect-сценарий работает
- [ ] Backward compatibility учтена

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Точку входа WS | `/backend/src/index.js` |
| Общие сообщения (challenges, matchmaking, punches) | `/backend/src/websocket/handler.js` |
| PvP combat сообщения | `/backend/src/websocket/pvpHandler.js` |
| Очередь матчмейкинга | `/backend/src/services/matchmaking.js` |
| Lifecycle PvP матча | `/backend/src/services/pvpMatchManager.js` |
| Симуляция PvP раундов | `/backend/src/services/pvpCombatEngine.js` |
| Vuex модуль соединения | `/src/core/state/modules/webSocketState.js` |
| Клиентская обвязка | `/src/core/websocket/` |
| Полная таблица сообщений | CLAUDE.md "WebSocket Protocol" |
| Friend Challenge Flow | CLAUDE.md "Friend Challenge Flow" |
| Backend config (intervals, timeouts) | `/backend/src/config.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-combat` — для PvP combat flow и dice/coach
- `hexlash-api` — для backend изменений и JWT auth
- `hexlash-vue` — для UI компонентов, потребляющих WS
