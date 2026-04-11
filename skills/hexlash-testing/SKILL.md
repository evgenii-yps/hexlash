---
name: hexlash-testing
description: Тестирование, QA и регрессия Hexlash. Триггерится на тест, test, QA, регрессия, regression, дебаг, debug, smoke, E2E, проверка, релизный чеклист, баг, bug, fix, починить, проверить. Грузить вместе с hexlash-dev. Для деплой-проверок — hexlash-deploy. Для бой-регрессии — hexlash-combat. Для UI — hexlash-design.
---

# hexlash-testing — QA & Regression

## Главное правило

Автотесты **минимальные** (4 файла на backend). Основная QA — **ручная smoke/регрессия по чеклистам**. Любое изменение → smoke. Бой/WS/Prisma → полная регрессия. Не полагаться на "локально работает".

---

## Существующие автотесты

**Backend:** `cd backend && npm test` (Node.js `--test` runner)

| Файл | Что тестирует |
|------|--------------|
| `tests/userMigrationService.test.js` | User→Fighter #1 миграция (14 тестов) |
| `tests/beltService.test.js` | Belt system: qualifying wins, belt calc, hexmaster |
| `tests/captainService.test.js` | Captain: setCaptain, atomic swap |
| `tests/captainArenaFlow.test.js` | Captain in arena: PvE/PvP flow |

**Frontend:** автотестов нет.

**Запуск:** `cd backend && npm test`

---

## Уровни проверок

| Уровень | Когда | Объём |
|---------|-------|-------|
| **Smoke** | После нетривиального изменения | 5-10 мин, критические flow |
| **Регрессия** | Перед PR в main / прод-релиз | 20-40 мин, полный чеклист |
| **Hot path** | Изменения в бою / WS / auth / Prisma | Углублённая проверка домена |
| **Backend smoke** | Изменения в API / Prisma | curl + UI |

---

## Smoke-чеклист (~5 мин)

1. **Auth:** login → ok, reload → state сохраняется
2. **Arena → PvE Fight:** START FIGHT → бой до конца → результат сохранён
3. **Training:** тапы работают, счётчик растёт
4. **Profile:** открывается, статы видны
5. **Console:** нет ошибок, Network — нет 4xx/5xx

---

## Полная регрессия

### Auth
- Signup, Login, Logout
- Reset password → 501
- JWT expire / refresh
- Telegram auth (если тестовый bot)

### PvE Fight
- Колода 4-8 модулей, архетипы выбраны
- Бой до конца, все раунды
- Кубик: доступен после round 1, cooldown 3, все 6 эффектов
- Coach: round ≥6, 15s timer, boost 4 раунда
- Overdrive: после round 10, кубик отключён
- Результат: Victory/Defeat/Draw
- XP: win=10, draw=7, lose=5
- AI Trainer Analysis на результатах

### PvP Fight (2 устройства/окна)
- Matchmaking → MatchFoundMsg → оба в Fight
- `pvp_ready` → `fight_start`
- Оба видят одинаковые `round_result`
- Кубик: `dice_available` → `dice_rolled`
- Coach: `coach_pause` 10s, `coach_result`, `coach_opponent_ready`
- Overdrive в PvP
- `fight_end` → `hexlash_pvp` localStorage очищен
- BottomMenu скрыта

### Friend Challenge
- `challenge_send` → `challenge_received` (ChallengeNotification, 10s)
- Accept → `challenge_start` → PvP flow
- Decline / timeout → корректно
- Offline → `challenge_error`

### Club Mode (Agent scheduler — backend)
- Создать агента в `FightClubView` → `CreateAgentView`
- Включить auto-fight для агента в `AgentDetailView` (tactics tab)
- Через ~30s (scheduler tick) проверить: бой произошёл, AgentFightLog записан
- Статистика агента обновилась (wins/losses, XP, belt)
- Daily limit (50 fights/agent/day) соблюдается
- Остановка auto-fight работает (агент переходит в idle)
- Morning Report (`POST /v1/ai/morning-report`) приходит с данными

### Training & Punches
- Батчи каждые 11s
- Achievement milestones (100, 1k, 5k, 10k)
- Звук (если не mute)

