# Hexlash Smoke Test (Playwright)

Read-only smoke utility for Hexlash wrap-up PRs. Built for the Legacy Cleanup
series wrap-up — designed to catch regressions where retired symbols leak back
into the runtime via stale references.

## Scope

This smoke is **read-only**. It does **not**:
- Submit auth forms (no signup, no login, no password reset)
- Write to backend (no fight saves, no progression writes, no clan create/edit)
- Open WebSocket connections / matchmaking / live PvP flows
- Touch any auth-protected route

It **does**:
- Open all anonymous public surfaces (`/`, `/play/rules`, `/rules`, `/play/help`,
  `/auth/login`, `/auth/signup`, `/privacy`)
- Verify SPA navigation + redirects resolve correctly
- Verify cross-links between pages (Phase 8 — `/play/help` references `/play/rules`,
  not legacy `/rules`)
- Scan `console.error` + `pageerror` for a fixed list of forbidden signatures
  that indicate retired-symbol regressions

## Forbidden console signatures

These strings, if found in `console.error` / `pageerror` on any anonymous surface,
fail the smoke. They map 1:1 to artifacts retired during the Legacy Cleanup series:

| Signature              | Source                                     |
|------------------------|--------------------------------------------|
| `PageView`             | Phase 8 cleanup — v1 /rules chain          |
| `BackButton`           | Phase 8 cleanup                            |
| `<Card>` / `"Card"`    | Phase 8 cleanup                            |
| `background_page`      | Phase 8 cleanup (265 KB asset)             |
| `ProfileAccount`       | Phase 2 (L1)                               |
| `ProfileSkins`         | Phase 3 (L4)                               |
| `ProfileInvite`        | Phase 4 (L9)                               |
| `ProfileWallet`        | Phase 5                                    |
| `DailyTasks`/`SocialTasks`/`TaskModal` | Phase 6 (v1 training fragments) |
| `progression/`         | Phase 7-pre-2 (whole module retired)       |
| `sendShare`            | Phase 7-pre Vuex cascade                   |
| `initGetStarted`       | Phase 7-pre                                |
| `clearSavedFight`      | Phase 7-pre                                |
| `syncProgression`      | Phase 7-pre                                |
| `uploadMasterAvatar`   | preserve-zone test (must not be dispatched anonymously) |
| `User.language` / `master.language` | Phase 10 Stage A + Stage B    |
| `lblChangeLanguage`    | Phase 7 (L6 i18n sweep)                    |

## What this smoke does NOT cover (manual sanity check required)

- **Auth-protected routes**: `/play/profile`, `/play/training`, `/play/fight`,
  `/play/clan`, `/play/ratings`, `/play/matchmaking`, `/play/spectate/:id`,
  HUD-level features. These need a test account to enter safely; out of scope
  for automated PR smoke. **Manual sanity by owner before production-merge.**
- **WebSocket flows**: matchmaking queue, live PvP, friend challenges, spectate
  live fights. Read-only smoke cannot exercise these.
- **Backend API contract**: already covered by 105 backend tests passing in
  PR #379 (Phase 10 Stage A).
- **Visual regression**: this smoke checks DOM presence + URL + console, not
  pixel-perfect rendering. Visual QA stays manual.

## Usage

### Install (first time)

```bash
cd scripts/smoke-test
npm install
npx playwright install chromium
```

### Run against prod (sanity self-check)

```bash
cd scripts/smoke-test
npm run smoke
```

Defaults to `BASE_URL=https://www.hexlash.com`.

### Run against Vercel preview (PR smoke)

```bash
cd scripts/smoke-test
BASE_URL=https://testhexlash-git-claude-...vercel.app npm run smoke
```

### Sandbox / TLS-inspection environments

If running from a sandbox with TLS-inspection (e.g. corporate MITM proxy, Anthropic
Claude Code sandbox), Playwright's bundled Chromium may not see the injected CA
even when system `curl` works. Opt in to permissive TLS:

```bash
INSECURE=1 BASE_URL=https://... npm run smoke
```

**Do not** use `INSECURE=1` in production / CI — it disables certificate validation.

### View HTML report after run

```bash
npx playwright show-report playwright-report
```

### Artifacts on failure

- `playwright-report/` — HTML test report (open `index.html`)
- `test-results/` — screenshots, videos, traces

## Exit codes

- `0` — all tests passed, zero forbidden signatures
- non-zero — at least one assertion failed; check `playwright-report/index.html`
  + the `Forbidden console offenders:` log line in stdout

## Files

- `package.json` — Playwright dev dep (self-contained, does not pollute root)
- `playwright.config.js` — Chromium-only, serial, networkidle-aware
- `smoke.spec.js` — 7 anonymous-surface tests + 1 cross-surface console sweep
- `README.md` — this file
