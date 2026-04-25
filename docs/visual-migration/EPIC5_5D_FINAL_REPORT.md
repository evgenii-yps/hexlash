# Sub-Epic 5D — Clan — Final Report

**Status:** ✅ COMPLETE — 2026-04-25
**Branch:** `claude/clan-view-completion-C97qk` (run-local designated)
**Predecessor:** `claude/implement-ratings-endpoint-4BPEk` (5C run)
**Merge target:** `visual-v2` (в конце Epic 5)
**Commit range:** `ecedd20` (Step 1) → `041e7c1` (Step 13 CLAUDE.md) + `<this commit>` (Step 14 final part 2).

**Scope:** Третья views-миграция Эпика 5 после 5B (Profile) + 5C (Ratings). Клик по clan plinth в hub → `/v2/clan` с 2-state HUD (no-clan browse + Create CTA / in-clan header + roster + actions) поверх lazy ClanScene (octagonal hall + 3 flag totems + warm pink/gold rim lighting). Path A (prototype-first) per Q1; legacy `ClanView.vue` + `/clan/:id` route нетронуты — fragments `CreateClan`, `ClanEdit`, `ClanConfirmModal` reused через augmentation pattern (Q2 Hybrid).

---

## §1 Шаги и коммиты

26 commits на designated branch (8 functional Steps + 6 Step 5 hot-fix attempts + revert + correct port + fine-tune + 4 Step 6 parts + 4 Step 7 commits + 2 Step 8 commits + 1 Step 13 + Step 14 этот). Все hashes верифицированы через `git log --oneline -30 | grep epic5-5d` перед записью.

| # | Commit | Что | Files |
|---|---|---|---|
| 1 | `ecedd20` | route + entry switch + HudClan/ClanView stubs | router/index.js, PitViewV2.vue, HudPit.vue, ClanView.vue (new), HudClan.vue (new), clan.css (new stub), hexlash-v24.css |
| 2 | `eed7a9d` | ClanScene scaffold (5A `buildOctagonalRoom` — 6th consumer) | ClanScene.js (new) |
| 3 | `f44d6e4` | lighting + dust (5A `createDustField` — 6th consumer) | ClanScene.js |
| 4 | `86cafac` | clan flag totems | clanFlag.js (new), ClanScene.js |
| 5 | `e287a3f` | view orchestrator with lazy scene lifecycle (stable baseline) | ClanView.vue |
| 5 hot-fix #1 | `f68846c` | rim bump + wall/floor brighten (false trail attempt 1) | ClanScene.js |
| 5 hot-fix #2 | `4ba9ee0` | ambient/hemi match Profile + rim distance/intensity (attempt 2) | ClanScene.js |
| 5 hot-fix #3 | `b424c2b` | light targets to floor + walls (attempt 3) | ClanScene.js |
| 5 hot-fix #4 | `824198c` | full Profile clone lighting verbatim (attempt 4) | ClanScene.js |
| 5 hot-fix #5 | `032f74e` | Profile camera tilt + colors match (attempt 5) | ClanScene.js |
| 5 hot-fix #6 | `be0e563` | emissive accent geometry (H1 fix) | ClanScene.js, clanFlag.js |
| diagnostic | `dd05fbe` | debug: H1 emissive ball test (debug/5d-h1-emissive branch — since deleted) | ClanScene.js |
| revert | `51c3752` | revert step 5 hot-fix series — return to stable e287a3f baseline | ClanScene.js, clanFlag.js |
| 5 correct | `f26d53f` | step 5 hot-fix (correct) — prototype port with exposure 2.3 retune | ClanScene.js |
| 5 fine-tune | `f88fbf7` | key intensity + cone angle для outer flag readability | ClanScene.js |
| 6 part 1 | `9027368` | clan.css port (prototype 2899-3060: back / title / noclan / hero / browse) | clan.css |
| 6 part 2 | `21da4dc` | clan.css port (prototype 3060-3220: clan-card / clan-ingrid / header / crest / hstats) | clan.css |
| 6 part 3 | `44df5d8` | clan.css port (prototype 3222-3392: side / roster / @media 820px) | clan.css |
| 6 part 4 | `9e07013` | HudClan template + script + scoped selector fix `.hud-clan → .clan-hud` | HudClan.vue |
| 7 prep | `6060c00` | CreateClan.vue defineExpose({ openModal }) augmentation | CreateClan.vue |
| 7 | `4ecfee8` | no-clan state + BROWSABLE_CLANS + CreateClan lazy reuse | HudClan.vue, clanMock.js (new) |
| 7 hot-fix | `702b341` | remove display:none from CreateClan host (modal Teleport blocked by parent display) | HudClan.vue |
| 7 augment | `1255898` | CreateClan v2-aware navigation (TODO 5G full migration revisit) | CreateClan.vue |
| 8 prep | `21949f8` | ClanEdit.vue defineExpose({ openModal }) + v2-aware dissolve navigation | ClanEdit.vue |
| 8 | `4b5e105` | in-clan body + ClanEdit lazy + Leave confirm + MY_CLAN_MEMBERS | HudClan.vue, clanMock.js |
| 11 | — | static trace regression (read-only, 0 regressions, no commit) | — |
| 13 | `041e7c1` | final part 1 — CLAUDE.md Sub-Epic 5D section + lessons #19-24 | CLAUDE.md |
| 14 | this | final part 2 — EPIC5_5D_FINAL_REPORT.md | docs/visual-migration/EPIC5_5D_FINAL_REPORT.md (new) |
| 15 | next | final part 3 — HANDOFF_EPIC5_5E_CHAT_HANDOFF.md | (new) |

