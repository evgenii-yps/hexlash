# Sub-epic 1b Final Report — Auth Views Redesign + RainView Removal + Telegram Excision

**Status:** ✅ CLOSED
**Branch:** `claude/investigate-auth-views-redesign-rFAwk`
**Type:** FE redesign + BE Telegram code removal + cleanup, M-L size
**Date opened:** 2026-05-06 (after Sub-epic 1a merge `7aaf9be`)
**Date closed:** 2026-05-06 (CL1+CL2+CL3, same day)
**Streak target:** 1 → 2 ✅ achieved (zero hot-fixes)

---

## 1. Executive Summary

Closed three intertwined Эпик 6 / Эпик 7 carry-overs in one sub-epic:

1. **Auth views redesign** — `/auth/login` + `/auth/signup` migrated from RainView 3D-rain shell to AuthLayoutView with new card-style design matching Landing aesthetic (Sub-epic 1a precedent)
2. **RainView removal** — 1212-line Three.js + Kokomi + GLSL shaders view deleted along with all RainView-only assets and 3 npm packages (`kokomi.js`, `postprocessing`, `gsap`)
3. **Telegram-as-auth excision** — `/auth/telegram` route + Vuex action + service function + backend endpoint + HMAC-SHA256 helper + 11-locale keys all removed; adaptive UI flag for TG webview detection preserved per decision #2

