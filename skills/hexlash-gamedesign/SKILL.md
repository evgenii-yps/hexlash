---
name: hexlash-gamedesign
description: Геймдизайн и баланс Hexlash — формулы урона, архетипы, прокачка, экономика. Триггерится на баланс, balance, формула, formula, урон, damage, архетип, archetype, ветка, branch, движение, move, прокачка, progression, XP, taps, requirements, cardPower, ELO, ranked, экономика, BASE_DAMAGE, POSITION_BONUS, power rating. Грузить вместе с hexlash-dev. Для боя — hexlash-combat. Для backend — hexlash-api. Для UI — hexlash-vue + hexlash-design.
---

# hexlash-gamedesign — Balance & Mechanics

## Главное правило

Геймдизайн живёт в **трёх местах**: `/src/data/`, `/src/core/constants.js`, `/backend/src/config.js`. Многие значения **должны совпадать** между фронтом и бэком. Изменение одного без другого ломает баланс PvE↔PvP. Перед изменением — определить **все места** параметра, менять синхронно.

---

## Источники правды

| Домен | Файл |
|-------|------|
| Константы боя (фронт) | `/src/core/constants.js` |
| Константы боя (бэк) | `/backend/src/config.js` |
| Ветки (3) | `/src/data/branches.js` |
| Движения (18) | `/src/data/moves.js` |
| Прокачка | `/src/data/requirements.js` |
| Кардпавер | `/src/data/cardPower.js` |
| Архетипы PvE | `/src/core/data/archetypes.js` |
| Архетипы PvP | `/backend/src/config.js` → `ARCHETYPE_MODIFIERS` |
| Архетипы бэкенд (Agent) | `/backend/src/data/archetypes.js` |
| Power rating | `/src/utils/powerRating.js` |

---

## Ключевые константы (фронт ↔ бэк совпадают)

MAX_HP=100, MAX_ROUNDS=10, EXTRA_ROUNDS=2, TOTAL_ROUNDS=12, BASE_DAMAGE=15, POSITION_BONUS=5, MIN_DECK_SIZE=4, MAX_DECK_SIZE=8, DICE_COOLDOWN_ROUNDS=3, EMERGENCY_HP_THRESHOLD=30, COACH_MIN_ROUND=6, COACH_BOOST_ROUNDS=4, COST_PER_CLICK=2, COST_CREATE_CLUB=10000

**PvP-only (бэк):** MIN_PVP_DECK_SIZE=3, SLOT_WEIGHTS=[0.5,0.3,0.2], ARCHETYPE_MODIFIERS

**Точные значения → файлы.** Здесь карта, не дублирование.

---

## 6 архетипов

| Архетип | PvE поведение | PvP модификатор |
|---------|---------------|-----------------|
| **Predator** | attack 80/90% high/low HP | dmgBonus + crit 8% |
| **Sentinel** | defense 50/70% high/low HP | incomingReduction 15% |
| **Ghost** | position 50/50% | dodge 8% |
| **Analyst** | balanced 35/30/35 → 30/30/40 | dodge 2%, crit 2% |
| **Maverick** | equal high, random low | dodge 4%, crit 4% |
| **Juggernaut** | attack 50% (stable) | dmgBonus + crit 3% |

**Слот-веса:** slot1=50%, slot2=30%, slot3=20%. Frontend: object `{ slot1, slot2, slot3 }`. Backend: array `[0.5, 0.3, 0.2]`.

**Dice preferences** per archetype — в `/src/core/data/archetypes.js`.

---

## 3 ветки, 18 движений

- **Speed** (cyan): jab, double_jab, rapid_fire, combo_strike, flurry, hurricane
- **Power** (pink): straight, hook, uppercut, haymaker, hammer_fist, knockout_blow
- **Technique** (purple): block_strike, counter_jab, feint_cross, parry_punish, slip_counter, precision_strike

Каждое: `{ damage[5], speed[5] }` — по уровням 1-5. Имена через i18n.

---

## Прокачка

```
levelUp:  2={100t,50xp} 3={200t,100xp} 4={350t,200xp} 5={500t,350xp}
unlock:   3={300t,150xp} 4={250t,120xp} 5={200t,100xp}
```

**XP с боёв:** win=10, draw=7, lose=5. **Taps:** грушу × COST_PER_CLICK=2.

---

## Кубик — 6 эффектов

