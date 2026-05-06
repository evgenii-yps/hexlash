# Handoff — Эпик 9 / Stream 1 Cleanup (post Эпик 8 closure)

**From:** Sub-epic 8c CL3 (Эпик 8 closure milestone)
**To:** Fresh design-Claude chat for next-direction kickoff
**Date:** 2026-05-06
**Predecessor closure:** EPIC8_SUBEPIC_8C_FINAL_REPORT.md (`72505bf`)
**Continue stack tip:** `claude/investigate-marketing-cluster-b-xX4a9` HEAD `<post-CL3-SHA>` (8 commits ahead of main pre-merge)
**Main HEAD:** `c5c913a` (post-8b hot-fix `80dbd59` merge)

---

## 1. State at handoff

### 1.1 Streak

**0 → 1** (Sub-epic 8c clean). Rebuilding from 8b post-deploy hot-fix `80dbd59` break.

Maintaining streak forward priority for all Эпик 9 sub-epics.

### 1.2 Lesson tally

**39 lessons promoted** (Lesson #46 PROMOTED in 8c — document-level CSS reflex).

**Active candidates (7):** #36 / #37 / #38 / #39 / #40 / #41 / #42 — unchanged from Sub-epic 7. None empirically reinforced in Эпик 8.

**Mandatory Phase 0 subsections (6):** API contract / Negative-space / CSS taxonomy / UI infrastructure / Vocabulary alignment / Semantic invariant + flow direction. Lesson #46 (document-level CSS audit) is **candidate-tier** for 7th mandatory subsection — promote on occurrence #2.

### 1.3 Closure shapes established (Эпик 6 + Эпик 8)

5 distinct closure shapes proven across Эпик 6:
- Standard linear (11 sub-epics)
- Code-complete + deferred-verify (3 sub-epics)
- Deprecation-via-redirect (1 sub-epic)
- Scope-deferral-к-downstream (1 sub-epic)
- Code-complete + deferred-deploy (1 sub-epic)

Эпик 8 used standard linear × 3 (8a/8b/8c). No new closure shapes introduced.

---

## 2. Cumulative carry-overs (5 sub-epics: 1a + 1b + 8a + 8b + 8c)

Listed by Stream with priority.

### 2.1 Stream 1 cleanup (recommended next direction — 5 items, S-M size aggregate)

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | **Lesson #43 STEP 0 formalization** — 12 cumulative occurrences across 5U/5S/Sub-epic 2/4a/4b/5/6/7/1b/8a/8b/8c. Recurring pattern: each new sub-epic post-merge requires manual branch switch. Formalize as automatic bootstrap procedure in CLAUDE.md methodology section instead of surfacing manually each sub-epic as Recovery #N. | 1b/8a/8b/8c carry-over | **HIGH** (process improvement, 12 occurrences) |
| 2 | `master/resetPassword` Vuex action + `masterService.resetPassword()` + `state.resetState` + `PasswordResetStateModel` orphan chain. Function unreachable post-1b C5 (Reset.vue deleted, route removed). Backend `POST /user/reset` returns 501. Locale keys `t.auth.reset.*` removed in 1b C10. Vuex chain still alive but unreachable. | 1b C5 + C10 | Medium |
| 3 | `master/saveTelegramFlag` action + `setIsTelegram` phantom mutation. Silent no-op + Vuex warning. localStorage actual source of truth via `masterService.setTelegram`. Action survives 1b interrupt fix re-wire (App.vue dispatches it from app-init detection). Phantom mutation cleanup separate. | 1b Phase 0 §7.1 | Medium |
| 4 | Help anonymous-access UX caveat — `/help` cascades through `/play/help` which may auth-gate anonymous users. Marketing site footer links to `/help` without auth check. Verify cascade behavior + decide: protect or open. | 8b Phase 0 §6.4 | Medium |
| 5 | Stale doc comments referencing deleted v1 views (~25-30 cleanup pass post-Эпик 6 cutover). PreparationView, FightClubView still v1 (Phase C deferred). RainView, CardFightView, MatchmakingView, SpectateView, TrainingView, RatingsView, ClanView, FriendsView, ProfileView, MoveTreeView, DeckBuilderView all deleted in Эпик 6 Sub-epic 8. Stale references in code comments + scattered doc files. | Эпик 6 Sub-epic 8 forward | Low |

**Total Stream 1 cleanup batch:** 5 items, all FE-only, no backend touch, no new component, no new dep. Estimated 1 sub-epic, 5-8 functional commits, S-M size.

### 2.2 Stream 3 BE features (2 items, M-L size aggregate)

| # | Item | Source | Priority |
|---|---|---|---|
| 6 | Password reset full backend (email-based) — needs SendGrid/Postmark/SMTP decision + email template + token generation + validation flow + UI re-port. Currently `POST /user/reset` returns 501 (1b decision #4). | 1b decision #4 | Medium (user product decision) |
| 7 | Subscribe email collection backend (Mailchimp / SendGrid / in-house). Currently 8c Subscribe form is FE-only Vuex toast "Coming soon — stay tuned!" — emails not captured. | 8c decision #6 | Medium (user product decision) |

### 2.3 Stream 4 Visual polish (6 items, S-M size aggregate)

| # | Item | Source | Priority |
|---|---|---|---|
| 8 | Auth refinement — match concept screenshot (background blur fighters image, layout proportions tighter, possible red CTA color variant). | 1b G2 user feedback | Low (cosmetic) |
| 9 | Proper og:image banner (1200×630 dimensions per Open Graph best practice) — currently 1024² square logo placeholder. | 8b decision #2 + Phase 0 §6.5 | Low (SEO polish) |
| 10 | Hero hex pattern tempo / opacity tuning if user feedback during 8c live review. | 8b decision #4 acceptance | Low (deferred until user reviews live preview) |
| 11 | Gameplay section 16:9 placeholder → real video / screenshot asset. | 8c decision #2 | Low (asset production dependency) |
| 12 | Roadmap content from generic Q1-Q4 placeholders → real product roadmap once user supplies content. | 8c decision #4 | Low (user content dependency) |
| 13 | Partners section COMING SOON → real partner logos when partnerships sign. | 8c decision #5 | Low (business dependency) |

### 2.4 Stream 5 Token launch (1 item, L size)

| # | Item | Source | Priority |
|---|---|---|---|
| 14 | $HEX Token section live ticker + DEX widget + tokenomics page. Currently 8c Token section is placeholder + Base chain reference only. Requires token contract deployment, DEX listing, tokenomics whitepaper. | 8c decision #3 | Low (depends on token launch timeline) |

### 2.5 Stream 6 Web3 (1 item, L size)

| # | Item | Source | Priority |
|---|---|---|---|
| 15 | Connect Wallet auth — actual SIWE backend integration. Currently 1b auth pages have Connect Wallet button showing "Coming soon" toast. Wagmi composables already in place from Эпик 5/6/7 wallet work. | 1b decision #5 | Medium (Web3 priority) |

### 2.6 Эпик 6 deferred (carry-overs #38-#46 forward — unchanged)

See Эпик 6 Sub-epic 8 closure entry in CLAUDE.md for full list:
- ChallengeNotification routing branch simplification (#38)
- App.vue:100 path check redundancy (#39)
- App.vue:110 scrollableRoutes /friends literal (#40)
- PreparationView.vue:97 router.push('/friends') (#41) — Phase C scope
- HudSpectate inline fallbacks dead code (#43)
- Engine status enum defensive (#44)
- findCurrentFight O(N×M) optimization (#45)
- Stale doc comments referencing deleted v1 views (#46) — see Stream 1 #5

---

## 3. Recommended next direction

### 3.1 Primary recommendation: Stream 1 cleanup batch

**Why:**
- **Streak preservation friendly** — no backend touch, no new feature, all items adaptation-tier candidates
- **5 items aggregate to S-M sub-epic** — single Phase 0 + 5-8 functional commits + 3 closure
- **Lesson #43 formalization closes 12-occurrence carry-over** — process improvement compounds forward
- **Aligns with hot-fix recovery cadence** — clean polish run after Эпик 8 streak break + 0 → 1 rebuild

**Estimated effort:** 1 sub-epic, ~9-11 commits total, 1-2 sessions.

**Phase 0 subsections (mandatory 6 + Lesson #46 candidate):**
1. API contract verification (resetPassword + saveTelegramFlag callsite enumeration)
2. Negative-space verification (what doesn't exist that ТЗ might assume — Vuex chain orphan tests)
3. CSS taxonomy dump (N/A for Stream 1 cleanup — no UI changes)
4. UI infrastructure dependencies (N/A — no new HUDs)
5. Vocabulary alignment audit (`master/resetPassword` ↔ ТЗ wording, `master/saveTelegramFlag` ↔ phantom `setIsTelegram`)
6. Semantic invariant + flow direction (Lesson #18 reflex on Stream 1 #5 stale doc cleanup — verify references actually stale before delete)
7. **Document-level CSS audit (Lesson #46 candidate-tier)** — N/A for Stream 1 cleanup but maintain checkbox going forward

### 3.2 Alternative: Stream 6 Web3 (Connect Wallet SIWE auth)

**Why consider:**
- User explicitly carry-over from 1b decision #5
- Wagmi composables already in place (Эпик 5/6/7 wallet integration prior art)
- Single feature surface, well-scoped

**Why defer:**
- Backend-touching (SIWE message verification, JWT issuance from wallet signature) — Lesson #33 cherry-pick chain risk
- L-size sub-epic, longer than Stream 1 cleanup batch
- Streak preservation harder (BE = more variables)

**Estimated effort:** 1 sub-epic, ~12-15 commits total, 2-3 sessions, includes cherry-pick PR.

### 3.3 Alternative: Stream 3 (Subscribe email backend OR Password reset backend)

**Why consider:**
- Closes 8c decision #6 (Subscribe captures emails for real)
- Closes 1b decision #4 (Password reset actually works)

**Why defer:**
- Both require **user product decision first** (SendGrid vs Mailchimp vs in-house — not technical, business)
- Backend-touching, Lesson #33 cherry-pick chain risk
- Lower priority than user-facing features

---

## 4. Deferred / strategic notes

### 4.1 Эпик 9 vs Эпик 7+ continuation

Convention: post-Эпик 6 cutover work is "Эпик 7+" parallel streams. Эпик 8 was Marketing site (3 sub-epics: 8a/8b/8c). Next sub-epic could be:
- **Эпик 9 Stream 1 Cleanup** (recommended) — formal Эпик label
- OR **Stream N parallel** without Эпик label (looser organization)

User to confirm naming preference at Phase 0 ТЗ generation. Recommendation: keep "Эпик 9" label for tracking parity with Эпик 8.

### 4.2 Branch strategy

- **Continue stack pattern** (per 1b precedent abandoning Lesson #33 cherry-pick chain): incremental merges to main. User merges PRs as comfortable.
- **Cherry-pick chain (Lesson #33)** reserved for: production hot-fixes only (e.g., 8b `80dbd59` style), or backend-touching sub-epics where deferred-deploy gating matters.

### 4.3 Visual sign-off pending

8c continue stack PR not yet merged at CL3 push (8 commits ahead of main: 6 functional + 3 closure). User-side action: merge PR → Vercel preview deploy → live verify Subscribe form + 5 new sections render correctly.

If visual issues surface post-deploy (mirror 8b `80dbd59` pattern), hot-fix → streak 1 → 0 break → next sub-epic rebuilds 0 → 1.

If clean: streak holds at 1, next sub-epic targets 1 → 2.

### 4.4 Lesson #46 promotion path

**Current:** PROMOTED at 1st occurrence (8b hot-fix), candidate-tier for 6th-tier mandatory Phase 0 subsection.

**Promotion criterion:** occurrence #2 — another document-level CSS issue caught by reflex (or missed and hot-fixed) in any future sub-epic.

**Tracking forward:** include `body { ... }`, `html { ... }`, `:root { ... }`, universal selector resets in every Phase 0 subsection going forward (especially layout/scroll/viewport-touching sub-epics).

### 4.5 Carry-over hygiene

Carry-overs accumulated since Эпик 5: ~50+ items across Streams. Periodic **carry-over harvest sub-epic** (mechanical cleanup batch) recommended every 5-7 sub-epics to prevent backlog rot. Stream 1 cleanup batch is one such harvest.

---

## 5. Phase 0 ТЗ template hints (for next sub-epic)

When user opens fresh chat for next sub-epic:

1. **STEP 0 reflex (Lesson #43):** verify branch is correct — current bootstrap pattern surfaces fresh-slug `claude/<harness-generated>` from main HEAD. If ТЗ specifies continue stack or specific branch, switch with user authorization (Option A precedent across 12 occurrences).

2. **6 mandatory Phase 0 subsections** (always):
   - Subsection 1: API contract verification
   - Subsection 2: Negative-space verification
   - Subsection 3: CSS taxonomy dump
   - Subsection 4: UI infrastructure dependencies
   - Subsection 5: Vocabulary alignment audit
   - Subsection 6: Semantic invariant + flow direction

3. **Lesson #46 candidate subsection** (recommended for layout/scroll/viewport-touching sub-epics):
   - Subsection 7: Document-level CSS audit (`body`, `html`, `:root`, universal resets)

4. **Mode A discipline:** 1 commit per step, push after each, build pass per commit, STOP gates between major clusters.

5. **Lesson #11 reflex:** pre-edit + post-edit grep on every commit. Adaptation-tier per Lesson #35 acceptable; STOP-tier per Lesson #18 if structural mismatch detected.

6. **Streak target:** 1 → 2 (assuming clean 8c live verify; rebuild from 0 → 1 if 8c hot-fix surfaces).

---

## 6. Cumulative metrics entering Эпик 9 / next sub-epic

| Metric | Value |
|---|---|
| Streak | 1 (post-8c clean) |
| Lessons promoted | 39 (#46 added in 8c) |
| Lesson candidates active | 7 (#36-#42 unchanged) |
| Mandatory Phase 0 subsections | 6 + #46 candidate-tier |
| Closure shapes established | 5 distinct |
| Recoveries cumulative | 90+ (last from Эпик 6 Sub-epic 8) |
| Carry-overs cumulative across all Streams | ~50+ |
| Эпик 6 status | CLOSED ✅ (15/15 sub-epics) |
| Эпик 8 status | CLOSED ✅ (3/3 sub-epics 8a/8b/8c) |

---

## 7. Closure summary

Sub-epic 8c — **CLOSED ✅** (CL1 `32adffd` + CL2 `72505bf` + CL3 this commit).
Эпик 8 — **CLOSED ✅**.

**Continue stack ready for user merge.** Pending: visual sign-off post-Vercel deploy.

**Next:** fresh design-Claude session opens with this handoff. User chooses next-direction option (A/B/C):
- **A:** Stream 1 cleanup batch (recommended)
- **B:** Stream 6 Web3 Connect Wallet auth
- **C:** Stream 3 BE feature (Subscribe email backend OR Password reset backend) pending product decision

Streak: **1** entering. Target: **1 → 2**.
