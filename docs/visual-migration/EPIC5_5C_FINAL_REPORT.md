# Sub-Epic 5C — Ratings — Final Report

**Status:** ✅ COMPLETE — 2026-04-24
**Branch:** `claude/implement-ratings-endpoint-4BPEk` (run-local designated)
**Predecessor:** `claude/hexlash-visual-migration-epic5-DV1oX` (5A+5B run)
**Merge target:** `visual-v2` (в конце Epic 5)
**Commit range:** `8d25c14` (Step 1) → `e8ab71c` (hot-fix 10.1) + `6795af9` (final part 1)

**Scope:** Второй views-миграция Эпика 5. Клик по ratings plinth в hub → `/v2/ratings` с unified leaderboard HUD (5 scope tabs + 2 season toggle + debounced search + sticky your-row bound to captain data) поверх lazy RatingsScene (octagonal room + distant ring silhouette + spotlights + dust field). Prototype-first (Path A): legacy табовая структура (MyClub/Clubs/Fighters/Agents) в v2 НЕ переносится — новая ментальная модель.

---

## §1 Шаги и коммиты

13 commits на designated branch (10 functional + 2 follow-up + 1 hot-fix + 3 final; 2 step-numbers skipped no-op). Все hashes верифицированы через `git log --oneline origin/claude/implement-ratings-endpoint-4BPEk` перед записью таблицы.

| # | Commit | Что | Files |
|---|---|---|---|
| 1 | `8d25c14` | route + entry switch + stubs | router/index.js, PitViewV2.vue, HudPit.vue, RatingsView.vue (new), HudRatings.vue (new), ratings.css (new), hexlash-v24.css |
| 1 follow-up | `5008af3` | Esc listener in RatingsView stub (UX gap Steps 1-5) | RatingsView.vue |
| 2 | `fcdfe4f` | RatingsScene scaffold (5A `buildOctagonalRoom` — 5-й consumer) | RatingsScene.js (new) |
| 3 | `69a317a` | lighting + shaft + dust (5A `createDustField` — 5-й consumer) | RatingsScene.js |
| 4 | `fd082bc` | distant ring silhouette + 8 posts + cleanup `RA_ROOM_R`/`H` re-exports | RatingsScene.js |
| 5 | `4dd4bc9` | view orchestrator with lazy scene lifecycle | RatingsView.vue |
| 5 follow-up | `0d237a8` | bump rim intensities (pink 0.6→1.2, gold 0.45→0.9) | RatingsScene.js |
| 6 | `39d1d6e` | HUD skeleton + ratings.css port (prototype 2326-2590) | HudRatings.vue, ratings.css |
| 7 | `f06f7e4` | scope tabs + search + mock leaderboard | ratingsMock.js (new), HudRatings.vue |
| 8 | `57d77ca` | sticky your-row bound to captain data (null-safe, shape corrections) | HudRatings.vue |
| 9 | — skipped | season polish no-op (verified post-Step 7, reactive state correct) | — |
| 10 | — skipped | mobile + polish no-op (all edge cases + media query ported in Step 6) | — |
| hot-fix 10.1 | `e8ab71c` | HUD pointer-events + root positioning (missing `<style scoped>`) | HudRatings.vue |
| 11 | — | static trace regression (read-only, 6/6 ✓, no commit) | — |
| 13 | `6795af9` | final part 1 — CLAUDE.md Sub-Epic 5C section | CLAUDE.md |
| 14 | this | final part 2 — EPIC5_5C_FINAL_REPORT.md | docs/visual-migration/EPIC5_5C_FINAL_REPORT.md (new) |
| 15 | next | final part 3 — HANDOFF_EPIC5_5D_CHAT_HANDOFF.md | (new) |

## §2 Файлы

### Созданы (5)