| Эффект | Сила | Тип |
|--------|------|-----|
| Heal | +15 HP | Восстановление |
| Adrenaline | x2 ATK 1 раунд | Бафф |
| Shield | Полная блокировка 1 раунд | Защита |
| Blind | Промах противника 1 раунд | Дебафф |
| Rage | -20 HP мгновенно | Финишер |
| Crit | -30 HP мгновенно | Финишер |

Cooldown 3 раунда, после round 1, отключён в Overdrive. **Rage/Crit могут убить.**

---

## Coach — расхождение by design

| | PvE | PvP |
|--|-----|-----|
| Эффект | +25 priority (action) | % бонусы (dmg/incoming) |
| Timer | 15s | 10s |
| Attack | +25 attack priority | +25% dmg |
| Defense | +25 defense priority | -30% incoming |
| Position | +25 position priority | +15% dmg, -15% incoming |

Длительность: 4 раунда. Один раз за бой, с round ≥6.

---

## Power Rating

`/src/utils/powerRating.js` — расчёт силы на основе колоды, модулей, прогрессии.

Difficulty ranges: easy (0.70-0.85), medium (0.90-1.10), hard (1.15-1.30). Position weights: [0.5, 0.3, 0.2].

---

## ELO / Ranked

Backend config: ELO_K_FACTOR=32, ELO_MIN=100, ELO_MAX=3000, ELO_MATCH_RANGE=200. RANKED_REMATCH_COOLDOWN=5, RANKED_MIN_FIGHTS_FOR_RANKING=5.

---

## Clan экономика

Создание: 10000 taps. Levels 1-10: `CLAN_LEVEL_CONFIG` (xpRequired, maxMembers, maxAgents, xpBonus). XP rewards: `CLAN_XP_REWARDS` (player + agent-specific). Tap share: 5%.

---

## Каскады — что ломается

| Меняешь | Затрагивает |
|---------|-------------|
| MAX_HP | Все формулы, кубик (Heal/Rage/Crit), длительность |
| BASE_DAMAGE | Длительность, архетипы, кубик value |
| MAX_ROUNDS | Coach trigger, Overdrive, длительность |
| damage[] в moves.js | Power rating, баланс веток, win-rate |
| ARCHETYPE_MODIFIERS | Win-rate PvP, выбор архетипов |
| Кубик values | Стратегия dice, модули |
| XP rewards | Скорость прогрессии, удержание |
| requirements.js | Кривая обучения |
| ELO K-factor | Стабильность рейтинга |

---

## Balance test process

1. Определить все места параметра (фронт + бэк + data)
2. Изменить синхронно
3. 10 PvE боёв с разными колодами
4. 1 PvP бой (2 устройства)
5. Сравнить win-rate/урон/длительность до и после
6. Документировать в commit

---

## Запрещено

- Константу боя только в одном файле
- `damage[]`/`speed[]` без проверки всех 5 уровней
- Унифицировать PvE/PvP без запроса
- Архетип modifier без проверки win-rate
- XP rewards без учёта кривой прогрессии
- Хардкод значений в компоненты вместо `/src/data/`
- Переводить имена архетипов в коде (через i18n)
- Игнорировать каскады

---

## Чеклист изменения баланса

- [ ] Все места параметра определены
- [ ] Изменения синхронны (frontend + backend + data)
- [ ] Каскад проверен
- [ ] 10 PvE боёв прогнаны
- [ ] PvP smoke (если затронут)
- [ ] Win-rate / длительность сравнены
- [ ] CLAUDE.md обновлён (Game Constants / Backend Config / Combat System)

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Frontend константы | `/src/core/constants.js` |
| Backend константы | `/backend/src/config.js` |
| Ветки | `/src/data/branches.js` |
| Движения | `/src/data/moves.js` |
| Requirements | `/src/data/requirements.js` |
| Card power | `/src/data/cardPower.js` |
| Архетипы PvE | `/src/core/data/archetypes.js` |
| Архетипы PvP | `/backend/src/config.js` → `ARCHETYPE_MODIFIERS` |
| Power rating | `/src/utils/powerRating.js` |
| PvE engine | `/src/core/engine/combatEngine.js` |
| PvP engine | `/backend/src/services/pvpCombatEngine.js` |
| AI strategy | `/src/core/engine/aiStrategy.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-combat` — механики боя, PvE/PvP
- `hexlash-api` — backend константы, ELO
- `hexlash-vue` — UI отображение
- `hexlash-i18n` — имена движений/архетипов
- `hexlash-design` — UI правила
- `hexlash-testing` — regression при balance changes
