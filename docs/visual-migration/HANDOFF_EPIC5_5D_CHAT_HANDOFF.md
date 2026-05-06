# Transition Handoff — Sub-Epic 5D — Clan

**Для нового чата.** Sub-Epic 5C closed, переходим к 5D.

**Status 5C:** ✅ COMPLETE (2026-04-24). Finals: `6795af9` (CLAUDE.md) + `93b6a77` (FINAL_REPORT).
**Target 5D:** `/v2/clan/:id` per TZ §5.

---

## §1 Где мы сейчас

### Route table `/v2/*` после 5C CLOSED

| Route | Sub-Epic | Status |
|---|---|---|
| `/v2` | 2 + 4 | Hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | FD |
| `/v2/fight` | 3A + 3Bb | Fight (via Matchmaking only) |
| `/v2/training` | 3Ba | Training (5A migrated) |
| `/v2/matchmaking` | 3Bb | Matchmaking (5A migrated) |
| `/v2/create` | 3Bc + 4 | Create Fighter |
| `/v2/profile` | 5B | Profile (4-card HUD + WS friends) |
| `/v2/ratings` | **5C** | ✅ unified leaderboard + sticky your-row |

### Entry `clan` currently

PhModal placeholder через `PH_MODAL_IDS = ['clan', 'shop']` (line 27 PitViewV2.vue). HudPit.vue `MODAL_CONTENT.clan`:

```js
clan: {
  kicker: 'Your Clan',
  title: 'CLAN',
  desc: 'Manage your clan, agents, and shared resources.',
},
```

5D scope — Step 1 удаляет 'clan' из PH_MODAL_IDS + explicit branch `router.push('/v2/clan/:id')` + удаление `MODAL_CONTENT.clan` entry (симметрично 5C Step 1 для 'ratings').

### Branch context

5C designated branch was **`claude/implement-ratings-endpoint-4BPEk`** (run-local). 5D run получит **новый claude/\* slug** — **НЕ** hard-code `4BPEk` / `DV1oX` в ТЗ spec. Verify через:
- `git branch --show-current` — current slug.
- `git log --oneline -10` — recent should include `6795af9` + `93b6a77` (5C finals).

Merge target для всего Epic 5 — `visual-v2` (не сейчас, в конце Epic 5 после 5G polish).

## §2 Что прочитать в новом чате

**Читать в этом порядке** (суммарно ~15-20 мин):

1. **Этот файл** (`HANDOFF_EPIC5_5D_CHAT_HANDOFF.md`) — первый. Карта scope, уроки, открытые вопросы, start message template.
2. **Full ТЗ для 5D** (приходит от пользователя в новом чате) — §5 TZ per VISUAL_MIGRATION_PLAN.md, full scope spec.
3. **`docs/visual-migration/EPIC5_5C_FINAL_REPORT.md`** (353 lines, 8 sections) — предшественник. Особенно важны:
   - §3 Technical details (5B parity / 5A consumer / Path A / null-safe).
   - §5 Расхождения (9 items — pattern библиотека).
   - §6 Уроки 11-14 — применимы к 5D.
4. **`CLAUDE.md`** — Sub-Epic 5C section (line 2589-2710) + Sub-Epic 5B section (line 2461) + Captain in Public UI section + Clan Page Redesign секции (в нижней половине файла).
5. **`src/views/ClanView.vue`** — legacy view, ~500-700 строк (estimate). НЕ удалять, оставить параллельно.
6. **`src/components/fragments/clan/`** — 10 clan fragments:
   - `ClanPageContent.vue` — shared page content (header + stats + tabs).
   - `ClanActivityFeed.vue`, `ClanEdit.vue`, `ClanStats.vue`, `ClanAvatar.vue`, `ClanOwnerAvatar.vue`, `ClanWithdraw.vue`, `ClanConfirmModal.vue`, `CreateClan.vue`, `MyClanTab.vue`.
