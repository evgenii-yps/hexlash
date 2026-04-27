# Sub-Epic 5E — Shop — Final Report

**Date closed:** 2026-04-27
**Branch:** `claude/setup-5e-shop-mode-a-khIAi`
**Predecessor:** 5D ✅ CLOSED (`5f246eb`)
**Commit range:** `f5aeacc` (Step 1) → `<step 10>` (Step 10)

---

## §1 Шаги и коммиты

| # | Commit | Что |
|---|---|---|
| 0.5 | (branch switch only — `-B claude/setup-5e-shop-mode-a-khIAi` from `claude/clan-view-completion-C97qk@5f246eb`) | Branch slug switch |
| 1 | `f5aeacc` | epic5-5e: step 1 — stubs + route /v2/shop + entry hookup |
| 2 | `42b8098` | epic5-5e: step 2 — scene composition (podium + glove + dust + lighting) |
| 3 | `6bf512c` | epic5-5e: step 3 — shop.css body port (prototype 3643-4013, scoped .app-v2) |
| 4 | `f9a162a` | epic5-5e: step 4 — HudShop body (template + script + 18 items grid + purchase flow) |
| 5 | (skipped — no-op per 5C precedent; edge cases covered в Step 4) | — |
| 6 | `69d753b` | epic5-5e: step 6 — mobile show-detail + sd-mobile-back btn |
| 7 | (verify-only — visual sign-off на Vercel preview) | — |
| 8 | (verify-only — 12 automated checks + static manual regression, all PASS) | — |
| 9 | `e36dbb3` | epic5-5e: step 9 — CLAUDE.md Sub-Epic 5E section |
| 10 | `<step 10>` | epic5-5e: step 10 — EPIC5_5E_FINAL_REPORT.md |
| 11 | `<step 11>` | epic5-5e: step 11 — HANDOFF_EPIC5_5F_CHAT_HANDOFF.md |

## §2 Файлы

### Созданы (5)
- `src/views-v2/ShopView.vue` — 41 lines — orchestrator (lazy registerScene + activateScene + Esc + strict teardown)
- `src/scene/scenes/ShopScene.js` — 222 lines — full scene composition с 5A 7-th consumer
- `src/components/hud/HudShop.vue` — 220 lines — full HUD (template + script + scoped style)
- `src/styles/v24/shop.css` — 419 lines — port prototype 3643-4013 scoped .app-v2 (68 prefixed rules, 2 keyframes, 1 @media block)
- `src/data/shopMock.js` — 39 lines — SHOP_ITEMS (18) + SHOP_OWNED_INIT + INITIAL_BALANCE

### Augmented (0)
Path A pure — никаких legacy augmentation.

### Reused as-is (3)
- `src/scene/objects/octagonalRoom.js` (5A) — 7-й consumer
- `src/scene/objects/dustField.js` (5A) — 7-й consumer
- `src/scene/materials/concrete.js` (pre-5A) — `makeConcreteTexture(THREE)` для podium

### Изменены (4)
- `src/router/index.js` — V2Shop route
- `src/views-v2/PitViewV2.vue` — PH_MODAL_IDS empty + click branch added
- `src/components/hud/HudPit.vue` — MODAL_CONTENT.shop deleted
- `src/styles/hexlash-v24.css` — @import './v24/shop.css'

### Удалены (0)

## §3 Технические детали

### 3.1 Lazy sub-scene — 5B/5C/5D parity
ShopView.vue 41 lines с identical structure: registerScene на mount + activateScene + Esc handler + strict teardown order (`activateScene('pit')` → `unregisterScene` → `dispose`). Validate stable lazy sub-scene pattern beyond 4 prior consumers.

### 3.2 5A helpers — 7-й consumer
Both `buildOctagonalRoom` + `createDustField` reused. Call signatures unchanged since 5A. Stable contract holds через 5A→5E (7 consumers each).

### 3.3 Path A decision — prototype-first (Q2)
Legacy `BuyTokens.vue` disabled с Phase 1 (per CLAUDE.md §Skins System + VISUAL_MIGRATION_PLAN line 234). Confirmed via grep — only comment в `contractState.js:2` references. No legacy reuse.

