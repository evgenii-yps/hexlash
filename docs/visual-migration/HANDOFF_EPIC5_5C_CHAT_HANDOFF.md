# HANDOFF — Переход из Sub-Epic 5B (CLOSED) в Sub-Epic 5C

**Дата:** 2026-04-23
**Источник:** завершение Sub-Epic 5B (`/v2/profile` — 4 cards + lazy ConnectWallet + WS friend challenges).
**Цель:** ввод нового чата Claude в контекст Sub-Epic 5C (`/v2/ratings/:type`). Скоуп 5C **фиксирован** per EPIC5_TZ.md §4, но открыты 4 вопроса (см. §5).

---

## §1 Где мы сейчас

**Sub-Epic 5B CLOSED.** `/v2/profile` работает: 4 cards (Identity / Performance / Friends / Settings), lazy ProfileScene (5A helper reuse), wagmi sync для wallet, lazy ConnectWallet modal (shared chunk с legacy `/profile/wallet`), WS friend challenge integration. Hub avatar-btn → `/v2/profile` (hot-fix 10.1 переключил с `openPhModal` на direct `router.push`). Hub avatar initials теперь реактивные из `master.userData.login` (hot-fix 10.2).

**Ветки:**
- **Dev ветка:** `claude/hexlash-visual-migration-epic5-DV1oX` — 5A (`c71903f/8333dc7/748b6ad/ded72f2/5d259b5/8e739ae`) + CORS infra fix (`c8aba35`) + 5B (`9d69473` → `ee977cb`) + final part 1 (`87430ed`) + final part 2 (этот handoff parent).
- **Основная миграция:** `visual-v2` — база Epic 1-4 CLOSED.

**Что deployed на Vercel preview `/v2/*`:**

