# Phase 1 — Дизайн-документ: Migration, Belt System

**Дата:** 9 апреля 2026
**Версия:** 1.0
**Связанные документы:** CLAUDE.md (секции "Club Mode", "Phase 1"), `docs/phase1-parking-list.md`

Источник правды для всех ТЗ Phase 1. Фиксирует архитектурные решения (зафиксированы 9 апреля 2026) в детальной форме: миграция User → Fighter №1, Belt System, deck unification, i18n политика.

---

## Содержание

- [1. Словарь и базовые сущности](#1-словарь-и-базовые-сущности)
- [2. Migration Flow](#2-migration-flow)
- [3. Belt System спецификация](#3-belt-system-спецификация)
- [5. Deck size unification](#5-deck-size-unification)
- [6. i18n политика Phase 1](#6-i18n-политика-phase-1)
- [7. Definition of Done](#7-definition-of-done)
- [8. Открытые вопросы](#8-открытые-вопросы)

---

## 1. Словарь и базовые сущности

### Таблица терминов

| Концепция | В коде (Prisma/backend) | В UI / i18n | Что это |
|-----------|------------------------|-------------|---------|
| Социальная клановая система | Club → Clan (after rename) | Clan | Объединение игроков (существующая система) |
| Команда бойцов одного игрока | FightClub (остаётся в коде) | Club | Ядро Phase 1 — персональный контейнер |
| Один боец | Agent | Fighter | Сущность которая дерётся |

### Правила использования терминов в ТЗ Phase 1

- При первом упоминании "Club" в новом ТЗ — писать "Club (в коде FightClub)"
- Далее по контексту — Club или FightClub
- "Fighter" в i18n значениях и UI, "Agent" в коде Prisma/backend/frontend
- **3 концепции. Не путать.**

---

## 2. Migration Flow

Пошаговый сценарий первого логина пользователя после Phase 1 deploy.

### 2.1. Pre-conditions

Что есть до миграции:
- User с полной progression (taps, freeXP, branchExp, moves, deck, playerModules, skin)
- Может быть FightClub (если игрок заходил в Club Mode prototype)
- Может быть несколько Agent'ов в FightClub (если создавал агентов в prototype)

### 2.2. Migration trigger

- **Где:** backend, при `GET /v1/user/me` после Phase 1 deploy
- **Условие:** User не имеет ни одного Agent в своём FightClub
- **Идемпотентность:** если миграция уже прошла (есть Agent) — не повторяется

### 2.3. Migration steps (внутри $transaction)

**Шаг 1 — Создать FightClub если нет:**
```
getOrCreateFightClub(userId)
FightClub.name = User.login (default)
```

**Шаг 2 — Создать Agent (Fighter №1):**
```
Agent {
  name: User.login + " #1" (или User.login если уникально в рамках FightClub)
  skin: User.skin
  primaryModule: User.progression.playerModules[0]
  secondaryModule: User.progression.playerModules[1]
  tertiaryModule: User.progression.playerModules[2]
  status: 'idle'
  autoFight: false
  belt: 1  // white
  stripe: 0
  winsCurrentStripe: 0
  hexmasterProgress: 0
  fightClubId: FightClub.id
  ownerId: User.id
}
```

**Шаг 3 — Создать AgentTactics:**
```
AgentTactics {
  aggression: 'balanced'
  dicePolicy: 'smart'
  coachPreference: 'auto'
  emergencyThreshold: 30
  restPeriod: 600000
  fightMode: 'pve_training'
  agentId: Agent.id
}
```

**Шаг 4 — Создать AgentProgression с миграцией данных:**
```
AgentProgression {
  moves: transform(User.progression.moves)
    // из { moveId: { level, unlocked } } в [{ moveId, level }]
    // фильтр: только unlocked === true && level > 0
  speedXp: User.progression.branchExp.speed + floor(User.progression.freeXP / 3)
  powerXp: User.progression.branchExp.power + floor(User.progression.freeXP / 3)
  techniqueXp: User.progression.branchExp.technique + floor(User.progression.freeXP / 3)
  deck: User.deck  // без pad'инга, min=3 после deck unification
  agentId: Agent.id
}
```

**Шаг 5 — Обнулить User.freeXP:**
```
User.progression.freeXP = 0
// Сохранить обратно в User.progression Json blob
// Остальные поля User.progression НЕ трогать
```

### 2.4. Post-migration state

- `User.progression` сохраняется с moves, deck, branchExp — **не трогаем**
- Это важно для Research Gate: User остаётся "школой", Agent — "учеником"
- Fighter №1 готов к бою, дека валидна (если у User была валидная)
- freeXP = 0 у User, распределён по веткам Agent'а

### 2.5. Edge cases

| Случай | Решение |
|--------|---------|
| User уже имеет Agent (повторный deploy) | Миграция skip — идемпотентность |
| `User.progression.playerModules` пустой или < 3 | Fallback модулей: `['predator', 'sentinel', 'analyst']` |
| `User.deck` пустой | Agent.deck тоже пустой, но PvP блокирован до сборки деки. Показать onboarding hint |
| `User.skin` null | Fallback `"skin_m_1.png"` |
| `User.progression` null целиком | Создать минимального Agent: пустые moves/deck, default modules. Starter moves (jab, straight, block_strike) добавить автоматически |
| FightClub существует, уже есть агенты | Создать ещё одного Agent (Fighter №1). Существующие агенты не трогаются |

### 2.6. Rollback план

- Миграция в одной `$transaction` → atomic rollback при ошибке
- Если упала на одном пользователе — он остаётся без Agent до следующего GET /user/me
- Логирование: `console.error('[Migration]', userId, error)` для пост-мортема
- Массовый rollback не нужен: миграция per-user, lazy, идемпотентная

---

## 3. Belt System спецификация

### 3.1. Структура поясов

10 поясов × 3 нашивки = 30 ступеней + Hexmaster = 31.

| # | Belt | Name (en) | Name (ru) | Color | CSS var |
|---|------|-----------|-----------|-------|---------|
| 1 | white | White | Белый | #FFFFFF | --hex-belt-white |
| 2 | yellow | Yellow | Жёлтый | #FFD700 | --hex-belt-yellow |
| 3 | orange | Orange | Оранжевый | #FF8800 | --hex-belt-orange |
| 4 | green | Green | Зелёный | #00CC44 | --hex-belt-green |
| 5 | blue | Blue | Синий | #2196F3 | --hex-belt-blue |
| 6 | purple | Purple | Фиолетовый | #9C27B0 | --hex-belt-purple |
| 7 | brown | Brown | Коричневый | #8B4513 | --hex-belt-brown |
| 8 | red | Red | Красный | #FF1744 | --hex-belt-red |
| 9 | black | Black | Чёрный | #1A1A1A | --hex-belt-black |
| 10 | hexmaster | Hexmaster | Хексмастер | --hex-primary | --hex-belt-hexmaster |

Stripe: 0, 1, 2, 3 (max 3 — после 3 stripe → следующий belt, stripe сбрасывается в 0).

### 3.2. Прогрессия — числа побед на нашивку

| Belt | Name | Wins per stripe | Wins per belt (×3) | Total cumulative |
|------|------|-----------------|--------------------|------------------|
| 1 | White | 8 | 24 | 24 |
| 2 | Yellow | 10 | 30 | 54 |
| 3 | Orange | 12 | 36 | 90 |
| 4 | Green | 15 | 45 | 135 |
| 5 | Blue | 20 | 60 | 195 |
| 6 | Purple | 25 | 75 | 270 |
| 7 | Brown | 30 | 90 | 360 |
| 8 | Red | 38 | 114 | 474 |
| 9 | Black | 50 | 150 | 624 |
| 10 | Hexmaster | special | special | — |

**Темп достижения Black Belt:**
- Активный игрок (auto-fight ~144/день, 50% WR, 80% valid после filter): ~10.7 дней
- Casual игрок (5-10 wins/день manual): ~2-3 месяца

### 3.3. Filter качества

Победа над агентом, чей belt < (мой belt - 1), **не считается** для belt прогресса.

```
isBeltProgressValid(myBelt, opponentBelt):
  return opponentBelt >= (myBelt - 1)
```

Примеры:
- Я на Blue (5) → засчитываются победы над Green (4), Blue (5), и выше
- Победы над Orange (3), Yellow (2), White (1) — XP начисляется, belt прогресс **нет**
- White (1): засчитываются победы над любым (нет нижнего фильтра)
- Black (9): засчитываются победы над Red (8), Black (9), Hexmaster (10)

### 3.4. Поражения

- **Не штрафуют** belt прогресс
- Учитываются только в `Agent.losses` статистике
- Для UI: "Win streak" и "Last 5 results" остаются как сейчас
- Belt/stripe никогда не уменьшаются

### 3.5. Hexmaster — финальный пояс

Условие: 5 побед над агентом на Black belt, stripe 3.

```
if (myBelt == 9 AND myStripe == 3):
  if (opponentBelt == 9 AND opponentStripe == 3):
    hexmasterProgress += 1
    if (hexmasterProgress >= 5):
      belt = 10 (Hexmaster)
      stripe = 0
```

Хранение: `hexmasterProgress Int @default(0)` на Agent.
После Hexmaster: дальнейшие победы не повышают — это вершина.

### 3.6. Belt fields в Prisma

**На модели Agent — добавить:**
```
belt                Int       @default(1)
stripe              Int       @default(0)
hexmasterProgress   Int       @default(0)
winsCurrentStripe   Int       @default(0)

@@index([belt, stripe])
```

**На модели Agent — удалить:**
```
elo                 Int       @default(1000)    // заменяется belt/stripe
@@index([elo])
```

**На модели AgentFightLog — удалить:**
```
eloChange           Int       @default(0)
```

**На модели AgentFightLog — добавить:**
```
beltChanged         Boolean   @default(false)
stripeChanged       Boolean   @default(false)
```

### 3.7. UI индикация

- **BeltBadge компонент:** цветной квадрат пояса + 3 точки stripes (заполненные/пустые)
- **Hexmaster:** пульсирующий розовый glow (`--hex-primary`)
- **Прогресс:** "8/8 wins to next stripe" в AgentDetailView Overview tab
- **Belt up:** анимация при обнаружении через polling (beltChanged/stripeChanged флаги)

---

## 4. Captain спецификация

> **REMOVED in Phase −1.** Captain system was fully removed. Active agent for combat is determined by `createdAt` ASC via `fightClubService.getActiveAgent()`. See CLAUDE.md Phase −1 section for details.

---

## 5. Deck size unification

### 5.1. Решение

Min deck size = 3 для всех систем.

### 5.2. Изменения в коде

| Файл | Что менять |
|------|-----------|
| `backend/src/config.js` | `MIN_AGENT_DECK_SIZE: 4 → 3` (или добавить если отсутствует) |
| `backend/src/routes/agent.js` | PUT /agent/:id/deck валидация `deck.length < 4` → `deck.length < 3` |
| Frontend Agent deck builder | Validation 4-8 → 3-8 |

### 5.3. Что НЕ меняется

- User PvE deck max остаётся 5 (исторически, через `isDeckValid` в progressionState)
- PvP deck min остаётся 3 (`config.MIN_PVP_DECK_SIZE` — уже совпадает)
- Combat engine логика: деки из 3 мувов уже работают (циклит `roundNum % deck.length`)

### 5.4. Проверка

В ТЗ #P1-belt-2 Claude Code должен симулировать 10 боёв с `deck=[jab, hook, block_strike]` и убедиться в отсутствии ошибок в `simulateAgentFight`.

---

## 6. i18n политика Phase 1

### 6.1. Текущее состояние

- 11 локалей в проекте
- Базовые секции (menu, auth, profile) — переведены во всех 11
- Club Mode подсекции (134 ключа) — переведены только в en и ru
- Остальные 9 локалей: английский текст для Club Mode

### 6.2. Политика для новых ключей

- Новые i18n ключи добавлять обязательно в **en + ru**
- Остальные 9 локалей: добавлять английский fallback (тот же текст что в en)
- Не нарушение правила "11 локалей" — ключи есть, 9 из них просто английский текст
- Соответствует существующей практике Club Mode раздела

### 6.3. Терминология в значениях

| Было | Станет | Когда |
|------|--------|-------|
| "Agent" | "Fighter" | #P1-rename-4 |
| "Fight Club" | "Club" | #P1-rename-4 |
| "ELO" | "Belt" | #P1-belt-3 |
| "League" | "Belt" | #P1-belt-3 |

### 6.4. After Phase 1

Отдельный followup ТЗ на полные переводы 9 локалей. Не входит в Phase 1 scope.

---

## 7. Definition of Done

Каждое ТЗ Phase 1 считается закрытым только если:

1. Изменения соответствуют решениям из **этого документа**
2. Парковочный список пополнен (если найдены новые долги)
3. CLAUDE.md обновлён в указанных секциях
4. i18n: новые ключи добавлены во все 11 локалей (en+ru native, остальные English fallback)
5. git status показывает только заявленные в ТЗ файлы
6. Pre-report Claude Code соответствует фактическому отчёту

---

## 8. Открытые вопросы

Вопросы, которые не нужно решать сейчас, но которые всплывут позже:

| Вопрос | Когда решать |
|--------|-------------|
| **Promotion fights:** добавить promo-матчи как опциональную механику для belt up (вместо простого counter)? | Phase 2 |
| **Belt decay:** сбрасывается ли belt если agent неактивен N дней? | Phase 2 |
| **Hexmaster honor system:** что делать с игроком, который достиг Hexmaster? Специальные привилегии? Другая лига? | Phase 2 |
| **PvE bot belt scaling:** заменить `generatePveBot(agentElo)` на `generatePveBot(agentBelt, agentStripe)` — как именно масштабировать? | #P1-belt-2 |