7. **Прототип** — `docs/visual-migration/hexlash_v24.html`. Найти Clan section (searchable string типа `"openClan"` / `class="clan-"` / similar). Определить HUD layout + 3D scene spec (аналогично lines 10060-10200 для Ratings).
8. **`src/scene/scenes/ProfileScene.js`** (5B) + **`src/scene/scenes/RatingsScene.js`** (5C) — reference для 5A helper reuse pattern (5D = 6-й consumer).
9. **Previous handoff'ы** — `HANDOFF_EPIC5_5C_CHAT_HANDOFF.md`, `HANDOFF_EPIC5_5B_CHAT_HANDOFF.md` (если есть) — для сравнения handoff structure conventions.
10. **`src/views-v2/ProfileView.vue`** + **`src/views-v2/RatingsView.vue`** — orchestrator pattern canonical (83 lines each, same structure).
11. **`src/components/hud/HudProfile.vue`** (line 618) + **`src/components/hud/HudRatings.vue`** (line 290-298) — HUD scoped `<style>` pointer-events canonical block (mandatory урок #12).

## §3 Уроки 5C — actionable для 5D

Aggregate всех уроков 5A/5B/5C — 14 пунктов total.

### 1. Git log verify mandatory перед finals
Инst Steps 13/14/15 — `git log --oneline -20` перед записью hash'ей в docs. Урок из 5B finals — factual hashes, не memory.

### 2. DOM HUD vs 3D raycast — оба path grep'нуть
Entry point имеет 2 click mechanisms: DOM HUD (TopBar buttons / MODAL_CONTENT) + 3D raycast (plinth/interactable clicks via useClickState). Step 0 pre-flight grep'ает оба path. Step 1 закрывает оба одним commit.

### 3. masterModel vs UserModel asymmetry (Date wrapping)
masterModel.fromJSON НЕ оборачивает userData через UserModel constructor — поля остаются raw (e.g. `userData.createdAt` = ISO string, не `Date` object). При use — coerce explicitly `new Date(raw)`.

### 4. Vuex action dispatch vs direct call (multi-step atomic)
Для state mutations preferred `store.dispatch('module/action')` вместо direct import + call. Action может делать multi-step atomic (e.g. 5B `master/setLanguage` = 4 шага + backend sync). Direct call обновит только 1 шаг, остальные stale.

### 5. Lazy scene pattern — default для v2 sub-scenes
CanvasLayer singleton строит hub PitScene на AppV2 mount. Sub-scenes (Training/MM/Create/Profile/Ratings/Clan) регистрируются в `onMounted` через `buildXxxScene` + `registerScene(id)` + `activateScene(id)`. Teardown — **строгий порядок** `activateScene('pit') → unregisterScene → dispose`.

### 6. 5A helper reuse — mandatory grep first
Перед scene build Step 2/3 — grep `buildOctagonalRoom` + `createDustField`. Both должны использоваться если сцена — octagonal room с dust field. 5D = 6-й consumer ожидаемый.

### 7. Lazy modal + defineExpose augment (5B precedent)
Modal components (ConnectWallet) — dynamic `import()` + `shallowRef + markRaw` + `defineExpose({ openModal })` на child ref. Shared bundle = 1 chunk для legacy + v2. Pattern применим к любой modal в 5D (Invite / Edit / Disband modals).

### 8. Hot-fix mid-epic приемлем, multi-part норма
5B shipped 2 hot-fixes (10.1 + 10.2) после visual verify. 5C shipped 1 hot-fix (10.1). Не treat hot-fix как failure — treat как protocol. Multi-part (`hot-fix N.1 part K`) норма для 2-х связанных багов.

### 9. Preemptive edit-split для файлов >100 строк
Claude Code Write/Edit может стримить timeout на больших changes (>100 строк за один op). Split на ≤50 lines per edit — через sequential Edit / str_replace. 5C CSS port 386 строк сделан 3 edit'ами (sections 1-5 / 6-8 / 9-12). Mandatory для final documents (CLAUDE.md / FINAL_REPORT / HANDOFF).

### 10. HUD line count soft-300 — splitting candidate в polish
HudRatings 300 lines (порог). 5B HudProfile 615 (уже split candidate). При >500 — обязательный split на sub-components (RatingsRow, RatingsSticky, etc.) в 5G polish. Не блокирующий для sub-epic completion.

### 11. Shape assumptions в ТЗ require pre-verification (5C urok)

**(5C §5.4.)** ТЗ 5C §11.3 заложил wrong shape `userData.stats.{wins,losses,streak}` — factual shape flat `userData.wins` / `userData.losses` (no `.stats` wrapper, no `.streak` tracking).

**Protocol для 5D+:** перед bind'ом к данным grep'ом verify prev sub-epic (5B/5C) usage того же source. Двухступенчатая verification:
- Step 0 pre-flight grep (prev sub-epic overall usage).
- Re-verification непосредственно перед bind (actual file read + grep).

### 12. v2 HUD components MUST own their pointer-events reset (5C urok)

**(5C §5.6 + 3.7.)** HudRatings.vue shipped без `<style scoped>` block — clicks broken + sticky row mis-anchored. 8+ часов circle'ом Steps 7/8/hot-fix 10.1 pro-work'а.

**Canonical pattern — 5B HudProfile.vue line 618:**

```css
.hud-XXX { position: absolute; inset: 0; pointer-events: none; }
.hud-XXX > * { pointer-events: auto; }
```

**Protocol для 5D+:**
- **Mandatory template** — scoped `<style>` block с 2-rule pattern copy из 5B/5C HUD.
- **Pre-commit grep** — `grep "<style" src/components/hud/NewHud.vue` → должен return match перед Step 6 commit. 0 matches = blocking issue.

### 13. Prototype values require target-hardware retuning (5C urok)

**(5C §5.3 + 3.6.)** 3-й раз подтверждено — prototype renders откалиброваны под desktop/native, v2 Vercel preview (ACES toneMapping + scene fog density stack) требует adjustment. Precedents:
1. Epic 3A toneMapping `1.05 → 2.3`.
2. Epic 3A pit floor color `0x2c2c34 → 0x6e6e7a`.
3. Epic 5C Ratings rim intensities (pink `0.6 → 1.2`, gold `0.45 → 0.9`).

**Protocol для 5D+:**
- **Expect retuning** на user visual verify — не treat as prototype deviation bug.
- Prefer `intensity × 2` / color one-step-brighter над structural changes.
- Document в FINAL_REPORT §5 Расхождения с precedent reference.

### 14. ТЗ HUD markup specs обязаны включать canonical v2 Vue scaffolding (5C urok, refined)

**(5C §5.9.)** Prototype HTML — референс для structure/classes, но Vue-level plumbing (scoped style, pointer-events reset, defineExpose) обязан copy-paste из prev sub-epic HUD. Prototype — static HTML, не Vue SFC; canonical patterns не видны в prototype.

**Protocol для 5D+:**
- ТЗ HUD markup specs — при review Step 0 pre-flight — обязан включать parallel check на canonical v2 Vue scaffolding из prev sub-epic HUD.
- **Verification перед Step 6 commit:** `grep "<style" src/components/hud/NewHud.vue` — должен match. Если 0 — blocking issue, copy-paste 2-rule block из 5B/5C HUD reference.
- **Treat prototype HTML как HTML-layer only** — layer on top Vue machinery (scoped style, defineExpose, composable imports, lifecycle hooks) из prev sub-epic reference component.

## §4 Карта Sub-Epic 5D

### Scope

Clan page view под `/v2/clan/:id`. Legacy `src/views/ClanView.vue` (+ `/clan/:id` route) остаётся параллельно (нетронут). Два state'а:
1. **In-clan** — user имеет clan membership (show full clan page: header + stats + tabs members/activity/settings).
2. **No-clan** — user не в clan (show empty state с "Create Clan" / "Browse Clans" actions).

Shared clan page content — reuse candidate из `ClanPageContent.vue` (heavy lifting done там в 5B time). Или new v2 port с prototype parity.

### Entry point

Hub `clan` plinth click (3D raycast) — currently PhModal via `PH_MODAL_IDS` whitelist. 5D Step 1 переключает на router push `/v2/clan/:id`.

**Q3 open** — route shape: `/v2/clan/:id` (explicit id) vs `/v2/clan` (state resolution в view) vs `/v2/clan/none` (explicit no-clan). См. §5.

### Expected files

| File | Estimated | Pattern source |
|---|---|---|
| `src/views-v2/ClanView.vue` | ~83 lines | Orchestrator (5B/5C parity) |
| `src/scene/scenes/ClanScene.js` | ~150-200 | Lazy sub-scene (5A helper 6-й consumer если octagonal) |
| `src/components/hud/HudClan.vue` | ~300-500 | HUD с 2 states (in-clan / no-clan) |
| `src/styles/v24/clan.css` | ~300-400 | Port prototype clan section |
| (optional) `src/components/hud/HudClanNoClan.vue` | ~100-200 | Separate component для no-clan state (если большой) |

**Q2 open** — reuse legacy `ClanPageContent.vue` + `ClanStats.vue` + `ClanAvatar.vue` + `ClanEdit.vue` (inline / port / hybrid). См. §5.

### Changes to existing files

- `src/router/index.js` — `V2Clan` route.
- `src/views-v2/PitViewV2.vue` — `'clan'` убран из `PH_MODAL_IDS`, explicit branch added.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.clan` deleted.
- `src/styles/hexlash-v24.css` — `@import './v24/clan.css'`.

### Deferred для 5G polish (pre-flag)

- LocalStorage persist tab choice (members/activity/settings).
- i18n inline EN strings.
- Unused imports / dead code cleanup.
- Invite modal reuse pattern (5B ConnectWallet precedent).

### Visual expectations (placeholder — pending prototype search)

3D scene — unknown. Если clan имеет дефолтный background (treasure room / vault / etc.) — octagonal room reusable (5A 6-й consumer). Если кастомная геометрия — specific scene builder. Prototype search determines.

HUD — tabs (Members / Activity / Settings) + header (avatar + name + LVL badge + member count) + stats (wins/losses/wr grid) + sticky actions (Invite / Leave / Edit).

## §5 Открытые вопросы для 5D opening

4 вопроса для user answer в первом сообщении 5D chat'а. Gate перед Step 1.

### Q1: Path A (prototype-first) vs Path B (legacy-first)?

**5C precedent:** Path A — legacy табовая структура НЕ переносится, новая ментальная модель из prototype.

**Для 5D:** legacy `ClanView.vue` уже имеет сложную структуру с tabs (Members/Activity/Settings), owner controls (Edit/Kick/Promote/Disband), invite flow, leave confirmation. Prototype clan section — **пока неизвестно**, пользователь должен сначала найти в `hexlash_v24.html` (grep `openClan` / `class="clan-"` / similar).

**Possibilities:**
- **Path A**: prototype имеет fresh layout (aналогично ratings — central panel + sticky sections), 5D portирует его с нуля.
- **Path B**: prototype не имеет специфичной clan section, 5D portирует legacy ClanView structure (с v24 design tokens).
- **Path Hybrid**: prototype имеет header + stats layer, но tabs / settings / actions остаются легаси-style.

### Q2: Legacy Clan components reuse

`src/components/fragments/clan/` — 10 shared components (ClanPageContent / ClanStats / ClanAvatar / ClanOwnerAvatar / ClanEdit / ClanWithdraw / ClanConfirmModal / ClanActivityFeed / CreateClan / MyClanTab).

**Options:**
- **A (inline)**: port relevant structure from ClanPageContent.vue inline в HudClan.vue v2 markup. Pros: full v24 style control. Cons: duplicate maintenance if legacy updates.
- **B (port)**: создать v2 versions в `src/views-v2/components/clan/` — ClanStatsV2 / ClanAvatarV2 / etc. Pros: full isolation. Cons: 10 file stubs.
- **C (hybrid)**: reuse простых presentation-only components (ClanAvatar / ClanStats) если их styling compatible с `.app-v2` scope. Port complex ones (ClanPageContent). Pros: balance. Cons: mix проверок compatible.

5B precedent — ConnectWallet reuse via lazy dynamic import + shared bundle (Option C-like for single-component).
5C precedent — zero legacy component reuse (unified leaderboard полностью new markup).

### Q3: Route shape — `/v2/clan/:id` vs `/v2/clan` vs `/v2/clan/none`

**`/v2/clan/:id`** — match legacy `/clan/:id`. :id — current user's clan. Но что если user без clan? → router guard redirect to `/v2` OR fallback no-clan view state. ТЗ §5 spec'ает `/v2/clan/:id` — следуем буквально, но open на no-clan handling.

**`/v2/clan`** — без param. View resolves state: `userData.clanId ? show clan : show no-clan`. Pros: single URL, cleaner. Cons: не deep-linkable на specific clan (хотя — зачем deep-link на другой clan?).

**`/v2/clan/none`** — explicit no-clan state. Pros: URL описывает state. Cons: ugly + redundant with `/v2/clan` без param.

Preferred default: `/v2/clan` без param (cleanest) + resolution в view. Если ТЗ §5 буквально требует `/v2/clan/:id` — добавить также `/v2/clan` redirect на один из fallback'ов.

### Q4: Owner controls — reuse legacy modals или new v24-port?

Legacy: `ClanEdit.vue` (edit avatar/name/description modal), `ClanConfirmModal.vue` (Disband / Kick / Leave confirmations), invite flow через `ClubInviteNotification.vue` + backend API. Port vs reuse:

- **Reuse ConnectWallet-style lazy**: dynamic import ClanEdit / ClanConfirmModal → mount через teleport → defineExpose({ openModal }). Pros: low-effort, shared bundle. Cons: legacy styling leak через `.app-v2` scope.
- **Port всё v24-style**: new modals scoped `.app-v2` с v24 tokens. Pros: design consistency. Cons: 3-4 new modal components, +200-400 lines.
- **Hybrid**: simple modals (Disband confirm) port, complex modals (ClanEdit with image upload) reuse.

Preferred default по 5B precedent — lazy reuse для complex modals, port для simple.

## §6 Что делать новому чату в первом сообщении

Claude Code 5D run — 10 steps в первом сообщении:

1. **`git branch --show-current`** — note actual slug (NOT hard-code).
2. **`git log --oneline -15`** — verify 5C CLOSED state: hashes `6795af9` (final part 1 CLAUDE.md) + `93b6a77` (final part 2 FINAL_REPORT) должны присутствовать в recent.
3. **`ls node_modules/` → если empty:** `npm install` (environmental gap per 5C §5.8).
4. **Read this handoff file** full.
5. **Read ТЗ 5D** от пользователя (приходит в первом user message).
6. **Read `EPIC5_5C_FINAL_REPORT.md`** — §3 tech + §5 divergences + §6 lessons.
7. **Read `CLAUDE.md`** 5C section + 5B section + Clan Page Redesign sections.
8. **Grep prototype** `docs/visual-migration/hexlash_v24.html` для clan section: `grep -n "openClan\|class=\"clan-\|class='clan-\|ClanScene" docs/visual-migration/hexlash_v24.html | head -20`.
9. **Respond с Step 0 pre-flight report** (read-only) — branch / recent commits / 5A helper availability / legacy clan components / router clan refs / prototype clan section line range / 5B Modal reuse candidate analysis.
10. **Wait for user Q1-Q4 answers** перед proceed в Step 1. **Не start implementation** без user decisions на 4 open questions §5.

**Если user уже в ТЗ 5D answered Q1-Q4** — acknowledge answers + Step 0 pre-flight выполняется симметрично, затем proceed в Step 1.

## §7 Стартовое сообщение для нового чата

Copy-paste в начало 5D chat'а (после user's ТЗ spec):

```
Start 5D.

Mandatory pre-flight перед Step 1:

1. git branch --show-current — note actual claude/* slug (НЕ hard-code в ТЗ spec'е
   имена 4BPEk / DV1oX — предыдущие run'ы имели разные, 5D run получит новый).

2. git log --oneline -15 — verify 5C CLOSED в recent:
   * 93b6a77 epic5-5c: final part 2 — EPIC5_5C_FINAL_REPORT.md
   * 6795af9 epic5-5c: final part 1 — CLAUDE.md Sub-Epic 5C section
   * e8ab71c epic5-5c: hot-fix 10.1 — HUD pointer-events + root positioning
   Оба finals должны быть в history. Если отсутствуют — state inconsistent, STOP.

3. ls node_modules → если empty → npm install (environmental per 5C §5.8).

4. Read HANDOFF_EPIC5_5D_CHAT_HANDOFF.md полностью.

5. Read EPIC5_5C_FINAL_REPORT.md §3 tech + §5 divergences + §6 lessons.

6. Grep prototype для clan section:
   grep -n "openClan\|class=\"clan-\|ClanScene" docs/visual-migration/hexlash_v24.html | head -20

7. Step 0 pre-flight report (read-only) по template EPIC5_5C_FINAL_REPORT §1 format.

8. Gate на Q1-Q4 (§5 handoff):
   - Q1: Path A/B/Hybrid (prototype-first vs legacy-first)?
   - Q2: Legacy clan components reuse A/B/C (inline/port/hybrid)?
   - Q3: Route shape /v2/clan/:id vs /v2/clan vs /v2/clan/none?
   - Q4: Owner controls modals — reuse legacy или port v24-style?

   User answers → proceed Step 1. Не implementation без decisions.

4 критических урока из 5C (read full in §3 handoff):
- Урок #11: shape assumptions в ТЗ require pre-verification grep'ом.
- Урок #12: v2 HUD MUST own <style scoped> pointer-events block
  (`grep "<style" NewHud.vue` перед Step 6 commit — mandatory).
- Урок #13: prototype values require target-hardware retuning (rim/toneMapping precedent).
- Урок #14: ТЗ HUD markup specs обязаны включать canonical Vue scaffolding (scoped
  style / defineExpose / composables) из prev sub-epic HUD — prototype HTML не Vue SFC.

Branch context:
- Current branch — новый claude/* slug (определить через git branch --show-current).
- Predecessor — claude/implement-ratings-endpoint-4BPEk (5C run).
- Merge target — visual-v2 (в конце Epic 5).

Mode A strict: стоп после каждого шага → short status → ждать ok.
```

## §8 Чеклист самого handoff'а

Self-audit перед commit этого файла:

- [x] §1 — route table + entry point state + branch warning (new slug).
- [x] §2 — reading order 11 files, включая prev handoff / FINAL_REPORT / canonical references.
- [x] §3 — 14 уроков (1-10 inherited + 11-14 новых из 5C). Refined #14 formulation применена per user message.
- [x] §4 — scope map: 2 states (in-clan/no-clan), 5 expected files, 4 changes to existing, deferred flags, visual placeholder pending prototype search.
- [x] §5 — Q1 (Path A/B/Hybrid), Q2 (legacy reuse A/B/C), Q3 (route shape), Q4 (owner modals) — все с 5B/5C precedents referenced.
- [x] §6 — 10 steps для new chat в первом сообщении + не start implementation перед Q1-Q4.
- [x] §7 — start message copy-paste ready. Branch warning + 4 critical lessons + 5C final hashes + Mode A mention.
- [x] §8 — this self-audit.

Finals 5C для verification:
- `6795af9` epic5-5c: final part 1 — CLAUDE.md Sub-Epic 5C section.
- `93b6a77` epic5-5c: final part 2 — EPIC5_5C_FINAL_REPORT.md.
- `<this commit>` epic5-5c: final part 3 — HANDOFF_EPIC5_5D_CHAT_HANDOFF.md.

После этого commit'а — **Sub-Epic 5C — CLOSED**. Переход к 5D в новом чате.