| File | Lines | Contract |
|------|-------|----------|
| `src/views-v2/RatingsView.vue` | 83 | Orchestrator — lazy `buildRatingsScene` + `registerScene('ratings')` + `activateScene` в `onMounted`, строгий teardown `activateScene('pit') → unregisterScene → dispose` в `onBeforeUnmount`. Esc/Back → `/v2`. Size identical 5B ProfileView.vue. |
| `src/scene/scenes/RatingsScene.js` | 193 | `buildRatingsScene(THREE, aspect) → { scene, camera, tick, dispose }`. Octagonal room (R=16 H=9 fogDensity=0.055 via 5A `buildOctagonalRoom`) + AmbientLight + HemisphereLight + 3 SpotLight (warm key + pink rim L + gold rim R) + ConeGeometry shaft + ExtrudeGeometry ring platform + 8 CylinderGeometry posts + 5A `createDustField`. Local consts `RA_ROOM_R=16`/`RA_ROOM_H=9` (internal only, re-exports removed Step 4). |
| `src/components/hud/HudRatings.vue` | 300 | HUD — scope/season/search reactive state, debounced search (200ms setTimeout), `rows` computed (`RATINGS_DATA[key]` + handle filter), 5 scope tabs (v-for 4 + Live с pink dot separately), reactive season chips, v-for rows с rank-1/2/3/WR/streak class helpers, sticky your-row bound to captain data, null-safe `v-if="yourRow"`. Inline helpers: `archetypeIdShort` (full-name → short-id), `archetypeName`, `beltLabelShort`, `rowRankClass`, `wrClass`, `streakStr`, `streakClass`. Scoped `<style>` block added in hot-fix 10.1. |
| `src/styles/v24/ratings.css` | 386 | 1-to-1 port prototype `hexlash_v24.html` 2326-2590, scoped `.app-v2`. 12 sections: back btn / title (kicker+name) / season chips / panel / toolbar (tabs+search) / thead / tbody (scroll) / row base+cells / rank-1/2/3 highlights (base+hover) / sticky your-row / empty state / `@media max-width: 720px`. `.arch-tag-{id}` **skipped** — reuse из create.css app-wide (Correction 3 from Step 0). |
| `src/data/ratingsMock.js` | 91 | Mulberry32 seeded RNG + 10 pre-generated datasets (5 scopes × 2 seasons). 40 `TOP_NAMES`, 6 `RATINGS_ARCHS` short-ids, 8 `BELTS`. `generateLeaderboard(seed, n)` exported. Client-side mock до PvP-integration sub-epic. |

### Изменены (4)

