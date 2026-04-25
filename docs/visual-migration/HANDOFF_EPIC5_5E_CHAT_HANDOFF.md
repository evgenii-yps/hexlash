# Transition Handoff — Sub-Epic 5E

**Для нового чата.** Sub-Epic 5D closed, переходим к 5E.

**Status 5D:** ✅ COMPLETE (2026-04-25). Finals: `041e7c1` (CLAUDE.md) + `6e7008a` (FINAL_REPORT) + `<this commit>` (HANDOFF).
**Target 5E:** TBD per VISUAL_MIGRATION_PLAN.md §6 (Shop preferred based on prototype availability) → `/v2/shop` или `/v2/settings`.

---

## §1 Где мы сейчас

### Route table `/v2/*` после 5D CLOSED

| Route | Sub-Epic | Status |
|---|---|---|
| `/v2` | 2 + 4 | Hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | FD |
| `/v2/fight` | 3A + 3Bb | Fight (via Matchmaking only) |
| `/v2/training` | 3Ba | Training (5A migrated) |
| `/v2/matchmaking` | 3Bb | Matchmaking (5A migrated) |
| `/v2/create` | 3Bc + 4 | Create Fighter |
| `/v2/profile` | 5B | Profile (4-card HUD + WS friends) |
| `/v2/ratings` | 5C | Unified leaderboard (5 scope × 2 season mocks) |
| `/v2/clan` | **5D** | ✅ 2-state HUD + lazy CreateClan/ClanEdit + 6th 5A consumer |

### Entry `shop` currently

PhModal placeholder через `PH_MODAL_IDS = ['shop']` (line 27 PitViewV2.vue после 5D Step 1). HudPit.vue `MODAL_CONTENT.shop`:

```js
shop: {
  kicker: 'Cosmetics',
  title: 'SHOP',
  desc: 'Buy fighter skins, archetype glows, and clan emblems.',
},
```

5E scope (если Shop) — Step 1 удаляет 'shop' из `PH_MODAL_IDS` + explicit branch `router.push('/v2/shop')` + удаление `MODAL_CONTENT.shop` entry (симметрично 5C 'ratings' / 5D 'clan').

### Open `MODAL_CONTENT` entries unrelated to 5E

`MODAL_CONTENT.warden` + `MODAL_CONTENT.predator` — status unclear, carry-over из 5C deferred #10. См. 5D FINAL_REPORT §7 Deferred #14. Не блокирует 5E, verify в 5G polish.

### Branch context

5D designated branch was **`claude/clan-view-completion-C97qk`**. 5E run получит **новый claude/\* slug** — НЕ hard-code `C97qk` / `4BPEk` / `DV1oX` в ТЗ spec. Verify через:
- `git branch --show-current` — current slug.
- `git log --oneline -10` — recent should include `041e7c1` (Step 13 CLAUDE.md) + `6e7008a` (Step 14 FINAL_REPORT) + `<this commit>` (Step 15 HANDOFF).

Merge target для всего Epic 5 — `visual-v2` (не сейчас, в конце Epic 5 после 5G polish).

## §2 Что прочитать в новом чате

**Читать в этом порядке** (суммарно ~15-20 мин):

