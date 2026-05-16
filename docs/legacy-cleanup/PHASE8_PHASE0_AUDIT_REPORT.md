# Phase 8 — Phase 0 Audit (`/rules` v2 port discovery)

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA:** `0bfaac4` (Phase 7 Part B)
**Date:** 2026-05-14
**Scope:** Discovery only. No code edits.

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `0bfaac4` ✅ matches expected (Phase 7 Part B)
- Clean working tree
- Decision: proceed

---

## Шаг 1 — `views/PageView.vue` анатомия

**File:** 107 lines, single-file Vue 3 setup component.

**Imports:**
- `Card` from `@/components/ui/Card.vue` (v1 UI primitive — **sole consumer** outside Info/Error/DeleteAccount usage of icon_close.svg)
- `BackButton` from `@/components/ui/BackButton.vue` (**sole consumer**)
- `t` from `@/locales/index.js`
- `useRoute` from `vue-router`
- `backRef` from `@/router/index.js`

**Props:** none. Stateless container.

**Template:**
```vue
<div class="background">
  <Card :title="title" bgColor=... borderColor=... :showCloseButton="false">
    <template #back>
      <BackButton style="margin-left: 0 !important;" :defaultRoute="backRef(route)"/>
    </template>
    <div class="help-content" v-html="content"></div>
  </Card>
</div>
```

**Content-loading mechanism (key insight):**
```js
watch(route, () => {
  title.value = route.name.toLowerCase();
  content.value = t.value.pages?.[title.value] || '';
}, {immediate: true});
```

PageView is **multi-purpose by route.name**: reads `route.name`, lowercases it, looks up `t.value.pages[<lower-name>]`. So `/rules` (name `'Rules'`) → `t.pages.rules`. If another route mounted PageView with name `'Privacy'`, it'd read `t.pages.privacy` automatically. This is the "multi-purpose magic" that made v1 PageView fragile (route name = data lookup key, implicit coupling).

**Styling:**
- `.background` — full-screen fixed positioning with `background_page.webp` (265 KB asset, **sole consumer** is PageView)
- Heavy custom `:deep()` styles for v-html children: `ul`, `li`, `a` (1.4em color), `h2`, `p` (1.2em line-height), `span` (`--hex-primary-light`), `.margin-l-20`

**Vuex/store dependencies:** none direct. Just reactive `t` ref from i18n loader.

**i18n keys held:** none directly. Indirect access via `t.pages.[route.name.toLowerCase()]`. The two referenced pages (`pages.help`, `pages.rules`) come from JSON files, not en.js.

**Router connection:** `useRoute` + reactive watcher. Route name is the data key (no explicit param). Currently only `/rules` route uses PageView (post Sub-epic 6B-1 — `/help` moved to v2 HelpView).

---

## Шаг 2 — `views-v2/HelpView.vue` анатомия

**File:** 139 lines, single-file Vue 3 setup component.

**Imports:**
- `t` from `@/locales/index.js`
- `useRouter` from `vue-router`
- Standard Vue `computed`
- **Does NOT import PageView, Card, or BackButton** — fully independent.

**Props:** none.

**Template:**
```vue
<div class="help-view">
  <div class="help-header">
    <button class="help-back-btn" @click="goBack" type="button">
      ← {{ t.common?.back || 'Back' }}
    </button>
    <h1 class="help-title">{{ t.nav?.help || 'Help' }}</h1>
  </div>
  <div class="help-scroll">
    <div class="help-content" v-html="helpContent"></div>
  </div>
</div>
```

**Content-loading mechanism:**
```js
const helpContent = computed(() => t.value.pages?.help || '');
```

**Hardcoded `t.pages.help`** — no route-name magic. This is the clean v2 redesign of PageView's multi-purpose pattern.

**Back-button:** inline `<button>` styled with `--text-mid` / `--hex-primary`, no shared component. `goBack()` calls `router.back()`.

