# HANDOFF — Sub-Epic 5I — Chat Handoff

**From:** 5H ✅ CLOSED (commit `867a19e` FINAL_REPORT, Step 7 этот handoff `<step 7>`)
**To:** Sub-Epic 5I — TBD scope (Option A single medium feature OR Option B polish batch)

---

## §1 Где мы сейчас

### 🎯 Halfway milestone — 11/22 (50%) Эпик 5 §4.2 features done

```
Progress 5A → 5H:
After 5A-5E: 6/22 (27%)
After 5F:    9/22 (41%) +3 (Verify email / Help overlay / MODAL cleanup)
After 5G:   10/22 (45%) +1 (Captain switch)
After 5H:   11/22 (50%) +1 (Referral QR)  ← 50% milestone

Remaining: 11 items (5 partial + 6 missing)
```

**11/22 = 50% milestone достигнут после 5H.** Sub-Epics 5A-5H delivered half of §4.2 missing features. Если cadence keeps (1-3 features per sub-epic), оставшиеся 11 закроются за 4-6 sub-epics (≈ 5I-5N).

### Route table `/v2/*` (unchanged from 5G — no new routes)

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 + 5G | ✅ FD (kicker fix + captain switch) |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ |
| `/v2/matchmaking` | 3Bb | ✅ |
| `/v2/create` | 3Bc + 4 | ✅ |
| `/v2/profile` | 5B + **5H** (Identity Referral row) | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | 5E | ✅ |

5H modifies HudProfile.vue + profile.css **in-place** (no new routes). Plus 5F global overlays (VerifyEmailBanner mounted в AppV2, HelpModal hub-only) + 5G Captain switch UI in HudFighterDetail.

### Branch state

- Current branch `claude/setup-5e-shop-mode-a-khIAi` continues from 5E + 5F + 5G + 5H. Same harness slug, single PR target к visual-v2 покроет all sub-epics.
- 5D ветка нетронутая `claude/clan-view-completion-C97qk@5f246eb` — historical reference.
- Merge target — `visual-v2` (после Эпика 5 + Эпика 6 polish).

## §2 Что прочитать в новом чате

Пользователь должен загрузить в новый чат:
1. **CLAUDE.md** (full) — особенно §Sub-Epic 5A-5H sections + lessons #1-30 (5D brought 19-24, 5F brought 25-27, 5G brought 28-29, 5H brought 30)
2. **EPIC5_5H_FINAL_REPORT.md** (commit `867a19e`) — precedent + lesson #30 + 0-line legacy touch + modal lifecycle taxonomy
3. **EPIC5_5G_FINAL_REPORT.md** (commit `c3818e6`) — для bug-bundle pattern + mirror real convention если 5I touches similar в-place modification
4. **Audit gap matrix** (text artifact из prev chat — 22 features classification per §4.2). Если потерян — re-run audit per ТЗ §3 (15-20 мин read-only)
5. **VISUAL_MIGRATION_PLAN.md** — для sequence decisions
6. **hexlash_v24.html** — prototype (если 5I touches visual area)

Если пользователь не загрузил эти файлы — попроси загрузить **до** ответа на любой вопрос про 5I. Не работай по памяти.

## §3 Уроки 5H — actionable для 5I+

### Validated working patterns (5H)

- **Lesson #11 — verify shape с реальным data** — 5H validated as **preventive mode**. Step 0 caught 2 ТЗ corrections (defineExpose unnecessary + CSS file location) before any code change. Step 4 returned 9/9 clean — first sub-epic в running tally без reactive recovery. Pattern works dual-mode: pre-write catch (Step 0) + post-write recovery (Step N). Cumulative TZ self-correction tally: **7 across 5F (3) + 5G (2) + 5H (2)**.
- **Lesson #22 — HUD scoped selector match** — applied для `.ifv.referral` через `.app-v2 .id-field` ancestor chain в profile.css. Validated.
- **5B ConnectWallet pattern — semantic reuse** — validated in 5H. Core principle preserved (lazy import + lazy mount), ceremony dropped (defineExpose + nextTick chain) per target lifecycle.

### 5H-introduced patterns (5I+ can apply)

- **#30 Pattern reuse — semantic vs mechanical** — when reusing precedent pattern (e.g., 5B ConnectWallet → 5H ReferralModal), distinguish core principle (lazy import + lazy mount) from ceremonial details (defineExpose + nextTick × 2 + ref method). Adapt to target component's actual lifecycle. Mechanical mirror leads к dead code (e.g., no-op `openModal` just for symmetry); semantic adaptation respects component's real needs. Lesson #11 specialization для cross-sub-epic pattern reuse.
- **0-line legacy touch — augmentation reuse rule extension** — 5H proved minimal touch isn't always 1-line. ReferralModal's existing `<Teleport to="body">` + `emit('close')` API was sufficient для parent-controlled v-if mount/unmount lifecycle. Pattern: assess legacy component's full API surface before deciding augmentation scope. Sometimes "augment" = "consume as-is".
- **Modal lifecycle taxonomy — mount-on-demand vs long-lived** — explicit categorization prevents wrong pattern force-fit. Mount-on-demand (data fresh per open): ReferralModal, future modals fetching data на mount. Long-lived (state persists across opens): ConnectWallet (connector list, address sticky). Pre-flight Step 0 grep `isOpen|openModal|modelValue` reveals which lifecycle target component uses.