Bonus closures via Phase 0 audit + Lesson #11 reflex:
- `/auth/reset` route deleted (decision #4 — backend `/user/reset` returned 501, FE form was cosmetic)
- `App.vue` text Logo hidden on `/auth/*` (interrupt fix during G2 — extends 1a `isLandingRoute` → `isMarketingRoute`)
- `master/saveTelegramFlag` re-wired from auth-side to App.vue init-time (Lesson #18 STOP-tier — preserves decision #2 adaptive UI in absence of TelegramLogin.vue dispatcher)

**Bundle reduction:** main bundle ~3.35MB → ~1.82MB raw (~45%), brotli ~829KB → ~479KB (~42%). Largest single-sub-epic bundle reduction in project history.

---

## 2. Commit Chain

10 functional + 2 interrupt + 3 closure = 15 commits.

| # | SHA | Type | Description |
|---|---|---|---|
| 0 | `965d3c2` | docs | Phase 0 investigation report (7 mandatory subsections) |
| 1 | `34b96ef` | feat | C1 — AuthLayoutView wrapper component (logo header + glow + router-view slot) |
| 2 | `a4e4969` | feat | C2 — Wire /auth/* routes to AuthLayoutView (nested children + redirect) **G1 STOP** |
| 3 | `ab9a805` | feat | C3 — Migrate Login form to new design (card layout + Connect Wallet toast) |
| 4 | `b67c9a9` | feat | C4 — Migrate Signup form to new design (mirror shell, signup-specific) |
| 5 | `e65ecfc` | feat | C5 — Remove /auth/reset route and Reset.vue fragment (decision #4) **G2 STOP** |
| 6 | `547e6ff` | fix | Interrupt fix from G2 visual review — hide App.vue Logo on /auth/* |
| 7 | `316fd7b` | refactor | Lesson #18 interrupt fix — re-wire isTelegram flag setter to App.vue (preserves decision #2 after C6) |
| 8 | `c3eee1b` | feat | C6 — Remove /auth/telegram FE (route + TelegramLogin.vue + Vuex action + service function) |
| 9 | `0c77ce9` | feat | C7 — Remove auth.telegram locale keys (44 lines × 11 locales) |
| 10 | `b76aa07` | feat | C8 — Remove BE Telegram (auth.js + config.js, ~85 lines) **G3 STOP** |
| 11 | `00daa63` | feat | C9 — Delete RainView.vue + 3 npm packages + 11+ assets + 2 legacy fragments |
| 12 | `bcbf6a8` | chore | C10 — Remove orphan auth.reset.* locale keys + final cleanup sweep **G4 STOP** |
| 13 | `dbff6d2` | docs | CL1 — CLAUDE.md sync (routes table + views count + Sub-epic 1b CLOSED entry) |
| 14 | (this) | docs | CL2 — Final report |
| 15 | (next) | docs | CL3 — Handoff to Эпик 8 Marketing Site |

**Merge timeline (incremental continue stack pattern):**
- **PR #361** merged at 10:49Z (during G2 STOP gate review) — brought C1-C5 to main
- **PR #362** merged after G3 + Railway smoke test — brought interrupt fixes + C6+C7+C8 to main
- **Final continue stack PR (TBD)** — small-scope closure: C9+C10+CL1+CL2+CL3

---

## 3. Files

### 3.1 NEW (3)
- `src/views/AuthLayoutView.vue` — 124 lines, scoped `.auth-layout__*` BEM, logo header + glow + `<router-view>` slot with fade transition
- `src/views/auth/LoginView.vue` — 365 lines, card form + ENTER THE PIT sub-headline + Connect Wallet button (toast) + signup link
- `src/views/auth/SignupView.vue` — 403 lines, mirror shell, signup validation (required/min8/match)

### 3.2 MODIFIED (8)
- `src/router/index.js` — restructured authRoutes nested under AuthLayoutView, removed RainView import (C9), function-form redirect for /r/:username
- `src/App.vue` — `isLandingRoute` → `isMarketingRoute` (interrupt fix), added `master/saveTelegramFlag` dispatch in TG webview detection (interrupt fix)
- `src/core/state/modules/masterState.js` — deleted `master/telegram` action (12 lines, C6)
- `src/core/services/masterService.js` — deleted `telegram()` function (54 lines, C6)
- `src/views/RainView.vue` — transient (Reset import + branch removed C5, TelegramLogin import + branch removed C6) — fully deleted in C9
- `src/locales/*.js` (11 files) — auth.telegram block deleted (C7) + auth.reset block deleted (C10)
- `backend/src/routes/auth.js` — deleted crypto require + TG constants destructure + telegramLimiter + validateTelegramPayload + POST /telegram handler (C8, ~85 lines)
- `backend/src/config.js` — deleted TELEGRAM_BOT_TOKEN + TELEGRAM_AUTH_MAX_AGE_SEC exports (C8)

### 3.3 DELETED (16+ files)
**Code:**
- `src/views/RainView.vue` (1212 lines)
- `src/components/fragments/auth/Login.vue` (192 lines, legacy fragment, RainView-only consumer)
- `src/components/fragments/auth/Signup.vue` (224 lines, legacy fragment, RainView-only consumer)
- `src/components/fragments/auth/Reset.vue` (126 lines, deleted in C5)
- `src/components/fragments/auth/TelegramLogin.vue` (137 lines, deleted in C6)

**Assets:**
- `src/assets/sound/rain.mp3`
- `src/assets/models/scene.glb`
- `src/assets/textures/brick-normal2.jpg`
- `src/assets/textures/rain-normal.png`
- `src/assets/textures/asphalt-pbr01/` (3 files: normal/opacity/roughness webp)
- `src/assets/textures/door/` (8 files: shutter/top-cover/side-cover diffuse/glossiness/normal variants)

**npm packages (uninstalled):**
- `kokomi.js@^1.10.3`
- `postprocessing@^6.38.2`
- `gsap@^3.x`

### 3.4 LoC reduction

| Category | LoC |
|---|---|
| RainView.vue | -1212 |
| Legacy auth fragments (4 files) | -679 |
| Backend auth.js (TG) | -85 |
| Backend config.js (TG) | -3 |
| Vuex/service (master/telegram + masterService.telegram) | -66 |
| Locale auth.telegram (11 × 4 lines) | -44 |
| Locale auth.reset (11 × 8 lines) | -88 |
| Router (auth.telegram + auth.reset routes + RainView import + Referral component:) | ~-10 |
| **Total (rough)** | **~-2187 LoC** |

Plus npm dep tree reductions in `package-lock.json` (~hundreds of indirect entries via three's transitive deps eliminated where solely RainView-used).

---

## 4. Architectural Decisions (locked by design-Claude pre-Phase-1)

| # | Decision | Outcome |
|---|---|---|
| 1 | TG-only user lockout risk | 0 prod users (audited) — safe excision |
| 2 | `isTelegram` adaptive UI flag | KEEP (re-wired in interrupt fix `316fd7b`) |
| 3 | `setIsTelegram` phantom mutation | Stream 1 carry-over (not 1b scope) |
| 4 | `/auth/reset` route | DELETED (BE 501 cosmetic) |
| 5 | Connect Wallet on Login/Signup | UI present, "Coming soon" toast (BE Stream 6) |
| 6 | Footer in auth views | NO Privacy/Rules/Help footer inside auth |
| 7 | Login↔Signup links | YES — Don't have account? / Already have account? |
| 8 | Background | Black + subtle pink radial glow (mirrors Landing 1a) |
| 9 | Primary CTA color | `--hex-primary` pink |
| 10 | Sub-headline | "ENTER THE PIT" above form |
| 11 | Layout | Center card, logo above |
| 12 | Visual concept | Match Landing aesthetic, legacy `--hex-*` tokens |
| 13 | Wrapper | AuthLayoutView replaces RainView |
| 14 | Telegram social task | KEEP (separate from auth removal) |
| 15 | Telegram social link icon | KEEP (community channel) |
| 16 | Vuetify removal | NO (auth fragments already Vuetify-free post 5T AW1) |
| 17 | DB telegram fields | N/A (no `telegramId` column existed; tg_<id> login convention only) |
| 18 | npm Telegram packages | N/A (no telegram packages, custom HMAC-SHA256) |

---

## 5. Lessons Applied

### 5.1 Lesson #11 — pre-edit + post-edit grep on every edit

**Catches:** 38+ across 1b, all adaptation-tier per Lesson #35.

Selected examples:
- C2: ТЗ template said `name: 'AuthLogin'`; pre-edit grep showed actual existing names `'Login'`/`'Signup'` — adapted to preserve verbatim (router guard line 250 uses `next({name: 'Login'})`)
- C3: ТЗ template used local try/catch with `serverError` ref; pre-edit grep of existing `Login.vue` + `masterState.js` showed `master/login` action handles errors via state mutation (NOT throw) — adapted to read `loginState.authError` from getter
- C5: Pre-edit grep found dead-code `router.push('/auth/reset')` in legacy `Login.vue:118` — fragment unreachable after C2, documented for C9 cascade
- C6: Pre-edit classification of Telegram refs into REMOVE (auth) vs KEEP (decision #2/#14/#15) — surfaced `saveTelegramFlag` orphan after TelegramLogin.vue delete (Lesson #18 trigger)
- C8: `crypto` require became orphan after `validateTelegramPayload` + `tempPassword` removal — caught and removed in same commit
- C9: Pre-edit grep beyond ТЗ template found `postprocessing` + `gsap` as RainView-only consumers (ТЗ only mentioned `kokomi.js`) — bonus npm uninstall
- C10: Pre-edit grep found `masterService.resetPassword()` still references `t.value.auth.reset.*` keys (orphan refs in unreachable function) — documented for Stream 1

### 5.2 Lesson #18 — STOP at structural mismatch

**Triggered twice mid-cluster:**

**(a)** Before C6 commit — pre-edit grep revealed `saveTelegramFlag` was ONLY dispatched from `TelegramLogin.vue` (being deleted). Decision #2 says KEEP `isTelegram` adaptive UI flag, but the only mechanism that SET the flag was about to be deleted. Surfaced to user before C6. User chose Option A — re-wire setter to App.vue init-time (commit `316fd7b`). 1-line additive change preserved decision #2 intent.

**(b)** At G3 — discovered PR #361 already merged continue stack to main mid-session at 10:49Z. Cherry-pick branch `fix/remove-telegram-auth-be` was redundant given user's incremental continue stack merge workflow. ТЗ Lesson #33 cherry-pick chain assumed continue stack stays detached from main until sub-epic closure — reality differs. Surfaced 3 options (A: abandon cherry-pick, B: open cherry-pick PR anyway, C: merge continue stack now). User chose Option C — atomic continue stack merge (PR #362). Lesson #33 doctrine **abandoned mid-Эпик** — remains valid for sub-epics where user keeps continue stack detached.

### 5.3 Lesson #32 — convention discovery

**Applied across 1b:**
- `.auth-form-*` BEM-light classes mirror `.landing-*` pattern from 1a
- Vuex action error handling pattern adopted from existing `fragments/auth/Login.vue` (read authError from computed getter, not local try/catch)
- `useStore()` composable for new components (mirrors v2 component convention)
- Function-form `redirect:` for `/r/:username` (existing precedent in same router file at `/user/:userLogin`)
- Toast pattern: `InfoMessageModel.withTimeout` + `store.commit('master/setInfoMessage', msg)` (mirrors HudProfileWallet + MatchmakingView)

### 5.4 Lesson #33 — cherry-pick chain ABANDONED mid-Эпик

ТЗ Cluster D specified C8 (BE Telegram excision) cherry-picked to main via separate PR for early prod deploy. **Pattern abandoned at G3** when discovered user's actual workflow merges continue stack incrementally to main during sub-epic execution.

**Cherry-pick branch `fix/remove-telegram-auth-be`** (commit `cd82f51`) was created and pushed but NO PR opened. Branch remains stale on remote (sandbox blocked `git push --delete` — user can prune via GitHub UI manually OR leave for batch cleanup).

**Doctrine update:** Lesson #33 cherry-pick chain applies when continue stack stays detached from main until sub-epic closure. For workflows with incremental continue stack merges (this user's pattern), Lesson #33 is **redundant** — the next continue stack PR atomically brings BE+FE changes together, eliminating race window concerns.

### 5.5 Lesson #43 — STEP 0 bootstrap branch verify

Applied at Phase 0 start. Branch `claude/investigate-auth-views-redesign-rFAwk` was correctly created post-1a-merge from main HEAD `7aaf9be`. Zero divergence, zero recovery needed.

### 5.6 Lesson #45 — Phase 0 metadata triple-verify

Phase 0 inventory cross-checked twice during execution. Two false-positive surfaces caught:

**(a)** Phase 0 §7.2 said `backend/src/services/telegramAuth.js` exists as standalone helper — reality: helper code was inline in `backend/src/routes/auth.js:153-176` (`validateTelegramPayload` function). Detected at C8 pre-edit grep, no actual code change required (planned action was "delete inline block" anyway).

**(b)** Phase 0 §6.4 flagged TG-only user lockout as HIGH risk (no `telegramId` DB field, `tg_<id>` login + `tempPassword` pattern + reset password BE = 501 → potential lockout). User audit pre-Phase-1 revealed 0 affected prod users → risk fully mitigated.

---

## 6. Carry-Overs

### 6.1 Эпик 8 Marketing Site (NEW direction)
Long-form landing site replacing current LandingView. 8-10 sections (Hero, About, Token, Gameplay screenshots/video, Roadmap, Partners, Subscribe, Footer). Reference: clashofcoins.com style. Documented in CL3 handoff with required user inputs (gameplay assets, hero visual, token info, social URLs).

### 6.2 Stream 1 cleanup (orphan code)

| Item | Scope | Source |
|---|---|---|
| `master/resetPassword` orphan chain | Vuex action + `masterService.resetPassword()` (broken refs to deleted `t.auth.reset.*`) + getters/mutations + `PasswordResetStateModel` | C5 + C10 deferral |
| `master/saveTelegramFlag` + `setIsTelegram` phantom mutation | Action calls phantom mutation (silent no-op + Vuex warning); localStorage is actual source of truth via `masterService.setTelegram` | Phase 0 §7.1 finding + decision #3 |

### 6.3 Stream 3 (BE features)
Password reset full backend implementation — email-based flow needs SendGrid/Postmark/SMTP infrastructure decision. Currently `POST /v1/user/reset` returns 501.

### 6.4 Stream 6 (Web3)
Connect Wallet auth — actual SIWE backend integration. FE button currently shows "Coming soon" toast.

### 6.5 Stream 4 Visual Polish
Auth refinement to match concept screenshot:
- Background blur fighters image
- Layout proportions tighter
- Possible red CTA color variant (instead of pink)

User noted during G2 visual review: "не так круто как концепт".

### 6.6 Cleanup tasks (post-1b)
- `fix/remove-telegram-auth-be` stale remote branch (sandbox blocked deletion; manual prune via GitHub UI)
- Production Railway env: remove `TELEGRAM_BOT_TOKEN` env var (manual post-deploy cleanup, no CI exposure)

---

## 7. Risks Mitigated

| Risk | Severity | Mitigation |
|---|---|---|
| TG-only user lockout post-Telegram excision | HIGH (Phase 0) → **0 actual** | User audit pre-Phase-1 confirmed 0 affected users |
| BE Telegram cherry-pick race window (FE calls dead BE before next merge) | LOW | Lesson #33 doctrine abandoned, atomic continue stack merge instead |
| `isTelegram` adaptive UI broken after C6 (orphan flag setter) | MEDIUM (decision #2 silently broken) | Lesson #18 STOP-tier interrupt fix `316fd7b` — re-wired setter to App.vue |
| RainView delete cascade — Three.js used elsewhere | MEDIUM | Pre-edit grep verified 3 active non-RainView Three.js consumers — kept in package.json |
| Reset password 501 still appears functional in UI | LOW | Decision #4 — full route deletion + UI removal (no orphan link in new LoginView) |

---

## 8. Telegram Excision Audit (final)

### 8.1 Removed
- **FE files:** `TelegramLogin.vue` (137 lines), `master/telegram` action, `masterService.telegram()` (54 lines)
- **BE files:** `validateTelegramPayload` helper, POST `/v1/auth/telegram` handler, `telegramLimiter`, `TELEGRAM_BOT_TOKEN`/`TELEGRAM_AUTH_MAX_AGE_SEC` config (~85 lines)
- **i18n:** `t.auth.telegram.*` block × 11 locales (44 lines)
- **Routes:** `/auth/telegram` route registration

### 8.2 Preserved (per decisions)
- `App.vue:203-211` — `window.Telegram.WebApp` adaptive UI detection (decision #2) + re-wired `master/saveTelegramFlag` dispatch (interrupt fix)
- `master/saveTelegramFlag` action + `masterService.setTelegram/getTelegram` localStorage flag (decision #2 + #3)
- `ProfileButtons.vue:3 v-if="!isTelegram"` — Wallet button hide in TG webview (decision #2)
- `LandingView.vue:27` Telegram social link icon (decision #15)
- `socialTaskModel.js` `SUBSCRIBE_TELEGRAM` task icon (decision #14)
- `clan.confirmInviteFriend` locale string × 11 locales — Telegram-share UX, NOT auth (Phase 0 §7.4)
- `src/assets/images/icon_telega.svg` — used by Landing footer + ProfileTasks (community channel)

### 8.3 DB schema
**Zero changes.** No `telegramId` column existed — Telegram-bound users were identified by `login: 'tg_<telegramId>'` prefix convention only. Existing `tg_*` prod users (0 per audit) can still authenticate via password if known.

### 8.4 Production env cleanup
**Manual post-deploy:** remove `TELEGRAM_BOT_TOKEN` from Railway env config. Not exposed in `.env.example` (Phase 0 §7.5 confirmed never declared there). Zero codebase trace post-1b.

---

## 9. Metrics

| Metric | Value |
|---|---|
| Functional commits | 10 (C1-C10) |
| Interrupt fixes | 2 (`547e6ff` + `316fd7b`) |
| Closure commits | 3 (CL1, CL2, CL3) |
| Total commits | 15 (excl. Phase 0) |
| STOP gates triggered | 4 (G1, G2, G3, G4) |
| Lesson #11 catches | 38+ (all adaptation-tier) |
| Lesson #18 STOP-tier triggers | 2 (saveTelegramFlag orphan + cherry-pick strategy mismatch) |
| Lesson #45 false-positives caught | 2 (telegramAuth.js path + TG-only lockout severity) |
| Hot-fixes | **0** ✅ |
| Streak | 1 → **2** ✅ |
| LoC removed | ~-2187 (FE + BE + i18n + assets) |
| Bundle reduction (raw main) | ~3.35MB → ~1.82MB (~45%) |
| Bundle reduction (brotli main) | ~829KB → ~479KB (~42%) |
| npm packages removed | 3 (kokomi.js, postprocessing, gsap) |
| Files deleted | 16+ (5 .vue + 11+ assets) |
| New files | 3 (AuthLayoutView, LoginView, SignupView) |
| Locale files modified | 11 (auth.telegram + auth.reset deletions) |
| PRs merged to main | 2 (PR #361 mid-session, PR #362 at G3) + final small-scope TBD |
| Cherry-pick PRs | 0 (Lesson #33 doctrine abandoned mid-Эпик) |

---

## 10. Closure Notes

**Sub-epic 1b ✅ CLOSED.** All decisions honored, all carry-overs documented, all surfaces resolved via STOP gates. Streak intact at 2 (continued clean from 1a).

**Next:** Эпик 8 Marketing Site — major scope shift per user product-pivot. CL3 handoff documents required user inputs and Phase 0 entry conditions for new chat session.

**Branch state:** `claude/investigate-auth-views-redesign-rFAwk` ready for final continue stack PR (small-scope: C9+C10+CL1+CL2+CL3). User merges at convenience.
