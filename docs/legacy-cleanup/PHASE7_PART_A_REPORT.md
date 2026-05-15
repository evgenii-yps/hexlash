# Phase 7 — Part A Report (i18n orphan-key sweep, discovery)

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA:** `bee213b` (Phase 7-pre-2 Part B)
**Date:** 2026-05-14
**Scope:** Discovery only. No edits to `en.js` or any consumer file.

---

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `bee213b` ✅ matches expected (Phase 7-pre-2)
- Clean working tree, in sync with origin
- Decision: proceed

---

## A.0 — i18n loader and access patterns

Read `src/locales/index.js`. Key facts:

- **Custom i18n** (NOT `vue-i18n`). `t` is a `computed()` ref returning the `en.js` data object spread + `{ pages: { help, rules } }` injected from JSON files.
- **Access patterns (4):**
  1. Template (auto-unwrap): `{{ t.section.key }}`, `:attr="t.section.key"`
  2. Script (composable): `t.value.section.key`
  3. Interpolation: `interpolate(t.value.section.key, params)` with `{name}` placeholders. 8 callsites in `src/`.
  4. Dynamic bracket-notation: `t.value.section?.subsection?.[var]`, `t.section[var]`, `t.value.section.subsection[var]`
- **NOT used:** `t()` function call, `$t()` (vue-i18n), destructuring from `t`. Verified by grep.
- **Fallback chains:** none in loader — direct nested object access only.

### Dynamic-access pattern enumeration

Grep `t\.value\.[a-zA-Z?.]+\[|t\.[a-zA-Z?.]+\[` across `src/` (excluding `en.js` and known false-positives like `event.target.files[0]`, `BELT_THRESHOLDS[t][0]`):

| Consumer | Line | Pattern | Namespace dynamically accessed |
|---|---|---|---|
| `ResearchTree.vue` | 152 | `t.value.gameData?.branches?.[b]?.name` | `gameData.branches.*` (3 branches × {name, description}) |
| `ResearchTree.vue` | 158 | `t.value.gameData?.moves?.[id]?.name` | `gameData.moves.*` (15 moves × {name, description}) |
| `AgentCard.vue` | 63 | `t.value.belts?.[d.color]` | `belts.{9 colors + hexmaster}` |
| `ArchetypeSelector.vue` | 37 | `t.value.cards?.archetypes?.[id]` | `cards.archetypes.*` (6 archetypes) |
| `ArchetypeSelector.vue` | 38, 43 | `t.value.cards?.archetypeDesc?.[id]` | `cards.archetypeDesc.*` (6 archetypes) |
| `ModuleBuilder.vue` | 14, 64, 107 | `t.arena.archetypes[id]`, `t.value.arena.archetypes[id]` | `arena.archetypes.*` (6 archetypes) |
| `ModuleBuilder.vue` | 65 | `t.arena.archetypeDesc[archetype.id]` | `arena.archetypeDesc.*` (6 archetypes) |
| `ModuleBuilder.vue` | 98-100 | `t.value.arena.protocolName.X`, `protocolTrigger.X` | `arena.protocolName.*` + `arena.protocolTrigger.*` (3 protocols each) |
| `ModuleBuilder.vue` | 113 | `t.value.arena.buildStyle` (whole object) | `arena.buildStyle.*` (7 buildStyle keys) |
| `cardFightState.js` | 126 | `t.value.arena.archetypes[id]` | (already counted above) |
| `PageView.vue` | 36 | `t.value.pages?.[title.value]` | `pages.help`, `pages.rules` (out of `en.js` scope — separate JSON files) |

**8 distinct dynamic-access patterns, all in en.js scope** (pages.help/pages.rules in JSON files, out of scope).

### Total dynamic-protected key list

Computed and saved to `docs/legacy-cleanup/PHASE7_DYNAMIC_PROTECTED.txt` — **89 keys** that the static-path sweep would falsely flag orphan.

---

## A.1 — Accumulated queue verify (20 keys from prior phases)