### 3.4 Mock-only purchase flow (Q3)
`SHOP_ITEMS` static array + `SHOP_OWNED_INIT` Set + `INITIAL_BALANCE` constant. Real backend `POST /v1/shop/buy` + Prisma `UserCosmetic` deferred к backend purchase sub-epic.

### 3.5 No coupling с master/changeSkin (Q4 A)
Shop catalog uses named items (`skn_obsidian`, `skn_riot`) vs legacy `skin_m_N.png` numeric scheme. Hybrid mapping creates accidental coupling. Pure mock holds Path A purity (4-й precedent в Epic 5).

### 3.6 Exposure compensation FULL APPLY (lessons #19-21)
Prototype 1.05 vs v2 2.3 → all intensities × ~0.55 (key, rim) + ambient × 0.30/0.45 (~67%) + hemi × 0.30/0.40 (~75%) + cones × ~1.4 (key π×0.25 → π×0.35; rim π×0.4 → π×0.45). **Pre-tuned в ТЗ §Step 2 table до Step 2 write — НЕ потребовалось visual hot-fix series как в 5D Step 5.**

**Hot-fix narrative metric: 0 attempts на ложной траектории.** Compare 5D Step 5: 5 hot-fix attempts + 1 diagnostic + 1 revert + 1 correct port + 1 fine-tune = 9 commits Step 5 alone. 5E Step 2 single commit = visual passed first try.

### 3.7 Vue 3 Set reactivity workaround
`ownedSet.value = new Set([...ownedSet.value, it.id])` re-create требует. Vue 3 ref не tracks `Set.add()`. Иначе grid не обновляется после purchase. Зафиксировано inline в HudShop.vue purchase function comment.

### 3.8 Conditional spans для price (vs v-html)
Prototype рендерил price как `priceToHtml(price)` returning HTML string injection. v2 переписали на conditional `<span v-if="price.taps">...</span>` блоки. Safer (no XSS surface), idiomatic Vue 3, full reactivity. Trade-off: template slightly verbose (price рендерится в 2 местах — grid card + detail panel — без shared helper). Accepted.

### 3.9 sd-mobile-back addition
Prototype mobile flow полагался на browser back button для возврата к grid из detail. v2 имеет Esc → `goBack()` (выход в `/v2`), не back-to-grid. Без mobile back btn user trapped в detail view (можно только tab switch). 5E intentional addition: `<button class="sd-mobile-back" @click="mobileShowDetail = false">← Items</button>` first child detail panel'а, hidden on desktop через `display: none`, shown @media max-width: 820px.

### 3.10 Sentinel-marker split-write pattern
**5E-introduced practice.** При port'е больших файлов (shop.css 419 lines, HudShop.vue 220 lines) split на 4-5 chunks через initial Write + последующие Edit ops с sentinel markers (`@@PART2@@`, `@@TPL_GRID@@`, etc). Pre-commit verify includes sentinel removal check (`grep -c '@@.*@@'` should be 0). Symmetric с урок #9 split-write но более structured чем простой append. Validates per 5E run, future reusable.

### 3.11 Floor concrete texture dropped
Prototype 12403: `sFloorTex = makeConcreteTexture(); sFloorTex.repeat.set(5, 5)`. 5A `buildOctagonalRoom` floorMat parameter accepts pre-built MeshStandardMaterial without specific texture coupling. Symmetric с 5D ClanScene helper usage. Visually equivalent под fog 0.05 + exposure 2.3 + view distance ~7 от camera. Floor texture micro-detail almost не виден в actual rendered output. Documented as carry-over to 5G polish если 5A helper extension scope opens.

### 3.12 Dust yMax 4 vs prototype 4.3
Minor 5A helper signature bound. Visual delta negligible (yMax 4.3 means 0.3m extra vertical drift range; particles wrap at yMax to yMin). 5G polish candidate если 5A signature extension.