Steps 9 (no-clan polish) + 10 (in-clan polish) skipped no-op — Step 7 + Step 8 уже доставили full state coverage; Step 12 (regression) выполнен read-only без commit.

## §2 Файлы

### Созданы (6)

| File | Lines | Contract |
|------|-------|----------|
| `src/views-v2/ClanView.vue` | 84 | Orchestrator — lazy `buildClanScene` + `registerScene('clan')` + `activateScene` в `onMounted`, строгий teardown `activateScene('pit') → unregisterScene → dispose` в `onBeforeUnmount`. Esc/Back → `/v2`. Identical structure 5B/5C parity (+1 line vs RatingsView 83). |
| `src/scene/scenes/ClanScene.js` | 149 | `buildClanScene(THREE, aspect) → { scene, camera, tick, dispose }`. Octagonal hall (R=14 H=8 fogDensity=0.05 via 5A `buildOctagonalRoom` — 6th consumer) + AmbientLight 0.4 + HemisphereLight + 3 SpotLight (warm key 1.2 + pink rim L 0.25 + gold rim R 0.2) + 3 flag totems via `makeClanFlag` factory + 5A `createDustField` (60 warm particles, 6th consumer). FOV 42 (Q1 prototype-first) — diverges Profile FOV 40 / Ratings FOV 44. Camera pos `(0, 2.6, 7.5)` → `(0, 1.6, 0)` + sin sway. |
| `src/scene/objects/clanFlag.js` | 90 | `makeClanFlag(THREE, { tag, color, x }) → THREE.Group`. Pole (CylinderGeometry 0.05 × 4) + brushed metal cap + cloth (PlaneGeometry 1.6 × 2.0) с canvas-texture (CanvasTexture 256×320 colored bg + tag text). No colorSpace override per codebase convention. 3 instances в ClanScene: PRED pink `#ff066f` @ x=-3.5 / IRW gold `#D4A843` @ x=0 / ANA cyan `#4dd9ff` @ x=+3.5. |
| `src/components/hud/HudClan.vue` | 430 | HUD — 2 states (no-clan: hero + Create CTA + browse list / in-clan: header + side panel + roster + Leave + Edit). `<style scoped>` 2-rule pointer-events block (mandatory урок #12, fixed Step 6 part 4 from `.hud-clan → .clan-hud`). Lazy CreateClan + ClanEdit via `shallowRef + markRaw + defineExpose({ openModal })` 5B precedent. ClanConfirmModal (controlled-props) used as-is для Leave confirm. Reactive xpPct + crestColor computeds. **Над soft-300 limit** — splitting candidate (5G polish). |
| `src/styles/v24/clan.css` | 473 | 1-to-1 port prototype `hexlash_v24.html` 2899-3392, scoped `.app-v2`. Port в 3 commits (Steps 6 parts 1/2/3) per урок #9 split-write. Sections: back btn / title / no-clan hero / browse list / clan-card grid / header + crest + hstats / side panel / roster / `@media max-width: 820px`. |
| `src/data/clanMock.js` | 34 | BROWSABLE_CLANS (6 mock entries, prototype 11001-11008 verbatim) + MY_CLAN_MEMBERS (14 roster rows, prototype 11010-11024 verbatim). Field shape: `{ handle, role, elo, wins, losses, wr, lastSeen }` + optional `self: true` (one row marks current user). lastSeen='online' carries online-indicator semantic. |

### Augmented (2)

- `src/components/fragments/clan/CreateClan.vue` (+22 / −7) — `defineExpose({ openModal })` (5B ConnectWallet pattern) + v2-aware navigation conditional. Step 7 prep + augment commits.

  ```js
  // Append at end of <script setup>:
  defineExpose({ openModal: () => { showCreateClubModal.value = true; } });

  // Wrap existing router.push в success callback:
  if (router.currentRoute.value.path !== '/v2/clan') {
    router.push(`/clan/${createdClan.id}`);
  }
  ```

- `src/components/fragments/clan/ClanEdit.vue` (+22 / −5) — same defineExpose + v2-aware dissolve navigation conditional (skips `router.push('/ratings/clans')` when on `/v2/clan`). Step 8 prep commit.

### Reused as-is (1)

- `src/components/fragments/clan/ClanConfirmModal.vue` — controlled-props pattern (`<ClanConfirmModal v-if="leaveOpen" :title="..." @confirm="..." @cancel="..."/>`). Не требует defineExpose — visibility управляется родителем через `v-if`.

### Изменены (3)

- `src/router/index.js` — `V2Clan` route (`/v2/clan`) добавлен в `v2Routes.children` после `V2Ratings`. **No `:id` param** — Q3 decision (state resolution в view, current user's clan).
- `src/views-v2/PitViewV2.vue` — `PH_MODAL_IDS` стал `['shop']` (clan removed); explicit branch `click.id === 'clan' → router.push('/v2/clan')` добавлен в click watcher.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.clan` entry удалён. Breadcrumb-коммент "'clan' removed in Epic 5 Sub-Epic 5D Step 1".
- `src/styles/hexlash-v24.css` — `@import './v24/clan.css'` после ratings.css.
- `CLAUDE.md` — 5D section inserted (commit `041e7c1`, Step 13).

### Удалены (0)

Нет. Legacy `/clan/:id` route + `src/views/ClanView.vue` + 10 fragments в `src/components/fragments/clan/` — нетронуты (Q2 Hybrid: simple modals reused через augmentation, complex page content нет — v2 portирует с нуля).

## §3 Технические детали

### 3.1 Lazy sub-scene — 5B/5C parity

ClanView.vue (84 lines) — 1-line дельта vs 5B/5C ProfileView/RatingsView (83 lines each). `onMounted` последовательность: `sceneApi = buildClanScene(THREE, aspect)` → `registerScene('clan', { scene, camera, tick })` → `activateScene('clan')` → `addEventListener('resize' + 'keydown')`.

`onBeforeUnmount` строгий порядок (5B precedent verbatim):
1. `removeEventListener('keydown')`.
2. `removeEventListener('resize')` + `onResize = null`.
3. `activateScene('pit')` — **FIRST**, renderLoop swap back prevents next-tick touch of freed scene.
4. `unregisterScene('clan')` — registry delete.
5. `sceneApi.dispose()` + `sceneApi = null` — geometry/material cleanup LAST.

### 3.2 5A helpers — 6th consumer для обоих

`buildOctagonalRoom(THREE, scene, opts)` + `createDustField(THREE, opts)` — 6th consumer (Training/Matchmaking/Create/Profile/Ratings/Clan). Helpers stable; 5D reuse pattern работает без модификаций. Params для Clan dust: `count: 60, color: 0xffd9c8, opacity: 0.3` — warm палитра matching key spot.

### 3.3 Path A decision — prototype-first (Q1)

Legacy `ClanView.vue` (большая структура с tabs Members/Activity/Settings, `ClanPageContent.vue` shared component, owner controls modal flow) **не переносится в v2**. Новая ментальная модель — 2-state HUD (no-clan / in-clan) per prototype 4887-4981. Legacy `/clan/:id` route + 10 fragments остаются параллельно, augmentation pattern (defineExpose + v2-aware navigation conditional) позволяет reuse 3 modals (CreateClan, ClanEdit, ClanConfirmModal) без duplication.

Path A confirmed как **default для оставшихся 5E-5G** если prototype расходится с legacy. 3-й precedent в Epic 5 (5C unified leaderboard, 5D 2-state Clan, 5B 4-card Profile).

### 3.4 Q2 Hybrid — augmentation для legacy modal reuse

Lazy modal pattern из 5B refined для 5D (двойной reuse + v2-aware conditional):

```js
// HudClan.vue
const CreateClanComp = shallowRef(null);
const createClanMounted = ref(false);
const createClanRef = ref(null);

async function loadCreateClan() {
  if (CreateClanComp.value) return;
  const mod = await import('@/components/fragments/clan/CreateClan.vue');
  CreateClanComp.value = markRaw(mod.default);
}

async function openCreateClan() {
  await loadCreateClan();
  createClanMounted.value = true;
  await nextTick();
  await nextTick();
  createClanRef.value?.openModal?.();
}
```

В legacy `CreateClan.vue` — additive `defineExpose({ openModal })` + conditional navigation (skip `router.push` если currentPath === `/v2/clan`). Same pattern для `ClanEdit.vue` (Step 8 prep).

### 3.5 Q3 decision — `/v2/clan` без `:id` param

Original ТЗ §5 spec'ал `/v2/clan/:id` (legacy `/clan/:id` parity). Финал: `/v2/clan` без param — **single URL, state resolution в view** через `master.userData.clanId` lookup. Rationale:

- Cleaner URL — не нужен deep-link на specific clan (own clan only в v2).
- Visitor view (`/clan/:id` для чужих) остаётся в legacy — отдельная UX тема (потенциально 5G polish).
- No-clan state не требует `/v2/clan/none` ugly redirect — same `/v2/clan` path с branch'ем на `userData.clanId`.

### 3.6 Q4 owner controls — lazy reuse via augmentation

Step 8 ships full in-clan body с lazy ClanEdit modal + Leave confirm via ClanConfirmModal. Edit btn (owner-only) → `openClanEdit()` → dynamic import ClanEdit + defineExpose openModal. Leave btn → ClanConfirmModal (controlled-props, не defineExpose). Disband flow — внутри ClanEdit (existing legacy logic) + v2-aware navigation skip per step 8 prep.

Invite flow — `console.info` stub в HudClan (no legacy invite modal ready, deferred).

### 3.7 Step 5 hot-fix narrative — false trail before correct port

Step 5 потребовал 5 sequential hot-fix attempts на ложной траектории lighting/camera/material tuning **прежде чем** correct port был обнаружен. Полная chronology:

1. `e287a3f` — stable Step 5 baseline (view orchestrator + initial scene values).
2. `f68846c` (hot-fix #1) — rim bump + wall/floor brighten. Не помогло.
3. `4ba9ee0` (#2) — ambient/hemi match Profile + rim distance/intensity. Не помогло.
4. `b424c2b` (#3) — light targets to floor/walls (key 0/0.5/0, rims 0/1/0). Не помогло.
5. `824198c` (#4) — full Profile clone lighting verbatim (abandon prototype intent). Не помогло.
6. `032f74e` (#5) — Profile camera tilt + floor/wall colors clone. Не помогло.
7. `be0e563` (#6) — emissive accent geometry on flag totems (H1 hypothesis: composition issue, not lighting). Подтвердило hypothesis.
8. `dd05fbe` — diagnostic debug branch `debug/5d-h1-emissive` (emissive ball test geometry). Confirmed H1: visible accents need composition fix, не intensity.
9. `51c3752` — **revert step 5 hot-fix series** через `git checkout e287a3f -- file` (atomic single-file checkout) — sequential `git revert --no-commit × 6` failed на overlapping conflicts. Вернулись к stable baseline.
10. `f26d53f` — **correct port** prototype values verbatim + intensity ~50% retune для exposure 2.3 compensation (CanvasLayer renderer.toneMappingExposure = 2.3 vs prototype 1.05).
11. `f88fbf7` — fine-tune key cone π*0.25 → π*0.35 + intensity 0.8 → 1.2 + ambient 0.3 → 0.4 для outer flag readability (off-axis geometry exposure compensation).

**Lesson absorbed → урок #19 (exposure compensation FIRST), #20 (renderer settings delta as primary diagnostic), #21 (cone-angle adjustments belong в exposure toolkit).** См. §6.

**Process learning:** atomic single-file `git checkout <baseline> -- <file>` — emergency revert pattern когда sequential `git revert` failed на overlapping diffs. Documented для future precedent.

### 3.8 Hot-fixes Step 7 + 8 — modal Teleport + v2 navigation

Three hot-fix / augmentation commits после functional Steps 7-8:

- **`702b341` (Step 7 hot-fix)** — display:none gotcha. Lazy CreateClan host элемент изначально имел `style="display: none"` (5B ConnectWallet pattern). На v2 показалось логичным — host invisible, modal Teleport'ится в body. **Bug:** Vuetify VModal `<v-dialog>` Teleport visibility cascade блокируется ancestor display:none **despite** markup teleporting к body. Fix: убрать display:none — host рендерится, modal Teleport open работает. **Lesson #23.**

- **`1255898` (Step 7 augment)** — CreateClan v2-aware navigation. Existing legacy `router.push('/clan/' + createdClan.id)` после успешного create в `<v-dialog>` close handler. На v2 user landed на legacy clan page. Fix: conditional `if (currentPath !== '/v2/clan') router.push(...)`. Минимальное additive изменение, full v2-flow refactor — separate scope.

- **`21949f8` (Step 8 prep)** — same conditional pattern в ClanEdit.vue dissolve flow (`router.push('/ratings/clans')` после disband теперь skip'ится на v2). **Lesson #24.**

### 3.9 HUD selector typo fix — Step 6 part 4

Step 1 stub `ecedd20` shipped `<style scoped>` block с `.hud-clan` selector — но template root class был `.clan-hud` (typo). Pre-commit grep "block exists" check passed — функционально pointer-events block был broken. Step 6 part 4 (`9e07013`) обнаружил при HUD body ship + fixed (`.hud-clan` → `.clan-hud`). **Lesson #22 — pre-commit grep должен включать literal selector ↔ template root class match check, не только `<style scoped>` block existence.**

## §4 Проверки

- **`node --check`** на созданных `.js` файлах (ClanScene.js, clanFlag.js, clanMock.js) — pass на каждом шаге.
- **`npm run build`** — pass на каждом из 26 commits (Vercel preview deploys активны).
- **Grep sanity:**
  - `MODAL_CONTENT.clan` refs в `src/` — 0 (only docs HANDOFF mention).
  - `'clan'` в `PH_MODAL_IDS` array — 0 (array is `['shop']`).
  - `createDustField` + `buildOctagonalRoom` grep — **6th consumer confirmed** (Training/Matchmaking/Create/Profile/Ratings/Clan).
  - `<style scoped>` block в HudClan.vue — verified present + selector match `.clan-hud` после Step 6 part 4.
  - `defineExpose` в CreateClan.vue + ClanEdit.vue — verified augmented.
- **Static trace regression (Step 11, read-only, 0 regressions):**
  1. 3D click path — explicit branch `click.id === 'clan' → /v2/clan` correctly placed.
  2. Legacy cleanup — MODAL_CONTENT / PH_MODAL_IDS clean.
  3. Scene lifecycle — teardown strict order 5B/5C parity.
  4. State branching — `userData.clanId` resolution in HudClan computed.
  5. Lazy modals — CreateClan + ClanEdit lazy import + defineExpose ref access.
  6. v2-aware navigation — conditional `currentPath !== '/v2/clan'` skip in legacy modals.
  7. ClanConfirmModal controlled-props — Leave / Disband flows correctly bound.
- **User visual verify** (Vercel preview):
  - Step 5 — scene (room/lighting/dust/flags) — accepted после correct port `f26d53f` + fine-tune `f88fbf7` ("темновато но норм" — accepted state).
  - Step 6 — HUD skeleton (back/title/no-clan hero/in-clan grid placeholder) ✓.
  - Step 7 — no-clan state (CreateClan modal opens, BROWSABLE_CLANS render, JOIN btns) ✓.
  - Step 8 — in-clan state (header + side + roster + ClanEdit modal opens, Leave confirm flow) ✓ (test_jen_1 account, clan "sdfsdf"/"bzdfgbdf").
- **Memory stability** — static trace confirms strict teardown order; full DevTools Performance test deferred (5B pattern parity, не блокирующий).
- **Legacy untouched** — `src/views/ClanView.vue`, `src/components/fragments/clan/` 10 fragments (с 3 augmentation), `/clan/:id` route — 3 fragments augmented additively (defineExpose + conditional navigation), zero behavioral regression в legacy view paths.

## §5 Расхождения — осознанные

### 5.1 Path A decision — prototype-first (Q1)

Legacy ClanView табовая структура (Members/Activity/Settings + ClanPageContent shared) **не переносится в v2**. Новая 2-state модель (no-clan / in-clan) per prototype 4887-4981. Legacy `/clan/:id` остаётся параллельно. См. §3.3.

### 5.2 Q2 Hybrid — augmentation поверх 3 legacy modals

Legacy `CreateClan.vue` + `ClanEdit.vue` augmented additively (defineExpose + conditional navigation) для lazy reuse в v2. `ClanConfirmModal.vue` reused as-is (controlled-props). Остальные 7 fragments (`ClanPageContent`, `ClanStats`, `ClanAvatar`, `ClanOwnerAvatar`, `ClanWithdraw`, `ClanActivityFeed`, `MyClanTab`) **не reuse'ятся в v2** — markup port в HudClan / clan.css inline.

### 5.3 Q3 — `/v2/clan` без `:id` param

Original ТЗ §5 спецал `/v2/clan/:id` (legacy parity). Финал — `/v2/clan` cleaner URL + state resolution в view через `userData.clanId`. См. §3.5.

### 5.4 Q4 — lazy reuse via augmentation (not port)

Owner controls (Edit / Disband) — lazy ClanEdit reuse через defineExpose, не v24-port. Leave confirm — ClanConfirmModal controlled-props. Минимизирует duplicate maintenance. См. §3.6.

### 5.5 Step 5 false trail — exposure compensation discovery

5 hot-fix attempts на ложной траектории (lighting/material/camera tuning) перед correct port обнаружен. Root cause — exposure delta prototype 1.05 vs v2 2.3 не сравнено как primary diagnostic. Корректный port — prototype values verbatim + intensity ~50% retune. **Lesson #19-21.** См. §3.7.

### 5.6 Cone-angle widened от prototype

Prototype 10867 spotlight cone `Math.PI * 0.25` — на target hardware (exposure 2.3) outer flag totems @ x=±3.5 падают в ambient-only lighting (key cone не охватывает). Fine-tune `f88fbf7`: cone π*0.25 → π*0.35 + intensity 0.8 → 1.2. **Lesson #21 — cone-angle adjustments belong в exposure compensation toolkit вместе с intensity scaling.**

### 5.7 Step 6 part 4 — HUD selector typo

Step 1 stub shipped `.hud-clan` scoped selector ≠ template root `.clan-hud`. Pre-commit grep "block exists" check passed (formal), функционально broken. Caught Step 6 part 4 при body ship. **Lesson #22 — selector ↔ template root match check.** См. §3.9.

### 5.8 Step 7 hot-fix — display:none cascade

Lazy CreateClan host элемент с `style="display: none"` (5B ConnectWallet pattern) блокировал Vuetify VModal Teleport visibility cascade. Fix: убрать display:none. **Lesson #23 — pure-modal legacy doesn't need display:none host pattern; legacy template having inline trigger button does.** См. §3.8.

### 5.9 Step 7 + 8 augment — v2-aware navigation conditionals

Legacy CreateClan + ClanEdit имеют `router.push('/clan/' + id)` / `router.push('/ratings/clans')` после success/disband. На v2 user landed на legacy. Fix: conditional `currentPath !== '/v2/<area>'` skip. Минимальное additive изменение, full v2-flow refactor — отдельный scope (deferred). **Lesson #24.**

### 5.10 HudClan 430 lines > soft-300

HudClan.vue превышает soft-300 limit. 5G polish candidate для splitting (HudClanNoClan / HudClanInClan / HudClanModals sub-components). Не блокирующий для 5D completion.

### 5.11 Mock data — clanMock.js

BROWSABLE_CLANS + MY_CLAN_MEMBERS — port prototype 11001-11024 verbatim. Real backend wiring (clan list API, member list API с roles + WR + lastSeen) deferred в PvP-integration sub-epic. См. §7.

### 5.12 Visual mood "темновато но норм"

User accepted post fine-tune `f88fbf7` state ("темновато но норм"). Visible accents through pink/gold rims читаются, key cone охватывает 3 flags, dust field warm. Polish дальше — 5G visual mood pass (если требуется).

### 5.13 Invite flow stub

`console.info` placeholder в HudClan invite btn — no legacy invite modal ready (BackgroundClan invite system uses notification, не modal). Real invite flow — отдельный scope.

### 5.14 Roster member shape — depends on real API

MY_CLAN_MEMBERS field shape `{ handle, role, elo, wins, losses, wr, lastSeen, self? }` — prototype-first. Real backend ClanMember shape (Prisma User join + ClanRole) может отличаться. Confirm shape перед PvP-integration mapping pass.

### 5.15 foundedStr Date coercion — depends on Date wrapping

`clan.createdAt` format unknown — depends on backend serialization (ISO string / Date object / epoch). Per урок #3 (5B precedent) — explicit `new Date(raw)` coercion + isNaN guard если real data binding.

## §6 Уроки для 5E и дальше

Aggregate всех уроков 5A/5B/5C + новых из 5D — 24 пункта total. Protocol для 5E opening — прочитать §6 5C FINAL_REPORT + этот §6 + §3 HANDOFF 5E.

### 19. Exposure compensation FIRST при port'е prototype scenes

**(5D §3.7 + §5.5.)** При port'е prototype scenes в v2 — сравнить `renderer.toneMappingExposure` prototype vs v2 (1.05 vs 2.3 в нашем случае) **перед любой lighting tune**. Prototype values verbatim + exposure compensation = single source of truth, не "Profile parity tune". Frankenstein-mode (Step 5 hot-fix series) cost 5 commits + 5 visual verifies до того как корректный port был обнаружен.

**Protocol для 5E+:**
- Step 0 pre-flight grep: `grep "toneMappingExposure" src/scene/CanvasLayer.vue` + сравнить с prototype `<canvas>`/renderer setup в `hexlash_v24.html`.
- При visual readability ambiguity — **не tune lighting blindly** до verify exposure delta.

### 20. Renderer settings delta как primary diagnostic

**(5D §3.7.)** Exposure / tonemapping / colorspace mismatches accountfor major fraction of "не выглядит как prototype" issues. При visual mismatch — first compare prototype renderer settings vs v2 CanvasLayer settings, не tune scene values.

**Protocol для 5E+:** При user visual feedback "не так как должно" — Step 0 diagnostic = prototype renderer settings dump (toneMapping / exposure / colorSpace / outputColorSpace) vs v2 CanvasLayer state.

### 21. Cone-angle adjustments belong в exposure compensation toolkit

**(5D §3.7 + §5.6.)** Exposure boost изменяет light falloff geometry для off-axis geometry (multiple posts / fighters / pillars away from origin) — cone width должна следовать boost иначе off-cone geometry падает в ambient-only lighting.

**Protocol для 5E+:** Exposure compensation при port'е — adjust both intensity (~50% reduction для exposure 2x boost) **и** cone angle (~1.4x widening для off-axis coverage). Document в FINAL_REPORT §5 Расхождения.

### 22. Pre-commit grep для HUD scoped style — selector ↔ template root match

**(5D §3.9 + §5.7.)** Step 1 stub shipped `.hud-clan` scoped selector ≠ template root `.clan-hud` (typo). Formal "block exists" grep passed, функционально broken.

**Protocol для 5E+:** Pre-commit verify обязан включать literal selector match check:

```bash
# Extract template root class:
root_class=$(grep -oP 'class="\K[a-z-]+(?=-hud")' src/components/hud/HudX.vue | head -1)
# Verify scoped block matches:
grep "\.${root_class} {" src/components/hud/HudX.vue || echo "MISMATCH — fix scoped selector"
```

Convention: `{name}-hud` для template root class (clan-hud, ratings-hud, pit-hud). Exception: `hud-profile` legacy from 5B.

### 23. display:none на lazy modal host pattern — conditional на legacy template

**(5D §3.8 + §5.8.)** 5B ConnectWallet `display: none` на lazy `<component :is>` host pattern требует legacy template having inline trigger button to hide. Pure-modal legacy (только VModal в template) doesn't need it. Vuetify VModal Teleport visibility cascade блокируется ancestor display:none **despite** markup teleporting к body.

**Protocol для 5E+:** Pre-copy verify legacy template:
- Has inline btn? → `style="display: none"` на host OK (5B ConnectWallet pattern).
- Pure modal (только VModal/VDialog)? → **НЕ** добавлять display:none (5D CreateClan/ClanEdit pattern).

### 24. Augmentation для legacy reuse — обязательный grep `router.push` в legacy file

**(5D §3.8 + §5.9.)** При reuse legacy components в v2 через augmentation (defineExpose / ConnectWallet pattern), **обязательный** pre-augmentation grep `router\.push|this\.\$router` внутри legacy file. Conditional на `router.currentRoute.value.path` = minimal additive fix:

```js
const currentPath = router.currentRoute.value.path;
if (currentPath !== '/v2/<area>') {
  router.push('/<legacy-path>');
}
```

Confirmed twice (CreateClan + ClanEdit). Full v2-flow refactor (replace router.push с emit, parent decides navigation) — separate scope (deferred §7).

### Уроки 1-18 inherited from 5A/5B/5C

Перечислены в `docs/visual-migration/EPIC5_5C_FINAL_REPORT.md` §6 + предыдущих report'ах. Distilled list для 5E quick-reference:

1. Git log verify before finals (factual hashes).
2. DOM HUD vs 3D raycast — оба path grep'нуть.
3. masterModel vs UserModel asymmetry (Date wrapping).
4. Vuex action dispatch vs direct call (multi-step atomic).
5. Lazy scene pattern — default для v2 sub-scenes.
6. 5A helper reuse — mandatory grep first.
7. Lazy modal + defineExpose augment (5B precedent).
8. Hot-fix mid-epic приемлем, multi-part норма.
9. Preemptive edit-split для файлов >100 строк.
10. HUD line count soft-300 — splitting candidate в polish.
11. Shape assumptions в ТЗ require pre-verification (grep prev sub-epic).
12. v2 HUD components MUST own pointer-events reset (scoped style mandatory).
13. Prototype values require target-hardware retuning.
14. ТЗ HUD markup specs обязаны включать canonical Vue scaffolding.
15. SPEC import paths must cite real precedent verbatim.
16. Visual readability is multi-factor — first check renderer exposure prototype vs v2.
17. Visual issue first move = literal diff against working precedent line-by-line, not value tuning.
18. 2 failed visual tunes → STOP tuning, START structural inspection.

## §7 Deferred list

12 carry-over items. Distribution: 3 → PvP-integration (real APIs / clan events feed / streak), 6 → 5G polish, 1 → 5F i18n, 2 → infra/cleanup.

| # | Item | Target | Severity |
|---|---|---|---|
| 1 | Real clan list API wiring (BROWSABLE_CLANS sourced from backend search/filter — current Mulberry-style mock) | **PvP-integration sub-epic** | Functional |
| 2 | Real clan members API wiring (MY_CLAN_MEMBERS from real Prisma User join + ClanRole + lastSeen tracking) | **PvP-integration sub-epic** | Functional |
| 3 | Real `ClanActivityFeed` integration в HudClan (legacy fragment exists, не reused в v2 due to Q2 hybrid decision; carry to 5G polish или PvP-integration depending на UX scope) | **5G polish** или PvP-integration | Functional |
| 4 | Visual mood polish ClanScene — current accepted state "темновато но норм". Если 5G visual mood pass запланирован — revisit clan lighting balance | **5G polish** | UX |
| 5 | CreateClan + ClanEdit full v2-aware flow refactor (replace router.push с emit, parent decides navigation; current minimal conditional fix). Removes legacy coupling | **5G polish** | Code quality |
| 6 | Invite flow modal — legacy ClubInviteNotification — separate component. v2 invite flow needs new modal или reuse legacy — currently `console.info` stub | **5G polish** | UX |
| 7 | Roster member shape divergence — prototype mock vs real backend (unknown shape until PvP-integration). Confirm field map + adapt computed | **PvP-integration sub-epic** | Functional |
| 8 | foundedStr Date coercion — depends on real `clan.createdAt` format (ISO/Date/epoch). Apply explicit `new Date(raw) + isNaN guard` per урок #3 при real binding | **PvP-integration sub-epic** | Data accuracy |
| 9 | i18n inline EN strings (no-clan hero "JOIN A CLAN" etc., in-clan "MEMBERS"/"ACTIVITY" labels, button labels, modal titles) | **5F i18n pass** | Feature |
| 10 | Loading state UX polish (skeleton rows для no-clan browse list, в-clan roster). Currently no spinner — instant render from mocks. Real API requires loading affordance | **5G polish** | UX |
| 11 | HudClan.vue 430 lines > soft-300 — splitting candidate (HudClanNoClan + HudClanInClan + HudClanModals sub-components) | **5G polish** | Code quality |
| 12 | clanState cache staleness protection — currently no invalidation on member/role mutations. Refresh strategy needs design | **5G polish** | Data accuracy |
| 13 | Remote `debug/5d-h1-emissive` cleanup — sideband disconnect at delete time (4 retry attempts failed). Branch persists в remote. Manual cleanup через GitHub UI или ignore | **infra cleanup** | Cleanup |
| 14 | `MODAL_CONTENT.warden` + `.predator` в HudPit — status unclear, carry-over из 5C deferred #10. Verify `grep "warden\|predator" src/views-v2/PitViewV2.vue` click watcher + visual test | **5G polish** | Cleanup candidate |

## §8 Footer

**Sub-Epic 5D — CLOSED.** ✅

### Route table `/v2/*`

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD (legacy mocks + dynamic) |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ 4-card HUD + lazy ConnectWallet + WS friends |
| `/v2/ratings` | 5C | ✅ unified leaderboard (5 scope × 2 season mocks) |
| `/v2/clan` | **5D** | ✅ 2-state HUD (no-clan browse / in-clan body) + lazy CreateClan/ClanEdit reuse via augmentation + 6th 5A consumer both helpers |

### Key metrics

- **Коммитов:** 26 (8 functional Steps + 6 Step 5 hot-fix attempts + 1 diagnostic + 1 revert + 1 correct port + 1 fine-tune + 4 Step 6 parts + 4 Step 7 commits + 2 Step 8 commits + 1 Step 13 + Step 14 этот; Step 15 next).
- **Новых файлов:** 6 (ClanView.vue, HudClan.vue, ClanScene.js, clanFlag.js, clan.css, clanMock.js).
- **Augmented файлов:** 2 (CreateClan.vue + ClanEdit.vue, defineExpose + v2-aware navigation conditionals).
- **Reused as-is:** 1 (ClanConfirmModal.vue controlled-props).
- **Изменённых файлов:** 4 (router, PitViewV2, HudPit, hexlash-v24.css, CLAUDE.md).
- **Удалённых файлов:** 0.
- **Добавленных строк:** ~1395 (code + docs).
- **Ключевые паттерны:** lazy sub-scene 5B/5C parity, 5A helper 6th consumer × 2, Path A prototype-first (3-й precedent), Q2 Hybrid augmentation pattern (defineExpose + v2-aware conditional), exposure compensation lighting tune, atomic single-file revert via `git checkout`.
- **Осознанных расхождений:** 15 (§5.1-5.15).
- **Новых уроков:** 6 (#19-#24).
- **Deferred carry-over:** 14 items distributed (PvP-integration 3, 5G polish 6+2, 5F i18n 1, infra cleanup 2).

### Hot-fix narrative metric

5 hot-fix attempts на ложной траектории + 1 diagnostic branch + 1 revert + 1 correct port + 1 fine-tune = 9 commits Step 5 alone. Lessons #19-21 absorbed для prevention в 5E+. Atomic single-file `git checkout <baseline> -- <file>` revert pattern documented для emergency use когда sequential `git revert` failed на overlapping diffs.

### Transition к 5E

Следующий sub-epic — **5E** (TBD: Settings или Shop per VISUAL_MIGRATION plan; preferred Shop based on prototype). Pre-flight план стартует в `docs/visual-migration/HANDOFF_EPIC5_5E_CHAT_HANDOFF.md` (создаётся в Step 15 final part 3).

Designated branch для 5E run — **новый claude/\* slug**. Будущий Claude Code run обязан verify git branch через `git branch --show-current` + сверить recent commits против 5D CLOSED state (hashes `041e7c1` Step 13 CLAUDE.md + `<this commit>` Step 14 FINAL_REPORT + Step 15 HANDOFF должны присутствовать в history).

---

**End of Sub-Epic 5D Final Report.**