1. **Этот файл** (`HANDOFF_EPIC5_5E_CHAT_HANDOFF.md`) — первый. Карта scope, уроки, открытые вопросы, start message template.
2. **Full ТЗ для 5E** (приходит от пользователя в новом чате) — §6 TZ per VISUAL_MIGRATION_PLAN.md, full scope spec.
3. **`docs/visual-migration/EPIC5_5D_FINAL_REPORT.md`** (430 lines, 8 sections) — предшественник. Особенно важны:
   - §3 Technical details (5B/5C parity / 5A 6th consumer / Path A / Q2 Hybrid augmentation / exposure compensation discovery / Step 5 hot-fix narrative).
   - §5 Расхождения (15 items — pattern библиотека).
   - §6 Уроки 19-24 — применимы к 5E (особенно #19 exposure FIRST + #22 selector match + #23 display:none conditional + #24 router.push grep).
4. **`CLAUDE.md`** — Sub-Epic 5D section + 5C section + 5B section + (если Shop) Skins System section.
5. **Прототип** — `docs/visual-migration/hexlash_v24.html`. Найти Shop section (searchable string типа `"openShop"` / `class="shop-"` / `"shopLocker"` / similar). Определить HUD layout + 3D scene spec.
6. **`src/views-v2/ProfileView.vue`** + **`src/views-v2/RatingsView.vue`** + **`src/views-v2/ClanView.vue`** — orchestrator pattern canonical (83-84 lines each, same structure). 5E view = 5-й идентичный orchestrator.
7. **`src/components/hud/HudProfile.vue`** + **`src/components/hud/HudRatings.vue`** + **`src/components/hud/HudClan.vue`** — HUD scoped `<style>` pointer-events canonical block (mandatory урок #12 + #22 selector match).
8. **`src/scene/scenes/ProfileScene.js`** + **`RatingsScene.js`** + **`ClanScene.js`** — reference для 5A helper reuse pattern (5E = 7-й consumer if octagonal, не блокирующий — может быть кастомная геометрия).
9. **`src/scene/CanvasLayer.vue`** — verify `renderer.toneMappingExposure` value (2.3) для exposure compensation calc (урок #19).
10. **`src/data/clanMock.js`** + **`src/data/ratingsMock.js`** — mock data conventions для 5E mock (если нужен). Mulberry32 RNG в ratingsMock, verbatim port в clanMock.
11. **`src/components/fragments/profile/wallet/ConnectWallet.vue`** + **`src/components/fragments/clan/CreateClan.vue`** + **`ClanEdit.vue`** — augmentation pattern reference (defineExpose + v2-aware navigation conditional).

## §3 Уроки 5D — actionable для 5E

Aggregate всех уроков 5A/5B/5C/5D — 24 пункта total. Distilled list для 5E quick-reference:

### 1-10 Inherited from 5A/5B/5C
1. Git log verify before finals (factual hashes).
2. DOM HUD vs 3D raycast — оба path grep'нуть.
3. masterModel vs UserModel asymmetry (Date wrapping).
4. Vuex action dispatch vs direct call (multi-step atomic).
5. Lazy scene pattern — default для v2 sub-scenes (5B/5C/5D parity).
6. 5A helper reuse — mandatory grep first.
7. Lazy modal + defineExpose augment (5B precedent + 5D refined).
8. Hot-fix mid-epic приемлем, multi-part норма.
9. Preemptive edit-split для файлов >100 строк.
10. HUD line count soft-300 — splitting candidate в polish.

### 11-14 From 5C
11. Shape assumptions в ТЗ require pre-verification (grep prev sub-epic).
12. v2 HUD components MUST own pointer-events reset (scoped style mandatory).
13. Prototype values require target-hardware retuning.
14. ТЗ HUD markup specs обязаны включать canonical Vue scaffolding.

### 15-18 From process

15. SPEC import paths must cite real precedent verbatim.
16. Visual readability is multi-factor — first check renderer exposure prototype vs v2.
17. Visual issue first move = literal diff against working precedent line-by-line, not value tuning.
18. 2 failed visual tunes → STOP tuning, START structural inspection.

### 19-24 New from 5D (CRITICAL для 5E)

**#19 Exposure compensation FIRST при port'е prototype scenes.**
**(5D §3.7 + §5.5 + ranks #1 priority lesson 5D run.)** Renderer exposure delta prototype (1.05) vs v2 CanvasLayer (2.3) — primary diagnostic при visual readability mismatch. **НЕ tune lighting** до verify exposure delta. Frankenstein-mode (5 hot-fix attempts на ложной траектории) cost 9 commits + 5 visual verifies в 5D Step 5.

**Protocol для 5E:** Step 0 pre-flight grep `grep "toneMappingExposure" src/scene/CanvasLayer.vue` + сравнить prototype `<canvas>`/renderer setup. При port'е — prototype values verbatim + intensity ~50% reduction для exposure 2x boost.

**#20 Renderer settings delta как primary diagnostic.**
Exposure / tonemapping / colorspace mismatches accountfor major fraction of visual mismatches. При user "не так как должно" feedback — Step 0 = renderer settings dump prototype vs v2.

**#21 Cone-angle adjustments belong в exposure compensation toolkit.**
Exposure boost изменяет light falloff geometry для off-axis geometry. Cone width должна следовать boost (~1.4x widening для off-axis coverage) иначе off-cone geometry падает в ambient-only.

**#22 Pre-commit grep для HUD scoped style — selector ↔ template root match.**
Pre-commit verify обязан включать literal selector match check (не только block existence):
```bash
root_class=$(grep -oP 'class="\K[a-z-]+(?=-hud")' src/components/hud/HudX.vue | head -1)
grep "\.${root_class} {" src/components/hud/HudX.vue || echo "MISMATCH"
```
Convention: `{name}-hud` (clan-hud, ratings-hud, pit-hud, [shop-hud / settings-hud для 5E]). Exception: `hud-profile` legacy 5B.

**#23 display:none на lazy modal host pattern — conditional на legacy template.**
- Legacy template имеет inline trigger button → `style="display: none"` host OK (5B ConnectWallet pattern).
- Pure-modal legacy (только VModal/VDialog) → **НЕ** добавлять display:none (5D CreateClan/ClanEdit pattern).

**#24 Augmentation для legacy reuse — обязательный grep `router.push` в legacy file.**
При reuse legacy через defineExpose — pre-augmentation grep `router\.push|this\.\$router` внутри legacy file. Conditional на `currentPath !== '/v2/<area>'` skip = minimal additive fix. Confirmed twice 5D (CreateClan + ClanEdit).

## §4 Карта Sub-Epic 5E

### Scope (TBD — depends on prototype availability)

5E target — **Shop preferred** (cosmetic покупки: skins / archetype glows / clan emblems). Если prototype Shop section не специфична — fallback на **Settings** (language / sound / theme / build version standalone — выделить из ProfileSettings).

**Q1 first** — поиск prototype Shop section в `hexlash_v24.html`. Если есть `class="shop-"` + dedicated 3D scene (shop locker geometry) — Shop. Если только legacy `BuyTokens.vue` (отключен с Phase 1) — Settings.

### Path A vs Path B (если Shop)

5C/5D precedent — Path A (prototype-first). Legacy `BuyTokens.vue` (disabled), `ProfileWallet.vue` skin tab — НЕ переносится в v2 Shop. v2 Shop = fresh prototype layout (полки cosmetics + price + buy btn + connected wallet flow).

### Entry point

Hub `shop` plinth click (3D raycast) — currently PhModal via `PH_MODAL_IDS = ['shop']`. 5E Step 1 переключает на router push `/v2/shop`.

### Expected files (Shop scenario)

| File | Estimated | Pattern source |
|---|---|---|
| `src/views-v2/ShopView.vue` | ~83-84 lines | Orchestrator (5B/5C/5D parity) |
| `src/scene/scenes/ShopScene.js` | ~150-200 | Lazy sub-scene (5A 7-th consumer if octagonal) |
| `src/components/hud/HudShop.vue` | ~300-500 | HUD с product grid + filter tabs + buy modal |
| `src/styles/v24/shop.css` | ~300-400 | Port prototype shop section |
| `src/data/shopMock.js` | ~50-80 | Mock cosmetics catalog (skins + emblems + glows) |

### Changes to existing files

- `src/router/index.js` — `V2Shop` route (no `:id` per Q3 5D precedent).
- `src/views-v2/PitViewV2.vue` — `'shop'` убран из `PH_MODAL_IDS`, explicit branch added.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.shop` deleted.
- `src/styles/hexlash-v24.css` — `@import './v24/shop.css'`.

### Wallet integration (Shop scenario)

Shop требует connected wallet для покупок. Reuse pattern из 5B Profile — lazy ConnectWallet через defineExpose. Дополнительная wagmi hook'и: `useAccount()` для balance display, transaction send для buy flow. **Q3 open** — backend purchase API exists? (Likely no — нужен new endpoint или mock-only для 5E).

### Deferred для 5G polish (pre-flag)

- LocalStorage persist filter choice (skin category / glow category).
- i18n inline EN strings.
- Real backend purchase API (если mock-only в 5E scope).
- Buy confirmation modal v24-style.

## §5 Открытые вопросы для 5E opening

3 вопроса для user answer в первом сообщении 5E chat'а. Gate перед Step 1.

### Q1: Shop vs Settings — какой target для 5E?

Determines based on prototype Shop section availability (`grep "openShop\|class=\"shop-\|ShopScene" docs/visual-migration/hexlash_v24.html`). Если prototype Shop section dedicated — Shop preferred (5G plan). Если только legacy `BuyTokens.vue` (disabled) — Settings (язык / звук / build standalone выделить из ProfileSettings).

### Q2: Path A (prototype-first) vs Hybrid (если Shop)

5C/5D precedent — Path A consistent. Если prototype Shop = fresh layout — port v24-style. Если legacy fragments shareable (e.g. `BuyTokens` modal logic для price calculations) — Hybrid via augmentation pattern (5D Q2).

### Q3: Backend purchase API — exists или mock-only?

Если backend purchase endpoint (POST /v1/shop/buy?) — wire real API. Если нет — mock-only для 5E (catalog + simulated buy flow → fake confirmation), real wiring deferred в PvP-integration или separate backend sub-epic.

## §6 Что делать новому чату в первом сообщении

Claude Code 5E run — 10 steps в первом сообщении:

1. **`git branch --show-current`** — note actual slug (NOT hard-code).
2. **`git log --oneline -15`** — verify 5D CLOSED state: hashes `041e7c1` (Step 13 CLAUDE.md) + `6e7008a` (Step 14 FINAL_REPORT) + `<this commit>` (Step 15 HANDOFF) должны присутствовать в recent.
3. **`ls node_modules/` → если empty:** `npm install` (environmental gap per 5C §5.8 / 5D parity).
4. **Read this handoff file** full.
5. **Read ТЗ 5E** от пользователя (приходит в первом user message).
6. **Read `EPIC5_5D_FINAL_REPORT.md`** — §3 tech + §5 divergences + §6 lessons (особенно #19-24).
7. **Read `CLAUDE.md`** Sub-Epic 5D section + 5C section + 5B section + (если Shop) Skins System section.
8. **Grep prototype** для shop section: `grep -n "openShop\|class=\"shop-\|class='shop-\|ShopScene\|shopLocker" docs/visual-migration/hexlash_v24.html | head -20`. Result determines Q1 (Shop vs Settings).
9. **Verify exposure delta** Step 0 mandatory: `grep "toneMappingExposure" src/scene/CanvasLayer.vue` + grep prototype renderer setup. **Lesson #19 critical.**
10. **Respond с Step 0 pre-flight report** (read-only) — branch / recent commits / 5A helper availability / shop prototype section line range / exposure delta confirmed / legacy shop components (BuyTokens etc.) / Q1 recommendation (Shop vs Settings).

11. **Wait for user Q1-Q3 answers** перед proceed в Step 1. **Не start implementation** без user decisions на 3 open questions §5.

**Если user уже в ТЗ 5E answered Q1-Q3** — acknowledge answers + Step 0 pre-flight выполняется симметрично, затем proceed в Step 1.

## §7 Стартовое сообщение для нового чата

Copy-paste в начало 5E chat'а (после user's ТЗ spec):

```
Start 5E.

Mandatory pre-flight перед Step 1:

1. git branch --show-current — note actual claude/* slug (НЕ hard-code в ТЗ spec'е
   имена C97qk / 4BPEk / DV1oX — предыдущие run'ы имели разные, 5E run получит
   новый).

2. git log --oneline -15 — verify 5D CLOSED в recent:
   * <Step 15 commit> epic5-5d: step 15 — HANDOFF_EPIC5_5E_CHAT_HANDOFF.md
   * 6e7008a epic5-5d: step 14 — EPIC5_5D_FINAL_REPORT.md
   * 041e7c1 epic5-5d: step 13 — CLAUDE.md Sub-Epic 5D section + lessons #19-24
   * 4b5e105 epic5-5d: step 8 — in-clan body + ClanEdit lazy + Leave confirm
   Все три finals должны быть в history. Если отсутствуют — state inconsistent, STOP.

3. ls node_modules → если empty → npm install (environmental per 5C §5.8 / 5D parity).

4. Read HANDOFF_EPIC5_5E_CHAT_HANDOFF.md полностью.

5. Read EPIC5_5D_FINAL_REPORT.md §3 tech + §5 divergences + §6 lessons.

6. Grep prototype для shop section:
   grep -n "openShop\|class=\"shop-\|ShopScene\|shopLocker" docs/visual-migration/hexlash_v24.html | head -20

7. Verify renderer exposure delta (lesson #19 critical):
   grep "toneMappingExposure" src/scene/CanvasLayer.vue
   grep "toneMappingExposure" docs/visual-migration/hexlash_v24.html

8. Step 0 pre-flight report (read-only) по template EPIC5_5D_FINAL_REPORT §1 format.

9. Gate на Q1-Q3 (§5 handoff):
   - Q1: Shop vs Settings target?
   - Q2: Path A prototype-first vs Hybrid?
   - Q3: Backend purchase API exists или mock-only?

   User answers → proceed Step 1. Не implementation без decisions.

6 критических уроков из 5D (read full в §3 handoff):
- Урок #19: exposure compensation FIRST при port'е prototype scenes
  (renderer.toneMappingExposure delta 1.05 vs 2.3 — primary diagnostic).
- Урок #20: renderer settings delta как primary diagnostic при visual mismatch.
- Урок #21: cone-angle adjustments belong в exposure compensation toolkit
  (~1.4x widening для off-axis coverage).
- Урок #22: pre-commit grep для HUD scoped style — selector ↔ template root
  match check (не только block existence).
- Урок #23: display:none на lazy modal host pattern conditional на legacy
  template — pure-modal legacy doesn't need it.
- Урок #24: при reuse legacy через augmentation — обязательный grep
  router.push в legacy file, conditional на currentPath skip.

Branch context:
- Current branch — новый claude/* slug (определить через git branch --show-current).
- Predecessor — claude/clan-view-completion-C97qk (5D run).
- Merge target — visual-v2 (в конце Epic 5).

Mode A strict: стоп после каждого шага → short status → ждать ok.
```

## §8 Чеклист самого handoff'а

Self-audit перед commit этого файла:

- [x] §1 — route table + entry point state + branch warning (new slug for 5E).
- [x] §2 — reading order 11 files, включая 5D FINAL_REPORT / canonical references.
- [x] §3 — 24 уроков (1-18 inherited + 19-24 новых из 5D, ranked priority с #19 как critical).
- [x] §4 — scope map: Shop preferred (TBD), 5 expected files, 4 changes to existing, deferred flags, wallet integration note.
- [x] §5 — Q1 (Shop vs Settings), Q2 (Path A vs Hybrid), Q3 (backend purchase API) — все с 5D precedents referenced.
- [x] §6 — 11 steps для new chat в первом сообщении + не start implementation перед Q1-Q3.
- [x] §7 — start message copy-paste ready. Branch warning + 6 critical lessons (#19-24) + 5D final hashes + Mode A mention.
- [x] §8 — this self-audit.

Finals 5D для verification:
- `041e7c1` epic5-5d: step 13 — CLAUDE.md Sub-Epic 5D section + lessons #19-24.
- `6e7008a` epic5-5d: step 14 — EPIC5_5D_FINAL_REPORT.md.
- `<this commit>` epic5-5d: step 15 — HANDOFF_EPIC5_5E_CHAT_HANDOFF.md.

После этого commit'а — **Sub-Epic 5D — CLOSED**. Переход к 5E в новом чате.
