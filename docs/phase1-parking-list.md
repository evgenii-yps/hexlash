# Phase 1 Parking List — Долги и улучшения

Долги, обнаруженные при серии deepdive ТЗ #1a-#1i (9 апреля 2026). Фиксятся **не в Phase 1**, а в Дороге 2 после Phase 1 deploy — кроме явно помеченных **[Phase 1]**.

---

## Высокая серьёзность

| # | Описание | Источник | Статус |
|---|----------|----------|--------|
| 1 | **Legend buff применяется к обоим бойцам (баг).** `simulateAgentFight()` применяет `legendDmgMult` и к fighter1, и к fighter2. В PvE бот получает бафф клана игрока. В Agent vs Agent agent2 получает бафф agent1 вместо своего. Нужно: раздельные `legendBuff1`/`legendBuff2` в engine. | #1a, #1c | **[Phase 1]** #P1-fix-legend |
| 2 | **Race condition: scheduler vs manual train.** Оба делают `findUnique → check status → update fighting` без atomic lock. Два параллельных боя одного агента возможны, двойной XP. | #1c | Дорога 2 |
| 3 | **PUT /user/progression доверяет фронтенду.** Backend принимает произвольный JSON blob и сохраняет в `User.progression`. Вся логика unlock/levelup на фронтенде. Нет серверной валидации. | #1d | Дорога 2 |
| 4 | **x402 on-chain verification — TODO.** `x402.js` строки 42-44: принимает любой tx hash без проверки on-chain. Когда `X402_ENABLED=true`, нет реальной верификации платежа. | #1e | Дорога 2 |
| 5 | **archetype winrate считается неправильно.** `metaAnalysisService` строки 52-59: `_avg.wins / _avg.totalFights` — это среднее число побед / среднее число боёв, не win rate. Нужно `_sum`. | #1e | Дорога 2 |
| 6 | **getClubRanking загружает ВСЕ FightClub'ы.** `metaAnalysisService` строки 111-114: `prisma.fightClub.findMany()` со всеми агентами. При 10K+ clubs — performance проблема. | #1e | Дорога 2 |

## Средняя серьёзность

| # | Описание | Источник | Статус |
|---|----------|----------|--------|
| 7 | **Dice порядок даёт bias fighter1.** `agentCombatEngine` строки 283-310: f1 кидает dice до f2. Если f1 убил f2 rage/crit, f2 не кидает. Системное преимущество fighter1 в ranked. | #1a | Дорога 2 |
| 8 | **Coach активируется строго на round 6 без рандома.** В PvE/PvP coach имеет trigger chance. В agent engine — гарантированно на COACH_MIN_ROUND. | #1a | Дорога 2 |
| 9 | **Три копии данных мувов.** Frontend `src/data/moves.js`, backend `backend/src/data/moves.js`, `researchGateService.js` MOVE_BRANCHES. Рассинхрон при добавлении мува. | #1d | Дорога 2 |
| 10 | **LEVEL_UP_XP_COST дублирует requirements.js.** `researchGateService.js` строки 23-28 — хардкод exp-части из `requirements.js`, без taps. Два источника стоимости. | #1d | Дорога 2 |
| 11 | **Research Gate не проверяет sequential unlock.** User progression требует "предыдущий мув level ≥ 3". Agent может выучить любой мув из researched сразу, пропуская цепочку. | #1d | Дорога 2 (by design?) |
| 12 | **Deck size mismatch: три разных политики.** User: 3-5, Agent: 4-8, PvP: 3-8. Три MIN_DECK_SIZE для трёх контекстов. | #1d | **[Phase 1]** deck unification |
| 13 | **Тройное дублирование XP-систем.** `fightClubService.addFightClubXp()` (FightClub), `clubLevelService.addClubXp()` (мёртвый код), `clanLevel.awardClanXP()` (Club). Три файла одной задачи. | #1f | Дорога 2 |
| 14 | **clubLevelService.addClubXp — мёртвый код.** Экспортирован, но не вызывается ни одним файлом. Артефакт до рефакторинга FightClub. | #1f | Дорога 2 |
| 15 | **Race condition getOrCreateFightClub.** `findUnique → if null → create` без try/catch. Параллельные запросы → unique constraint violation → 500. | #1f | Дорога 2 |
| 16 | **Double status update для auto-fight.** `_executeFight()` ставит `idle`, затем scheduler повторно ставит `resting`. Два последовательных update одного агента. | #1c | Дорога 2 |
| 17 | **a2 branchXP дублирует логику distributeXpByBranch.** `_executeAgentVsAgentFight` строки 279-291 — ручной расчёт вместо вызова существующей функции. | #1c | Дорога 2 |
| 18 | **clubXP fire-and-forget теряет levelUp.** `addFightClubXp().then()` заполняет `clubXpResult.leveledUp`, но return уже произошёл. Фронтенд не узнает о level-up. | #1c | Дорога 2 |
| 19 | **Дублирование calculateElo в pvpCombatEngine.** `pvpCombatEngine.js:749` имеет свою `calculateElo()` для PvP игроков, отдельно от `eloService.js` для агентов. Две реализации. | #1b | Дорога 2 |
| 20 | **ELO пороги 900/1100 хардкодом в 3 файлах.** AgentCard.vue, AgentDetailView.vue, AgentLeaderboard.vue — дублируют без leagues.js. | #1b | **[Phase 1]** убирается с ELO→Belt |
| 21 | **Wizard сокращён с 3 до 2 шагов, CLAUDE.md устарел.** CreateAgentView реально 2 шага (name+skin → confirm), не 3. | #1g | **[Phase 1]** fix в этом ТЗ |
| 22 | **Модель одна для всех AI endpoints.** `claude-haiku-4-5-20251001` для analyze-fight, build-description, morning-report, premium-report. Для premium 2000-token "elite strategist" haiku может быть недостаточно. | #1e | Дорога 2 |

