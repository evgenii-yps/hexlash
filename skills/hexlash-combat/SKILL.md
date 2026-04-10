---
name: hexlash-combat
description: Боевая система Hexlash — PvE, PvP, Auto Fight. Триггерится на бой, fight, combat, дамаг, damage, кубик, dice, коуч, coach, архетип, archetype, PvE, PvP, Auto Fight, overdrive, opponent, deck, модуль, module, AI strategy, combatEngine, раунд, round, HP, урон, emergency, heal, adrenaline, shield, blind, rage, crit. Грузить вместе с hexlash-dev. Для UI боя — hexlash-vue + hexlash-design. Для PvP — hexlash-websocket. Для баланса — hexlash-gamedesign.
---

# hexlash-combat — Combat System

## Главное правило

PvE и PvP — **разные системы**, живут в разных местах, имеют намеренные расхождения. Перед изменениями:
1. Понять, какой режим затрагивается
2. Прочитать соответствующий движок целиком
3. Если изменение касается обоих режимов — менять оба синхронно и явно сказать в отчёте
4. **Не "унифицировать" PvE и PvP без явного запроса** — расхождения by design

---

## Три режима — обзор

| Режим | Где живёт логика | Авторитет | Сеть |
|-------|------------------|-----------|------|
| PvE | Фронтенд (`/src/core/engine/`) | Клиент | Нет |
| PvP | Бэкенд (`/backend/src/services/pvp*`) | Сервер | WebSocket |
| Auto Fight | Фронтенд (тот же combatEngine) + sync на сервер | Клиент | HTTP POST /fight/save |

---

## Файлы (карта кода)

**Frontend (PvE + Auto Fight):**
- `/src/core/engine/combatEngine.js` — симуляция раунда (action-based: attack/defense/position, dodge/crit)
- `/src/core/engine/aiStrategy.js` — логика AI (приоритеты архетипов, coach boost, dice preferences)
- `/src/core/engine/archetypes.js` — 6 архетипов с приоритетами и dice preferences
- `/src/core/engine/opponentGenerator.js` — генерация случайного оппонента
- `/src/core/state/modules/cardFightState.js` — Vuex state активного боя (rounds, HP, dice, coach, playerModules), persist в localStorage
- `/src/views/CardFightView.vue` — главный экран боя (PvE + PvP)
- `/src/components/AiTrainerAnalysis.vue` — пост-фактум AI анализ боя

**Backend (PvP):**
- `/backend/src/services/pvpCombatEngine.js` — симуляция раунда PvP (без actions/архетипов как priorities, чистый move damage + speed order)
- `/backend/src/services/pvpMatchManager.js` — lifecycle PvP матча
- `/backend/src/services/matchmaking.js` — очередь матчмейкинга
- `/backend/src/websocket/pvpHandler.js` — WS обработка PvP сообщений (dice_roll, coach_choice)
- `/backend/src/config.js` — константы боя (см. секцию ниже)

**Backend (Agent Combat — Club Mode):**
- `/backend/src/services/agentCombatEngine.js` — симуляция боя агентов (гибрид PvE actions + PvP archetype modifiers)
- `/backend/src/services/agentFightService.js` — оркестратор (PvE training, ranked, free arena)
- `/backend/src/services/agentScheduler.js` — автобой агентов (30s tick)
- `/backend/src/data/archetypes.js` — бэкенд-копия архетипных приоритетов

---

## Игровые константы (где источник правды)

- **Frontend:** `/src/core/constants.js`
- **Backend:** `/backend/src/config.js`
- **Они должны совпадать** для значений видимых игроку: MAX_HP=100, MAX_ROUNDS=10, BASE_DAMAGE=15, POSITION_BONUS=5, DICE_COOLDOWN_ROUNDS=3, EMERGENCY_HP_THRESHOLD=30, COACH_MIN_ROUND=6, COACH_BOOST_ROUNDS=4, MIN_DECK_SIZE=4, MAX_DECK_SIZE=8
- **При изменении любой константы боя** — менять в обоих файлах одновременно
- **Backend-only:** SLOT_WEIGHTS, ARCHETYPE_MODIFIERS, COUNTDOWN_MS, ROUND_ANIMATION_MS, DICE_PAUSE_TIMEOUT_MS, COACH_PAUSE_TIMEOUT_MS

---

## Колода и модули