## §4 Проверки
- `node --check` на новых .js файлах (ShopScene.js, shopMock.js) — pass на каждом шаге
- `npm run build` — pass на каждом из 5 functional commits + 1 closing CLAUDE.md commit (build times: 34.6s / 51.5s / 50.0s / 37.0s / 35.9s / 56.5s)
- Grep sanity:
  - `MODAL_CONTENT.shop` refs в `src/` — 0 (удалён в Step 1)
  - `'shop'` в `PH_MODAL_IDS` — 0 (array empty `[]`)
  - `BuyTokens` references — 1 (только comment в `contractState.js:2`, expected)
  - `v-html` directive в HudShop — 0 (1 grep hit = comment line "no v-html — safer")
- Pre-commit grep checklist Step 8 — 12/12 PASS
- Visual verify Vercel preview Steps 1, 2, 4, 6 — user signed off
- Smoke test: shop locker click → /v2/shop → return to /v2 — pass
- Static regression trace (Step 1 closing): 7 explicit click branches + DOM avatar path + fighter UUID fallback — все paths covered, 0 broken

## §5 Расхождения — осознанные

### 5.1 Path A pure (Q2)
Legacy BuyTokens.vue disabled с Phase 1, не reused. Никаких augmentation targets в Shop scope.

### 5.2 Mock-only purchase flow (Q3)
Real backend `POST /v1/shop/buy` + Prisma `UserCosmetic` model + real catalog source — deferred к backend purchase sub-epic post-5E.

### 5.3 No coupling с master/changeSkin (Q4 A)
Catalog taxonomy mismatch с legacy `skin_m_N.png` numeric scheme. Pure cosmetic mock без hybrid mapping table.

### 5.4 Intensities ~55-75% + cones ~1.4x retuned per exposure 2.3 compensation
Lessons #19-21. Key/rim ~55% reduction; ambient ~67%; hemi ~75% (less aggressive т.к. fill light без directional geometry). Cones widened для off-axis side-face readability glove. Pre-tuned в ТЗ table до Step 2 write — НЕ потребовалось hot-fix series.

### 5.5 Vue 3 Set reactivity workaround
`ownedSet.value = new Set([...])` re-create. Inline comment в purchase function.

### 5.6 Conditional spans вместо v-html для price rendering
Safer (no XSS), idiomatic, fully reactive. Trade-off: template slight verbosity (price рендерится в 2 местах). Accepted.

### 5.7 sd-mobile-back btn addition
5E intentional UX gap fill (prototype полагался на browser back).

### 5.8 Floor concrete texture dropped
5A helper bound. Carry-over candidate если 5A floor signature extension в polish.

### 5.9 Dust yMax 4 vs prototype 4.3
Minor 5A helper signature bound. Carry-over candidate.

### 5.10 Hemi retune × 0.30 (75%) less aggressive than key/rim (~55%)
Fill light без directional geometry — exposure boost меньше affect side-face contribution. Empirically arrived after exposure compensation math (1/2.19 ≈ 0.46 strict; we used 0.55-0.75 для visual readability).

### 5.11 Sentinel-marker split-write pattern
5E-introduced practice. Per урок #9 split-write base + structured markers для multi-chunk SFC/CSS port. Future-reusable pattern.

### 5.12 i18n inline EN strings
Defer 5F (5B/5C/5D pattern). Strings hardcoded EN: "Hexlash"/"LOCKER"/"All"/"Skins"/"Gloves"/"Boosts"/"Titles"/"Banners"/"Select an item to see details"/"Effect"/"Price"/"Owned"/"Purchase"/"Insufficient Funds"/"← Items"/"OWNED"/"On-Chain"/"Empty category".

### 5.13 ShopView.vue — 41 vs estimated 83-84
ТЗ §1 estimated 83-84 lines симметрично 5B/5C/5D. Actual ShopView 41 lines (almost half). Reason: 5B/5C/5D ProfileView/RatingsView/ClanView имеют additional logic (route-param sync, deep-link state restoration, etc). 5E has none of that — pure orchestrator. Not a divergence per se, but worth noting for future estimates.

### 5.14 ShopScene.js dispose() simple traverse pattern
Inherited из 5D ClanScene precedent (CLAUDE.md verified). No special CanvasTexture dispose needed beyond standard traverse → geometry/material dispose chain. Floor disc CanvasTexture is nested inside material.map, gets dispose'd via material.dispose() chain.