### Anti-patterns avoided в 5H (stay vigilant в 5I)

- **0 mechanical pattern application** — Correction A caught defineExpose force-fit. Resolved via lifecycle assessment.
- **0 fabricated CSS rules** — Correction B located `.ifv.wallet` actual file (profile.css) before adding `.ifv.referral`. Avoided creating duplicate rule в HudProfile scoped style.
- **0 unnecessary edits на legacy file** — ReferralModal.vue untouched. Augmentation reuse rule's deepest variant.

## §4 Карта Sub-Epic 5I — TBD pending decision

After 5H — **11 remaining items** из §4.2 (5 partial + 6 missing). Two strategy options:

### Option A — Single medium feature (continue Эпик 5 §4.2 progress)

Из gap matrix (recheck audit + 5G/5H deferred lists). All 6 candidates ниже have **legacy components ready** → augmentation pattern candidates. 5H proved 0-line touch possible — 5I likely быстрый run если right candidate.

| Candidate | Audit ref | Estimated work | Reasoning |
|---|---|---|---|
| **Social tasks** | #11 (❌ Missing v2) | S/M (2-3 commits) | Legacy `SocialTasks.vue` reuse. **Top recommendation для 5I** — следующий small augmentation после Referral. Symmetric pattern (legacy fragment reuse + lazy mount + Identity-card-style trigger). Closes Training-related deferred. |
| AutoFight toggle | #22 (❌ Missing v2) | M | Legacy lives в Club Mode AgentCard.vue. Backend scheduler active. Port toggle to HudFighterDetail tactics tab. |
| Spectate flag | #4 (🟡 Partial) | M | Add /v2/spectate route + `body.fight-readonly` flag wiring. CLAUDE.md §3A explicitly defers. |
| AI Trainer port | #12 (❌ Missing v2) | M | Legacy `AiTrainerAnalysis.vue` augmentation в v2 ResultOverlay slot. Backend Anthropic endpoint active. |
| Challenges notification | #6 (🟡 Partial) | M | Cross-wire legacy `ChallengeNotification.vue` to v2 HUD layer. Closes 5B Deferred #1. |
| FightClub level + Morning Report | #14 (🟡 Partial) | M | Legacy `MorningReport.vue` (5A days). Port to FightClub view OR HudPit overlay. |
| Retirement | #15 (🟡 Partial) | M | Legacy `RetirementPanel.vue`. Port to HudFighterDetail overlay. |

### Option B — Polish batch (closes 5A-5H carry-over)

