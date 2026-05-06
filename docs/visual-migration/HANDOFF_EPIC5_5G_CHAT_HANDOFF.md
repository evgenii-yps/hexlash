# HANDOFF — Sub-Epic 5G — Chat Handoff

**From:** 5F ✅ CLOSED (commit `0e6e521` FINAL_REPORT, Step 10 этот handoff `<step 10>`)
**To:** Sub-Epic 5G — TBD scope (Option A single medium feature OR Option B polish batch)

---

## §1 Где мы сейчас

### Route table `/v2/*` (unchanged from 5F — no new routes added)

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ |
| `/v2/matchmaking` | 3Bb | ✅ |
| `/v2/create` | 3Bc + 4 | ✅ |
| `/v2/profile` | 5B | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | 5E | ✅ |

5F adds **global overlays** (no new routes):
- VerifyEmailBanner — mounted в AppV2.vue, visible на всех `/v2/*` if `emailVerified === false`
- HelpModal — hub-only (lazy mount в HudPit, "?" trigger в TopBar)
- MODAL_CONTENT cleanup — pure dead code removal

### Эпик 5 §4.2 features progress

| Status | Count | Items |
|---|---|---|
| ✅ Done after 5A-5E | 6/22 | Friends (5/5B), Web3 Wallet (#7/5B), Achievements (#9/5B), Daily tasks (#10/3Ba), Club Mode Agents in hub (#13/4), Belt rendering (#17/5B+5C), Sound toggle (#20/5B) |
| ✅ Done after 5F | +3 (9/22 total) | Verify email banner (#2/5F), Help overlay (#3/5F), MODAL cleanup (P4 polish/5F) |
| 🟡 Partial | 5/22 | Spectate flag (#4), Challenges (#6), FightClub level (#14), Retirement (#15), Captain switch UI (#18) |
| ❌ Missing | 8/22 | Auth entry (#1), Referral (#8), Social tasks (#11), AI Trainer (#12), MoveTree/DeckBuilder (#16), i18n (#19), Onboarding (#21), AutoFight (#22) |

### Branch state

- Current branch `claude/setup-5e-shop-mode-a-khIAi` continues from 5E + 5F. Same harness slug, single PR target к visual-v2 покроет 5E + 5F + 5G + further sub-epics.
- 5D ветка нетронутая `claude/clan-view-completion-C97qk@5f246eb` — historical reference.
- Merge target — `visual-v2` (после Эпика 5 + Эпика 6).

## §2 Что прочитать в новом чате

Пользователь должен загрузить в новый чат:
1. **CLAUDE.md** (full) — особенно §Sub-Epic 5A-5F sections + lessons #1-24
2. **EPIC5_5F_FINAL_REPORT.md** (commit `0e6e521`) — precedent для FINAL_REPORT structure + 5F-introduced patterns в §6
3. **EPIC5_5E_FINAL_REPORT.md** (commit `54906d6`) — для view migration patterns если 5G choses Option A с new sub-scene
4. **Audit gap matrix** (text artifact из prev chat — 22 features classification per §4.2). Если потерян — re-run audit per ТЗ §3 (15-20 мин read-only)
5. **VISUAL_MIGRATION_PLAN.md** — для sequence decisions (5G scope choice)
6. **hexlash_v24.html** — prototype (если 5G touches visual area, e.g. Spectate flag / Challenges notification panel)

Если пользователь не загрузил эти файлы — попроси загрузить **до** ответа на любой вопрос про 5G. Не работай по памяти.

## §3 Уроки 5F — actionable для 5G+

### Validated working patterns (continued)

- **Lesson #11 — verify shape с реальным data** — 5F applied 5+ times в run (3 blockers Step 0 + 2 grep false-positive recoveries). Pattern: при unexpected state — first verify где именно matched (comment / code / string / shape / signature), не just count or assumption.
- **Pre-flight Step 0 blocker discovery** — 3 blockers caught **before** Step 1 write at zero-commit cost. Compare 5D Step 5 hot-fix series (5 wasted commits before correct port discovery).
- **Path A для prototype port** — 5F applied для VerifyEmailBanner (verbatim 3395-3445 with documented adaptation deltas).

### 5F-introduced patterns (5G can apply)

- **TZ self-correction via pre-flight** — surface assumption errors ДО Step 1 write. Pattern: pre-flight greps verify **every** ТЗ field reference / action signature / file path / route name against real codebase. Catches mismatches at zero-commit cost. 5F surfaced 3 blockers (`verified` field rename → `emailVerified`; `master/sendVerifyEmail` action signature; mount location intent-vs-literal).
- **Delta preservation для adaptation** — extract delta, не copy value blindly. 5F example: verify-banner push-down 36px (prototype absolute) → 48px (5F absolute). Both `+36px` from baseline. Pattern: identify what the prototype was DOING, not what number it was using.
- **Cascade dead code discovery** — initial cleanup goal might expand когда found dependent dead code. 5F Step 1 example: removing 2 MODAL_CONTENT entries → entire PhModal infrastructure dead → −66 lines net в Step 1. Pattern: when removing **last** entries from a dispatch table, audit dependent infrastructure for cascade dead code.
- **Sentinel-marker split-write для Markdown** — 3rd validation в 5F (HTML-comment `<!-- @@PART2@@ -->`). Pattern stable across SFC + CSS + Markdown.
- **Wrapper-based button cluster** — semantic groups для future extensibility. 5F example: TopBar `.v2-topbar__right` flex group wrapping `?` btn + avatar btn. Future-extensible (notif btn / settings btn / language switcher).
- **New pattern OK когда prototype lacks** — HelpModal precedent: prototype only has Onboarding (no dedicated help overlay). Created с нуля per plan §4.2 #3 recommendation. Pattern: Path A is preferred but new pattern acceptable когда prototype gap explicitly noted в plan.

### Anti-patterns avoided в 5F (stay vigilant в 5G)

- **0 lighting tunes blindly** — no visual mismatches surfaced в 5F (Step 6 deferred), but principle stays: при visual issue, first move = structural diagnostic + renderer settings dump (lessons #18 + #20).
- **0 fabricated artifacts** — 3 blockers caught instead of guessed values. ТЗ assumed `verified` field, reality `emailVerified` — lesson #11 catches before Step 1.
- **0 PhModal reuse forced** — when component doesn't fit (PhModal had single desc prop, HelpModal needed 6 sections), новый component идиоматичен. Pattern: respect prop signature constraints; don't force-fit unsuitable components с slot expansion.

## §4 Карта Sub-Epic 5G — TBD pending decision

Two strategy options для 5G:

### Option A — Single medium feature (continue Эпик 5 §4.2 progress)

| Candidate | Audit ref | Estimated work | Reasoning |
|---|---|---|---|
| **Referral QR / share** | #8 (❌ Missing v2) | S/M (2-3 commits) | Augmentation pattern 5B precedent already validated (defineExpose + lazy load). Closes 5B Deferred #2 (referral shortcut). |
| **Captain switch UI** | #18 (🟡 Partial) | M (3-5 commits) | Backend `agentState.setCaptain` ready. Add "Set as Captain" toggle btn в HudFighterDetail. Closes captain system gap. |
| **AutoFight toggle** | #22 (❌ Missing v2) | M | Legacy lives в AgentCard.vue (Club Mode rename). Backend scheduler active. Port toggle to HudFighterDetail tactics. |
| **Spectate flag** | #4 (🟡 Partial) | M | Add /v2/spectate route + `body.fight-readonly` flag wiring. CLAUDE.md §3A explicitly defers this. |
| **Social tasks** | #11 (❌ Missing v2) | S/M | Legacy `SocialTasks.vue` reuse (augmentation pattern). Port to HudTraining. |
| **AI Trainer port** | #12 (❌ Missing v2) | M | Augmentation в v2 ResultOverlay slot. Backend Anthropic endpoint active. |
| **Challenges notification** | #6 (🟡 Partial) | M | Cross-wire legacy `ChallengeNotification.vue` to v2 HUD layer. Closes 5B Deferred #1. |

### Option B — Polish batch (closes 5A-5E carry-over)

5G polish list (cumulative across 5A-5E + 5F):
- HudClan splitting (5D #11, 430 lines > 300 soft cap) — M
- ClanScene mood polish (5D #4, accepted "темновато но норм") — S
- ClanActivityFeed reuse в HudClan (5D #3, 0 hits в v2) — M
- 5E floor concrete texture restore — S
- 5E dust yMax 4.3 prototype parity — XS
- 5F banner dismiss persistence (`dismissed` ref local — refresh restores) — XS
- 5F cascade dead code retrospective (grep PhModal в legacy components) — XS

### Recommended

**Option A** с single feature pick. Polish has lower priority before missing features ship. i18n (#19) остаётся последним per plan §R8 (5L sub-epic).

**Top рекомендации Option A:**
1. **Referral QR** (S/M) — augmentation pattern 5B-validated, closes 5B Deferred #2, low risk
2. **Social tasks** (S/M) — augmentation reuse, closes #11 missing, low risk
3. **Captain switch UI** (M) — backend ready, closes #18 partial, medium risk

## §5 Открытые вопросы для opening 5G

### If Option A (single medium feature)

**Q1 — Какой feature?** Recommendation Top-3 see §4. Pick один.

**Q2 — Augmentation reuse vs ground-up port?** Per chosen feature:
- Referral QR — augmentation legacy `ReferralModal.vue` (defineExpose + lazy mount, 5B precedent) — YES recommended
- Social tasks — augmentation legacy `SocialTasks.vue` — YES recommended
- AI Trainer — augmentation legacy `AiTrainerAnalysis.vue` — TBD (depends on prototype delta)
- Captain switch UI — ground-up (legacy doesn't have v2-style toggle) — NO augmentation
- AutoFight — ground-up (legacy lives in Club Mode AgentCard, different layout) — NO

**Q3 — Backend coupling readiness?** Verify endpoint readiness for chosen feature:
- Captain switch — `PUT /v1/agent/:id/captain` ready (CLAUDE.md §Captain in Arena)
- AutoFight — `agentState.toggleAutoFight` action exists, scheduler running
- AI Trainer — Anthropic endpoint via `POST /v1/ai/analyze-fight` ready
- Referral / Social tasks / Spectate flag — verify before Step 1

### If Option B (polish batch)

**Q1 — Priority order:** Какие 3-5 items first? Recommendation: HudClan splitting + ClanActivityFeed reuse (related — clan fragments) + 5F banner persistence (cheap closure of 5F deferred).

**Q2 — Scope cap:** Single 5G commit pile (8-10 commits) или split на 5G + 5H (если scope > 10 commits). Cumulative polish list has ~7 items — borderline.

## §6 Что делать новому чату в первом сообщении

Standard pre-flight sequence (read-only):

```bash
# 1. Branch slug verification
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi (continue 5E+5F stack) либо новый slug per harness.

# 2. 5F finals reachable
git log --oneline | head -5
# Expected: <step 10 = this commit hash> + 0e6e521 (Step 9 FINAL_REPORT) +
#   d9830ac (Step 8 CLAUDE.md) + 59ad533 (Step 5) reachable.

# 3. node_modules
ls node_modules/ | head -3
# If empty → npm install.

# 4. Files loaded check (chat-side, не git)
# CLAUDE.md / EPIC5_5F_FINAL_REPORT.md / EPIC5_5E_FINAL_REPORT.md / audit gap matrix /
#   VISUAL_MIGRATION_PLAN.md / hexlash_v24.html

# 5. Step 0 questionnaire — Q1-Q3 per §5 в зависимости от Option A/B chosen
```

## §7 Стартовое сообщение для нового чата

```
Start 5G. Mode A strict.

Predecessor: 5F ✅ CLOSED (commit `<step 10 hash>` HANDOFF, `0e6e521` FINAL_REPORT).

Mandatory pre-flight перед Step 1:
1. git branch --show-current — note slug.
2. git log --oneline | head -5 — verify 5F finals reachable.
3. ls node_modules → if empty, npm install.
4. Read EPIC5_5F_FINAL_REPORT.md полностью (lessons + 11 расхождений + 5F-introduced patterns в §6).
5. Read CLAUDE.md Sub-Epics 5A-5F + lessons #1-24.
6. Read audit gap matrix (text artifact от prev chat OR re-run audit per §3 read-only).
7. Step 0 pre-flight report.
8. Decide 5G scope: Option A (single medium feature from gap) или Option B (polish batch). Default rec: Option A с Top-3 candidates (Referral QR / Social tasks / Captain switch).
9. Q1-Q3 (per chosen option, see HANDOFF §5).

User answer → proceed Step 1.

Critical lessons applied (5F validated):
- Pre-flight Step 0 blocker discovery — каждый ТЗ assumption verified против real codebase data ДО Step 1 write. 5F caught 3 blockers (verified field rename / sendVerifyEmail signature / mount location).
- TZ self-correction via pre-flight — patterns established.
- Delta preservation для adaptation — extract delta, не copy value blindly.
- Cascade dead code discovery — initial cleanup goal might expand.
- #11 verify shape с реальным data — 5+ recoveries в 5F run, reflex-level pattern now.
- #19-21 exposure compensation — 5E validated; 5G applicable если visual restorations.
- #22 HUD scoped selector match — applied; Teleport modal exception explicitly documented (PhModal precedent).

Branch context:
- Predecessor 5E+5F — claude/setup-5e-shop-mode-a-khIAi.
- Current — same slug (continue) или новый claude/* per harness.
- Merge target — visual-v2 (после Эпика 5 + Эпика 6 polish).
```

## §8 Чеклист самого handoff'а

- [✅] Файлы 5F final state перечислены
- [✅] Branch state explained (continue vs new slug decision)
- [✅] Эпик 5 §4.2 features progress tracker (9/22 done, 5/22 partial, 8/22 missing)
- [✅] Уроки 5F distilled (validated + 6 new patterns + anti-patterns avoided)
- [✅] Map для Option A vs B (single medium feature vs polish batch)
- [✅] Top-3 Option A recommendations + Option B polish list
- [✅] Open questions per chosen option
- [✅] Pre-flight sequence для нового чата documented
- [✅] Стартовое сообщение copy-paste ready
- [✅] Self-reference `<step 10>` для Step 10 hash placeholder

**End of HANDOFF_EPIC5_5G_CHAT_HANDOFF.md**

**Sub-Epic 5F — TRULY CLOSED.** ✅