### 5.15 Static MODAL_CONTENT.warden + .predator carry-over
Из 5C/5D Deferred #14. Status unclear — `warden` / `predator` clicks могут попадать в click watcher fighter fallback. Verify в 5G polish: `grep "warden\|predator" src/views-v2/PitViewV2.vue` click watcher + visual test. Not blocking 5E.

## §6 Уроки для 5F и далее

5E **successfully applied** lessons #19/20/21 — НЕ потребовалось visual hot-fix series как в 5D Step 5. Pre-tuned scene values verbatim → first visual verify pass.

### Lessons 1-24 inherited from 5A-5D (distilled)

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
12. v2 HUD components MUST own pointer-events reset.
13. Prototype values require target-hardware retuning.
14. ТЗ HUD markup specs обязаны включать canonical Vue scaffolding.
15. SPEC import paths must cite real precedent verbatim.
16. Visual readability is multi-factor — first check renderer exposure.
17. Visual issue first move = literal diff against working precedent.
18. 2 failed visual tunes → STOP tuning, START structural inspection.
19. **Exposure compensation FIRST при port'е prototype scenes.**
20. **Renderer settings delta как primary diagnostic.**
21. **Cone-angle adjustments belong в exposure compensation toolkit.**
22. Pre-commit grep для HUD scoped style — selector ↔ template root match.
23. display:none на lazy modal host pattern — conditional на legacy template.
24. Augmentation grep router.push в legacy file.

### New lessons из 5E

**None.** 5E run was clean application of existing lessons. Specifically validates lessons #19-21 successfully prevent the 5D Step 5 hot-fix series narrative.

### Validation note

Lessons #19-21 absorbed pre-Step 2 в ТЗ §Step 2 table form (intensity ×0.55 baseline + cone ×1.4 widening). Step 2 single commit = correct port на первой попытке. Hot-fix narrative metric 0/0 vs 5D Step 5 (5 hot-fix attempts before correct port).

This is **first sub-epic в Epic 5 без hot-fix mid-run** — 5A had 0, 5B had 1, 5C had 1, 5D had 5 (Step 5) + 2 (Steps 7+8 augment). 5E = 0 unplanned hot-fixes.

## §7 Deferred list