| Route | Sub-Epic | Статус |
|-------|----------|--------|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + agentsList watch |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ legacy + dynamic |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ heavy bag + physics + combo (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ CRT typeLog + filters (client-mock, 5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist + materialize → new FD (5A migrated) |
| `/v2/profile` | **5B** | ✅ 4 cards + WS challenges + lazy ConnectWallet |

**Sub-Epic 5 progress:**

| Sub-Epic | Scope | Статус |
|----------|-------|--------|
| 5A | DRY helpers (buildOctagonalRoom, createDustField) | ✅ CLOSED |
| 5B | `/v2/profile` — Profile screen | ✅ CLOSED |
| **5C** | **`/v2/ratings/:type` — Ratings screen** | **NEXT** |
| 5D | `/v2/clan/:id` — Clan screen | pending |
| 5E | `/v2/shop` — Shop screen | pending |
| 5F | i18n pass на все v2 HUD'ы (9 locales + выход language switch 5B на v2 strings) | pending |
| 5G | Cross-cutting polish (11 carry-overs 5B + предыдущие) | pending |
| **PvP-integration** (new, TBD) | ChallengeNotification widget в v2 + `challenge_start` routing на `/v2/fight` | pending (см. §5 Q4) |

**Bundle bonus 5B:** Legacy `ProfileView.js` chunk **−11.21kb gzipped** (lazy ConnectWallet shared chunk). Positive side-effect, не scope.

**Следующий sub-эпик:** **5C**. Entry point — `ratings` plinth click в hub (currently через `PH_MODAL_IDS`, нужно переключить).

## §2 Что прочитать в новом чате

Порядок (строгий — каждый документ готовит контекст для следующего):

1. **`HANDOFF_EPIC5_5C_CHAT_HANDOFF.md`** (этот файл) — читать первым. Roadmap + открытые вопросы.
2. **`EPIC5_5B_FINAL_REPORT.md`** — свежий опыт 5B. Особенно:
   - §3 (lazy scene pattern, 5A reuse, captain belt public UI, wagmi watch, lazy modal, hot-fix flows — **оба multi-part**).
   - §5 (7 расхождений — DOM vs 3D click paths, masterModel vs UserModel asymmetry, Vuex action dispatch, camera auto-orbit skip, bundle bonus).
   - §6 (10 lessons — первым идёт «git log verification before report publish», дублируется в §3 handoff'а).
3. **`EPIC5_TZ.md`** — ТЗ всего Epic 5, **фокус §4 Sub-Epic 5C** (lines 155-178). Acceptance criteria, файлы для создания/изменения.
4. **`CLAUDE.md`** — **секция «Эпик 5 — Sub-Epic 5B — Profile»** (свежая, 129 строк). Содержит полный inventory commits + patterns + 11 deferred items + bundle measurements.
5. **`src/views/RatingsView.vue`** (legacy, ~693 строки) — **pre-flight target 5C.** Существующий source of truth для tabs / filters / table / sticky your-row. Составить mapping legacy → v2 HUD до Step 1.
6. **`hexlash_v24.html`** (prototype) — **фокус на Ratings HUD section** per `VISUAL_MIGRATION_PLAN.md §2.3 Ratings HUD`. Season tabs, filter tabs, table rows, sticky row styling.
7. **`HANDOFF_EPIC5_CHAT_HANDOFF.md`** — Epic 5 overall scope (refresh если сессия новая и Epic 5 контекст не в project knowledge).
8. **`EPIC4_FINAL_REPORT.md`** — контекст Epic 4 (hub scene lifecycle, CanvasLayer singleton). Нужен для понимания почему 5C entry point через `PH_MODAL_IDS` переключение (прецедент из 5B Step 1 + hot-fix 10.1 part 1).

### ⚠️ Про `CLAUDE.md` в project knowledge

Пользователь обновляет project knowledge через `Project settings → Knowledge` после закрытия каждого sub-эпика. В новой сессии:
- Если `CLAUDE.md` в project knowledge содержит **секцию «Эпик 5 — Sub-Epic 5B — Profile»** → контекст синхронизирован.
- Если её нет (не успел обновить) → явно читать `CLAUDE.md` как файл `/home/user/testhexlash/CLAUDE.md`.

**Recurring pattern (прецедент Epic 4):** handoff всегда упоминает эту опцию.

## §3 Уроки 5B — actionable для 5C

10 lessons из EPIC5_5B_FINAL_REPORT.md §6 с action-oriented формулировкой под 5C.

1. **Sub-epic reports ОБЯЗАНЫ сверяться с реальным `git log` перед publish.** Прецедент 5B: финальный отчёт первой попытки содержал неточности (wrong file name, wrong line counts, single-part hot-fixes вместо multi-part, Step 10 описан как ReferralModal+Logout вместо ConnectWallet). Root cause — написание по session memory, не по фактическим commit diff'ам. **Для 5C Step 13 — mandatory pre-check:** `git log --oneline origin/DV1oX -20`, `git show --stat <hash>` каждого 5C коммита, `git show <hash>` критичных (hot-fixes если будут + final part 1 CLAUDE.md) ДО написания отчёта.

2. **DOM HUD clicks — отдельный flow от 3D raycast clicks.** Hot-fix 10.1 part 1 5B: TopBar avatar-btn — DOM element, click идёт через `HudXxx emit → HudXxx handler`, НЕ через useClickState / PitViewV2 watcher. Step 1 review должен проверить **оба пути**: (a) 3D raycast via PitViewV2 click watcher (для plinth / terminal / etc), (b) DOM HUD component emit chains (TopBar / HudXxx direct bindings). **Для 5C:** entry `ratings` plinth — 3D target, но если будут TopBar-like secondary entries — грепать DOM binding flow.

3. **masterModel vs UserModel asymmetry.** Hot-fix 10.1 part 2 5B: `masterModel.fromJSON` присваивает userData raw (createdAt — ISO string), UserModel constructor wraps как Date. `String.toLocaleString(locale, opts)` игнорирует opts. **Для 5C:** любое чтение user profile data из `master.userData.*` — explicit coercion (`new Date(raw)` + NaN guard). Для rows в таблице лидеров (opponent lookup) — тот же паттерн.

4. **Vuex action dispatch vs direct function call для cross-component state sync.** Hot-fix 10.2 part 2 5B: direct `setLanguage()` пропустил 3 шага atomic action. **Правило для 5C:** если state change потенциально read'ится в > 1 component — `grep master/set.*` / `git grep "dispatch.*'[module]/set"` перед direct import. Для 5C: season filter / sort order / pinned rows — проверить existence Vuex action.

5. **Lazy sub-scene pattern = default для sub-screens.** 5B ProfileScene register в view `onMounted`, dispose в `onBeforeUnmount` со строгим teardown order (`activateScene('pit')` → `unregisterScene` → `sceneApi.dispose()`). **Для 5C:** если RatingsScene нужна (см. §5 Q3) — register/dispose симметрично.

6. **5A helpers reuse — обязательный grep.** Profile стал 4-м consumer'ом `buildOctagonalRoom` + `createDustField`. **Для 5C:** первый file обязан `grep -r "createDustField\|buildOctagonalRoom" src/scene/objects/` перед написанием scene boilerplate. Zero-copy reuse подтверждён.

7. **Lazy modal + existing legacy component `defineExpose` augmentation.** 5B Step 10 ConnectWallet: +1 line `defineExpose({ openModal })` → shallowRef + dynamic import. Bundle split free bonus (−11.21kb legacy chunk). **Для 5C:** для filter panel / opponent detail popover / ratings snapshot modal — первым шагом проверить existing legacy components (`PvPStatsCard.vue`, modals из `/clan/` stack). Не создавать новый если можно augmented existing.

8. **Hot-fix mid-epic приемлем, multi-part hot-fixes — норма.** Если visual verify Step X regression найдёт 2 bugs в одной session — оба под одним hot-fix commit'ом (прецедент 10.1 + 10.2 5B, оба multi-part). Не откладывать в 5G. Incremental visible bugs подрывают confidence.

9. **Preemptive edit-split для file writes > 100 строк.** Паттерн 4-й раз подтверждён (3Bc / Epic 4 / 5B попытка 1 timeout / 5B попытка 2 split = success). **Для 5C final:** 1 Write stub ≤50 строк + per-section Edits ≤50 строк. Mandatory.

10. **HUD line count — soft-300 limit.** HudProfile 615 строк — над limit, candidate для splitting в 5G. **Для 5C:** если HudRatings приближается к 300 — рассмотреть раннее splitting на sub-tabs (HudRatingsMyClub / HudRatingsClubs / HudRatingsFighters). Или документировать как candidate с numeric commitment в final report.

## §4 Карта Sub-Epic 5C — `/v2/ratings/:type`

### Scope (per EPIC5_TZ.md §4)

- Новый route `/v2/ratings/:type` (`type ∈ {myclub, clubs, fighters}` default, см. ниже про Agents).
- Новый view `src/views-v2/RatingsView.vue` (naming — следуем 5B `ProfileView.vue` без V2 suffix, DV1oX committing pattern).
- Новый HUD `src/components/hud/HudRatings.vue` — season tabs + filter tabs + table + sticky your-row.
- Reuse legacy components: **`MyClubTab.vue`** (полностью — для `myclub` tab), **`AgentLeaderboard.vue`** (pending Step 0 dead-code check), **`PvPStatsCard.vue`** (sticky your-row для fighters), **`UserCaptainBadge.vue`** (inline в rows).
- Entry point: `ratings` click в hub — переключить из `PH_MODAL_IDS` на `router.push('/v2/ratings/fighters')` (default tab).
- Tabs: **My Club / Clubs / Fighters** — + 4-я Agents tab **requires Step 0 verify** (см. ниже).

### Важно: Agents tab — статус неясен

CLAUDE.md секция **«Agent Rankings + Leagues (ТЗ-26)»** (pre-5B) описывает 4-ю tab "AGENTS" в RatingsView. 5B Step 0 pre-flight audit НЕ проверял Ratings (не в scope 5B).

**Impact на 5C:** Step 0 5C ОБЯЗАН проверить `src/views/RatingsView.vue`:
1. Сколько реальных tabs в template (3 или 4).
2. Если 4 — Agents tab используется.
3. Если 3 — Agents tab была удалена в промежуточном коммите, CLAUDE.md секция stale.

Также grep:
- `git grep "AgentLeaderboard"` — где импортируется.
- Если только в RatingsView.vue и больше нигде — dead code кандидат.

**Decision matrix (§5 Q2):**
- Если 4 tabs + реально used: 5C переносит 4 tabs.
- Если 3 tabs + AgentLeaderboard dead: 5C переносит 3 tabs, AgentLeaderboard cleanup в 5G.
- Если 3 tabs + AgentLeaderboard used elsewhere: 5C 3 tabs, оставить компонент.

### Pre-flight requirements (Step 0 5C)

1. **Read `src/views/RatingsView.vue`** полностью (~693 строки) — понять existing tabs logic, data flow, component composition.
2. **Map legacy → v2 HUD:**
   - `<v-tabs>` tabs UI → HUD chip row (паттерн `.pv-lang-chip` из 5B `profile.css` для reference).
   - Table rows → pure-CSS `.hr-row` классы, neon fonts (Anonymous / AnonymousBalance для numbers).
   - Sticky your-row → `.hr-sticky-row` с border-top `--hex-primary` glow.
3. **Reuse verify:**
   - `MyClubTab.vue` — работает как SFC inline в Ratings HUD? Или требует v24-port? (§5 Q3).
   - `AgentLeaderboard.vue` — dead code status (§5 Q2).
   - `PvPStatsCard.vue` — existing render OK или нужен v24 wrapper?
4. **Scene decision:** prototype HTML fragment для Ratings — есть ли 3D background или pure HUD? (§5 Q3).

### Clan routing split (Sub-Epic 5D prep)

- **`/v2/ratings/myclub`** — My Club tab (no-clan state + has-clan dashboard). Использует `MyClubTab.vue` reuse (или v24-port).
- **`/v2/clan/:id`** — Sub-Epic 5D scope. Single-clan detail view (members leaderboard / activity feed / settings).

Split rationale: legacy `ClanView.vue` (`/clan/:id`) ≠ `MyClubTab.vue` (rendered в `/ratings/myclub`). Две разные системы. 5C делает `/v2/ratings/myclub` через MyClubTab reuse, 5D — отдельный view для `/v2/clan/:id`.

### Scene vs overlay decision

Unknown до prototype check. Likely scenarios:
- **Overlay** (most likely): pure HUD поверх активной pit scene (dimmed через body class). Простой, быстрый, минимальный overhead.
- **Lazy scene** (если prototype required): аналог 5B ProfileScene — 5A helpers reuse (`buildOctagonalRoom` + `createDustField`). Memory cost minimal, pattern отработан.

**Decision point — Step 0 prototype review.**

### Файлы (создаются)

- `src/views-v2/RatingsView.vue` — orchestrator.
- `src/components/hud/HudRatings.vue` — HUD скаффолд.
- `src/styles/v24/ratings.css` — scoped `.app-v2`.
- Optional `src/scene/scenes/RatingsScene.js` — если scene нужна.

### Файлы (изменяются)

- `src/router/index.js` — `V2Ratings` route с param `:type`.
- `src/views-v2/PitViewV2.vue` — `ratings` click → `router.push('/v2/ratings/fighters')` + удалить из `PH_MODAL_IDS`.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.ratings` удалён. **Внимание (урок 5B hot-fix 10.1 part 1):** если entry point DOM-based (typed TopBar slot) — переключить DOM binding тоже.
- `src/styles/hexlash-v24.css` — `@import './v24/ratings.css'`.

## §5 Открытые вопросы

4 вопроса для пользователя **до старта Step 1 5C**. Claude Code gate'ит старт commit'ов до ответов.

### Q1: Порядок sub-эпиков 5C → 5G подтверждён?

EPIC5_TZ.md §1 фиксирует порядок `5C → 5D → 5E → 5F → 5G`. Rationale:
- **5C Ratings → 5D Clan** — Ratings MyClub tab ссылается на `/v2/clan/:id` (когда клик по rank rows). Clan view нужна после Ratings.
- **5D Clan → 5E Shop** — ни одной прямой зависимости, но Clan сложнее Shop. Easier screens — позже.
- **5F i18n после всех HUD'ов** — одной пропашкой (включая 5B deferred #10 — inline EN strings в HudProfile + предыдущие HUD'ы).
- **5G polish в конце** — собирает 6 carry-overs 5B (#3, #4, #5, #6, #9, #11) + предыдущих sub-эпиков.

**Decision:** подтвердить порядок **или** предложить изменение.

### Q2: AgentLeaderboard.vue — dead code? Agents tab — 3 vs 4?

CLAUDE.md pre-5B секция «Agent Rankings + Leagues (ТЗ-26)» описывает 4-ю tab "AGENTS" в RatingsView. 5B Step 0 НЕ проверял это (out of scope).

**5C Step 0 обязан:**
1. `wc -l src/views/RatingsView.vue` → что там сейчас.
2. Read RatingsView.vue template → count `<v-tab>` elements.
3. `git grep "AgentLeaderboard"` → где импортируется.
4. `git log --oneline --follow src/components/ratings/AgentLeaderboard.vue` → history.

**Decision options:**
- **A:** Оставить AgentLeaderboard как-есть, 5C переносит **текущее реальное состояние** (3 или 4 tabs) без cleanup. Cleanup в 5G если dead.
- **B:** 5C Step 0 подтвердит dead code → удалить + update CLAUDE.md секцию в 5C Step 1. Cleaner.
- **C:** Восстановить Agents tab в `/v2/ratings/agents` (4-я tab) если была удалена по ошибке.

Подтвердить выбор до старта 5C.

### Q3: MyClubTab.vue reuse verbatim?

Существующий `MyClubTab.vue` (`src/components/fragments/clan/MyClubTab.vue`) — полный clan page content (ClanPageContent reuse для has-clan state + no-clan CTA + browse).

**Option A (zero-port):** Inline `<MyClubTab :clubData="..." :clubId="..." />` в HudRatings при `type === 'myclub'`. Vuetify + legacy CSS просочится в v2 UI — visual mismatch risk.

**Option B (full v24-port):** Переписать HTML + CSS под `--hex-*` vars, Anonymous font, без Vuetify. Больше работы, clean visual. Similar to 5B Identity/Performance/Friends cards scope.

**Option C (hybrid):** Inline reuse с CSS override layer (`.app-v2 .my-club-tab { ... }` overrides specific Vuetify classes). Компромисс.

**Decision:** подтвердить выбор. Визуальный bar-set высок — legacy MyClubTab в v2 контексте может выглядеть как foreign body. Likely Option B (precedent 5B HudProfile 615 строк — 4 cards с нуля), но требует ≥40% 5C time budget.

Также: **scene vs overlay decision для Ratings HUD** (из §4). Prototype check — есть ли 3D scene для Ratings или pure HUD overlay.

### Q4: PvP-integration sub-epic timing

5B deferred items **#1 и #2** блокируют PvP flow для v2 users:

1. **ChallengeNotification widget hidden на `/v2/*`.** `App.vue:35` — `v-if="!isV2Route"`. V2 users не видят incoming challenge toast. 5B Step 8 только **sends** challenges.
2. **`challenge_start` routing на legacy `/fight?mode=pvp`.** WebSocket `challenge_start` event → redirect на legacy route, не `/v2/fight`.

**Impact:** v2 user → sends challenge → opponent accepts → sender landed в legacy Fight view (не v2). Half-broken v2 PvP.

**Decision options:**
- **A:** Отдельный sub-epic ПОСЛЕ 5G (e.g. Epic 6 или 5H). Чистые scope boundaries.
- **B:** Вкатить в 5G polish (scope extension). 5G становится largest sub-epic.
- **C:** Отложить на Epic 6 полностью (merge visual-v2 → main сначала, потом отдельный заход).

Подтвердить когда и как запланировать. Рекомендация — Option A или C (B превращает 5G в gigantic kitchen-sink).

## §6 Что делать новому чату в первом сообщении

10 пунктов для первого ответа Claude в новом чате. Peer-review + pre-flight 5C + Q1-Q4 gate.

1. **Подтвердить приём handoff.** "Я прочитал HANDOFF_EPIC5_5C_CHAT_HANDOFF.md + EPIC5_5B_FINAL_REPORT.md + EPIC5_TZ.md §4".

2. **Peer-review handoff.** Найти неточности, gaps, противоречия. Прецедент 3Bc / Epic 4 / 5B — каждый handoff review находит 2-6 missed facts. Специально проверить:
   - Q1 порядок обоснован?
   - Q2 Agents tab / AgentLeaderboard status — предположение или факт? (step 0 проверит)
   - Q3 MyClubTab options — есть ли 4-й вариант?
   - Q4 PvP-integration carry-over — scope правильно описан?

3. **Pre-flight check 5C (read-only, no commit).** Grep + read:
   - `git log --oneline origin/DV1oX -20` → recent commits.
   - `git grep "AgentLeaderboard"` → где импортируется.
   - `git grep -l "ratings" src/views-v2/ src/components/hud/` → текущие routing.
   - `wc -l src/views/RatingsView.vue src/components/fragments/clan/MyClubTab.vue src/components/ratings/*.vue` — размеры.
   - Read `src/views/RatingsView.vue` полностью (count `<v-tab>`).
   - Read `hexlash_v24.html` section для Ratings (поиск "ratings" / "leaderboard").

4. **Compose Step 0 report.** Секции:
   - 0.1 RatingsView structure (tabs logic, data flow, real tab count).
   - 0.2 AgentLeaderboard status (dead / used / needs cleanup) — resolves Q2.
   - 0.3 MyClubTab reuse feasibility (verbatim / port / hybrid) — informs Q3.
   - 0.4 Prototype Ratings HUD (scene or overlay) — resolves §4 scene decision.
   - 0.5 Scope confirmation (3 vs 4 tabs, naming File конвенция).

5. **Ответить на Q1-Q4.** Предложить рекомендации + ждать подтверждения пользователя.

6. **Gate на 5C Step 1.** Не начинать commits пока Q1-Q4 не закрыты. Прецедент Epic 5 handoff.

7. **Detailed 5C plan proposal.** После Q1-Q4 gate — предложить разбивку на 8-10 шагов + оценку commit'ов. Формат аналогичен 5B шагам (`9d69473` → `ee977cb`, 10 functional + possible hot-fixes).

8. **Визуально подтвердить с prototype.** Если scene decision = overlay — показать секцию `hexlash_v24.html` (lines + reference) в начальном плане.

9. **Закладывать edge cases из 5B уроков (§3 этого handoff'а).** Особенно:
   - Step 13 git log verification mandatory.
   - DOM HUD vs 3D raycast click paths — grep оба.
   - masterModel vs UserModel asymmetry при чтении user data.
   - Vuex action existence check до direct import.

10. **Preemptive edit-split в финале.** Финал 5C = 3 commit'а (CLAUDE.md / FINAL_REPORT / HANDOFF) + per-section Edits ≤50 строк. Прецедент 4 раза (3Bc / Epic 4 / 5B попытка 2).

## §7 Стартовое сообщение для нового чата

Готовый текст для копи-паст. Пользователь отправляет в новом чате вместе с attachments.

---

```
Привет. Продолжаем визуальную миграцию Hexlash.

Sub-Epic 5B CLOSED (final part 1 87430ed CLAUDE.md +
final part 2 EPIC5_5B_FINAL_REPORT.md + final part 3
HANDOFF_EPIC5_5C_CHAT_HANDOFF.md).
/v2/profile работает, deployed на Vercel preview.
Bundle bonus: legacy ProfileView.js -11.21kb.

Цель этой сессии: Sub-Epic 5C — /v2/ratings/:type.
3-4 tabs (My Club / Clubs / Fighters + может Agents —
step 0 verify). Entry — ratings plinth в hub.

Ветка dev: claude/hexlash-visual-migration-epic5-DV1oX
(5A + 5B committed там; 5C продолжает там же).

Инструкции:

1. Прочитай в порядке §2 handoff'а:
   - HANDOFF_EPIC5_5C_CHAT_HANDOFF.md (первый)
   - EPIC5_5B_FINAL_REPORT.md
   - EPIC5_TZ.md §4
   - CLAUDE.md (секция Эпик 5 — Sub-Epic 5B — Profile)
   - src/views/RatingsView.vue (legacy, ~693 строк)
   - hexlash_v24.html (Ratings HUD section)

2. Peer-review handoff. Найди gaps / неточности.
   Прецедент 3Bc/Epic4/5B — каждый review находит
   2-6 missed facts.

3. Pre-flight check 5C (read-only):
   - git log origin/DV1oX -20
   - grep AgentLeaderboard usages
   - ratings routing в v2
   - legacy RatingsView tab count (3 or 4?)
   - prototype Ratings HUD section

4. Compose Step 0 report — 5 секций (structure /
   AgentLeaderboard status / MyClubTab reuse /
   scene decision / scope confirmation).

5. Ответь на Q1-Q4 (handoff §5):
   - Q1: порядок 5C-5G подтверждён?
   - Q2: AgentLeaderboard dead? Tabs 3 or 4?
   - Q3: MyClubTab reuse A/B/C? Scene overlay or
         dedicated?
   - Q4: PvP-integration carry-over timing (2 deferred
         items блокируют v2 PvP)?

6. GATE — не начинать 5C Step 1 commits пока Q1-Q4
   не закрыты пользователем.

7. После gate — предложить 8-10 step plan + оценку
   commit'ов.

Критичные уроки 5B (handoff §3):
- #1: git log verification ПЕРЕД написанием отчёта
     (ошибка в 5B привела к переписыванию final
     part 2).
- #2: DOM HUD vs 3D raycast click paths — грепать
     оба flow при добавлении route.
- #3: masterModel.fromJSON != UserModel constructor —
     createdAt приходит как ISO string.
- #4: Vuex action existence check до direct import
     (пример setLanguage hot-fix 10.2).

СТОП после Step 0 report + Q1-Q4 ответов. Жду
подтверждения перед Step 1.
```

---

## §8 Чеклист самого handoff'а

Verify перед commit:

- [x] **§1 Status correct.** 5B CLOSED (включая правильные commit hashes `9d69473` → `ee977cb`), 5A/5C-5G + PvP-integration candidate pending table.
- [x] **§2 Порядок чтения правильный.** Handoff → FINAL_REPORT → TZ §4 → CLAUDE.md секция → legacy RatingsView → prototype → handoff Epic 5 overall → Epic 4 FINAL.
- [x] **§3 10 lessons.** Все из EPIC5_5B_FINAL_REPORT.md §6, переформулированы под 5C action-oriented. Первый — «git log verification mandatory» (новый урок из этой сессии).
- [x] **§4 5C scope.** Matches EPIC5_TZ.md §4 (`/v2/ratings/:type`, 3-4 tabs pending Step 0, reuse components listed).
- [x] **§4 Agents tab handling.** Documented как **неясный** (не factual 3 vs 4 — Step 0 resolves). Flagged AgentLeaderboard status check.
- [x] **§4 MyClubTab routing split.** `/v2/ratings/myclub` (MyClubTab reuse) vs `/v2/clan/:id` (Sub-Epic 5D).
- [x] **§4 Scene decision.** Placeholder — prototype check в Step 0, depends on HUD section content.
- [x] **§4 DOM HUD binding warning.** Ratings likely 3D target (plinth), но урок 5B hot-fix 10.1 part 1 reference включён для entry-point safety.
- [x] **§5 Q1-Q4 распределены.** Order / Agents tab status / MyClubTab options + scene decision / PvP-integration timing.
- [x] **§5 Q4 PvP-integration.** 2 deferred items из 5B (#1, #2) явно связаны с этим вопросом.
- [x] **§6 10 first-message actions.** Receipt → peer-review → pre-flight → Step 0 report → Q1-Q4 → gate → plan → prototype → edge cases → preemptive split.
- [x] **§7 Start message.** Готовый копи-паст текст. Упомянуты 4 критичные lesson'а из 5B + hash `87430ed` final part 1.
- [x] **Preemptive edit-split выдержан.** 1 Write stub + 8 Edit'ов per section, каждая ≤50 строк. 0 timeouts.
- [x] **Branch info correct.** `claude/hexlash-visual-migration-epic5-DV1oX` = dev (5A+5B+эти docs), `visual-v2` = база.
- [x] **Commit message format.** `epic5-5b: final part 3 — HANDOFF_EPIC5_5C_CHAT_HANDOFF.md`.
- [x] **Accuracy vs 5B реальных коммитов.** Hot-fix descriptions — both multi-part (10.1 avatar+date, 10.2 initials+lang). File names accurate (ProfileView.vue, HudProfile.vue 615 lines, profile.css 552). Step 10 = ConnectWallet (не ReferralModal).

---

**Sub-Epic 5B CLOSED** после commit этого handoff. Готов к transition в Sub-Epic 5C.
