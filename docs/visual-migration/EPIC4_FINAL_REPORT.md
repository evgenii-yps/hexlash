# EPIC 4 — FINAL REPORT

**Дата закрытия:** 2026-04-22
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Static trace 6/6 ✅, visual verify на Vercel preview за пользователем.
**Скоуп:** Captain Bind + Create Persistence + Dynamic FD. Первый эпик реальной интеграции с backend после полной CLOSED v2 миграции фронта (Эпик 3B).

---

## §1 Шаги и коммиты

| # | Commit | Что | Файлы |
|---|--------|-----|-------|
| 0 | — | pre-flight check (read-only) — verified backend `VALID_ARCHETYPES` 1-в-1 с v2 `ARCHETYPES` | 0 |
| 1 | `e20bb36` | useCreatedFighter composable stub (cross-view one-shot, паттерн 3Bb useFightSetup) | 1 |
| 2 | `3ca870a` | hub captain bind (slot 1) + fetchAgents in CanvasLayer + labelOverride hover | 3 |
| 3 | `1e92456` | hub second agent slot (three-way branch: real / legacy mock / empty) | 2 |
| 4 | — | createAgent action verification (read-only, no commit) | 0 |
| 5 | `942641f` | create persistence + inline error + HUD→CreateView materialize ownership shift | 4 |
| 5.5 | `4c31592` | hub fighters refresh on agentsList change (scope extension — Step 7 trace обнаружил критический bug) | 2 |
| 6 | `09a9112` | dynamic FD for any agent id (legacy/cache/fetchAgent resolution chain) | 5 |
| 7 | — | E2E regression (static trace 6/6, no commit) | 0 |
| 8.1 | `7fe0a0e` | final part 1 — CLAUDE.md Эпик 4 section | 1 |
| 8.2 | this | final part 2 — EPIC4_FINAL_REPORT.md | 1 |
| 8.3 | next | final part 3 — HANDOFF_EPIC5_CHAT_HANDOFF.md | 1 |

**Total:** 8 функциональных коммитов (Steps 1-6 + 5.5 extension) + 3 финальных (8.1/8.2/8.3). Steps 0/4/7 read-only (pre-flight + verify + regression).

---

## §2 Файлы

### Созданы (2)

| Файл | Строк | Contract |
|------|-------|----------|
| `src/scene/interaction/useCreatedFighter.js` | 32 | Module-scoped reactive `{ current: null }`. `setCreatedFighter({id, name, archetype})` — producer (CreateView после backend success). `getCreatedFighter()` + `clearCreatedFighter()` — consumer (FighterDetailView.resolveFighter, one-shot consumption). Симметрично 3Bb useFightSetup. |
| `src/scene/objects/archetypeColors.js` | 26 | Shared `pickFighterColor(archetypeId)` + `LEGACY_ARCHETYPE_COLORS`. Resolution: legacy warden/predator → 6 backend archetypes из `ARCHETYPES` (useCreateState) → warden gold fallback. Reuse: PitScene (captain + secondAgent glow), FighterDetailScene (FD podium glow). |

### Изменены (9)