5I polish list (cumulative across 5A-5H):
- HudClan splitting (5D #11, 430 lines > 300 soft cap) — M
- ClanScene mood polish (5D #4, accepted "темновато но норм") — S
- ClanActivityFeed reuse в HudClan (5D #3, 0 hits в v2) — M
- 5E floor concrete texture restore — S
- 5E dust yMax 4.3 prototype parity — XS
- 5F banner dismiss persistence — XS
- 5G optimistic UI captain swap polish — XS
- **5H referral data optimistic** (current await) — XS

### Recommended

**Option A с Social tasks (#11)** — следующий small augmentation после Referral. Symmetric pattern matches 5H precedent (legacy fragment reuse + lazy mount + Identity-style trigger), closes Training-related deferred. Apply lesson #30 — assess SocialTasks.vue lifecycle (mount-on-demand vs long-lived) before mechanical mirror.

**Top-3 Option A picks:**
1. **Social tasks** (S/M) — augmentation pattern continuation, low risk
2. **Challenges notification** (M) — closes 5B Deferred #1, unique cross-wire pattern
3. **AutoFight toggle** (M) — backend ready, ground-up port (legacy AgentCard layout doesn't fit HudFighterDetail tactics)

## §5 Открытые вопросы для opening 5I

### If Option A (single medium feature)

**Q1 — Какой feature?** Top-3 recommendations см. §4. Pick один. Если **Social tasks** — Q2-Q3 specific:
- Q2 — Mount placement: HudTraining (Training daily-tasks card, near existing tasks block) vs separate card?
- Q3 — Augmentation pattern: 5H 0-line touch (если SocialTasks.vue API sufficient) vs 5B-style 1-line defineExpose?
- Q4 — Backend coupling: tasks API endpoint ready? Verify `/social-tasks` или similar route.

Если другой feature — Q's adjust per feature.

**Lesson #30 application:** before Step 1 write, run pre-flight greps на legacy SocialTasks.vue:
- `<Teleport to=` (lifecycle indicator — Teleport at root = mount-on-demand candidate)
- `isOpen|openModal|modelValue` (internal state indicator — long-lived candidate)
- `defineEmits` (close-event API check)

Same pattern as 5H Step 0 pre-flight для ReferralModal.

### If Option B (polish batch)

**Q1 — Priority order:** Какие 3-5 items first? Recommendation: 5G optimistic UI captain swap + 5H referral optimistic + 5F banner dismiss persistence (3 cheap closures of recent sub-epic deferred lists).

**Q2 — Scope cap:** Single 5I commit pile (8-10 commits) или split на 5I + 5J (если scope > 10 commits). Cumulative polish list has ~8 items — borderline.

## §6 Что делать новому чату в первом сообщении

Standard pre-flight sequence (read-only):

```bash
# 1. Branch slug verification
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi (continue 5E+5F+5G+5H stack) либо новый slug per harness.

# 2. 5H finals reachable
git log --oneline | head -5
# Expected: <step 7 = this commit hash> + 867a19e (Step 6 FINAL_REPORT) +
#   8c989b1 (Step 5 CLAUDE.md) + 7933105 (Step 2 functional) reachable.

# 3. node_modules
ls node_modules/ | head -3
# If empty → npm install.

# 4. Files loaded check (chat-side, не git)
# CLAUDE.md / EPIC5_5H_FINAL_REPORT.md / EPIC5_5G_FINAL_REPORT.md / audit gap matrix /
#   VISUAL_MIGRATION_PLAN.md / hexlash_v24.html

# 5. Pre-spec investigation (if Option A с specific feature) — read-only grep:
#    - chosen feature legacy state location (Component/Vuex/service)
#    - related actions/getters
#    - HUD touchpoints
#    - prototype reference (if applicable)
#    - lifecycle indicators (Teleport at root / isOpen state / modelValue)

# 6. Step 0 questionnaire — Q1-Q4 per §5 в зависимости от Option A/B chosen
```

## §7 Стартовое сообщение для нового чата

```
Start 5I. Mode A strict.

Predecessor: 5H ✅ CLOSED (commit `<step 7 hash>` HANDOFF, `867a19e` FINAL_REPORT).
🎯 Halfway through Эпик 5 §4.2 (11/22 = 50% milestone after 5H).

Mandatory pre-flight перед Step 1:
1. git branch --show-current — note slug.
2. git log --oneline | head -5 — verify 5H finals reachable.
3. ls node_modules → if empty, npm install.
4. Read EPIC5_5H_FINAL_REPORT.md полностью (lesson #30 + 0-line touch + modal lifecycle taxonomy).
5. Read CLAUDE.md Sub-Epics 5A-5H + lessons #1-30.
6. Read audit gap matrix (text artifact от prev chat OR re-run audit per §3 read-only).
7. Step 0 pre-flight report.
8. Decide 5I scope: Option A (single medium feature from gap, top-3: Social tasks / Challenges / AutoFight) или Option B (polish batch). Default rec: Option A с Social tasks (#11).
9. Q1-Q4 (per chosen option, see HANDOFF §5).
10. Pre-spec investigation if Option A (read-only grep run for chosen feature touchpoints + lifecycle indicators).

User answer → proceed Step 1.

Critical lessons applied (5H validated):
- Pre-flight Step 0 catches ТЗ assumption errors at zero-commit cost (running tally 7 corrections in 5F+5G+5H).
- Lesson #30 — pattern reuse semantic vs mechanical (NEW from 5H).
- 0-line legacy touch — augmentation reuse rule extension (NEW from 5H).
- Modal lifecycle taxonomy — mount-on-demand vs long-lived (NEW from 5H, applicable for 5I if Social tasks chosen).
- Lesson #11 reflex — 9+ false-positive recoveries running tally (5H added 0 — first sub-epic without reactive recovery, validates preventive mode).
- 4-streak hot-fix metric (5E + 5F + 5G + 5H all 0 unplanned hot-fix).
- #19-21 exposure compensation — N/A для 5I if no scene work; otherwise applicable.
- #22 HUD scoped selector match — applied; Teleport modal exception explicitly documented (PhModal precedent).

Branch context:
- Predecessor 5E+5F+5G+5H — claude/setup-5e-shop-mode-a-khIAi.
- Current — same slug (continue) или новый claude/* per harness.
- Merge target — visual-v2 (после Эпика 5 + Эпика 6 polish).
```

## §8 Чеклист самого handoff'а

- [✅] Файлы 5H final state перечислены
- [✅] Branch state explained (continue vs new slug decision)
- [✅] 🎯 **Halfway milestone noted** (11/22 = 50% Эпик 5 §4.2 after 5H)
- [✅] Эпик 5 §4.2 features progress tracker
- [✅] Уроки 5H distilled (validated + 3 new patterns + anti-patterns avoided)
- [✅] Map для Option A vs B (single medium feature vs polish batch)
- [✅] Top-3 Option A recommendations с lifecycle assessment guidance
- [✅] Open questions per chosen option (Q's adapted для Social tasks scenario)
- [✅] Pre-flight sequence для нового чата documented (incl. lifecycle pre-spec investigation step)
- [✅] Стартовое сообщение copy-paste ready
- [✅] Self-reference `<step 7>` для Step 7 hash placeholder

**End of HANDOFF_EPIC5_5I_CHAT_HANDOFF.md**

**Sub-Epic 5H — TRULY CLOSED.** ✅