- Размер колоды: 4-8 модулей (MIN_DECK_SIZE / MAX_DECK_SIZE)
- 18 движений в `/src/data/moves.js`, по 3 ветки в `/src/data/branches.js`: speed, power, technique
- Каждое движение: `{ id, name, branch, description, damage[5], speed[5] }` — массивы по уровням 1-5
- Игрок собирает колоду в `/src/views/DeckBuilderView.vue`
- В бой колода передаётся вместе с `playerModules` (выбранные архетипы)

---

## Архетипы (6 штук)

Файл: `/src/core/engine/archetypes.js` (frontend) и `ARCHETYPE_MODIFIERS` в `/backend/src/config.js`.

| Архетип | PvE поведение (priorities) | PvP модификатор |
|---------|---------------------------|-----------------|
| Predator | Агрессия, attack-приоритет | dmgBonus + crit 8% |
| Sentinel | Защита, defense-приоритет | incomingReduction |
| Ghost | Уклонение | dodge 8% |
| Analyst | Адаптация | dodge 2%, crit 2% |
| Maverick | Хаос | dodge 4% |
| Juggernaut | Давление | dmgBonus + crit 3% |

**Слот-веса:** SLOT_WEIGHTS = [0.5, 0.3, 0.2] — первый слот 50%, второй 30%, третий 20%.

Точные значения — в `archetypes.js` и `config.js`. **Это источник правды**, не копировать в SKILL.md.

---

## PvE — как работает

1. Игрок в `PreparationView` → START FIGHT
2. `opponentGenerator.js` создаёт случайного оппонента
3. `combatEngine.js` симулирует раунды
4. Каждый раунд: оба бойца выбирают action (`attack`/`defense`/`position`) через `aiStrategy.js`
5. Action-based матрица: атака vs защита — урон снижен, атака vs позиция — 12% dodge, и т.д.
6. Crit: 10% шанс x1.5 на attack
7. На раунде ≥6 (COACH_MIN_ROUND) — Coach Advice: пауза 15s, игрок выбирает Attack/Defense/Position → +25 priority, длительность COACH_BOOST_ROUNDS=4
8. Кубик доступен после раунда 1, cooldown 3 раунда. Игрок жмёт сам
9. Результат сохраняется через POST `/v1/fight/save`
10. XP: win=10, draw=7, lose=5

---

## PvP — как работает