## Низкая серьёзность

| # | Описание | Источник | Статус |
|---|----------|----------|--------|
| 23 | **Хардкод HP порог 70 для high/low.** `agentCombatEngine` строка 30: порог для archetype priorities не в config. | #1a | Дорога 2 |
| 24 | **Хардкод Maverick spike chance 0.3 (30%).** `agentCombatEngine` строка 43. | #1a | Дорога 2 |
| 25 | **Хардкод aggression модификаторов +20/-10.** `agentCombatEngine` строки 69-74. | #1a | Дорога 2 |
| 26 | **Хардкод overdrive attack bias +30/-15.** `agentCombatEngine` строки 84-85. | #1a | Дорога 2 |
| 27 | **Хардкод defense block 60%.** `agentCombatEngine` строка 389. Дублируется в PvE combatEngine. | #1a | Дорога 2 |
| 28 | **Хардкод overdrive drain 5 HP.** `agentCombatEngine` строки 329-330. | #1a | Дорога 2 |
| 29 | **Хардкод overdrive cap MAX_ROUNDS + 10.** `agentCombatEngine` строка 251. | #1a | Дорога 2 |
| 30 | **Biased shuffle в bot generator.** `sort(() => Math.random() - 0.5)` — не настоящий shuffle. | #1a | Дорога 2 |
| 31 | **generatePveBot масштабируется по ELO.** Пороги 900/1100 хардкодом. При Belt System нужна замена шкалы. | #1b | **[Phase 1]** убирается с ELO→Belt |
| 32 | **MANUAL_FIGHT_COOLDOWN_MS не в config.** Определён в `agentFightService.js` строка 27, единственная константа боя не в config.js. | #1c | Дорога 2 |
| 33 | **XP_MULTIPLIERS и BASE_FIGHT_XP не в config.** Определены в `agentFightService.js`, при этом CLAN_XP_REWARDS — в config. Два набора XP-констант в разных местах. | #1c | Дорога 2 |
| 35 | **freeXP отсутствует в Agent системе.** User: двухэтапный XP flow (freeXP → allocate → branchExp). Agent: автоматическое распределение по ветвям. Концепция "свободного XP" не существует. | #1d | Архитектурное (by design) |
| 36 | **Дублирование Prisma запроса в gatherClubStats.** `morningReportService.js` строки 37-47: два одинаковых запроса, первый результат не используется. | #1e | Дорога 2 |
| 37 | **Club name хардкод "Fight Club".** `ai.js` строки 425, 542: `buildMorningReportPrompt('Fight Club', ...)`. FightClub модель не имеет поля name. | #1e | **[Phase 1]** #P1-club-name |
| 38 | **Кеш morning-report не инвалидируется при новых боях.** 30 мин TTL, новые бои после генерации не видны. | #1e | Дорога 2 |
| 39 | **FightClub level-up без clanEvent.** `fightClubService.addFightClubXp()` не вызывает `createClanEvent()` при level-up. Club и clanLevel — вызывают. | #1f | Дорога 2 |
| 40 | **xpBonus из config не применяется.** `CLAN_LEVEL_CONFIG[level].xpBonus` (0-20%) показывается на фронтенде, но не влияет на gameplay. Единственное применение — legendBuff (другая формула). | #1f | Дорога 2 |
| 41 | **RetirementPanel без confirm dialog.** Кнопка "Retire Fighter" (необратимое действие) не использует ClanConfirmModal. Только текстовое предупреждение. | #1f, #1h | Дорога 2 |
| 42 | **RetirementPanel прямой API без Vuex.** `apiClient.get('/user/retirement-status')` напрямую, не через store dispatch. Ломает единообразие. | #1h | Дорога 2 |
| 43 | **"ELO: 1000" хардкод в CreateAgentView.** Строка 54: хардкод текста, не i18n. При Belt System нужно заменить. | #1g | **[Phase 1]** убирается с ELO→Belt |
| 44 | **NFT mint — stub.** `onMint` просто показывает info toast. `nftRequired` всегда false. Мёртвый UI path. | #1g | Дорога 2 |
| 45 | **confirm() native dialog для delete.** AgentDetailView строка 414. Остальной проект использует ClanConfirmModal. | #1g | Дорога 2 |
| 46 | **Tab switch без debounce.** AgentDetailView: каждый клик по tab вызывает API мгновенно. Быстрое переключение — лишние запросы. | #1g | Дорога 2 |
| 47 | **fightStylePreview.js — мёртвый код.** 47 строк, экспортирует `generateFightStylePreview()`, не импортируется ни одним файлом. | #1h | **[Phase 1]** #P1-cleanup |
| 48 | **SkinPicker typo "notstandart".** `skin_m_23_notstandart.png` — опечатка в имени файла скина. | #1h | Дорога 2 |
| 49 | **Emoji вместо компонентов в UI.** MorningReport и RetirementPanel: ✅❌➖ raw emoji вместо HexBadge/PixelIcon. | #1h | Дорога 2 |
| 50 | **AgentRoster нет error state.** Loading и empty state есть, error state нет. Если fetchAgents упадёт — бесконечный spinner. | #1h | Дорога 2 |

## Дизайн-вопросы

| # | Описание | Источник | Статус |
|---|----------|----------|--------|
| 51 | **AgentDetailView: множественные розовые акценты.** Active tab, branch, tactic button, filter — все --hex-primary. 6+ розовых элементов одновременно. Нарушение "один розовый акцент на экран". | #1g | Дорога 2 (redesign) |
| 52 | **ArchetypeSelector box-shadow generic pink.** Selected archetype card имеет `rgba(255,6,111,0.2)` glow вместо `--hex-arch-{id}` color. Мелкое нарушение Visual System. | #1h | Дорога 2 |

---

## Сводка

- **Всего пунктов:** 52
- **Высокая:** 6 (1 фиксится в Phase 1)
- **Средняя:** 16 (4 фиксятся в Phase 1)
- **Низкая:** 28 (6 фиксятся в Phase 1)
- **Дизайн:** 2
- **Помечено [Phase 1]:** 11 из 52
- **Дорога 2:** 41 из 52