| Файл | Изменения |
|------|-----------|
| `src/scene/scenes/PitScene.js` | `buildPitScene(THREE, aspect, opts)` — 3-й параметр `{captain, secondAgent}`. `firstContainer`/`secondContainer` → `let`. Helpers: `disposeContainerInPlace(c)` + `applyFighters(cap, second)` (single source of truth). Mutable `clickableTargets` + `rebuildClickableTargets()`. Public `refreshFighters({captain, secondAgent})` с no-op short-circuit. Импорт `unregisterIdleFighter`. |
| `src/scene/CanvasLayer.vue` | `onMounted` async: `await dispatch('agent/fetchAgents')` → captain + secondAgent → `buildPitScene({captain, secondAgent})`. `watch(() => store.getters['agent/agentsList'])` → `pit.refreshFighters`. `stopAgentsWatch` handle cleanup в `onBeforeUnmount`. Hover handler: `userData.labelOverride` приоритет над `labels[id]`. |
| `src/views-v2/PitViewV2.vue` | Click watcher reorganised: `PH_MODAL_IDS = ['ratings','clan','shop','avatar']` whitelist → PhModal; training/matchmaking/create → sub-scene routes; всё остальное (legacy warden/predator + real UUID) → `/v2/fd/:id` default. |
| `src/views-v2/FighterDetailView.vue` | `resolveFighter(key)` async helper — 3 ветки (legacy mock / `useCreatedFighter` cache one-shot / `fetchAgent` + state-check). `agentData` ref, `hudKeyProp` computed. `onMounted` + `watch(route.params.key)` оба async через resolveFighter. Fail → `router.push('/v2')`. |
| `src/components/hud/HudFighterDetail.vue` | Prop `agent: Object` (default null). Computeds `kicker`/`name`/`meta`/`stats`/`resources`/`levels` branch на agent presence. `beltLabel(grade)` helper через `getBeltDisplay`. Real agents → levels mock `{speed:0, power:0, technique:0}`. |
| `src/scene/scenes/FighterDetailScene.js` | `setKey(key)` → `setFighter({key, archetype})`. Glow через `pickFighterColor(archetype)` shared helper. Удалён local `GLOW_COLOR` table. JSDoc описывает контракт (key = mesh variant, archetype = glow id). |
| `src/scene/interaction/useCreateState.js` | Добавлены `creating: false`, `error: null` в state. Оба сбрасываются в `resetCreateState`. |
| `src/views-v2/CreateView.vue` | `onCreatePersist(payload)` async handler: creating=true → await dispatch → setCreatedFighter → materialize → `router.push('/v2/fd/:id)`. Materialize-логика переехала из HudCreate (DOM flash + `startMaterializeAnimation` + `matHandle`). |
| `src/components/hud/HudCreate.vue` | Pure-presentation. `onCreate` собирает payload и emit'ит `create-persist`. Удалены props `getHoloFighter`/`getFlashEl` и emit `materialize-start`. Button disabled на `creating \|\| materializing`. Inline `<.cp-error>` UI. |
| `src/styles/v24/create.css` | Добавлены 7 правил `.app-v2 .cp-error` (pink-tinted bg/border, mono font, ~12px). |

### Удалены (0)

Ничего. Все правки — in-place refactors + additions.

---

## §3 Технические детали

### 3.1 Captain bind flow (Step 2)

`CanvasLayer.onMounted` стал async. Последовательность:

