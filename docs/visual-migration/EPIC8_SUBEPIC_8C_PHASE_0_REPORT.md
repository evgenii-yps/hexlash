# Sub-epic 8c Phase 0 Report — Marketing Site Cluster B

**Status:** Phase 0 — investigation only, READ-ONLY
**Branch:** `claude/investigate-marketing-cluster-b-xX4a9` (created from main HEAD `c5c913a` post 8b PR #367 merge incl. hot-fix `80dbd59` — Lesson #43 STEP 0 verified, 0 ahead / 0 behind origin/main)
**Predecessor:** Sub-epic 8b CLOSED + 1 hot-fix (PR #367 merge commit `c5c913a`)
**Date:** 2026-05-06

---

## 1. Toast Infrastructure

### 1.1 Existing toast components

**Files verified:**
- `src/components/Info.vue` — info-style toast (blue-ish neutral)
- `src/components/Error.vue` — error-style toast (red/destructive)

### 1.2 Mount scope (App.vue)

```vue
<!-- src/App.vue:19 -->
<template v-if="!isPlayRoute">
  <Info :text="infoMessage.text"
        :timeout="infoMessage.timeout"
        :showButton="infoMessage.showButton"
  />
  <Error :text="errorMessage.text"
        :timeout="errorMessage.timeout"
        :showButton="errorMessage.showButton"
  />
  <NoConnection v-if="isAuth" />
  <NewAchievement v-if="isAuth"/>
  ...
</template>
```

**Critical:** `<template v-if="!isPlayRoute">` block mounts toasts on ALL non-game routes — Marketing `/`, auth `/auth/*`, v1 routes. **Marketing `/` route receives toasts** ✓.

### 1.3 Toast trigger API (Vuex)

**Pattern A — InfoMessageModel.withTimeout (used by HudProfileWallet):**
```js
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
const msg = InfoMessageModel.withTimeout('Subscriptions opening soon', 3000);
store.commit('master/setInfoMessage', msg);
// ↑ withTimeout creates { text, timeout, showButton: true }
```

**Pattern B — plain object literal (used by ChallengeNotification):**
```js
store.commit('master/setInfoMessage', { text: msg, timeout: 3000, showButton: false });
```

Both patterns work. Pattern B avoids button affordance for simple confirmation toasts (more appropriate for Subscribe form feedback — no action needed from user).

### 1.4 Recommendation

**Option A — REUSE existing toast** (preferred):

| Criterion | Rationale |
|---|---|
| Mount scope | `<Info>` already renders on `/` route via App.vue:19 `!isPlayRoute` block ✓ |
| API simplicity | Single line `store.commit('master/setInfoMessage', {...})` — no inline UI logic |
| Consistency | Matches existing app UX (login success, profile save, challenge notifications) |
| Render position | Existing toast component handles position/animation/timeout/dismiss |
| Auto-cleanup | `clearInfoMessage` mutation auto-fires after timeout |

**Marketing already inherits toast infrastructure for free.** No need for inline toast in MarketingView.

**Recommended invocation in Subscribe submit handler:**
```js
import { useStore } from 'vuex';
const store = useStore();

function onSubscribeSubmit() {
  // No backend call — placeholder phase per decision #7
  store.commit('master/setInfoMessage', {
    text: "Coming soon — stay tuned!",
    timeout: 3000,
    showButton: false,
  });
  email.value = ''; // Clear field after submit
}
```

---

## 2. Negative-Space + Lesson #46 (NEW) Document CSS

### 2.1 Lesson #46 — document-level CSS scan

**`body` rule (single declaration):**
```css
/* src/assets/main.css:37-55 */
body {
    font-family: 'Arial', sans-serif;
    font-weight: 400;
    background-color: #101010;
    /* Sub-epic 8b hot-fix: removed `overflow: hidden` — was blocking
       document scroll on / route post-MarketingView deploy ... */
}
```

**Hot-fix `80dbd59` verified:** `overflow: hidden` REMOVED from body rule. Body has only font + bg-color — NO height, NO overflow rules. ✓

**`html` rule:**
- Single rule: `@media (min-width: 1024px) { html { font-size: 18px; } }` for desktop scaling
- No `html { height: ... }`, no `html { overflow: ... }` — clean ✓

**Blockers for long-form scroll:** **NONE.** Document-level scroll mechanism unblocked post 8b hot-fix.

### 2.2 Base logo asset

**`grep "base\|coin" src/assets/images/`:** no Base chain logo asset.

Existing token-related icons: `icon_token_less.svg`, `icon_tokens.svg` (game-related, not Base chain).

**Decision: text-only "BASE"** for Token section placeholder (per ТЗ decision recommendation). Avoids brand commitment + no asset acquisition needed.

### 2.3 Font tokens

**Available `--hex-font-*`:**
- `--hex-font-display: 'Impact', 'Anton', 'Bebas Neue', sans-serif` — heavy display font ✓
- `--hex-font-body: 'Inter', 'Roboto', 'SF Pro', -apple-system, sans-serif`
- `--hex-font-mono: 'JetBrains Mono', 'Fira Code', monospace`

**For "$HEX" big text:** `--hex-font-display` (Impact/Anton/Bebas Neue) provides aggressive bold sans-serif aesthetic. Falls back gracefully through 4 levels.

**Available font sizes:** `--hex-font-size-xs/sm/md/lg/xl/xxl/giant` (10px → 32px). For "$HEX" needs custom clamp (likely clamp(60px, 12vw, 140px) or similar — bigger than --hex-font-size-giant 32px).

### 2.4 File size projection

**Current MarketingView.vue:** 403 lines (post 8b + interrupt fix)

**Estimated 8c additions:**

| Section | Lines (template + script + CSS) |
|---|---|
| Gameplay (video placeholder) | ~70 |
| Token ($HEX big + Coming Soon + BASE) | ~60 |
| Roadmap (4 vertical cards + responsive) | ~130 |
| Partners (big COMING SOON heading) | ~40 |
| Subscribe (form + toast + horizontal/mobile responsive) | ~90 |
| 5 IntersectionObserver setup blocks (or composable factor) | ~30-150 (depending on extract) |
| **Total +** | **~420-540 lines** |

**Post-8c projection: ~820-940 lines** (well under 1500 split threshold per ТЗ recommendation).

### 2.5 Section split decision

**Recommendation: KEEP inline single-file MarketingView.vue.**

Rationale:
- Post-8c projection ~820-940 lines — manageable
- Continues 8b precedent (consistent review, simpler diff)
- Refactor to `src/components/marketing/Section*.vue` only if total exceeds ~1500 lines (Эпик 9 polish if needed)

---

## 3. CSS Class Taxonomy

### 3.1 New class prefixes (5 sections)

**Collision check:**
```bash
grep -rn "marketing-gameplay\|marketing-token\|marketing-roadmap\|marketing-partners\|marketing-subscribe" src/
# Result: empty — all clean, 0 collisions
```

**Naming convention:** Mirror 8b BEM-double-underscore pattern (`.marketing-hero__cta`, `.marketing-about__content` etc.)

**5 new section roots + child elements:**

| Section root | Notable children |
|---|---|
| `.marketing-gameplay` | `.marketing-gameplay__placeholder` (video placeholder block), `.marketing-gameplay__overlay` ("Video coming soon" text overlay) |
| `.marketing-token` | `.marketing-token__symbol` ($HEX), `.marketing-token__status` (Coming Soon), `.marketing-token__chain` (BASE label) |
| `.marketing-roadmap` | `.marketing-roadmap__grid` (4-card layout), `.marketing-roadmap__card`, `.marketing-roadmap__card-number`, `.marketing-roadmap__card-status` |
| `.marketing-partners` | `.marketing-partners__heading` (COMING SOON), `.marketing-partners__subtitle` (TBA) |
| `.marketing-subscribe` | `.marketing-subscribe__heading` (STAY UPDATED), `.marketing-subscribe__form`, `.marketing-subscribe__input`, `.marketing-subscribe__button` |

### 3.2 Card pattern for Roadmap

**Global `.hex-card` exists** in hexlash-ui.css (~line 408):
```css
.hex-card {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-color);
  border-radius: var(--hex-radius-lg);
  padding: var(--hex-spacing-lg);
  backdrop-filter: var(--hex-blur-sm);
}
```

**Decision: scoped `.marketing-roadmap__card`** (NOT reuse `.hex-card`).

Rationale:
- Global `.hex-card` uses `var(--hex-bg-card)` (semi-transparent dark) which may not match marketing aesthetic
- Roadmap card needs specific layout: phase number prefix + "Coming soon" placeholder vertical layout
- Custom scoped class allows fine-grained typography + spacing control
- Mirrors 8b precedent (`.marketing-hero__cta` was custom NOT `.hex-btn-primary`)

### 3.3 Form classes for Subscribe

**Global `.hex-input` exists** in hexlash-ui.css (~line 580):
```css
.hex-input {
  width: 100%;
  padding: var(--hex-spacing-md);
  background: var(--hex-bg-light);
  border: var(--hex-border-width) solid var(--hex-text-muted);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-primary);
}
```

**Decision: custom `.marketing-subscribe__input` + `.marketing-subscribe__button`** (NOT reuse `.hex-input` / `.hex-btn-primary`).

Rationale:
- Subscribe needs horizontal compound layout (input + button on same row, joined visually)
- Marketing-specific aesthetic: tight integration vs `.hex-input` 100% width
- Mirror 8b Hero CTA precedent (custom `.marketing-hero__cta` not `.hex-btn-primary`)
- Email field benefits from marketing-specific border radius matching button

### 3.4 Color tokens

All needed tokens exist in `src/styles/hexlash-ui.css :root`:

| Token | Use |
|---|---|
| `--hex-text-primary: #FFFFFF` | Headings ("$HEX", "STAY UPDATED", roadmap card titles) |
| `--hex-text-muted: rgba(255, 255, 255, 0.35)` | Subtitles, "Coming soon" text |
| `--hex-primary: #FF066F` | Pink CTA accent (Subscribe button bg) |
| `--hex-primary-light: #FF3D8E` | Hover states |
| `--hex-primary-glow: rgba(255, 6, 111, 0.5)` | CTA glow shadow |
| `--hex-bg-dark: #090909` | Section backgrounds |
| `--hex-bg-deep: #050507` | Token / Subscribe section bg variant (alternate stripe) |
| `--hex-border-default: rgba(255, 255, 255, 0.08)` | Card borders, input border |
| `--hex-border-active: rgba(255, 255, 255, 0.15)` | Input focus border |

**No additions required.**

---

## 4. UI Infrastructure Dependencies

### 4.1 IntersectionObserver pattern reuse

**Current 8b pattern (28 lines per section):**
```js
const aboutVisible = ref(false);
let aboutObserver = null;

onMounted(() => {
  if (aboutRef.value && 'IntersectionObserver' in window) {
    aboutObserver = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          aboutVisible.value = true;
          aboutObserver.disconnect();
          aboutObserver = null;
        }
      }),
      { threshold: 0.3 }
    );
    aboutObserver.observe(aboutRef.value);
  } else {
    aboutVisible.value = true;
  }
});

onBeforeUnmount(() => {
  if (aboutObserver) {
    aboutObserver.disconnect();
    aboutObserver = null;
  }
});
```

**8c needs 5 more sections with fade-in.** Two options:

**Option A — duplicate inline (5× the above):**
- Pros: stays consistent with 8b pattern verbatim, no new abstraction, easy to read each section in isolation
- Cons: ~140 lines of duplicate boilerplate. 6 section observers (1 from 8b + 5 new) all repeat same pattern. Future addition would compound debt.

**Option B — extract `useScrollFadeIn(elementRef, threshold = 0.3)` composable:**
- Pros: ~30 lines composable + 5×3 lines call sites = ~45 total. Saves ~95 lines vs Option A. Reusable for future sections (Эпик 8 closure or Эпик 9 polish). Vue 3 idiom.
- Cons: New abstraction file (`src/composables/useScrollFadeIn.js`). Refactoring 8b About from inline to composable is in-scope (cleanup as side-effect).

**Recommendation: Option B — extract composable.** Net positive (less code, reusable, matches Vue 3 best practices). Refactor 8b About at composable introduction time for consistency.

**Composable signature:**
```js
import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useScrollFadeIn(elementRef, threshold = 0.3) {
  const visible = ref(false);
  let observer = null;

  onMounted(() => {
    if (elementRef.value && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            visible.value = true;
            observer.disconnect();
            observer = null;
          }
        }),
        { threshold }
      );
      observer.observe(elementRef.value);
    } else {
      visible.value = true;
    }
  });

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return { visible };
}
```

**Usage per section:**
```js
const aboutRef = ref(null);
const { visible: aboutVisible } = useScrollFadeIn(aboutRef);
```

### 4.2 Vuex bindings

| Action | Use |
|---|---|
| `master/setInfoMessage` (Pattern B literal) | Subscribe form submit feedback |
| All other sections | Pure static, no Vuex |

### 4.3 Composables list

| Composable | Status | Source |
|---|---|---|
| `useDocumentMeta` | Existing (8b) | Reuse, no changes |
| `useScrollFadeIn` | NEW (8c, recommended) | `src/composables/useScrollFadeIn.js` (~30 lines) |
| `useRouter` | Existing (Vue Router 4) | For Subscribe form (no nav change needed actually — toast only) |
| `useStore` | Existing (Vuex) | For toast commit |

### 4.4 Asset dependencies

**No new assets needed for 8c:**
- Logo + 5 social icons inherited from 8b ✓
- Hex pattern: pure CSS (8b)
- Gameplay video: deferred to user content drop (placeholder block in 8c)
- Base logo: text-only "BASE" per S2.2 decision
- Roadmap content images: placeholder text only

---

## 5. Vocabulary Alignment Audit

### 5.1 Section ref names

**8b precedent:**
```js
const heroRef = ref(null);
const aboutRef = ref(null);
const footerRef = ref(null);
```

**8c additions (mirror pattern):**
```js
const gameplayRef = ref(null);
const tokenRef = ref(null);
const roadmapRef = ref(null);
const partnersRef = ref(null);
const subscribeRef = ref(null);
```

**8 total section refs post-8c.**

### 5.2 Visibility refs

**Two options:**

**Option A — separate refs (mirrors 8b pattern):**
```js
const aboutVisible = ref(false);     // 8b
const gameplayVisible = ref(false);  // 8c
const tokenVisible = ref(false);     // 8c
const roadmapVisible = ref(false);   // 8c
const partnersVisible = ref(false);  // 8c
const subscribeVisible = ref(false); // 8c
```

**Option B — reactive object:**
```js
import { reactive } from 'vue';
const sectionsVisible = reactive({
  about: false, gameplay: false, token: false, roadmap: false, partners: false, subscribe: false
});
```

**Recommendation: Option A — separate refs.**

Rationale:
- Mirrors 8b precedent exactly (Lesson #32 convention discovery)
- If using `useScrollFadeIn` composable (S4.1 Option B), each call returns its own `visible` ref naturally
- Cleaner reactivity (no single object dependency on all section visibility)
- Template binding `:class="{ 'is-visible': aboutVisible }"` cleaner than `:class="{ 'is-visible': sectionsVisible.about }"`

### 5.3 Subscribe form state

```js
const email = ref('');
const isSubmitting = ref(false); // (optional — useful if API call later)
```

**For 8c (no backend):** `isSubmitting` may be unnecessary since toast resolves immediately. But future-proof: include for symmetry with future Stream 3 BE integration.

**Recommendation: minimal `email` ref only** (no `isSubmitting` — add when backend integration arrives).

**Validation:**
- HTML5 native: `<input type="email" required>` (browser validates format on submit)
- No Vuelidate / library
- Catch-all client-side check before commit:
```js
if (!email.value || !email.value.includes('@')) return;
```

### 5.4 Toast message text

**Options:**

| Text | Tone | Length |
|---|---|---|
| "Thanks! We'll be in touch when subscriptions open." | formal, future-promise | 53 chars |
| "Coming soon — stay tuned!" | casual, honest | 25 chars |
| "Got it! Subscribe feature opens soon." | friendly, action-acknowledged | 38 chars |

**Recommendation: "Coming soon — stay tuned!"** (per ТЗ recommendation in §S5.4).

Rationale:
- Honest about placeholder phase (no backend → no actual subscription)
- Short / punchy / matches "STAY UPDATED" section heading vibe
- Avoids overcommitment ("we'll be in touch" implies database storage that doesn't exist)

---

## 6. Semantic Invariant + Flow Direction

### 6.1 Anonymous user `/` scroll-through experience

**Page structure post-8c (8 sections):**

| # | Section | Approx height | Content |
|---|---|---|---|
| 1 | Hero | 100vh | Logo + Play CTA + animated hex pattern + glow (8b) |
| 2 | About | ~60vh | NEVER GIVE UP + Train. Fight. Rise. (8b) |
| 3 | Gameplay | ~80vh | Video placeholder block (16:9 aspect, "Video coming soon" overlay) |
| 4 | Token | ~70vh | $HEX big text + Coming Soon + BASE chain reference |
| 5 | Roadmap | ~100vh | 4 vertical cards (Phase 1-4, all "Coming soon") |
| 6 | Partners | ~50vh | COMING SOON heading + Strategic partnerships TBA |
| 7 | Subscribe | ~60vh | STAY UPDATED + horizontal email form + Subscribe button |
| 8 | Footer | ~150-200px | 5 social icons + Privacy/Rules/Help (8b) |

**Total page height: ~520vh-550vh** (~5.2-5.5 viewports of scrollable content).

**Single Play CTA in Hero only** (no repetition across sections — preserves 8b decision focus).

**Smooth natural scroll** (post-hot-fix `80dbd59` body overflow removed). Fade-in animations as sections enter viewport (30% threshold).

### 6.2 Subscribe form submit flow

**No backend per decision #7 — toast-only feedback:**

```js
function onSubscribeSubmit(event) {
  event.preventDefault();

  // Minimal client-side validation (HTML5 already enforces type="email" + required)
  if (!email.value || !email.value.includes('@')) return;

  // No backend call — placeholder phase
  store.commit('master/setInfoMessage', {
    text: "Coming soon — stay tuned!",
    timeout: 3000,
    showButton: false,
  });

  // Clear field after submit (signals success, ready for next entry)
  email.value = '';
}
```

**Decision: clear email field after submit** (signals "received" without backend persistence).

### 6.3 External link interactions

**Token section "BASE" reference:**
- **NO external link** for placeholder phase (avoids brand commitment + hover affordance suggesting interactivity)
- Plain `<span>BASE</span>` text-only

**Other sections:** zero external links.

**5 social icons in Footer:** placeholder `href="#"` URLs (8b decision preserved).

### 6.4 Mobile flow (380×800 viewport)

**Section-specific responsive plans:**

| Section | Mobile behavior |
|---|---|
| Hero | Already responsive from 8b (clamp + media queries) |
| About | Already responsive from 8b |
| Gameplay | Video placeholder maintains 16:9 aspect ratio (max-width 100% + aspect-ratio: 16/9) |
| Token | $HEX text scales via clamp (60px → 140px desktop, scales to ~50px on mobile) |
| Roadmap | 4 cards stack 4→1 column on `<768px` (single column natural flow) |
| Partners | Heading scales via clamp |
| Subscribe | Form switches from horizontal `flex-direction: row` (desktop) to `column` (mobile) — input full-width, button below at full-width |
| Footer | Already responsive from 8b |

**Mobile media queries: `@media (max-width: 480px)` and `@media (max-width: 768px)`** for breakpoints.

### 6.5 Performance impact

**Estimated:**
- +420-540 lines source code (HTML + CSS + JS)
- Bundle delta: +50-100KB raw / +10-15KB brotli (mostly markup + CSS, no new image assets)
- No new dependencies
- Single new composable file (`useScrollFadeIn.js`, ~30 lines)
- Lazy chunk size: MarketingView.js + MarketingView.css already exist, will grow proportionally

**Risk: LOW.** No heavy assets, no Three.js, no animation library — pure CSS animations + IntersectionObserver native API.

---

## SUMMARY — Readiness Assessment

### Сложность ТЗ
**M-L** (medium-large). Concentrated in:
- 1 file extension (`MarketingView.vue` 403 → ~820-940 lines)
- 1 NEW composable (`src/composables/useScrollFadeIn.js`, ~30 lines, recommended)
- 0 new image assets (text + CSS placeholders)
- 0 backend changes
- 0 Vuex changes (uses existing `master/setInfoMessage` pattern)
- 0 i18n changes (inline EN per 8b precedent)

### Estimated functional commits
**6-7 functional + 3 closure.**

Suggested cluster ordering:

| Cluster | Commits | Purpose |
|---|---|---|
| **A — Composable extract** | 1 | NEW `useScrollFadeIn.js` + refactor 8b About to use it (consolidates pattern before adding 5 more sections) |
| **B — Gameplay section** | 1 | Video placeholder block + 16:9 aspect + "Video coming soon" overlay |
| **C — Token section** | 1 | $HEX big text + Coming Soon + BASE chain reference |
| **D — Roadmap section** | 1 | 4 vertical cards + responsive 4→1 column on mobile |
| **E — Partners section** | 1 | Big COMING SOON heading + TBA subtitle |
| **F — Subscribe section** | 1 | Horizontal form + email validation + toast on submit |
| **G — Final polish (optional)** | 0-1 | Section spacing tuning, animation timing, mobile QA fixes (or absorb into prior clusters) |

**STOP gates:**
- **G1** after Cluster A (composable refactor) — verify About section still fades in correctly after refactor
- **G2** after Cluster F (final visual) — full smoke test (anonymous + authed flows + 8 sections + Subscribe toast + mobile + console errors)

### Open questions for design-Claude

1. **Composable extract OR inline duplicate?** S4.1 — recommend extract (Option B) for ~95 line savings + reusability
2. **`.hex-card` reuse for Roadmap OR custom `.marketing-roadmap__card`?** S3.2 — recommend custom (mirror 8b precedent)
3. **`.hex-input` reuse for Subscribe email OR custom `.marketing-subscribe__input`?** S3.3 — recommend custom (Hero CTA precedent)
4. **Toast message exact text** — recommend "Coming soon — stay tuned!" (S5.4)
5. **Email field clear after submit OR keep value?** — recommend clear (S6.2)
6. **`isSubmitting` ref needed?** — recommend NO for 8c (no backend call delays); add when Stream 3 BE arrives
7. **Cluster G optional polish commit?** — defer decision until Cluster F complete; absorb if scope minimal

### Risks identified

| Risk | Severity | Mitigation |
|---|---|---|
| File size exceeds 1500-line split threshold | LOW | Projection 820-940 lines under threshold; refactor to section components only if exceeded |
| 5 IntersectionObserver instances perf overhead | LOW | One-shot disconnect after first fire (composable handles); native API; minimal CPU impact |
| Toast component scope (mounts via App.vue v-if !isPlayRoute) | LOW | Verified mounted on `/` ✓ — Marketing inherits toast for free |
| Subscribe email validation edge cases | LOW | HTML5 type="email" + required handles 95%; minimal client-side check sufficient for toast-only feedback |
| Mobile responsive at all 7 new sections | MEDIUM | Per-section clamp + media queries; G2 final smoke includes 380×800 mobile QA |
| Composable refactor breaks 8b About fade-in | LOW | Cluster A delivers refactor in isolation; G1 verifies About still works pre-Cluster B |
| Lesson #46 NEW — body overflow regression | LOW | 8b hot-fix verified preserved (S2.1); body has no overflow rule; no new global CSS in 8c |

### Pre-edit blockers

**NONE.** All paths verified, all assets present, all decisions locked pre-Phase-1.

### Major decisions for design-Claude review

1. **Toast strategy** — RECOMMEND **Option A (reuse `master/setInfoMessage`)** per S1.4. No inline toast, no Vuex coupling worry (toast already mounts on `/`).
2. **`useScrollFadeIn` composable extract** — RECOMMEND **Option B (extract + refactor 8b About)** per S4.1. Saves ~95 lines, Vue 3 idiom.
3. **File size — split MarketingView decision** — RECOMMEND **keep inline** (post-8c projection ~820-940 lines, under 1500 threshold). Defer split decision to Эпик 9 polish if needed.

---

## Bonus Findings (not in 6-subsection scope)

1. **Lesson #46 NEW formalized** — investigation of document-level CSS rules (`html`/`body` overflow/height) for any long-form view sub-epic. 8c Phase 0 §S2.1 verified hot-fix `80dbd59` preserved — body has no overflow:hidden globally. **Reflex applied to 8c entry.** Future long-form views inherit this Phase 0 subsection requirement.

2. **Stream 1 carry-over status update (NOT 8c scope):**
   - Lesson #43 STEP 0 formalization — 12 cumulative occurrences (each new sub-epic post-merge requires manual switch). User explicit defer to Stream 1.
   - `master/resetPassword` orphan chain (1b inheritance)
   - `master/saveTelegramFlag` + `setIsTelegram` phantom mutation (1b)
   - `AppV2.vue:24` stale comment (8a)
   - 6 collateral comment corrections during 8a C3 sed sweep (acknowledged debt)

3. **Composable refactor opportunity (8c side-effect):** Cluster A `useScrollFadeIn` introduces shared pattern. Future sub-epics adding scroll-trigger animations can `import { useScrollFadeIn } from '@/composables/useScrollFadeIn.js'` — no inline duplication.

4. **Toast component independence:** Marketing surface using `master/setInfoMessage` introduces a small Vuex coupling, but `<Info>` component already renders on Marketing route via App.vue v-if condition. Subscribe section becomes the FIRST marketing surface to interact with Vuex (8b had zero Vuex). Documented for future polish if "marketing should be 100% Vuex-free" is desired.

5. **Section anchor URLs (decision #10 NO sticky nav)** — confirmed deferred. Natural scroll only. If 8c reveals user wants section nav, future sub-epic adds `<nav>` + scroll-to-anchor logic (no in-8c scope).

6. **Hot-fix `80dbd59` documentation status:** body overflow removal is in `src/assets/main.css:41-55` with comment block documenting per-surface overflow management. CLAUDE.md update for hot-fix deferred per ТЗ "Documentation update в CLAUDE.md в следующий sub-epic." → 8c CL1 should add hot-fix note to 8b CLOSED entry (streak 4 → 0 break documentation).