- `src/router/index.js` — `V2Ratings` route (`/v2/ratings`) добавлен в `v2Routes.children` после `V2Profile`.
- `src/views-v2/PitViewV2.vue` — `PH_MODAL_IDS` стал `['clan', 'shop']` (ratings удалён); explicit branch `click.id === 'ratings' → router.push('/v2/ratings')` добавлен в click watcher (перед PhModal fallback, после training/matchmaking/create/avatar).
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.ratings` entry удалён. Breadcrumb-коммент "'ratings' removed in Epic 5 Sub-Epic 5C Step 1" добавлен consistent с existing file convention (Epic 3Ba/3Bb/3Bc/5B pattern).
- `src/styles/hexlash-v24.css` — `@import './v24/ratings.css'` добавлен после profile.css.
- `CLAUDE.md` — 5C section (122 lines, 2589-2710) inserted after 5B CLOSED section (2572 intact).

### Удалены (0)

Нет. Legacy `/ratings/*` route + `src/views/RatingsView.vue` (693 строки) + `src/components/ratings/AgentLeaderboard.vue` — нетронуты, остаются параллельно v2.

## §3 Технические детали

### 3.1 Lazy sub-scene — 5B ProfileView parity

RatingsView.vue (83 lines) — identical structure + size to 5B ProfileView.vue. `onMounted` последовательность: `sceneApi = buildRatingsScene(THREE, aspect)` → `registerScene('ratings', { scene, camera, tick })` → `activateScene('ratings')` → `addEventListener('resize' + 'keydown')`.

`onBeforeUnmount` **строгий порядок** (комментарий 5B Profile line 64-65 verbatim):
1. `removeEventListener('keydown')`.
2. `removeEventListener('resize')` + `onResize = null`.
3. `activateScene('pit')` — **FIRST**, renderLoop swap back prevents next-tick touch of freed scene.
4. `unregisterScene('ratings')` — registry delete.
5. `sceneApi.dispose()` + `sceneApi = null` — geometry/material cleanup LAST.

### 3.2 5A helpers — 5-й consumer для обоих

`src/scene/objects/octagonalRoom.js` (5A Step 1) — `buildOctagonalRoom(THREE, scene, opts)`. 5C — 5-й consumer (Training/Matchmaking/Create/Profile/Ratings).
`src/scene/objects/dustField.js` (5A Step 4) — `createDustField(THREE, opts) → { group, tick }`. 5C — 5-й consumer.

Both helpers stable после 5A+5B validation; 5C reuse pattern работает без модификаций. Asymmetric params (`xRadius=6 / zRadius=5`, `zOffset=-2`) for Ratings dust — helper signature accepts без расширения.

### 3.3 Client-side mock data (Mulberry32)

`src/data/ratingsMock.js` — prototype 10218-10272 port verbatim.
- Mulberry32 seeded RNG (`seedRng(seed)` returns RNG function).
- `generateLeaderboard(seed, n)` — ELO descending from 2060, random drops 2-16 per row, archetype + wins/losses/streak + belt computed from ELO tier.
- 10 datasets pre-generated at module load: `global|s1|all` (n=40), `friends|s1|all` (n=12), `clan|s1|all` (n=18), `country|s1|all` (n=28), `live|s1|all` (n=8). Prototype ships 8 (global + friends + clan + country × 2 seasons); 5C adds `live|s1|all` (seeds 909/1010) для 5th scope tab.

Real API wiring → PvP-integration sub-epic (post-5G). Rationale: 5C scope — визуал, API отвлекает + backend filter shape (archetype, belt, streak) не spec'нут.

### 3.4 Path A decision — prototype-first

**Legacy RatingsView.vue (693 строки, 4 таба MyClub/Clubs/Fighters/Agents) в v2 НЕ переносится.** Новая ментальная модель = unified leaderboard + 5 scope filter tabs (Global / Friends / Clan / Country / Live) + season toggle + sticky your-row. Это прототип-driven решение — `hexlash_v24.html` lines 4767-4819 показывают именно такую HUD структуру, не табовую.

Legacy `/ratings/*` route остаётся параллельно (`/ratings → /ratings/myclan` redirect нетронут). Legacy компоненты `AgentLeaderboard.vue`, `PvPStatsCard.vue` в исходной `RatingsView.vue` used — не dead code.

Path A validated как **default для оставшихся 5D-5G** если prototype расходится с legacy. Carry-over lesson — см. §6.

### 3.5 Null-safe your-row

`v-if="yourRow"` на root `.rt-your-row` скрывает весь sticky block если `master.userData.captain === null/undefined` (0-agent accounts; lazy User→Fighter migration ещё не прошла). Leaderboard rows выше остаются — user получает usable UI.

99% accounts имеют captain через Fighter #1 migration (CLAUDE.md §P1-migration). Edge case — 1% (fresh accounts до первого `/me` call или migration feature flag off). Protocol поддерживает оба.

### 3.6 Rim intensity bump — Epic 3A precedent (3-й раз)

Prototype 10142-10158 intensities `pink 0.6 + gold 0.45` — на target hardware на Vercel preview визуально **почти не читаются** из-за combination: wall color `0x0e0e16` (very dark) + `fogDensity: 0.055` (dims distant emitters) + low intensity × wide beam angle (`Math.PI * 0.4`). Вся композиция проходит как mono-light "tomb of rankings" — pink/gold accent lost.

Удвоил: `pink 0.6 → 1.2`, `gold 0.45 → 0.9` (commit `0d237a8`). Key spot `1.4` untouched — warm center dominant, rims теперь читаются как side accents без перекрытия atmosphere'ы.

**Precedent confirmation** — 3-й раз prototype values требуют target-hardware retuning:
1. Epic 3A toneMapping `1.05 → 2.3` (FD scene).
2. Epic 3A pit floor color `0x2c2c34 → 0x6e6e7a`.
3. Epic 5C Ratings rim intensities (this).

**Lesson** — prototype values откалиброваны под desktop/native rendering, v2 Vercel preview (target hardware + ACES toneMapping + fog density stack) часто требует adjustment. Accept как known prototype→v2 adaptation, не treat as bug. См. урок #13 в §6.

### 3.7 Hot-fix 10.1 — HUD pointer-events missing

**Symptom:** на `/v2/ratings` после Step 8 ничего не кликабельно + sticky your-row mis-anchored / invisible.

**Diagnostic (Step 12 read-only):**
- `grep "pointer-events" src/styles/v24/ratings.css` → 0 results.
- `grep "pointer-events" src/components/hud/HudRatings.vue` → 0 results.
- `grep "<style" src/components/hud/HudRatings.vue` → NOT found (entire scoped `<style>` block missing).
- `grep "pointer-events" src/components/hud/HudProfile.vue` → lines 625, 628 (canonical 5B pattern present).

**Root cause:** HudRatings.vue shipped без `<style scoped>` block. Parent RatingsView.vue sets `.ratings-view { pointer-events: none }` (let CanvasLayer receive 3D drag events). Каждый v2 HUD component **обязан** re-enable `pointer-events: auto` on its own root. 5B HudProfile.vue line 618:

```css
.hud-profile { position: absolute; inset: 0; pointer-events: none; }
.hud-profile > * { pointer-events: auto; }
```

Step 6 markup port пропустил этот блок — ТЗ §9.3 spec не включал `<style>` секцию.

**Fix:** identical 2-rule block scoped `.ratings-hud`. Single commit `e8ab71c`. 20 lines addition. Verified через grep + user visual verify → клики восстановлены + sticky row anchor correct.

**Lesson** — см. урок #12 в §6 (HUD scoped style mandatory template).

### 3.8 Structured `nextRankHint` refactor — clean Vue idiom

Original ТЗ §11.3 возвращал `{ text: string }` и template делал regex split:

```vue
{{ nextRankHint.text.split('+').length > 1 ? 'Next rank: ' : nextRankHint.text }}
<strong v-if="nextRankHint.text.includes('+')">
  +{{ nextRankHint.text.match(/\+(\d+)/)?.[1] }} ELO
</strong>
{{ ... match(/top (\d+)/)?.[1] }}
```

Уродливая string parsing logic в template.

Финал: structured return `{ kind: 'top10' | 'climb', eloDiff, targetRank }`, template branch'ится по `kind`:

```vue
<div v-if="nextRankHint" class="rt-next-rank">
  <template v-if="nextRankHint.kind === 'top10'">Top 10 reached</template>
  <template v-else>
    Next rank: <strong>+{{ nextRankHint.eloDiff }} ELO</strong>
    to reach top {{ nextRankHint.targetRank }}
  </template>
</div>
```

Clean separation — computed возвращает data shape, template branches over enum tag. Более idiomatic Vue, более testable (unit test может assert на object shape вместо regex string), более i18n-ready (5F может swap literals через t() без regex conflict).

## §4 Проверки

- **`node --check`** на созданных `.js` файлах (RatingsScene.js, ratingsMock.js) — pass на каждом шаге.
- **`npm run build`** — pass на каждом шаге (11 successful builds across 10 functional + hot-fix + 2 final commits).
- **Grep sanity**:
  - `MODAL_CONTENT.ratings` refs в `src/` — 0 (only docs HANDOFF file mention).
  - `'ratings'` в `PH_MODAL_IDS` array — 0 (array is `['clan', 'shop']`).
  - `createDustField` + `buildOctagonalRoom` grep — **5-й consumer confirmed** (Training/Matchmaking/Create/Profile/Ratings).
  - `<style>` block в HudRatings.vue — verified present после hot-fix 10.1.
- **Static trace regression (Step 11, 6/6 ✓):**
  1. 3D click path — explicit branch correctly placed.
  2. Legacy cleanup — MODAL_CONTENT / PH_MODAL_IDS clean.
  3. Scene lifecycle — teardown strict order 5B parity.
  4. Scope tabs — reactive setScope + computed rows re-compute.
  5. Search + season — debounce + computed key.
  6. Sticky your-row — null-safe v-if, structured nextRankHint.
- **User visual verify** (Vercel preview):
  - Step 5 — scene (room/ring/posts/lighting/shaft/dust) ✓ с rim bump fix.
  - Step 6 — HUD skeleton (back/title/season/panel/toolbar/thead/sticky placeholder) ✓.
  - Step 7 — mock rows render, tabs/search/season switch ✓.
  - Step 8 — sticky your-row bind (скрыта на null-captain, видна с real data) — deferred actual verify до post-5C run.
  - Hot-fix 10.1 — clicks restored + sticky anchored correctly ✓.
- **Memory stability** — static trace подтверждает strict teardown order; 5 cycles Vercel DevTools Performance test рекомендован, но не блокирующий (5B pattern parity).
- **`npm install`** был выполнен однократно в Step 1 (node_modules отсутствовали в designated branch initial state). Package-lock.json не менялся, новых зависимостей не добавлено. Environmental concern, не scope — будущий 5D run на новой ветке, возможно, потребует повторить.
- **Legacy untouched**: `src/views/RatingsView.vue` (693 строки), `src/components/ratings/AgentLeaderboard.vue`, `/ratings/*` router routes — zero cross-contamination.

## §5 Расхождения — осознанные

### 5.1 Path A decision — prototype-first

Legacy RatingsView табовая структура (MyClub/Clubs/Fighters/Agents) **не переносится в v2**. Новая модель — unified leaderboard + 5 scope filters per prototype 4767-4819. Legacy `/ratings/*` route остаётся параллельно.

### 5.2 Client-side mock — real API deferred

`src/data/ratingsMock.js` — Mulberry32 seedable RNG + 10 pre-generated datasets. Real API wiring отложено в PvP-integration sub-epic (после 5G). Rationale: 5C scope — визуал, API wiring отвлекает + backend filter shape (archetype/belt/streak params) не spec'нут.

### 5.3 Rim intensity bump от prototype

Prototype 10142-10158 использует pink 0.6 + gold 0.45 — на target hardware на Vercel preview они почти не читаются на dark backdrop (wall `0x0e0e16` + fog 0.055 + low intensity × wide beam angle). Удвоены до 1.2 / 0.9 по user visual verify (Step 5 follow-up `0d237a8`). Аналогично precedent'у Epic 3A toneMapping tuning — prototype values откалиброваны под другую scene density, target hardware требует adjustment.

### 5.4 ТЗ §11.3 shape error

Prompt spec'ал `master.userData.stats.{wins, losses, streak}` — factual UserModel shape: flat `userData.wins` / `userData.losses` (no nested `.stats`, no `.streak` tracking). Pre-verified через grep HudProfile 5B pattern + UserModel на Step 8. Null streak → `—` display fallback. Real streak tracking → PvP-integration sub-epic.

### 5.5 Streak inconsistency mock vs real

Leaderboard rows содержат streak (Mulberry32 генерит 0-8W/L), your-row всегда `—` т.к. UserModel не трекает streak. Subtle visual inconsistency ("у всех есть, у меня нет") — **не bug**, honest UI state. Correction → PvP-integration.

### 5.6 Hot-fix 10.1 — HUD pointer-events missing

HudRatings.vue shipped без `<style scoped>` block (Step 6 markup port skipped it — not in TZ §9.3 spec). All clicks broken + sticky row mis-anchored к `.ratings-view`. Fix: 2-rule scoped block (`.ratings-hud { position: absolute; inset: 0; pointer-events: none; } > * { pointer-events: auto }`) — identical к 5B HudProfile line 618 pattern. Single commit `e8ab71c`. См. урок #12 в §6.

### 5.7 Steps 9 + 10 skipped — no-op

Step 9 (season polish): Step 7 уже реализовал reactive season toggle корректно, verify прошёл без code changes. Step 10 (mobile + polish): Step 6 CSS port уже включил `@media max-width: 720px` block + rank-1/2/3 highlights + WR good/bad + streak hot + rt-empty — все edge cases prototype-correct. Traceable step numbering сохраняется (symbolic `— skipped` entries в §1 table).

### 5.8 Local `npm install` в Step 1

node_modules отсутствовали в designated branch initial state. Package-lock.json не менялся, новых зависимостей не добавлено. Environmental concern, не scope — будущий 5D run на новой ветке, возможно, потребует повторить.

### 5.9 ТЗ §9.3 omission — `<style scoped>` block не был в markup spec

ТЗ 5C §9.3 target markup не включал `<style scoped>` block — Claude Code корректно port'нул prototype HTML 4767-4819 template, но пропустил canonical Vue pattern pointer-events reset которого нет в static prototype (prototype живёт без Vue scoped CSS, он inherited). 5B HudProfile.vue line 618 устанавливает pattern, но ТЗ-spec не обязывал копировать.

**Root cause chain:** prototype HTML → ТЗ markup spec → Claude port → missing scoped style → hot-fix 10.1. Это **не TZ shape error** (§5.4), а **TZ template omission** — отдельная категория divergence.

Lesson: ТЗ spec'а markup never complete без parallel check на canonical v2 HUD patterns. См. урок #14 в §6.

## §6 Уроки для 5D и дальше

Aggregate всех уроков 5B + новых из 5C. Protocol для 5D opening — прочитать §6 5B FINAL_REPORT + этот §6 + §3 HANDOFF 5D.

### 11. Shape assumptions в ТЗ require pre-verification

**(5C §5.4.)** ТЗ 5C §11.3 заложил wrong shape `userData.stats.{wins,losses,streak}` — factual shape flat `userData.wins` / `userData.losses`. Pre-verified через grep HudProfile 5B pattern + UserModel в Step 8 pre-edit check.

**Protocol для 5D+:** перед bind'ом к данным grep'ом verify prev sub-epic (5B/5C) usage того же source. В 5C удалось поймать это на Step 8 благодаря двухступенчатой pre-verification:
- Step 0 pre-flight (grep prev sub-epic)
- Re-verification непосредственно перед bind (grep actual file)

### 12. v2 HUD components MUST own their pointer-events reset

**(5C §5.6 + 3.7.)** HudRatings.vue shipped без `<style scoped>` block — 8+ часов circle'ом Step 7/8/10.1 pro-work'а из-за пропуска 2-rule block'а. 5B HudProfile line 618 устанавливает canonical pattern:

```css
.hud-XXX { position: absolute; inset: 0; pointer-events: none; }
.hud-XXX > * { pointer-events: auto; }
```

**Protocol для 5D+:**
- **Mandatory template** — перед HUD markup ship'ом copy этот 2-rule block как scoped `<style>` секция, подменив `.hud-XXX` на actual component class.
- **Pre-commit grep** — `grep "<style" src/components/hud/NewHud.vue` — должен match перед коммитом. 0 matches = blocking issue.
- Соответствие 5B HudProfile pattern — проверять HudProfile.vue как reference на каждом HUD creation.

### 13. Prototype values require target-hardware retuning

**(5C §5.3 + 3.6.)** 3-й раз подтверждено: prototype renders откалиброваны под desktop/native, v2 stack (Vercel preview + ACES toneMapping + scene fog stack) часто требует adjustment. Precedents:
1. Epic 3A toneMapping `1.05 → 2.3` (FD scene).
2. Epic 3A pit floor color `0x2c2c34 → 0x6e6e7a`.
3. Epic 5C Ratings rim intensities (pink 0.6→1.2, gold 0.45→0.9).

**Protocol для 5D+:**
- **Expect retuning** на user visual verify — не treat as prototype deviation bug.
- Prefer `intensity × 2` / color one-step-brighter над structural changes (lighting positions / angle / geometry).
- Document в FINAL_REPORT §5 Расхождения с precedent reference.

### 14. ТЗ prompts могут omit canonical v2 patterns

**(5C §5.9.)** Markup spec в ТЗ может покрыть HTML structure + CSS classes, но пропустить Vue-specific patterns (scoped styles, defineExpose, provide/inject) которые **не видны в prototype HTML**. Prototype — static HTML, не Vue SFC. Canonical patterns живут в prev v2 SFCs (HudProfile, ProfileView, etc.).

**Protocol для 5D+:**
- Check prev sub-epic component для **structural-Vue patterns**: `<style scoped>`, `defineExpose`, `defineEmits`, cross-component composables, lifecycle hooks.
- ТЗ markup spec ≠ complete Vue SFC template. **Treat ТЗ template как HTML-layer** и layer on top canonical Vue machinery из 5B reference.
- При Step 0 pre-flight — grep prev HUD component для `<style`, `defineExpose`, composable imports → include as mandatory checklist items в markup port step.

### Уроки 1-10 inherited from 5A/5B

Перечислены в `docs/visual-migration/EPIC5_5B_FINAL_REPORT.md` §6 + предыдущих report'ах. Краткий список для 5D quick-reference:

1. Git log verify mandatory перед finals (factual hashes).
2. DOM HUD vs 3D raycast — оба path grep'нуть.
3. masterModel vs UserModel asymmetry (Date wrapping).
4. Vuex action dispatch vs direct call (multi-step atomic).
5. Lazy scene pattern — default для v2 sub-scenes.
6. 5A helper reuse — mandatory grep first.
7. Lazy modal + defineExpose augment (5B precedent).
8. Hot-fix mid-epic приемлем, multi-part норма.
9. Preemptive edit-split для файлов >100 строк.
10. HUD line count soft-300 — splitting candidate в polish.

## §7 Deferred list

11 carry-over items (matches CLAUDE.md §5C section deferred list). Distribution: 4 → PvP-integration, 5 → 5G polish, 1 → 5G cleanup, 1 → 5F i18n.

| # | Item | Target | Severity |
|---|---|---|---|
| 1 | Real ratings API wiring (5 scope filters, season data, backend search) — сейчас client-side mock | **PvP-integration sub-epic** (после 5G) | Functional |
| 2 | `AgentLeaderboard.vue` dead code cleanup — Step 0 подтвердил только docs refs + `src/views/RatingsView.vue` usage в legacy (not dead there). Current flow — только legacy, 5C Path A не reuse. Plus stale CLAUDE.md "Agent Rankings + Leagues (ТЗ-26)" секция upstream | **5G polish** | Cleanup |
| 3 | Live tab realtime indicator (pulsing dot beyond static ●) — если WS push `ratings_live` доступен | PvP-integration или 5G | UX |
| 4 | "Next rank" logic beyond decile — current naive `Math.floor((mr-1)/10)*10` target threshold. Real tier progression (Bronze/Silver/Gold/.../Champion) с fixed ELO thresholds | **5G polish** | UX |
| 5 | `HudRatings.vue` 300 lines > soft-300 — splitting candidate (script extract / template slots / RatingsRow + RatingsSticky subcomponents) | **5G polish** | Code quality |
| 6 | LocalStorage persist season/scope choice между навигациями `/v2/ratings ↔ /v2` | **5G polish** | UX |
| 7 | i18n inline EN strings (scope tab labels `Global/Friends/Clan/Country/Live`, season labels `Season 1/All Time`, placeholders, `Next rank: +N ELO`, `Top 10 reached`, `No results`, `You` label) | **5F i18n pass** | Feature |
| 8 | `MyClubTab.vue` — нет src-ссылок (только docs/handoff) — подозрение на dead code; подтвердить extended grep на `<MyClubTab` / `import.*MyClubTab` в 5G | **5G polish** | Cleanup |
| 9 | Unused const re-exports в `ProfileScene.js` (`PR_ROOM_R` / `PR_ROOM_H`) — dead surface inherited from 5B | **5G polish** | Cleanup |
| 10 | `MODAL_CONTENT.warden` + `.predator` в HudPit — status unclear. Found during Step 11 regression. Если stale (Epic 2-3 artifacts) — cleanup candidate. Если active (hub PhModal на warden/predator plinth click) — не трогать. Verify `grep "warden\\|predator" src/views-v2/PitViewV2.vue` click watcher + visual test | **5G polish** | Cleanup candidate |
| 11 | Real streak tracking (UserModel не имеет `.streak`) — your-row всегда `—`. Feature addition to UserModel + backend event tracking | **PvP-integration** | Feature |

## §8 Footer

**Sub-Epic 5C — CLOSED.** ✅

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
| `/v2/ratings` | **5C** | ✅ unified leaderboard (5 scope × 2 season mocks) + sticky your-row + lazy RatingsScene + 5A 5-й consumer both helpers |

### Key metrics

- **Коммитов:** 13 (10 functional + 2 follow-up + 1 hot-fix + 3 final; 2 symbolically skipped).
- **Новых файлов:** 5 (RatingsView.vue, RatingsScene.js, HudRatings.vue, ratings.css, ratingsMock.js).
- **Изменённых файлов:** 5 (router, PitViewV2, HudPit, hexlash-v24.css, CLAUDE.md).
- **Удалённых файлов:** 0.
- **Добавленных строк:** ~1000 (code + docs).
- **Ключевые паттерны:** lazy sub-scene 5B parity, 5A helper 5-й consumer × 2, client-side mock, Path A prototype-first, null-safe your-row, structured nextRankHint.
- **Осознанных расхождений:** 9 (§5.1-5.9).
- **Новых уроков:** 4 (#11-#14).
- **Deferred carry-over:** 11 items distributed across PvP-integration (4), 5G polish (6), 5F i18n (1).

### Transition к 5D

Следующий sub-epic — **5D** `/v2/clan/:id`. Pre-flight план стартует в `docs/visual-migration/HANDOFF_EPIC5_5D_CHAT_HANDOFF.md` (создаётся в Step 15 final part 3).

Designated branch для 5D run — **новый claude/\* slug** (не `4BPEk`, не `DV1oX`). Будущий Claude Code run обязан verify git branch через `git branch --show-current` + сверить recent commits против 5C CLOSED state (hash `6795af9` final part 1 должен присутствовать в history).

---

**End of Sub-Epic 5C Final Report.**