1. Игрок жмёт PvP в `MatchmakingView` → `MatchmakingStartMsg` через WS → очередь
2. `matchmaking.js` находит соперника → `MatchFoundMsg` обоим
3. Оба переходят в `CardFightView` с `?mode=pvp&matchId=...`
4. Каждый шлёт `pvp_ready` с колодой → `fight_start`
5. `pvpCombatEngine.js` симулирует раунды **на сервере**
6. **PvP отличия от PvE:**
   - Нет actions (attack/defense/position) — оба всегда атакуют
   - Нет coach priority boost через action — coach даёт **процентные бонусы**: `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming) на 4 раунда
   - Архетипы — пассивные модификаторы, не priorities
   - Dodge/crit — из ARCHETYPE_MODIFIERS, не из action-матрицы
7. Кубик: server-controlled. `dice_available` → игрок жмёт → `dice_roll` → `dice_rolled`. Rage/Crit могут убить → `fight_end`
8. Coach Advice: 10s timer (не 15s как PvE), оба игрока выбирают независимо, бой паузится для обоих

---

## Кубик — единая система (PvE и PvP)

Доступен после раунда 1, cooldown 3 раунда. 6 эффектов случайно:

| Эффект | Действие | Мгновенный |
|--------|----------|------------|
| Heal | +15 HP | Да |
| Adrenaline | x2 ATK на 1 раунд | Нет |
| Shield | Полная блокировка на 1 раунд | Нет |
| Blind | Гарантированный промах противника на 1 раунд | Нет |
| Rage | -20 HP мгновенно | Да |
| Crit | -30 HP мгновенно | Да |

- Rage и Crit **могут убить**
- Кубик **отключён в Overdrive**

---

## Overdrive

- Триггер: бой длится дольше MAX_ROUNDS (10)
- WebSocket: `overdrive_start`
- Кубик отключён, бой идёт до победителя
- Отдельная UI-индикация в `CardFightView`

---

## Auto Fight

- Toggle на `PreparationView`
- Использует тот же `combatEngine.js` + `aiStrategy.js` что и PvE
- Бой каждые 10 минут (AUTO_FIGHT_MIN_INTERVAL = 600000)
- Лимиты: 144 боя/день, 288/сессия
- При возврате на вкладку — догоняет пропущенные бои (catch-up)
- Push notifications через Notification API
- Daily auto-reset: новый день → очищается лог + счётчики
- **Sync на сервер:** результаты через POST `/v1/fight/save`
- State и история: localStorage only (`hexlash_clubmode_state`, `hexlash_clubmode_history`)

---

## AI Trainer (пост-фактум анализ боя)

- Компонент: `AiTrainerAnalysis.vue` на экране результатов в `CardFightView`
- Работает для PvE и PvP
- POST `/v1/ai/analyze-fight` → backend → Anthropic Claude API
- Возвращает 4 секции: Fight Summary, What You Did Well, What Went Wrong, Advice
- Feature flag: `AI_TRAINER_ENABLED` в backend config
- Graceful degradation на ошибке
- Для деталей промптов и Claude API — грузить `hexlash-ai`

---

## Persist и восстановление

- **PvE fight state** → localStorage через `cardFightState`, восстанавливается при перезагрузке
- **PvP fight state** → очищается из localStorage на `fight_end` через action `clearSavedFight` (предотвращает stale restore)
- **Прогрессия** (moves, XP, taps, deck, playerModules) → debounced PUT `/v1/user/progression` (3s), сервер = source of truth
- **Auto Fight state/history** — localStorage only (результаты синкаются через `/fight/save`)

---

## WebSocket сообщения боя (краткая ссылка)

Только перечисление, детали — в `hexlash-websocket`:
- **Запросы:** `pvp_ready`, `dice_roll`, `coach_choice`, `MatchmakingStartMsg`, `MatchmakingCancelMsg`
- **Ответы:** `fight_start`, `round_result`, `dice_available`, `dice_rolled`, `coach_pause`, `coach_result`, `coach_opponent_ready`, `overdrive_start`, `fight_end`, `match_cancelled`

---

## Намеренные расхождения PvE ↔ PvP (**НЕ "чинить"**)

| Механика | PvE | PvP | Статус |
|----------|-----|-----|--------|
| Архетипы | 6 архетипов через priorities в ModuleAIStrategy | Пассивные модификаторы (dmgBonus, incomingReduction, dodge, crit) | **By design** |
| Actions | attack/defense/position каждый раунд | Нет — оба всегда атакуют | **By design** |
| Dodge | 12% при position vs attack | Архетипный (Ghost 8%, Analyst 2%, Maverick 4%) | **By design** |
| Crit | 10% шанс x1.5 на attack | Архетипный (Predator 8%, Juggernaut 3%, Analyst 2%) | **By design** |
| Coach effect | +25 priority для action | Процентные бонусы на dmg/incoming | **By design** |
| Coach timer | 15s | 10s | **By design** |
| Dice | Все 6 эффектов | Те же 6 эффектов | Унифицировано |

---

## Запрещено

- "Унифицировать" PvE и PvP без явного запроса
- Менять константу боя только в одном файле (фронт без бэка или наоборот) для значений, которые должны совпадать
- Делать кубик доступным в Overdrive
- Делать кубик доступным в раунде 1 или ломать cooldown 3 раунда
- Триггерить Coach до COACH_MIN_ROUND=6
- Менять формулы урона без чеклиста баланса (грузить `hexlash-gamedesign`)
- Применять PvE логику actions к PvP движку или наоборот
- Не очищать PvP fight state на `fight_end` (stale restore)

---

## Чеклист изменений в боевой системе

- [ ] Определён режим: PvE / PvP / Auto Fight / все три
- [ ] Прочитан соответствующий движок целиком
- [ ] Если меняется константа боя — синхронизирована между `/src/core/constants.js` и `/backend/src/config.js`
- [ ] Если меняется баланс — прочитан `hexlash-gamedesign`
- [ ] Если меняется WS-протокол — прочитан `hexlash-websocket`, обновлены обе стороны
- [ ] Если меняется UI боя — прочитан `hexlash-design`
- [ ] Auto Fight по-прежнему синкается на сервер
- [ ] PvP fight state очищается на `fight_end`
- [ ] AI Trainer не сломан (graceful degradation)
- [ ] Обновлён CLAUDE.md если задеты публичные части

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-vue` — для UI боя на фронте
- `hexlash-websocket` — для PvP протокола
- `hexlash-api` — для backend endpoints (fight, ai)
- `hexlash-gamedesign` — для баланса и формул
- `hexlash-ai` — для AI Trainer и Claude API
- `hexlash-design` — для UI боя
