# Legacy Cleanup Series — Wrap-up Smoke Report

**PR:** [#380](https://github.com/evgenii-yps/testhexlash/pull/380) — Legacy Cleanup Series final merge (10 phases, 24 commits)
**Smoke harness:** `scripts/smoke-test/` (Playwright Chromium, read-only, 8 anonymous-surface tests)
**Generated:** 2026-05-15

---

## TL;DR

Smoke against PR #380 Vercel preview is **blocked by Vercel Deployment Protection**. Owner action required before automated smoke can pass against preview.

- ✅ Smoke harness validated against prod (script integrity proven)
- ❌ Smoke against preview blocked — Vercel returns HTTP 401 SSO gate for every request
- 🔧 Smoke script hardened mid-run (adaptation): SSO-page guard + `VERCEL_BYPASS` env opt-in

---

## Run #1 — sanity self-check against prod (`https://www.hexlash.com`)

**Purpose:** Verify the script itself is sound before pointing at preview.

**Result:** 5 passed / 3 expected-fail.

| Test | Result | Notes |
|---|---|---|
| A1 — Marketing landing | ✅ PASS | (after CTA selector adaptation — see §Adaptations below) |
| A2 — `/play/rules` RulesView | ❌ EXPECTED FAIL | Phase 8 RulesView not on prod (continue stack not merged yet) |
| A3 — `/rules` → `/play/rules` redirect | ❌ EXPECTED FAIL | Same — Phase 8 redirect not on prod |
| A4 — `/play/help` cross-link refresh | ❌ EXPECTED FAIL | `/play/help` on prod still references legacy `/rules` (refresh in Phase 8) |
| A5 — `/auth/signup` form loads | ✅ PASS | |
| A6 — `/auth/login` form loads | ✅ PASS | |
| A7 — `/privacy` renders | ✅ PASS | |
| B1 — cross-surface console sweep | ✅ PASS | Zero forbidden console signatures across 7 anonymous surfaces |

**Interpretation:** A2/A3/A4 fail on prod **by design** — they assert Phase 8 deliverables. The exact pattern that should INVERT (those 3 pass, all 8 pass total) when run against the preview where the series is built. This confirms the smoke can differentiate pre-series state from post-series state.

---

## Run #2 — against PR #380 Vercel preview

**Preview URL:** `https://testhexlash-git-claude-hexlas-6725bc-evgeniis-projects-97f58a87.vercel.app`

**Status:** Vercel reported `Ready` (deploy successful).

**Raw probe result:**

```
$ curl -sk -o /tmp/preview.html -w "HTTP %{http_code}" https://testhexlash-git-claude-hexlas-6725bc-evgeniis-projects-97f58a87.vercel.app/
HTTP 401

$ head -1 /tmp/preview.html
<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport ...
<title>Authentication Required</title>
```

Every request to the preview URL returns HTTP 401 with Vercel's SSO authentication page. **The Vue app never renders for anonymous probes.**

**Initial smoke result (before hardening):** 3 passed / 5 failed.

| Test | Apparent Result | Real Reason |
|---|---|---|
| A1 hero+CTA | ❌ FAIL | Vercel SSO page has no `.marketing-hero` or play CTA |
| A2 rules content | ❌ FAIL | Vercel SSO page body doesn't contain "rules" |
| A3 redirect | ❌ FAIL | Vercel intercepted before Vue router could resolve redirect |
| A4 cross-link | ✅ FALSE-POSITIVE PASS | Vercel SSO page has no `<a href="*rules*">` links — assertion vacuously satisfied |
| A5 signup form | ❌ FAIL | Vercel SSO page has fewer interactive elements than asserted |
| A6 login form | ❌ FAIL | Same — Vercel SSO page is minimal |
| A7 privacy renders | ✅ FALSE-POSITIVE PASS | Vercel SSO page body text > 50 chars (matched tolerant length check) |
| B1 console sweep | ✅ FALSE-POSITIVE PASS | Vercel SSO page emits no forbidden signatures (none of them are Vercel concerns) |

**5 real failures + 3 false-positive passes** — net zero confidence that the actual Vue app behaves correctly behind the SSO gate.

---

## Adaptations applied mid-run

### Adaptation 1 — Sandbox TLS interception (smoke commit `2b80f21`)

This sandbox uses TLS-inspection (Anthropic Claude Code egress proxy injects custom CA into system trust). System `curl` works, but Playwright's bundled Chromium has its own trust store and rejected the certificate with `ERR_CERT_AUTHORITY_INVALID`.

Added `INSECURE=1` env opt-in → sets `ignoreHTTPSErrors: true` in Playwright config. Documented in README as sandbox-only — production / CI runs keep strict TLS validation. Resolved sandbox-side TLS for both prod and preview runs.

### Adaptation 2 — CTA selector tolerance (smoke commit `2b80f21`)

A1 initially asserted `<a href="/auth/*">` for the Play CTA. MarketingView's actual hero CTA is `<button class="marketing-hero__cta" @click="onPlayClick">` — Vue click handler, not an anchor. Adapted selector to accept either anchor or button class. A1 then passed on prod.

### Adaptation 3 — Vercel SSO guard + bypass support (smoke commit `aa5cca3`)

After Run #2 revealed 3 false-positive passes, hardened the smoke:

- Added `failIfVercelSsoGate(page)` — called after every navigation. Detects `<title>Authentication Required</title>` and throws an actionable error.
- Added `VERCEL_BYPASS` env opt-in to `playwright.config.js` — when set, sends `x-vercel-protection-bypass: <token>` + `x-vercel-set-bypass-cookie: true` headers per Vercel docs.
- README documents the env var + alternative (owner temporarily disables Deployment Protection).

With this hardening, Run #2 against the protected preview would now report 8 hard failures with the actionable error message `"Vercel Deployment Protection SSO gate intercepted request. Set VERCEL_BYPASS=<token> ..."` instead of 5 fails + 3 false-positive passes.

---

## Required action before merge

Pick one:

**Option A (recommended)** — generate Vercel bypass token, re-run smoke.

1. Vercel project settings → Deployment Protection → Protection Bypass for Automation → Generate token
2. Provide token to me (or run locally yourself):
   ```bash
   cd scripts/smoke-test
   VERCEL_BYPASS=<token> BASE_URL=https://testhexlash-git-claude-hexlas-6725bc-evgeniis-projects-97f58a87.vercel.app npm run smoke
   ```
3. Expected outcome: 8/8 pass, zero forbidden console signatures. I'll append Run #3 results to this report.

**Option B** — temporarily disable Deployment Protection on the project.

1. Vercel project settings → Deployment Protection → toggle off
2. Re-run smoke (no env var needed):
   ```bash
   cd scripts/smoke-test
   BASE_URL=https://testhexlash-git-claude-hexlas-6725bc-evgeniis-projects-97f58a87.vercel.app npm run smoke
   ```
3. Re-enable Deployment Protection after smoke passes
4. I append Run #3 results

**Option C** — accept the project has SSO-protected previews and **skip automated smoke** for this PR. Use manual sanity check in browser (owner authenticated through Vercel SSO):

1. Owner opens preview URL in their browser (signs in to Vercel SSO)
2. Owner manually walks: `/`, `/play/rules`, `/rules`, `/play/help`, `/auth/signup`, `/auth/login`, `/privacy`
3. Owner checks DevTools console for errors mentioning retired symbols
4. Owner signs off in PR comment with checklist

Manual scope (out of automated smoke regardless of option):
- Auth-protected routes (`/play/profile`, `/play/training`, `/play/fight`, `/play/clan`, `/play/ratings`, `/play/matchmaking`, `/play/spectate/:id`, HUD-level)
- WebSocket flows (matchmaking, live PvP, friend challenges, spectate)

---

## Status

- [x] Vercel preview deploy successful
- [x] Smoke harness validated against prod
- [x] Smoke harness hardened against SSO false-positives
- [ ] **Smoke against preview blocked — owner action required (Option A / B / C above)**
- [ ] STOP gate for owner — PR review + merge

---

## Files

- Smoke spec: [`scripts/smoke-test/smoke.spec.js`](../../scripts/smoke-test/smoke.spec.js)
- Smoke config: [`scripts/smoke-test/playwright.config.js`](../../scripts/smoke-test/playwright.config.js)
- Smoke docs: [`scripts/smoke-test/README.md`](../../scripts/smoke-test/README.md)
- This report: `docs/legacy-cleanup/WRAP_UP_SMOKE_REPORT.md`

## Commits

- `2b80f21` — initial smoke infrastructure
- `aa5cca3` — SSO guard + VERCEL_BYPASS opt-in (this report's adaptation)