1. `setCanvasRef(canvasEl.value)` (не меняется).
2. `try { await store.dispatch('agent/fetchAgents') } catch { console.warn }`. Failure non-fatal (no-auth / offline / fresh install).
3. `const captain = store.getters['agent/currentCaptain'] || null` — уникальный Agent с `isCaptain=true` в роспаре (User Migration создаёт Fighter #1 как captain lazy на `/me`).
4. `buildPitScene(THREE, aspect, { captain, secondAgent })` (secondAgent wired в Step 3).

В PitScene:
- Если `captain` есть — slot 1 = real captain (`userData.id = captain.id`, `labelOverride = 'View {name}'`, glow по `pickFighterColor(captain.primaryModule)`).
- Если `captain = null` — fallback legacy warden mock (`userData.id = 'warden'`, gold glow).

Click на captain → `click.id = captain.id` (UUID) → PitViewV2 watcher → `/v2/fd/{uuid}` (до Step 6 это было 404; Step 6 сделал FD dynamic).

### 3.2 Refresh on agentsList change (Step 5.5)

Критическая находка Step 7: CanvasLayer строит PitScene **один раз** на AppV2 mount. `/v2/fd/:id` — child route, не перемонтирует CanvasLayer. Возврат из FD → `activateScene('pit')` только переключает активную сцену, не пересобирает контейнеры → новый агент невидим без hard refresh.

**Vuex 4 reactivity trigger.** Getter `agentsList` (`agentState.js:22-27`):
```js
agentsList: (state) => [...state.agents].sort((a, b) => { ... }),
```
Spread + sort создаёт новый array reference на каждый recompute → shallow `watch(() => store.getters['agent/agentsList'])` триггерится без `deep: true` при любой мутации `state.agents`. Сортировка и reactivity — один механизм.

**`refreshFighters({captain, secondAgent})` API.** No-op short-circuit:
```js
const newFirstId = cap ? cap.id : 'warden';
const newSecondId = (cap && second) ? second.id : (!cap ? 'predator' : null);
if (oldFirstId === newFirstId && oldSecondId === newSecondId) return;
```
Защищает от spurious fires (Vuex getter recomputes на любой мутации state.agents, даже когда slot identity не изменился).

**Atomic rebuild через `applyFighters(cap, second)`.** Dispose обоих через `disposeContainerInPlace` → `unregisterIdleFighter` (global registry release) → `parent.remove` → `traverse` с material array-safe disposal. Затем создание новых по slot rules. `clickableTargets` мутируется in-place через `rebuildClickableTargets()` — picker (`createPicker` замыкает targets по ссылке) видит обновления без re-registration.

Per-slot granularity (skip dispose если конкретный slot не изменился) — deferred в Epic 5 polish. Minor visual hiccup (captain idle phase reset при change slot 2), acceptable — refresh происходит пока pit невидим (пользователь в CreateView/FD).

### 3.3 Create persist flow (Step 5)

Sequential phases (backend FIRST, then animate):

1. `onCreate` в HudCreate: guard `creating || materializing` → собирает payload `{name: name.trim(), skin: DEFAULT_SKIN, primaryModule: archetypeId, secondaryModule: archetypeId, tertiaryModule: archetypeId}` → `emit('create-persist', payload)`.
2. `onCreatePersist` в CreateView (async):
   - `creating = true`, `error = null` → button disabled + label `'Creating…'`.
   - `try { agent = await store.dispatch('agent/createAgent', payload) } catch (e) { ... }`.
   - Error: `msg = e.response?.data?.error || e.message || 'Failed to create fighter'` → `createState.error = msg`, `creating = false`, return. Form state (step=3, archetypeId, name) preserved.
   - Success: `setCreatedFighter({id, name, archetype: agent.primaryModule})` → one-shot cache.
3. Phase swap: `creating = false`, `materializing = true`.
4. DOM flash overlay (remove + forced reflow + add `.flash` class) → `startMaterializeAnimation` 1.2s opacity lerp + 700ms pause.
5. `onDone → router.push('/v2/fd/' + agent.id)`.

`matHandle.cancel()` в `onBeforeUnmount` — idempotent, защищает от late onDone → router.push после unmount.

401 self-handles через apiClient interceptor (master/logout). CreateView ловит только business 4xx/5xx.

### 3.4 Dynamic FD (Step 6)

`resolveFighter(key)` — 3-ветка resolution chain:

```js
if (LEGACY_KEYS.includes(key)) {          // 'warden' | 'predator'
  agentData.value = null;                 // HUD uses mock via keyProp
  fd.setFighter({ key, archetype: key });
  return true;
}

const cached = getCreatedFighter();        // one-shot cache from Step 5
if (cached && cached.id === key) {
  clearCreatedFighter();                   // consume
  agentData.value = synthetic(cached);     // Belt 0, ELO 1000, 0-0-0
  fd.setFighter({ key: variant(cached.archetype), archetype: cached.archetype });
  return true;
}

await store.dispatch('agent/fetchAgent', key);  // backend round-trip
const ca = store.state.agent?.currentAgent;
if (!ca || ca.id !== key) return false;    // fail → router.push('/v2')
agentData.value = ca;
fd.setFighter({ key: variant(ca.primaryModule), archetype: ca.primaryModule });
return true;
```

`fetchAgent` **глушит ошибки** (`agentState.js:121-131`, catch без re-throw). Надёжный signal о fail — state-check `currentAgent?.id === key`. Zero-risk для legacy consumers (AgentDetailView x3 + trainAgent), которые тоже читают state после dispatch.

`setFighter({ key, archetype })` contract: `key` управляет 3D mesh variant (warden | predator, т.к. per-archetype variants — Epic 5+), `archetype` управляет glow color через `pickFighterColor`. По умолчанию `archetype = key` (legacy paths).

HudFighterDetail с prop `agent`:
- `beltLabel(grade)` через `getBeltDisplay` → "White Belt", "Yellow Belt", etc.
- `stats`: fights = `totalFights || wins+losses+draws`, winrate = `wins/fights * 100%`, elo, 'To Yellow' = '—' (mock).
- `resources`: `{taps: 0, xp: 0}` для real agents (User-level fields out of Epic 4 scope).
- `levels`: `{speed: 0, power: 0, technique: 0}` для real agents. Upgrade buttons в BranchPanel disabled (Epic 4 title).

### 3.5 Default skin + archetype mapping (Step 0 + Step 5)

**Default skin.** Hardcoded `'skin_m_1.png'` в `HudCreate.onCreate`. Rationale:
- Матчит backend `SKIN_REGEX = /^(skin_(m|w)_\d{1,3}|vip_(k|t)\d{1,2})\.png$/` (`agent.js:30`).
- Совпадает с Prisma `User.skin` default.
- Файл существует в `/public/images/skins/`.

Real skin picker UI — Epic 5 scope (новая panel в Create wizard или Step 2 → extension).

**Archetype mapping.** Step 0 pre-flight check подтвердил:
- Backend `VALID_ARCHETYPES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut']` (`agent.js:22`).
- v2 `ARCHETYPES` в `useCreateState.js:12-49` — те же 6 ids.
- Mapping 1-в-1 — никакого `getBackendArchetype()` helper не требуется. Payload `primaryModule: createState.archetypeId` форвардится напрямую.

`pvpState.generateOpponentFighter` (`pvpState.js:22-23`) использует `['Predator', 'Guardian', 'Ghost', 'Analyst', 'Chaos', 'Tank']` — это frontend mock для visual карточки оппонента в legacy PvP, НЕ backend contract. Отдельная carry-over (Discovery §7.1), не затрагивает Epic 4.

---

## §4 Проверки

- [x] **`node --check`** на всех изменённых .js + extracted `<script>` из .vue по каждому шагу. Все зелёные.
- [x] **Static trace 6 пунктов regression (Step 7)** — все ✅. Покрывают: 1-agent Create flow, 2+ agents click, roster overflow sad path, invalid URL redirect, re-mount after failure, useCreatedFighter one-shot.
- [x] **Grep sanity** — `wardenContainer`/`predatorContainer`/`FD_IDS`/`setKey`/`GLOW_COLOR` после refactor'ов → 0 активных usages (только в комментариях/JSDoc). `getHoloFighter`/`getFlashEl`/`materialize-start`/`onMaterializeStart` после HUD cleanup (Step 5) → 0 references.
- [x] **Build проверка** — sandbox limitation (`vite: not found`, нет `node_modules`), build-verify делегирована Vercel preview per commit. Подтвердил пользователь: зелёный push CLAUDE.md (Step 8.1).
- [ ] **Visual verify на Vercel preview** — 6 пунктов regression требуют clicks в браузере. За пользователем. Критично: **пункт 1** (Test Fighter виден в hub slot 2 после возврата из FD — проверяет Step 5.5 fix) + **пункт 6** (Network tab: `GET /v1/agent/:id` на 2-м визите).
- [x] **Backend `POST /v1/agent/create` работает** — подтверждено `createAgent` action trace (Step 4): принимает `{name, skin, primaryModule, secondaryModule, tertiaryModule}`, возвращает `{agent}` с include tactics+progression, commit ADD_AGENT обновляет `agentsList`.
- [x] **`fetchAgent` state-check approach** — zero-risk fallback против action catch-silent pattern. Прецедент `AgentDetailView.vue:359` (legacy читает state после dispatch тем же путём).

---

## §5 Расхождения — все осознанные

### 5.1 Scope extension — Step 5.5

Не входил в initial ТЗ. Обнаружен в Step 7 как критическая блокирующая находка: CanvasLayer — singleton через AppV2, child routes не перемонтируют его → `agentsList` changes не попадают в hub без full-page refresh.

**Resolution:** добавлен Step 5.5 (hub fighters refresh via `watch(agentsList)` + `refreshFighters` API). Scope extension принят — без него основной flow Create → hub → new agent visible не работает. Прецедент 3Ba Step 2 (`unregisterScene` API добавлен аналогично сверх ТЗ).

**Lesson:** жизненный цикл в SPA требует explicit reactivity к Vuex state, не полагаться на on-mount-only fetch.

### 5.2 HudPit captain name bind — skipped

ТЗ Step 2 §6 требовал заменить `<span class="hp-name">YURII.VARVAROV</span>` на prop `captainName`. В реальности этого элемента нет в HudPit/TopBar. UI slot для captain name в hub отсутствует в прототипе (TopBar = Resources / "THE PIT" / avatar).

**Resolution:** skip, carry-over в Epic 5 polish как UX-решение (нужно ли вообще показывать captain name в top-bar hub'а, где именно его рендерить).

### 5.3 `fetchAgents` в CanvasLayer, не PitViewV2

ТЗ Step 2 §1-2 указал `PitViewV2.onMounted`. Claude Code переместил в `CanvasLayer.onMounted`. Обоснование: scene строится в CanvasLayer, PitViewV2 держит только HUD. Abstraction boundary не нарушается — CanvasLayer уже имеет cross-sibling state через `useCanvasRef`/`useHoverState`. Vuex store в CanvasLayer не breaks pattern — он уже depends on `setCanvasRef`, `pickClick`, `useHoverState` composables из Epic 2/3A.

**Resolution:** accepted. Логика симметрична — где строится scene, туда и feeding data.

### 5.4 Atomic rebuild обоих slots в `refreshFighters`

Текущая реализация `applyFighters` всегда перестраивает оба контейнера при любом change. Per-slot diff (dispose/rebuild только реально изменённого slot) отложен в Epic 5 polish.

**Rationale:** minor visual hiccup (captain idle phase reset при change slot 2), acceptable — refresh происходит пока pit невидим (пользователь в CreateView/FD). Рефактор под per-slot diff потребует более сложной logic сравнения + отдельных dispose branches; optimization без user-facing benefit сейчас.

### 5.5 Duplicate name + auto-promote captain — backend gaps

**Duplicate name.** Prisma schema не имеет `@@unique([ownerId, name])`. Duplicate name НЕ вернёт 400. Step 3 sad path verified через **roster overflow** (достижимый 400 — club level 1 + 2 агентов → 3-я попытка вернёт `Agent roster is full`). Alt trigger для error UI mechanics работает.

**Auto-promote first agent to captain.** Backend `POST /agent/create` не делает auto-captain. `captainService.setCaptain` вызывается только из `PUT /agent/:id/captain` (`agent.js:329`). Prisma default: `isCaptain: false`. `userMigrationService` создаёт Fighter #1 с `isCaptain=true` (lazy на `/me`) — покрывает existing users. Hypothetical 0-agent accounts (без миграции) остаются в edge case: новый агент не показывается в hub (gate `captain ? agentsList[1] : null`).

**Resolution:** оба — carry-over в Epic 5 (требуют backend changes + frontend pre-check / post-create `setCaptain` dispatch).

### 5.6 Осознанные отклонения Claude Code

1. **Shared `pickFighterColor` helper** (Step 6). Вынесен в `archetypeColors.js` вместо дублирования в PitScene и FighterDetailScene. ТЗ §2 оставил выбор «удобнее» — Claude Code выбрал shared. Reuse в двух сценах + чище dependency graph.
2. **Materialize moved HUD → CreateView** (Step 5). HUD стал pure-presentation; CreateView orchestrator владеет sceneApi + flashRef + matHandle. ТЗ §3 описывал flow в HUD, Claude Code адаптировал под правильное ownership. Симметрично паттерну 3Bb HudMatchmaking / MatchmakingView.
3. **Default skin `'skin_m_1.png'`** — hardcoded с reference на SKIN_REGEX + Prisma default. Альтернативы (backend make optional, frontend skin selection UI 4-м шагом) требовали бы scope extension.
4. **`refreshFighters` no-op short-circuit** on unchanged ids — optimization, защищает от лишних dispose cycles при spurious Vuex getter recomputes.
5. **`labelOverride`** в captain container userData — per-instance hint text для UUID-бойцов. Не в ТЗ, но необходимо (статичный `labels` словарь не знает про UUID). Минимальное расширение CanvasLayer hover handler — `userData.labelOverride || labels[id] || ''`.
6. **Back button в HudCreate disabled на creating/materializing.** UX-решение для предотвращения race с cancel handle + unmount. Не в ТЗ, но логично (если backend создаёт агента, Back до resolve — потенциально создаст orphan без navigation).

---

## §6 Уроки для Epic 5

1. **Жизненный цикл в SPA.** CanvasLayer singleton через AppV2 — child routes (`/v2/fd/:id`, `/v2/create`, etc.) не перемонтируют его. Любые cross-view changes Vuex state требуют `watch` в CanvasLayer для перерисовки scene. **Для Epic 5:** если новая scene зависит от Vuex data — watcher обязателен с первого шага. Прецедент Step 5.5: без watcher весь Create flow сломан.

2. **Vuex 4 reactivity через getter spread.** `agentsList: (state) => [...state.agents].sort(...)` создаёт новый array reference каждый recompute → shallow watch триггерится без `deep: true`. Паттерн для других reactive Vuex → scene bindings (например, будущий `captainProgression` watch для branch columns).

3. **State-check after silent-catch action** — `fetchAgent` глушит ошибки (`catch` без re-throw), state-check через `store.state.agent.currentAgent?.id === key` — единственный надёжный signal. Для **новых** actions — рекомендуется explicit return status или throw (не правим legacy, чтобы не сломать AgentDetailView). Carry-over: explicit return patterns в Vuex actions — Epic 5 polish candidate.

4. **Scope extension при blocking findings.** Step 5.5 добавлен за пределами initial ТЗ, т.к. Step 7 обнаружил блокирующий баг основного flow. Прецедент 3Ba Step 2 (`unregisterScene` API добавлен аналогично). **Для Epic 5:** если regression test находит blocking bug — scope extension правильный путь, не hotfix после close.

5. **HUD ↔ orchestrator boundary.** Step 5 переместил materialize animation из HUD в CreateView. Владелец resources (scene, refs, cancel handles) = orchestrator; HUD = pure-presentation. Симметрично 3Bb Matchmaking view (startSearchLogAnimation cancel handle в MatchmakingView). **Для Epic 5:** новые view/HUD пары — orchestrator owns resources, HUD emits events.

6. **Pre-flight check перед backend wiring.** Step 0 подтвердил archetype names 1-в-1 → избежали mapping helper. **Для Epic 5:** любое wiring Vuex ↔ backend начинать с pre-flight (`grep VALID_*` backend, schema check, curl endpoint если нужен). Время на pre-flight << cost расхождений.

7. **Peer-review handoff работает.** 3 неточности в Epic 4 handoff'е найдены планированием до старта ТЗ (matchmaking filter backend support, duplicate name uniqueness, auto-promote captain). Peer-review → discovery-ТЗ → facts → informed scope. Механизм подтверждён трижды (3Bc разрешил 3 неточности, discovery Epic 4 выявил 6+ фактов, Step 7 regression нашёл блокирующий bug).

8. **Preemptive edit-split в финале.** Step 8 CLAUDE.md подсекция — 4 Edit'а ≤50 строк в рамках одного commit. 0 timeout'ов. Паттерн 3Bc final 13.1. **Для Epic 5:** каждый финал = split на 3 commit'а (CLAUDE.md / FINAL_REPORT / HANDOFF) + микро-Edit'ы ≤50 строк внутри каждого.

---

## Footer

**Эпик 4 — CLOSED.** 8 функциональных коммитов + 3 финальных. Visual verify на Vercel preview за пользователем (2 критичных пункта: hub refresh после Create + Network tab на 2-м визите dynamic FD).

Route table `/v2` дополнена dynamic FD — любой agent UUID роутится в `/v2/fd/:uuid` с fetchAgent или cache hydration. Legacy mocks (`warden`/`predator`) сохранены.

**Переход к Epic 5.** План в `docs/visual-migration/HANDOFF_EPIC5_CHAT_HANDOFF.md`. Карта вариантов: polish (DRY helpers + i18n + 4 fighter 3D variants + UX edge fixes) / missing screens (Profile / Ratings / Clan / Shop на `/v2/*`) / matchmaking backend integration (filter wiring: archetype + belt в очередях).