**i18n keys referenced (with fallback):**
- `t.common?.back || 'Back'` — `t.common` namespace does not exist in current en.js (post Phase 7 retire). Falls through to `'Back'` literal.
- `t.nav?.help || 'Help'` — `nav` namespace was retired in Phase 7 (was wholly-dead). Falls through to `'Help'` literal.
- `t.pages?.help` — live, from `pages/help/en.json`

**Styling:** clean v2 architecture using `--bg-panel`, `--text-mid`, `--hex-primary`, `--font-display`, `--font-mono`, `--font-body` CSS vars. `.help-view` is `position: absolute; inset: 0; pointer-events: none` overlay with children opting in (Lesson #34 HUD overlay convention). Heavy `:deep()` styles for v-html children: `h2`, `h3`, `p`, `ul`, `li`, `a` (with `text-decoration-thickness` modern styling).

**Architectural differences from PageView:**

| Aspect | PageView (v1) | HelpView (v2) |
|---|---|---|
| Component dependencies | Card + BackButton (2 v1 primitives) | None (self-contained) |
| Content source | `t.pages[route.name.toLowerCase()]` (dynamic, magic) | `t.pages.help` (static, explicit) |
| Back navigation | `BackButton :defaultRoute=backRef(route)` (utility-based) | `router.back()` (inline button + native) |
| Layout | `.background` fullscreen image | overlay pattern (`absolute inset:0`) |
| Styling vars | `--hex-primary`, `--hex-text-primary` | full v2 `--bg-panel`, `--text-mid`, `--font-*` family |
| Multi-purpose | yes (any route, any page key) | no (hardcoded `help`) |
| Coupling | high (3 imports, route-name magic) | low (1 import, explicit key) |

---

## Шаг 3 — JSON files inventory

```
src/locales/pages/
├── help/
│   └── en.json   (21 KB — long-form rules-style guide for play hub)
└── rules/
    └── en.json   (3.3 KB — legal-style rules of conduct)
```

**English-only ✅** — per Phase 7 closure, locale migration to English-only complete. Both `pages/help/` and `pages/rules/` contain single `en.json` file each, no remnants of 11-locale era. No legacy debt to clean up here.

**JSON structure (both files):**
```json
{
  "pages": {
    "<pageKey>": "<HTML string content>"
  }
}
```

Where `<pageKey>` is `"help"` for `help/en.json` and `"rules"` for `rules/en.json`. The loader (`src/locales/index.js`) spreads `enHelp.pages.help` into `data.pages.help` and `enRules.pages.rules` into `data.pages.rules`. Result: `t.pages.help` and `t.pages.rules` are the publicly-accessible paths.

**Content nature:**
- `pages.help` — 21 KB, 9-section in-game guide (Introduction, How to Start, Cryptocurrency, Trainings, Tasks, Fights, Clubs, Profile, Ratings). Cross-references `/rules`, `/profile/account`, `/profile/wallet`, etc.
- `pages.rules` — 3.3 KB, 5-rule manifesto styled as in-universe charter. Cross-references `/help#details`.

**Cross-links:** Both pages link to each other. `pages.help` content has 2 internal links to `/rules?back=help`. `pages.rules` has 1 link to `/help#details`. Whatever path is chosen for /rules, link integrity must be preserved.

---

## Шаг 4 — Router landscape

### Current state (src/router/index.js)

**Line 59 (publicRoutes):**
```js
{path: '/rules', name: 'Rules', component: () => import("/src/views/PageView.vue")},
```
- Path: `/rules`
- Name: `'Rules'` (PageView uses this for `t.pages[name.toLowerCase()]` lookup → `pages.rules`)
- Auth: public (no protectedRoutes entry)
- Component: v1 PageView

**Line 78 (protectedRoutes):**
```js
{path: '/help', redirect: '/play/help'},
```
- Path: `/help`
- Redirect-only to `/play/help` (Sub-epic 6B-1 redirect for legacy bookmarks)

**Line 95 (protectedRoutes — parking item context):**
```js
{path: '/profile/skins', name: 'Skins', redirect: '/play/profile'},
```
- Name: `'Skins'` — **orphan route name** (Phase 0 parking #5).
- Redirect-only. Name is meaningless for a redirect entry; could safely drop the `name: 'Skins'` field. Cosmetic-tier cleanup.

**Line 195–198 (v2Routes children):**
```js
{
  path: 'help',
  name: 'V2Help',
  component: () => import('@/views-v2/HelpView.vue'),
},
```
- Path: `play/help` (under `/play` parent)
- Name: `'V2Help'`
- Auth: not in `v2ProtectedNames` array → publicly accessible (consistent with help being a public reference)

### Conflicts / risk surfaces

- No path conflict for adding `/play/rules` as v2 child route.
- No name conflict for adding `'V2Rules'`.
- `/rules` is in publicRoutes — auth-free. Whatever location new RulesView lands, it must remain auth-free (legal content).

### Auth status confirmation

`v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate']` — V2Help is NOT in the list, so it's accessible without login. A future V2Rules added without entering the protected list inherits the same public posture. ✅ matches legal-page requirement.

---

## Шаг 5 — Path A vs Path B comparison + recommendation

### Path A — separate `views-v2/RulesView.vue`

**What to do:**
1. Copy `HelpView.vue` → `RulesView.vue`
2. Change `t.value.pages?.help` → `t.value.pages?.rules` (1 line)
3. Change `t.nav?.help || 'Help'` → `t.nav?.rules || 'Rules'` (1 line — note `t.nav` was retired, falls through to literal)
4. Optionally rename `.help-*` CSS classes → `.rules-*` (cosmetic, scoped style)
5. Add v2 route: `{ path: 'rules', name: 'V2Rules', component: () => import('@/views-v2/RulesView.vue') }`
6. Update old `/rules` public route: replace component with redirect to `/play/rules` (or keep `/rules` as public mount of new RulesView — see open question)
7. Update `pages.help` cross-references `/rules?back=help` → `/play/rules?back=help` (or whichever path)

**Pros:**
- Clean separation; each page evolves independently
- Zero risk of "multi-purpose creep" (the v1 PageView trap)
- Trivial change: copy + 2-line diff + route registration
- If rules page later needs different styling, breadcrumbs, signature block, etc., free to diverge without coordinating with help

**Cons:**
- ~140 lines duplicated between HelpView and RulesView
- Maintenance: any styling fix has to be applied to both
- If a 3rd long-form page appears (privacy, terms of service), duplication compounds

**LOC impact:** +140 (RulesView) + ~5 (router) − 107 (PageView retire in cleanup phase) = **net ~+38 lines**

### Path B — reuse `HelpView.vue` via route param/meta

**What to do:**
1. Modify HelpView to read a "page key" from route meta or route name. Options:
   - `route.meta.pageKey: 'help' | 'rules'`
   - `route.name === 'V2Help' ? 'help' : 'rules'` (name-based, like PageView did — but cleaner because explicit two-value lookup, not `toLowerCase()` magic)
2. Generalize `helpContent` computed: `t.value.pages?.[pageKey] || ''`
3. Generalize title: `t.nav?.[pageKey] || (pageKey === 'rules' ? 'Rules' : 'Help')` or similar
4. Add v2 route: `{ path: 'rules', name: 'V2Rules', component: HelpView, meta: { pageKey: 'rules' } }`
5. Optional: rename file `HelpView.vue` → `PageView.vue` or `LongFormView.vue` to reflect its multi-purpose nature
6. Update old `/rules` public route + cross-references same as Path A

**Pros:**
- Single source of truth for long-form page rendering
- Styling/UX changes apply to both pages automatically
- Scales cleanly to 3rd / 4th page (just add route entry)

**Cons:**
- HelpView becomes mildly "multi-purpose" — same family of component as v1 PageView
- HOWEVER, the multi-purpose-ness is bounded: explicit `pageKey` parameter (vs route.name.toLowerCase() implicit magic). Cleaner than v1.
- Optional rename adds touch points (consumer references in CLAUDE.md, etc.)

**LOC impact:** +~10 (HelpView edit) + ~5 (router) − 107 (PageView retire) = **net ~−92 lines**

### Recommendation

**Path A** — separate `RulesView.vue`.

Reasoning:
1. **Only 2 long-form pages** (help, rules). Abstraction overhead of Path B is not yet justified for 2 entries.
2. **Risk asymmetry:** Path A has zero risk of multi-purpose creep. Path B has small risk if future changes (e.g., adding query-param-based features per page) accidentally re-introduce PageView-style coupling.
3. **Future flexibility:** rules page may want different presentation (legal styling, signature block, version footer) that help doesn't need. Path A allows this without complicating the shared component.
4. **Cost is small:** 140-line duplicate is acceptable for genuinely-different content. Both files are mostly CSS.
5. **Future refactor path:** if a 3rd page is added (privacy, terms), refactor to Path B at that time, when the gain is clear.

**This is a recommendation, not a decision.** Owner approves on STOP gate.

---

## Шаг 6 — Chain dependencies retire phase

After Phase 8 implementation lands and `/rules` is served by v2 view, the cleanup phase retires:

### Direct retires
- `src/views/PageView.vue` (the v1 view itself)

### Chain orphans (confirmed by grep)
- `src/components/ui/BackButton.vue` — only consumer is PageView. Phases 1–5 retired all other consumers (L1, L4, ProfileWallet). **Retire after PageView.**
- `src/components/ui/Card.vue` — **NEW finding**, only consumer is PageView (170 lines, Vuetify-free). **Retire after PageView.**
  - Note: Card.vue imports `icon_close.svg` — that icon has 3 other live consumers (`Info.vue`, `Error.vue`, `DeleteAccount.vue`), stays live.

### Asset orphans
- `src/assets/images/background_page.webp` (265 KB) — only consumer is PageView's `.background` CSS rule. **Retire after PageView.** Significant bundle saving.

### Cumulative retire chain impact (estimate)
- 3 component files (PageView + BackButton + Card) — ~417 lines of code
- 1 asset (~265 KB raw, smaller in compressed bundle)
- All of which currently get bundled because PageView is on a live route

### Other potential orphans (verify in cleanup phase, not now)
- `backRef` function in `src/router/index.js` — used by PageView as `:defaultRoute="backRef(route)"`. Check if any other code uses it.
- Vuex / state — none used by PageView, no concern.

---

## Шаг 7 — Orphan i18n + other side-effects after retire

### i18n keys

**No new orphans expected.** Phase 7 already retired `t.nav.*` (was wholly-dead) and other unrelated keys. Live keys after PageView retirement:
- `t.pages.rules` — stays live (new RulesView or generalized HelpView reads it)
- `t.pages.help` — stays live (HelpView reads it)

### Helper functions / utilities

- `backRef` in `src/router/index.js` — likely orphan post-PageView retire (only documented consumer). Add to cleanup phase chain.

### `pages/rules/en.json` + `pages/help/en.json`

Both stay live (consumed by HelpView and new rules-view). No retire.

### CSS / global styles

PageView styles are `scoped` — no global cleanup needed. The `--hex-text-primary` `--hex-primary-light` `--hex-border-default` vars used inside are global v2 tokens that stay live.

---

## Шаг 8 — Open questions for STOP gate

1. **Path A vs Path B for port?** Recommendation: A (separate RulesView). Owner decides.

2. **`/rules` final location:**
   - **(a)** Keep `/rules` path public, mount new RulesView from publicRoutes directly. Old URL stays, no redirect. Cleanest URL.
   - **(b)** Move to `/play/rules` (under v2Routes children), redirect old `/rules` → `/play/rules` from publicRoutes. Consistent with /help being at `/play/help`. Slight URL-cosmetic change (path got `/play/` prefix).
   - **(c)** Same as (b) but keep `/rules` as public-mount alongside (so both `/rules` and `/play/rules` work). Belt-and-suspenders.

   Recommendation: **(b)** — consistency with `/play/help`. Old `/rules` redirect preserves bookmarks/external-links.

3. **Cross-link updates in `pages.help` content:**
   - `pages.help` references `/rules?back=help` (2x). If `/rules` retains its path (option 2a), no edit needed. If moved (2b), update to `/play/rules?back=help`. The redirect in option 2b would handle old links gracefully but updating to canonical path is cleaner.
   - Similarly `pages.rules` references `/help#details` (1x). v1 `/help` is already a redirect to `/play/help` (Sub-epic 6B-1), works as-is.

4. **JSON structure simplification:**
   - Current: `{ "pages": { "rules": "..." } }` then loader extracts `.pages.rules`. Two-level wrap is artifact of old multi-locale era.
   - Could simplify to `"<HTML content>"` as a string-only file, loaded as text via Vite raw import.
   - Trade-off: simpler structure but breaks loader API. Keeping as-is is fine; this is cosmetic. **Default: keep current structure** — no benefit to changing.

5. **Orphan-route-name `Skins` cleanup along the way?**
   - Drop the `name: 'Skins'` field on `/profile/skins` redirect (line 95). Cosmetic, single-line change. Could be bundled in this sub-epic since we're already touching router. Or kept as parking item.
   - Default: bundle if owner wants opportunistic cleanup; skip if strict scope.

6. **Phase 8 sub-epic structure confirmation:**
   - Implementation phase (this discovery's output): new RulesView + route + redirect + JSON cross-link updates.
   - Cleanup phase (after implementation visual-verify): retire PageView + BackButton + Card + background_page.webp + (maybe) `backRef` helper.
   - Confirm 2-phase structure (implementation + cleanup separately) or owner wants single atomic commit?

7. **Visual-verify gating between implementation and cleanup phases:**
   - Implementation phase lands; visual check on Vercel preview that `/play/rules` (or whatever path chosen) serves expected content.
   - Then cleanup phase retires v1.
   - This gating mirrors Эпик 6 cutover practice. Confirm acceptable.

---

## Out-of-scope findings (для записи, не Phase 8)

1. **`backRef` helper in `src/router/index.js`** — used by PageView. After PageView retire, if no other code uses it, becomes orphan. Verify in cleanup phase grep.

2. **Card.vue is sole-consumer chain** — discovered during this audit. Adds 170 LOC to retire-chain. Not previously flagged in series.

3. **`background_page.webp` (265 KB asset)** — sole-consumer chain. Notable bundle saving. Not previously flagged.

4. **`/help` legacy redirect** (line 78) — `/help` → `/play/help`. Old bookmark survival. If owner wants to clean up legacy redirects, this is a candidate (parking item). Out of scope.

5. **Pages JSON structure** — could be simplified but no functional benefit. Cosmetic-only. Out of scope.

6. **HelpView `t.common?.back` fallback** — `t.common` namespace doesn't exist in en.js. Always falls through to `'Back'` literal. Cosmetic, the fallback works fine. Could rename to a real namespace if owner wants i18n-correct (e.g., `t.modal?.btnBack`), but `'Back'` literal is functionally fine.

---

## Acceptance checklist

- [x] STEP 0 documented
- [x] Шаг 1: full PageView anatomy
- [x] Шаг 2: full HelpView anatomy
- [x] Шаг 3: JSON inventory + English-only verified
- [x] Шаг 4: router landscape + orphan route name status
- [x] Шаг 5: Path A vs Path B comparison + recommendation (Path A)
- [x] Шаг 6: chain dependencies (PageView + BackButton + Card + background_page.webp) + asset note
- [x] Шаг 7: orphan i18n status + side-effects checked
- [x] Шаг 8: 7 open questions surfaced
- [x] Out-of-scope findings (6 items)
- [x] No code changes
- [x] Single docs commit

---

## STOP gate

Wait for owner decisions on 7 open questions before Phase 8 implementation ТЗ.