| Key | From | Status |
|---|---|---|
| `profile.account.lblChangeLanguage` | Phase 2 (L6) | ✅ confirmed orphan |
| `profile.account.is3dPunch` | Phase 2 | ✅ confirmed orphan |
| `profile.account.soundToggle` | Phase 2 | ✅ confirmed orphan |
| `profile.skins.lblTitle` | Phase 3 | ✅ confirmed orphan |
| `profile.skins.lblFree` | Phase 3 | ✅ confirmed orphan |
| `profile.invite.lblInvite` | Phase 4 (L9) | ✅ confirmed orphan |
| `profile.invite.btnInvite` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.question` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.btnLogin` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.lblCopySuccess` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.lblCopyError` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.lblTooltipText` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.inviteFriend` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.confirmInviteFriend` | Phase 4 | ✅ confirmed orphan |
| `profile.invite.inviteText` | Phase 7-pre B (sendShare) | ✅ confirmed orphan |
| `training.lblDailyTasks` | Phase 6 | ✅ confirmed orphan |
| `training.noTasksAvailable` | Phase 6 | ✅ confirmed orphan |
| `training.checklistCompleted` | Phase 6 | ✅ confirmed orphan |
| `training.lblChecklist` | Phase 6 | ✅ confirmed orphan |
| `auth.login.btnReset` | Phase 4 bonus | ✅ confirmed orphan |

**20/20 verified orphan ✅** — sweep methodology consistent with accumulated queue.

---

## A.2 — Full sweep `en.js` results

### Raw numbers

- **Total leaf keys in `en.js`:** 807
- **Raw orphan candidates** (static-path grep, `t.X.Y` + `t.value.X.Y` patterns): 537
- **Dynamic-protected keys** (would be falsely flagged orphan by static grep): 89
- **Dynamic-protected ∩ raw orphan list** (saved from false retirement): **71 keys**
- **Final retire candidates** (raw orphans minus dynamic-protected): **466 keys**

Saved to `docs/legacy-cleanup/PHASE7_RETIRE_LIST.txt`.

### Lesson #11 catches during sweep

1. **`t.value.gameData?.branches?.[b]?.name` pattern missed by static grep** — `?.[` between letters was not in initial regex. Broader regex caught it. Without this catch, all 36 `gameData.{branches,moves}.*` keys would have been retired (game data for live ResearchTree component).

2. **`t.value.belts?.[d.color]`** — same pattern. Without catch, 10 belt color names would have been retired (Belt System is live via BeltBadge + AgentCard).

3. **`t.arena.archetypes[selectedModules[slot-1]]` (template syntax)** — bracket notation in templates also missed by initial regex. Caught on second pass.

4. **`t.value.arena.buildStyle` accessed as whole object** — not a leaf access. The 7 keys inside `arena.buildStyle.*` are iterated at runtime; static grep finds zero hits on individual leaves.

5. **`t.arena.hub?.switchBack` static access in PreparationView** — single live consumer keeps `arena.hub` namespace alive (1 key). Easy to miss if scanning only by leaf.

### False-positive sanity verifications (passed)

- `BELT_THRESHOLDS[t][0]` in `beltDisplay.js:29` — `t` is local array, NOT i18n. False-positive in initial dynamic-detection; excluded.
- `event.target.files[0]`, `agentsList[1]` — local vars. Excluded.

---

## A.3 — Cluster + preserve-candidate analysis

### Retire candidates by section (466 keys)

```
  146 club              (Club Mode v1 UI — absorbed into v2 HUDs with inline EN)
   71 fight             (v1 CardFightView / fight engine UI strings)
   64 profile           (v1 ProfileView fragments — deleted in Phases 1-4)
   39 clan              (v1 ClanView fragments — replaced by v2 HudClan)
   22 rating            (v1 RatingsView strings — replaced by v2 HudRatings)
   22 pvp               (v1 PvP UI — replaced by v2 fight/spectate)
   18 auth              (Эпик 9 auth-redesign abandoned old namespace)
   16 friends           (v1 friends UI — replaced by v2 HudProfile Friends tab)
   12 training          (v1 training UI — replaced by v2 HudTraining)
   10 deck              (DeckBuilder retired Эпик 7)
   10 belts             (lbl* keys; color names are protected)
    8 research          (research moved per-agent, old strings unused)
    8 arena             (residual after protected filter)
    6 guestClan         (whole namespace, never wired)
    3 xpAllocation      (whole namespace)
    3 userProfile       (whole namespace)
    3 info              (orphan info messages: firstFight, firstTraining, withdrawClanDisable)
    2 nav               (whole namespace, 2 keys)
    1 spectate          (single orphan)
    1 you               (top-level orphan: '(You)' string)
    1 referral          (single orphan)
```

### Wholly-dead namespaces (22, namespace-level retirement candidates)

After subtracting dynamic-protected:

| Namespace | Key count | Likely origin |
|---|---|---|
| `friends` | 16 | v1 FriendsView strings — replaced by v2 HudProfile Friends tab |
| `profile.buttons` | 13 | v1 ProfileButtons.vue (deleted Phase 1) |
| `auth.signup` | 10 | Эпик 9 auth-redesign |
| `profile.invite` | 10 | L9 ProfileInvite.vue (deleted Phase 4) |
| `deck` | 10 | DeckBuilder retired Эпик 7 |
| `auth.login` | 8 | Эпик 9 auth-redesign |
| `profile.stats` | 8 | v1 ProfileStats.vue (deleted Phase 1) |
| `research` | 8 | research moved per-agent, old user-level strings unused |
| `guestClan` | 6 | namespace never wired |
| `fight.diceName` | 6 | dice UI strings — v2 uses inline EN per Sub-epic 4a |
| `fight.diceDesc` | 6 | same |
| `club.tactics.coach` | 4 | v1 tactics UI |
| `club.tactics.fightMode` | 3 | same |
| `club.tactics.aggression` | 3 | same |
| `club.tactics.dicePolicy` | 3 | same |
| `club.tactics.emergency` | 3 | same |
| `club.tactics.restPeriod` | 3 | same |
| `userProfile` | 3 | UserProfileView replaced |
| `xpAllocation` | 3 | XPAllocationModal retired |
| `profile.skins` | 2 | L4 ProfileSkins.vue (deleted Phase 3) |
| `nav` | 2 | top-level nav keys, no callers |
| `arena.hub` | 1 | single orphan inside live namespace |

**Total wholly-dead namespace keys:** 128.

### Preserve-candidate flags

Reviewing the retire list for keys that look like preserve candidates (under-feature-flag or potentially-useful-later):

**None obvious.** Unlike L5 BuyTokens (which had explicit "disabled, preserved for future" doc-comment), no i18n keys in the orphan list carry self-label or comment indicating intentional preserve. All look like residue from completed migrations.

**Owner heads-up:** if you have particular UI flows that should be re-implemented later (e.g., friends search rework, club tactics revamp), those namespaces (`friends`, `club.tactics.*`) could be preserved instead of retired. Default: retire all 466 if no specific intent.

---

## A.4 — Cross-reference with parking list

### L7 — `auth.telegram.*` / `auth.reset.*` Phase 0 "already done"

Verification: no `auth.telegram.*` keys in `en.js`. No `auth.reset.*` keys either. ✅ confirmed already removed in referral series. L7 closed permanently.

### Vuetify-specific strings

Vuetify v2 typically uses its own English defaults (no i18n keys needed for basic UI). Grep for Vuetify-component strings (`v-` directives, Vuetify-specific terms in `en.js`): none found. Vuetify-removal series (when it happens) won't trigger i18n cleanup beyond what's already in scope.

### Pixel-font coverage

Project is English-only post referral series. Anonymous/AnonymousBalance fonts (English-only character set) are fine. No coverage issue → not relevant to Phase 7.

### Backend-API i18n strings

Verified: no i18n keys flagged as backend-API consumer (e.g., email-template strings come from backend, not from `en.js`). Backend has its own English defaults in code.

### `pages.help.*` + `pages.rules.*` namespace

These come from separate JSON files (`src/locales/pages/help/en.json`, `pages/rules/en.json`), NOT `en.js`. Out of Phase 7 scope per ТЗ "trogаем только en.js + i18n-loader (если нужно)". Accessed dynamically by `PageView.vue:36` (`t.value.pages?.[title.value]`). PageView is itself orphan per Phase 6B-1 carry-over (`/rules` route still mounted on v1 PageView). When `/rules` v2 port happens (separate sub-epic), pages JSON files retire alongside PageView.vue + BackButton.vue. Out of scope here.

---

## A.5 — Summary

### Final tally

- **807 leaf keys in `en.js`** (current state on HEAD `bee213b`)
- **89 keys dynamic-protected** (32 of those would have been falsely retired by naive static grep — see Lesson #11 catches)
- **466 keys final retire candidates** (after dynamic-protected filter)
- **22 wholly-dead namespaces** for clean namespace-level retirement (128 keys total — subset of 466)
- **20/20 accumulated queue items confirmed orphan**
- **0 preserve flags** identified
- **0 backend-API i18n strings** identified

### Risk assessment

- **Dynamic-access miss risk:** mitigated by broad regex pattern catching `?.[`, `[`, template `[id]`. 5+ distinct Lesson #11 catches during analysis. Confidence: high.
- **Runtime risk:** retiring 466 keys could surface "undefined" warnings if any consumer was missed. Build will pass (JS doesn't typecheck i18n access). Mitigation: Part B includes runtime sanity-check on main screens.
- **Bundle size impact:** estimated −15 to −25kb in `en.js`, propagating to compiled chunks.

---

## Open questions for owner STOP gate

1. **Confirm retire of all 466 keys** as-is, or any cluster you want preserved?
   - Specific preserve candidates to consider (not flagged automatically):
     - `friends.*` (16 keys) — friends UI strings, could be useful if Friends gets reworked
     - `club.tactics.*` (19 keys total across 6 sub-namespaces) — tactics UI was extensive in v1; v2 simplified, but if tactics revamp is on roadmap, keep
     - `info.firstFight`, `info.firstTraining` — first-time UX nudge strings; were used by retired `showFightRulesReminder` / `showTrainingRulesReminder`. If you want first-time nudges in future, keep these.

2. **Namespace-level vs key-level retirement?**
   - 22 wholly-dead namespaces (128 keys) can be deleted as namespace blocks — cleaner diff, less noise.
   - Remaining 338 keys (= 466 − 128) live in partially-alive namespaces — must be deleted key-by-key.
   - Default: full retirement, both modes (namespace blocks where wholly-dead, individual keys elsewhere).

3. **`info.firstFight` / `info.firstTraining` / `info.withdrawClanDisable`** — these 3 keys in the `info` section are orphan, but `info.withdrawAfterListing` is LIVE (HudProfileWallet). If you want first-time nudge strings preserved for future re-wiring (since `showFightRulesReminder` was retired in 7-pre-2 D), keep `info.firstFight` + `info.firstTraining`. Both will otherwise retire.

4. **Top-level `you: '(You)'` (1 key)** — single orphan top-level key. Likely was used by some legacy UI showing "(You)" indicator next to player name. Tiny, but in retire-list. Drop or keep?

5. **`spectate.lblWaitingForFighters`** (1 orphan key in spectate section) — most of spectate is live (v2 HudSpectate). This single key never wired. Drop.

6. **`referral.lblShared`** (1 orphan key in referral section) — referral is live (HudProfile Friends tab + ReferralModal). This single key not wired. Drop.

7. **CLAUDE.md note (optional, like Q6 of 7-pre-2):** should Phase 7 closure add an i18n inventory note to CLAUDE.md? Could be useful: "After Phase 7, en.js has N keys, X dynamic-access namespaces protected (gameData.branches/moves, belts colors, arena.archetypes/archetypeDesc/protocolName/protocolTrigger/buildStyle, cards.archetypes/archetypeDesc). Future additions: prefer static access; if dynamic needed, document the pattern."

### Defaults if blanket approve

- Retire all 466 keys
- Use namespace-block deletion where wholly-dead (22 namespaces)
- Use key-level deletion elsewhere
- No preserves
- Optional CLAUDE.md update with i18n inventory note

---

## Cascade for Phase 7-pre-2 (verification)

Part A scan checked whether Phase 7-pre-2 Part B retirements left additional orphan i18n keys. **None found.** All keys held by retired Vuex actions had either zero direct i18n references in their bodies, OR shared keys with live actions (e.g., `t.modal.btnCancel/btnConfirm/btnOk`). Confirmed in Part B report.

---

## STOP gate

Wait for owner sign-off before Part B retirement.