| # | Item | Target |
|---|---|---|
| 1 | Real backend purchase API (`POST /v1/shop/buy`, Prisma `UserCosmetic`, real catalog source) | Backend purchase sub-epic post-5E |
| 2 | Catalog → master.userData.skin coupling (Shop "skin" purchase = changeSkin) | Same backend sub-epic OR 5G polish (если frontend-side mapping table approach) |
| 3 | i18n inline EN strings (17 strings inventoried §5.12) | 5F i18n pass |
| 4 | Real player balance из master.userData.taps/xp + wallet useBalance() | Backend purchase sub-epic |
| 5 | Skin preview render-time (real character skin swap в hand silhouette) | 5G polish |
| 6 | Wallet integration для eth-priced purchase (skn_riot 0.045Ξ, bst_elo_shield 0.020Ξ, bnr_legacy 0.065Ξ) | Backend purchase sub-epic + 5B `ConnectWallet` reuse pattern |
| 7 | Floor concrete texture restore (5A helper signature extension для floor map+repeat) | 5G polish |
| 8 | Dust yMax 4 vs prototype 4.3 minor delta (5A helper signature extension) | 5G polish |
| 9 | MODAL_CONTENT.warden + .predator carry-over (5C/5D deferred #14) | 5G polish |
| 10 | Boost timers (24h taps/xp duration tracking — `bst_taps_2x_24h`, `bst_xp_2x_24h`, `bst_streak_save`, `bst_elo_shield`) | Backend purchase sub-epic |
| 11 | Title display в leaderboard (`ttl_*` items effect "Displayed in leaderboard" — нужна real LeaderBoard rendering integration) | 5C ratings sub-epic post-real-API OR backend purchase sub-epic |
| 12 | Banner display в clan hall (`bnr_*` items effect "Clan-wide cosmetic" — нужна real Clan rendering integration) | 5D clan sub-epic post-real-API OR backend purchase sub-epic |
| 13 | Sentinel-marker split-write pattern doc (для future sub-epics — promote из §3.10 в general practice doc) | 5G polish OR separate docs commit |

## §8 Footer

**Sub-Epic 5E — CLOSED.** ✅

### Route table /v2/*

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ 4-card HUD + lazy ConnectWallet + WS friends |
| `/v2/ratings` | 5C | ✅ unified leaderboard (5 scope × 2 season mocks) |
| `/v2/clan` | 5D | ✅ 2-state HUD + lazy CreateClan/ClanEdit reuse |
| `/v2/shop` | **5E** | ✅ 6-tab cosmetics catalog (18 items × 4 rarities) + mock purchase flow + lazy ShopScene |

### Key metrics

- **Коммитов:** 6 functional + 1 CLAUDE.md + 1 FINAL_REPORT (this) + 1 HANDOFF_5F (Step 11) = 9 total
  - Step 0.5: branch switch only (no commit)
  - Step 1: f5aeacc — stubs + route + entry
  - Step 2: 42b8098 — scene composition
  - Step 3: 6bf512c — shop.css
  - Step 4: f9a162a — HudShop body
  - Step 5: skipped (no-op)
  - Step 6: 69d753b — mobile + sd-mobile-back
  - Step 7: skipped (verify-only)
  - Step 8: skipped (verify-only)
  - Step 9: e36dbb3 — CLAUDE.md
  - Step 10: `<step 10>` — FINAL_REPORT
  - Step 11: `<step 11>` — HANDOFF_5F
- **Новых файлов:** 5 (ShopView, ShopScene, HudShop, shop.css, shopMock)
- **Augmented:** 0
- **Reused as-is:** 3 (5A buildOctagonalRoom + 5A createDustField + pre-5A makeConcreteTexture)
- **Изменённых:** 4 (router, PitViewV2, HudPit, hexlash-v24.css)
- **Удалённых:** 0
- **Добавленных строк:** ~941 (39 + 220 + 222 + 41 + 419 = 941 в новых файлах) + 87 (CLAUDE.md) + ~360 (FINAL_REPORT this file) + 23 (Step 6 mobile) + ~30 (Step 1 modifications в existing files)
- **Расхождений:** 15 (§5.1-5.15)
- **Новых уроков:** 0 (validation of lessons #19-21)
- **Deferred carry-over:** 13 items distributed (backend purchase sub-epic 6, 5G polish 5, 5F i18n 1, separate doc 1)

### Hot-fix narrative metric

**0 hot-fix attempts на ложной траектории.** First sub-epic в Epic 5 без unplanned hot-fixes. Lessons #19-21 absorbed successfully = exposure compensation values pre-tuned ТЗ-time, scene visually correct first commit.

Compare:
- 5A: 0 hot-fixes
- 5B: 1 hot-fix (ConnectWallet display:none discovery → урок #23)
- 5C: 1 hot-fix mid-epic
- 5D: 5 hot-fix attempts Step 5 (before correct port discovery) + 2 augmentation hot-fixes (Steps 7+8) = 7 unplanned commits → lessons #19-24
- **5E: 0 unplanned hot-fixes**

Lessons #19-21 проверены работающими.

### Bundle impact

- ShopView lazy chunk: 14.32kB raw / 5.78kB gzip / 4.95kB brotli
- HudShop scoped style: 0.26kB
- shop.css inlined в main `index.css` chunk через `@import` (Vite не chunk-splits @import inside SFC)
- Net 5E payload: ~25kB raw / ~6kB gzip к user fetch при первом visit `/v2/shop`

### Transition к 5F (or 5G)

Следующий sub-epic per VISUAL_MIGRATION plan: 5F (i18n pass) либо 5G (polish).

**Pre-flight план для нового чата** — `docs/visual-migration/HANDOFF_EPIC5_5F_CHAT_HANDOFF.md` (Step 11).

**Designated branch для 5F run** — новый `claude/*` slug (НЕ hard-code current 5E slug). Будущий Claude Code run обязан verify git branch через `git branch --show-current` + сверить recent commits против 5E CLOSED state (hashes `e36dbb3` Step 9 CLAUDE.md + `<step 10>` Step 10 FINAL_REPORT + Step 11 HANDOFF должны присутствовать в history).

---

**End of Sub-Epic 5E Final Report.**