### Friends & Clan
- Search, friend request, accept/decline
- Clan create/join/leave
- Online status

### Profile & Skins
- Смена скина (regex валидация)
- Скины в Arena, Matchmaking, Fight
- Тосты: `{{ }}` interpolation

### i18n
- 11 локалей загружаются
- EN fallback на пустых ключах
- DE/RU не ломают вёрстку

### Console & Network
- Нет JS ошибок
- WS соединение стабильно
- Heartbeat ping/pong

---

## Hot path тесты

**Бой:** 3 PvE боя + 1 PvP + кубик/coach в обоих режимах.

**WebSocket:** reconnect (оборвать сеть → восстановить), нет утечек соединений.

**Auth:** login + signup + logout + rate limit (5 login за 15 мин → 429) + JWT_SECRET absent → crash.

**Prisma:** миграция на чистой БД + на БД с данными, cascade delete, данные не теряются.

**UI:** чеклист из `hexlash-design`, 320px, touch ≥44px, 11 локалей.

**i18n:** все ключи в 11 локалях, EN fallback, длинные тексты.

---

## Дебаг — где смотреть

| Симптом | Где искать |
|---------|-----------|
| 401 на запросе | JWT в localStorage, expire, Bearer формат |
| 500 на ручке | backend logs, stack trace |
| WS не подключается | JWT в protocol, `Bearer_<token>`, код 4001 |
| WS отваливается | heartbeat timeout, `_replaced` flag |
| PvP не стартует | оба `pvp_ready`, matchId, pvpMatchManager |
| Кубик не работает | cooldown 3, round ≥1, не Overdrive |
| Coach не триггерится | round ≥6, уже был в этом бою? |
| Прогрессия не сохраняется | debounced PUT 3s, network request |
| Скин не сохраняется | regex на бэке |
| Тостер HTML | `v-html` → `{{ }}` |
| Build падает | terser console drop, обфускация |

---

## Инструменты

- **Frontend:** Chrome DevTools (Console, Network, Application > localStorage)
- **Backend:** stdout/stderr, на проде — K8s pod logs
- **WS:** Network → WS filter
- **БД:** `npx prisma studio` локально
- **Vuex:** Vue DevTools extension
- **Backend тесты:** `cd backend && npm test`

---

## Приоритет автоматизации (TODO — roadmap)

1. **Backend unit:** JWT, HMAC Telegram, skin regex, cascade delete
2. **Backend integration:** auth flow, fight save → stats, friends
3. **Combat engine unit:** PvE/PvP round simulation, кубик 6 эффектов, coach boost
4. **WS integration:** PvP flow end-to-end, reconnect
5. **E2E (Playwright):** login → arena → fight → result, friend challenge

---

## Запрещено

- Релизить без smoke-чеклиста
- Бой/WS/Prisma без полной регрессии
- PvP тестировать в одном окне
- Откатывать Security Hardening для удобства тестов
- Тестировать на production БД
- Хардкодить credentials в код
- Игнорировать console errors при QA

---

## Чеклист перед PR

- [ ] Smoke пройден
- [ ] Hot path если затронут
- [ ] Console чистая
- [ ] Network — нет неожиданных 4xx/5xx
- [ ] Backend тесты: `cd backend && npm test` — pass
- [ ] API изменения → curl примеры в PR
- [ ] WS изменения → обе стороны проверены
- [ ] UI → чеклист `hexlash-design`
- [ ] i18n → 11 локалей
- [ ] CLAUDE.md обновлён
- [ ] PR описывает что тестировалось

---

## Чеклист перед production

- [ ] Полная регрессия на `test.hexlash.com`
- [ ] Релизный чеклист из `hexlash-deploy`
- [ ] Миграции применены и проверены
- [ ] 11 локалей в build
- [ ] Health check 200
- [ ] WS стабильно
- [ ] Backend тесты pass
- [ ] Откат-план готов

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-deploy` — релизные проверки
- `hexlash-combat` — регрессия боя
- `hexlash-websocket` — регрессия WS
- `hexlash-api` — backend smoke
- `hexlash-design` — UI регрессия
- `hexlash-i18n` — проверка локалей
