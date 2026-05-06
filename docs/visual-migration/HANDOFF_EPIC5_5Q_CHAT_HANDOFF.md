# HANDOFF — Sub-Epic 5Q (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5P-...).
> **Predecessor:** 5P ✅ CLOSED (Phase 4 commit `e37b4ff`; this handoff = Phase 5).
> **Audit progress:** **17/22 done (77%)** — past three-quarters milestone reached.

---

## §1 Где сейчас

5P = Carry-overs Cleanup ψ-2 (Option A). Mechanical-batch sub-epic, 3 functional commits + 3 docs:

- **P1 i18n** `spectate.watchLive` aria-label key + HudProfile `:aria-label` binding (11 locales) — `ff2f463`
- **P2 phantom mutation** `master/setInfo` × 7 → `setInfoMessage` + `InfoMessageModel.withText()` (Lesson #35 bug-bundle-tier second empirical test) — `2f6ff46`
- **P3 component decomposition** HudClanEmpty.vue extract from HudClan.vue no-clan branch (Lesson #30 toolkit growth path D invert default) — `1064c3f`
- **P4 FINAL_REPORT** — `e37b4ff` (this handoff = P5)

**Q1 backend `/v1/agent/list` 500 dropped 3rd time** — same reasoning as 5O Q1 + 5M P4: no runtime access surfaced в pre-flight, root cause unobservable from frontend grep, requires runtime logs (Lesson #33).

**12-streak achieved** (5E-5P all clean). Recoveries 54 → 55 (+1 в 5P investigation matrix setInfo 5→7).

**Carry-over count drastically reduced:** 4 entering 5P → **1 leaving 5P** (Q1 backend only). Clean ledger.

**Branch:** `claude/setup-5e-shop-mode-a-khIAi`. **HEAD:** `e37b4ff` (P5 commit will append; P6 CLAUDE.md commit progresses HEAD further). Confirm post-P6 SHA before 5Q startup.

---

## §2 Lessons inherited (35 cumulative)

5P added **0 new formal lessons.** Two refinements documented commentary:

**Lesson #30 sub-pattern surfaced (pre-formal, P3):**
> When extracting component to mirror sibling decomposition, don't force prop/emit symmetry if child's data ownership model differs. Sibling shapes that lift state to parent (props-from-Vuex pattern) ≠ universal child shape — depends on whether child **consumes upstream data** (lift to parent, child = pure-presentational) OR **owns local state** (self-contained child, no parent state to lift).

5P P3 = first instance (HudClanEmpty self-contained vs HudClanHeader/Info/Roster sibling pattern). **Promote к formal Lesson #36 if second instance surfaces** (likely candidates: η Onboarding component split, θ MoveTree extract). Until then: commentary in 5P FINAL_REPORT §4.

**Lesson #35 second empirical validation (P2):**
- 5O P3 setError × 9 = first test (bug-bundle-tier prediction)
- 5P P2 setInfo × 7 = second test (same model family / factory shape / callsite pattern)
- Both held empirically. Toolkit robust.

**Cumulative lesson tally: 35 (UNCHANGED).**

**Stable lessons applied во всех recent sub-epics:**
- #11 verify shape — 55 cumulative recoveries
- #18 STOP at structural mismatch — operationalized via #35 tiering
- #19/20/21 exposure-aware tuning (preventive)
- #22 HUD scoped selector match
- #30 pattern reuse semantic vs mechanical (P3 sub-pattern documented)
- #31 schema unique-key migrations require findUnique audit
- #32 convention discovery reflex
- #33 deploy-environment awareness
- #34 HUD overlay layout convention
- #35 Lesson #11 reflex catch tiering (adaptation / bug-bundle / scope-boundary)

---

## §3 Carry-overs (1 item — clean state)

**Drastic reduction achieved в 5P:**

| # | Item | Source | Priority | Status |
|---|---|---|---|---|
| 1 | Backend `/v1/agent/list` 500 fix | 5M P4 → 5O Q1 → **5P Q1 (3rd defer)** | **HIGH** | Pending — needs runtime access strategy decision |

**Closed in 5P:**
- ✅ aria-label `"Watch live fight"` i18n
- ✅ `master/setInfo` × 7 phantom mutation
- ✅ HudClan no-clan branch split

**Master state phantom mutation family — CLOSED.** Lesson #35 scope-boundary proactive check (`master/setWarning|Notification|Alert|Message` returned 0) confirmed no further phantoms exist. No 4th-defer expected from this family.

---

## §4 Q1 backend strategy options (3rd defer warrants explicit section)

Continued passive defer creates risk of indefinite drift. 5Q должен decide proactive strategy OR continue defer with explicit reasoning.

### Strategy A — Wait for runtime access (passive)

User installs Vercel CLI / kubectl / configures production env vars. 5Q simply re-checks pre-flight Q1; if access surfaced → proceed, otherwise 4th defer.

**Risk:** indefinite drift cycle. Each subsequent defer accumulates blind spot.
**Effort:** zero (until access materializes).

### Strategy B — Backend instrumentation (proactive observability)

Add Sentry / datadog instrumentation в `backend/src/routes/agent.js` (specifically `GET /v1/agent/list` handler — currently logs to `console.error` only). Deploy via GitOps (test branch). Trigger 500 via real user actions, observe stack trace через deployed monitoring dashboard.

**Risk:** medium — requires Sentry/datadog account setup + deploy chain (Lesson #33). Adds dependency.
**Effort:** ~5-8 commits (instrumentation + deploy + observe + fix).

### Strategy C — Local backend stack reproduction

Claude Code reported `docker` present in 5P pre-flight Q1. `backend/.env.example` exists. Strategy: build local Postgres + backend stack via docker-compose, seed DB, hit `/v1/agent/list` locally, observe error.

**Risk:** medium-low — local repro may not match prod state (migration drift, data-specific edge cases). But 80%+ catches likely.
**Effort:** ~3-5 commits (stack setup + repro + diagnose + fix).

### Strategy D — Defensive blind fix (speculative)

Last touch to agent.js was `867a19e` (5H era) — added endpoints, not regression candidate. Other suspects:
- 5K Daily Tasks added `scope` field on DailyTask (manual SQL migration) — possible drift if not deployed
- Schema changes between 5K and now — verify migration log on prod

Strategy: Run `prisma migrate deploy` defensively + binary search recent backend commits + speculative fix per most-likely candidate.

**Risk:** medium — blind without observability, may worsen state.
**Effort:** ~2-4 commits (audit + speculative fix + monitor).

### Recommendation для 5Q

**Strategy C** (local reproduction) preferred over D (blind) — reproducibility > speculation.
Strategy B (instrumentation) is good long-term value but adds infrastructure dependency.
Strategy A (passive defer) acceptable only if user explicitly chooses feature-first 5Q with formal "no more carry-over deferral, accept drift" acknowledgment.

**User decision required в 5Q startup before pre-flight investigation.**

---

## §5 Feature options ranked

С 1 carry-over remaining (gated на strategy decision), feature work становится rational primary path.

### Option C — Feature γ AI Trainer (post-fight overlay)

Post-fight scene с AI-generated commentary on player performance. Audit §4.2.

**Why:** accumulated demand since pre-Epic 5 plan. Adds visible value.
**Risk:** medium. Requires fight integration + new HUD + new Vuex state (post-fight context).
**Size:** M (~6-8 commits).

### Option D — Feature ζ Retirement

Agent retirement flow + UI. Backend has retirement service (per CLAUDE.md retirement service §). Frontend mostly missing.

**Why:** existing backend infra ready. Frontend wiring is straightforward.
**Risk:** medium. UI + state mgmt + flow design.
**Size:** M (~5-7 commits).

### Option E — Feature ε FightClub level + Morning Report

FightClub UI surface (level bar, Morning Report card). Backend ready.

**Why:** backend already implemented (ТЗ-18/19/20 in CLAUDE.md). Frontend wiring pending.
**Risk:** medium-high. AI integration + scope ambiguity (Lv1/Lv2/Lv3 tiering).
**Size:** M-L (~7-10 commits).

### Option F — Feature η Onboarding (first-time user)

New user flow / tutorial. UX gap currently.

**Why:** UX gap. Player onboarding currently absent.
**Risk:** medium. Design ambiguity, scope creep candidate.
**Size:** M (~6-8 commits).

### Option G — Feature θ MoveTree (deeper progression)

Move research depth. Completes per-agent progression UX (5K Daily Tasks closed adjacent system).

**Why:** Research Gate backend ready (CLAUDE.md ТЗ-04). Frontend incomplete.
**Risk:** medium-high. Major UX rework.
**Size:** L (~8-12 commits).

### Option B — Q1 backend dedicated (Strategy C or D from §4)

Address 3rd-defer carry-over via local repro + diagnosis.

**Why:** unblocks 5M visual verify, removes single-item carry-over backlog.
**Risk:** medium per chosen strategy (C lower than D).
**Size:** S-M (~3-5 commits per Strategy C; ~2-4 per Strategy D).

---

## §6 Recommended next sub-epic

**Two strong candidates** (user decision required):

### Recommendation 1 — Option D (ζ Retirement)

**Why:** clean ledger achieved в 5P, backend ready, frontend straightforward. Mid-complexity feature work that doesn't introduce infrastructure dependencies. Streak-friendly (M sub-epic, mechanical-ish).

### Recommendation 2 — Option B (Q1 backend dedicated, Strategy C)

**Why:** finally close 3-time-deferred carry-over via local stack reproduction. Remove blind spot. Risk-managed (Strategy C reproduces vs blind speculate).

**Anti-recommendations:**
- ε FightClub (Option E) — scope ambiguity (AI Lv1/Lv2/Lv3 tiering) elevates 12-streak risk
- η Onboarding (Option F) — design ambiguity, scope creep candidate
- θ MoveTree (Option G) — L-size, deeper UX rework, less streak-friendly

**Skip Options C/F/G in 5Q** unless user explicitly prioritizes.

---

## §7 Pre-flight Q1-Q3 templates per option

### Option D pre-flight (ζ Retirement)

```bash
# Q1 — backend retirement service shape
grep -n "retirement\|retireAgent" backend/src/services/*.js | head -10
ls backend/src/routes/ | grep -i retire

# Q2 — frontend retirement UI scope
grep -rn "retirement\|retire" src/components/ src/views/ src/views-v2/ 2>/dev/null | head -10

# Q3 — Agent model fields
grep -A5 "isRetired\|retirementAt\|retiredAt" backend/prisma/schema.prisma | head -10
```

### Option B pre-flight (Q1 backend Strategy C)

```bash
# Q1 — docker-compose presence
ls docker-compose*.yml backend/docker-compose*.yml 2>/dev/null

# Q2 — backend startup deps (Postgres, Prisma generate)
cat backend/package.json | grep -A20 "scripts"

# Q3 — .env.example shape
cat backend/.env.example
```

### Options C/E/F/G pre-flight

Defer detailed templates until user prioritizes. Each requires fresh investigation pass.

---

## §8 Startup checklist для Claude Code

1. **Pre-flight branch verify** — `git branch --show-current` should be `claude/setup-5e-shop-mode-a-khIAi`. If harness slug fresh-spawn → switch (5J-5P Blocker A precedent: report blocker, escalate, wait approval before switch).
2. **Verify HEAD** — should match P6 CLAUDE.md commit SHA (5P closes with P6 architectural sync). Post-P6 SHA TBD; check `git log --oneline | head -3`.
3. **Tree clean check** — `git status --short` empty.
4. **Read mandatory files:**
   - `CLAUDE.md` — Sub-Epic 5P section (added in P6)
   - `docs/visual-migration/EPIC5_5P_FINAL_REPORT.md` — full closure (190 lines)
   - `docs/visual-migration/HANDOFF_EPIC5_5Q_CHAT_HANDOFF.md` — this file
   - `docs/visual-migration/VISUAL_MIGRATION_PLAN.md` — overall plan
   - 1-2 prior FINAL_REPORTs (5N/5O) for fresh context if extended absence
5. **Lessons review** — focus on **#30 sub-pattern (pre-formal)** + #35 (validated) + #11/#18/#32/#33 stable.
6. **User decision required** — Q1 strategy choice (A/B/C/D от §4) OR feature option (D/B/C/E/F/G от §5). Pre-flight investigation depends on chosen path.
7. **Run pre-flight Q1-Q3 (per chosen option)** — read-only, no commits, output as text reply.
8. **Wait for ТЗ from design-Claude** — no code, no commits before ТЗ.

---

## §9 Closing

5P closed clean. **12-streak achieved.** Past three-quarters milestone (17/22 = 77.3%) reached.

**Carry-over count: 1** (drastic reduction from 4). Clean ledger entering 5Q.

**Master state phantom mutation family CLOSED** — Lesson #35 scope-boundary proactive check confirmed.

5Q decision deferred к user / design-Claude assessment. Two strong recommendations:
- **ζ Retirement** (feature work, accumulated demand, streak-friendly)
- **Q1 backend dedicated, Strategy C** (close 3rd-defer carry-over via local repro)

Lessons stable at 35. Recoveries cumulative 55. Lesson #30 sub-pattern + Lesson #35 second validation strengthen toolkit без bloating formal entries.

**Goal для 5Q: 13-streak.**
