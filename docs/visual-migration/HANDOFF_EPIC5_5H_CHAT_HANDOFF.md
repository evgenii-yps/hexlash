# HANDOFF — Sub-Epic 5H — Chat Handoff

**From:** 5G ✅ CLOSED (commit `c3818e6` FINAL_REPORT, Step 7 этот handoff `<step 7>`)
**To:** Sub-Epic 5H — TBD scope (Option A single medium feature OR Option B polish batch OR Option C triple batch)

---

## §1 Где мы сейчас

### Route table `/v2/*` (unchanged from 5F + 5G — no new routes)

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 + **5G** (kicker bug fix + captain switch UI) | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ |
| `/v2/matchmaking` | 3Bb | ✅ |
| `/v2/create` | 3Bc + 4 | ✅ |
| `/v2/profile` | 5B | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | 5E | ✅ |

5G modifies HudFighterDetail.vue **in-place** (no new routes). Plus 5F global overlays (VerifyEmailBanner mounted в AppV2, HelpModal hub-only).

### Эпик 5 §4.2 features progress

| Status | Count | Items |
|---|---|---|
| ✅ Done after 5A-5E | 6/22 | Friends (5/5B), Web3 Wallet (#7/5B), Achievements (#9/5B), Daily tasks (#10/3Ba), Club Mode Agents in hub (#13/4), Belt rendering (#17/5B+5C), Sound toggle (#20/5B) |
| ✅ Done after 5F | +3 (9/22) | Verify email banner (#2/5F), Help overlay (#3/5F), MODAL cleanup (P4 polish/5F) |
| ✅ Done after 5G | +1 (**10/22**) | Captain switch UI (#18/5G) — 🟡 Partial → ✅ Done |
| 🟡 Partial | 5/22 | Spectate flag (#4), Challenges (#6), FightClub level (#14), Retirement (#15) |
| ❌ Missing | 7/22 | Auth entry (#1), Referral (#8), Social tasks (#11), AI Trainer (#12), MoveTree/DeckBuilder (#16), i18n (#19), Onboarding (#21), AutoFight (#22) |

### Branch state

- Current branch `claude/setup-5e-shop-mode-a-khIAi` continues from 5E + 5F + 5G. Same harness slug, single PR target к visual-v2 покроет 5E + 5F + 5G + 5H + further sub-epics.
- 5D ветка нетронутая `claude/clan-view-completion-C97qk@5f246eb` — historical reference.
- Merge target — `visual-v2` (после Эпика 5 + Эпика 6 polish).

## §2 Что прочитать в новом чате

Пользователь должен загрузить в новый чат:
1. **CLAUDE.md** (full) — особенно §Sub-Epic 5A-5G sections + lessons #1-29 (5F brought 25-27, 5G brought 28-29)
2. **EPIC5_5G_FINAL_REPORT.md** (commit `c3818e6`) — precedent + Bug-bundle in scope + Mirror real convention patterns
3. **EPIC5_5F_FINAL_REPORT.md** (commit `0e6e521`) — для triple batch precedent if Option C chosen
4. **Audit gap matrix** (text artifact из prev chat — 22 features classification per §4.2). Если потерян — re-run audit per ТЗ §3 (15-20 мин read-only)
5. **VISUAL_MIGRATION_PLAN.md** — для sequence decisions
6. **hexlash_v24.html** — prototype (если 5H touches visual area)

Если пользователь не загрузил эти файлы — попроси загрузить **до** ответа на любой вопрос про 5H. Не работай по памяти.

## §3 Уроки 5G — actionable для 5H+

### Validated working patterns (continued)

- **Lesson #11 — verify shape с реальным data** — 5G applied 3 specific times: investigation pre-spec (kicker bug discovery), pre-flight Step 0 (2 ТЗ assumption errors), Step 4 false-positive recovery (isCaptain count=2 in code+comment). 9th cumulative recovery в 5E+5F+5G run (4+4+1).
- **Lesson #22 — HUD scoped selector match** — applied для `.set-captain-btn` + `.captain-badge` в HudFighterDetail.vue scoped style block. Validated.
- **Pre-flight Step 0 blocker discovery** — 2 ТЗ corrections caught **before** Step 1 write at zero-commit cost. Compare 5D Step 5 hot-fix series (5 wasted commits before correct port).

### 5G-introduced patterns (5H+ can apply)

- **Bug-bundle in scope** — investigation findings (e.g., kicker bug в case 5G) могут быть scope-extended если изначальный focus area touches the file. Single-line fix bundled с 5G — не deferred к polish run отдельным commit'ом. Pattern для future investigation-driven sub-epics: when grep finds adjacent bug в same file/scope, bundle if low-risk single-line fix.
- **Mirror real convention** — when ТЗ phrasing differs from codebase reality (e.g., ТЗ said `position: absolute`, codebase uses `fixed`), pre-edit grep wins. Verify shape реальной реализации, не trust ТЗ verbatim. Lesson #11 specialization для CSS/markup conventions.
- **Cascade infra reuse** — Epic 4 Step 5.5 watcher means 5G не нужно manual refresh code; existing infra handles cascade automatically. Pattern: when adjacent epic provides reactive infra, lean on it rather than duplicate dispatch consumption.
- **Investigation-driven scope expansion** — pre-spec investigation findings drive ТЗ scope extension. Found kicker bug + Q1-Q7 closing all done in single TZ write before any commits. Reduces mid-run hot-fix risk.

### Anti-patterns avoided в 5G (stay vigilant в 5H)

- **0 lighting tunes blindly** — no visual mismatches surfaced (Step 3 sign-off clean), but principle stays: при visual issue, first move = structural diagnostic + renderer settings dump (lessons #18 + #20).
- **0 fabricated artifacts** — all decisions evidence-backed. Q1-Q7 decisions made в ТЗ before Step 1 with explicit reasoning, not assumed.
- **0 ConfirmModal forced** — Q4 direct dispatch chose appropriately vs 5D destructive precedent. Pattern: respect action reversibility; ConfirmModal reserved для irreversible ops.

## §4 Карта Sub-Epic 5H — TBD pending decision

After 5G — **12 remaining items** (5 partial + 7 missing). Three strategy options:

### Option A — Single medium feature (continue Эпик 5 §4.2 progress)

| Candidate | Audit ref | Estimated work | Reasoning |
|---|---|---|---|
| **Referral QR / share** | #8 (❌ Missing) | S/M (2-3 commits) | Augmentation pattern 5B precedent already validated (defineExpose + lazy load). Closes 5B Deferred #2. **Top recommendation для 5H** — low risk, fast close. |
| AutoFight toggle | #22 (❌ Missing v2) | M | Legacy lives в AgentCard.vue (Club Mode rename). Backend scheduler active. Port toggle to HudFighterDetail tactics. |
| Spectate flag | #4 (🟡 Partial) | M | Add /v2/spectate route + `body.fight-readonly` flag wiring. CLAUDE.md §3A explicitly defers this. |
| Social tasks | #11 (❌ Missing v2) | S/M | Legacy `SocialTasks.vue` reuse (augmentation pattern). Port to HudTraining. |
| AI Trainer port | #12 (❌ Missing v2) | M | Augmentation в v2 ResultOverlay slot. Backend Anthropic endpoint active. |
| Challenges notification | #6 (🟡 Partial) | M | Cross-wire legacy `ChallengeNotification.vue` to v2 HUD layer. Closes 5B Deferred #1. |
| FightClub level + Morning Report | #14 (🟡 Partial) | M | Legacy `MorningReport.vue` (5A days) reuse. Port to FightClub view (`/v2/club` или HudPit overlay). |
| Retirement | #15 (🟡 Partial) | M | Legacy `RetirementPanel.vue` reuse. Port to HudFighterDetail overlay. |

### Option B — Polish batch (closes 5A-5G carry-over)

5H polish list (cumulative across 5A-5G):
- HudClan splitting (5D #11, 430 lines > 300 soft cap) — M
- ClanScene mood polish (5D #4, accepted "темновато но норм") — S
- ClanActivityFeed reuse в HudClan (5D #3, 0 hits в v2) — M
- 5E floor concrete texture restore — S
- 5E dust yMax 4.3 prototype parity — XS
- 5F banner dismiss persistence (`dismissed` ref local) — XS
- 5F cascade dead code retrospective (grep PhModal в legacy) — XS
- 5G optimistic UI captain swap polish — XS

### Option C — Triple small batch (5F precedent)

- Banner dismiss persistence (5F deferred) — XS
- 5E dust polish (yMax extension) — XS
- 5G optimistic UI polish — XS

But i18n defers 5L per plan §R8, и triple-batch без i18n включения — minimal value.

### Recommended

**Option A с Referral QR** (S/M) — augmentation pattern 5B-validated, closes 5B Deferred #2 (referral shortcut), closes audit gap #8, low risk. Same scope-coherence pattern как 5G captain UI (closes single audit gap with bundled bug fix).

Polish (Option B) lower priority before missing features ship. i18n (#19) остаётся последним per plan §R8 (5L sub-epic).

**Top-3 Option A picks:**
1. **Referral QR** (S/M) — augmentation 5B pattern, low risk
2. **Social tasks** (S/M) — augmentation legacy SocialTasks.vue, low risk
3. **AutoFight toggle** (M) — backend ready, ground-up port (legacy AgentCard layout doesn't fit FD tactics tab)

## §5 Открытые вопросы для opening 5H

### If Option A (single medium feature)

**Q1 — Какой feature?** Top-3 recommendations см. §4. Pick один.

**Q2 — Augmentation reuse vs ground-up port?** Per chosen feature:
- Referral QR — augmentation legacy `ReferralModal.vue` (defineExpose + lazy mount, 5B precedent) — YES recommended
- Social tasks — augmentation legacy `SocialTasks.vue` — YES recommended
- AutoFight — ground-up (legacy lives in Club Mode AgentCard, different layout) — NO
- Spectate — ground-up (no legacy v2-style flag system) — NO
- AI Trainer — TBD (depends on prototype delta vs legacy `AiTrainerAnalysis.vue`)
- Challenges notification — cross-wire (5B Deferred #1 closure)
- FightClub level / Retirement — augmentation legacy `MorningReport.vue` / `RetirementPanel.vue`

**Q3 — Backend coupling readiness?** Verify endpoint readiness for chosen feature:
- Referral QR — `/user/referrals` GET ready (audit confirmed legacy works)
- AutoFight — `agentState.toggleAutoFight` action exists, scheduler running
- AI Trainer — Anthropic endpoint via `POST /v1/ai/analyze-fight` ready
- Social tasks / Spectate flag / Challenges notification — verify pre-Step 1

### If Option B (polish batch)

**Q1 — Priority order:** Какие 3-5 items first? Recommendation: 5F banner dismiss persistence + 5G optimistic UI captain swap + 5E floor concrete restore (cheap closures of recent sub-epic deferred lists).

**Q2 — Scope cap:** Single 5H commit pile (8-10 commits) или split на 5H + 5I (если scope > 10 commits). Cumulative polish list has ~8 items — borderline.

## §6 Что делать новому чату в первом сообщении

Standard pre-flight sequence (read-only):

```bash
# 1. Branch slug verification
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi (continue 5E+5F+5G stack) либо новый slug per harness.

# 2. 5G finals reachable
git log --oneline | head -5
# Expected: <step 7 = this commit hash> + c3818e6 (Step 6 FINAL_REPORT) +
#   ebeb2ef (Step 5 CLAUDE.md) + 65a1d6e (Step 2) reachable.

# 3. node_modules
ls node_modules/ | head -3
# If empty → npm install.

# 4. Files loaded check (chat-side, не git)
# CLAUDE.md / EPIC5_5G_FINAL_REPORT.md / EPIC5_5F_FINAL_REPORT.md / audit gap matrix /
#   VISUAL_MIGRATION_PLAN.md / hexlash_v24.html

# 5. Pre-spec investigation (if Option A с specific feature) — read-only grep run for:
#    - chosen feature legacy state location
#    - related Vuex actions/getters
#    - HUD touchpoints
#    - prototype reference (if applicable)

# 6. Step 0 questionnaire — Q1-Q3 per §5 в зависимости от Option A/B chosen
```

## §7 Стартовое сообщение для нового чата

```
Start 5H. Mode A strict.

Predecessor: 5G ✅ CLOSED (commit `<step 7 hash>` HANDOFF, `c3818e6` FINAL_REPORT).

Mandatory pre-flight перед Step 1:
1. git branch --show-current — note slug.
2. git log --oneline | head -5 — verify 5G finals reachable.
3. ls node_modules → if empty, npm install.
4. Read EPIC5_5G_FINAL_REPORT.md полностью (lessons #28-29 + bug-bundle pattern + mirror real convention).
5. Read CLAUDE.md Sub-Epics 5A-5G + lessons #1-29.
6. Read audit gap matrix (text artifact от prev chat OR re-run audit per §3 read-only).
7. Step 0 pre-flight report.
8. Decide 5H scope: Option A (single medium feature from gap) или Option B (polish batch) или Option C (triple batch). Default rec: Option A с Top-3 (Referral QR / Social tasks / AutoFight).
9. Q1-Q3 (per chosen option, see HANDOFF §5).
10. Pre-spec investigation if Option A (read-only grep run for chosen feature touchpoints).

User answer → proceed Step 1.

Critical lessons applied (5G validated):
- Pre-flight Step 0 blocker discovery — ТЗ assumptions verified против real codebase ДО Step 1 write. 5F caught 3 blockers, 5G caught 2 ТЗ corrections.
- Bug-bundle in scope — investigation findings → scope extension (kicker bug в 5G).
- Mirror real convention — defer к codebase reality vs ТЗ template phrasing (position fixed/absolute case).
- Cascade infra reuse — Epic 4 Step 5.5 watcher for hub auto-refresh.
- Investigation-driven scope expansion — pre-spec investigation drives ТЗ scope (kicker bug + Q1-Q7 closing in single TZ write).
- Lesson #11 reflex — 9+ false-positive recoveries running tally. Pattern reflex-level.
- #19-21 exposure compensation — N/A для 5H if no scene work; otherwise applicable.
- #22 HUD scoped selector match — applied; Teleport modal exception explicitly documented (PhModal precedent).

Branch context:
- Predecessor 5E+5F+5G — claude/setup-5e-shop-mode-a-khIAi.
- Current — same slug (continue) или новый claude/* per harness.
- Merge target — visual-v2 (после Эпика 5 + Эпика 6 polish).
```

## §8 Чеклист самого handoff'а

- [✅] Файлы 5G final state перечислены
- [✅] Branch state explained (continue vs new slug decision)
- [✅] Эпик 5 §4.2 features progress tracker (10/22 done, 5/22 partial, 7/22 missing)
- [✅] Уроки 5G distilled (validated + 4 new patterns + anti-patterns avoided)
- [✅] Map для Option A vs B vs C (single medium feature vs polish batch vs triple batch)
- [✅] Top-3 Option A recommendations + Option B polish list
- [✅] Open questions per chosen option
- [✅] Pre-flight sequence для нового чата documented (incl. pre-spec investigation step)
- [✅] Стартовое сообщение copy-paste ready
- [✅] Self-reference `<step 7>` для Step 7 hash placeholder

**End of HANDOFF_EPIC5_5H_CHAT_HANDOFF.md**

**Sub-Epic 5G — TRULY CLOSED.** ✅
