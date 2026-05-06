# Phase 0 Report — Sub-epic 7 — Visual polish + Auth/Wallet redesign — PART 2

**Continued from PART 1.** This part covers Q4-Q7.

---

## Q4 — ErrorMsg shape decision (carry-over #31)

### Q4.1 — Current state evidence

**Backend producers — INCONSISTENT shape (mixed nested vs flat):**

The `sendError()` helper at `backend/src/websocket/handler.js:482` uses **nested** shape:
```javascript
function sendError(ws, code, message) {
  sendMessage(ws, {
    type: 'ErrorMsg',
    errorDto: { code, message },
  });
}
```

But 5+ direct emissions bypass the helper и используют **flat** shape:

| Site | File:line | Code | Message |
|---|---|---|---|
| 1 | `backend/src/websocket/handler.js:628` | `NO_CAPTAIN_SET` | `'No Captain set. Create a fighter in Club Mode first.'` |
| 2 | `backend/src/websocket/handler.js:683` | `400` | `'INVALID_MATCH_ID'` |
| 3 | `backend/src/websocket/handler.js:689` | `404` | `'MATCH_NOT_FOUND'` |
| 4 | `backend/src/websocket/handler.js:695` | `403` | `'CANNOT_SPECTATE_OWN_MATCH'` |
| 5 | `backend/src/websocket/handler.js:715` | `403` | `'NOT_AUTHORIZED'` |

Example (line 628 NO_CAPTAIN_SET — flat):
```javascript
sendMessage(ws, { type: 'ErrorMsg', error: 'No Captain set...', code: 'NO_CAPTAIN_SET' });
```

Example (line 683 INVALID_MATCH_ID — flat, plus `JSON.stringify` direct):
```javascript
ws.send(JSON.stringify({ type: 'ErrorMsg', error: 'INVALID_MATCH_ID', code: 400 }));
```

**Note line 671 in-code comment** acknowledges shape divergence: *"ErrorMsg shape: BE flat {type, error, code} per Sub-epic 5 carry-over"*. Confirms divergence is known.

**Frontend consumer — expects nested shape:**

`src/core/state/modules/webSocketState.js:142-144`:
```javascript
case ErrorSocketResponse.TYPE_NAME:
    const errorSocketModel = ErrorSocketResponse.fromJSON(message.errorDto)
    await store.dispatch('webSocket/handleInternalError', errorSocketModel);
    break;
```

FE reads `message.errorDto` (nested) and parses through `ErrorSocketResponse.fromJSON()`. When BE sends flat `{ error, code }`, `message.errorDto` is `undefined` → `fromJSON(undefined)` → silent failure or model with empty fields (depends on `ErrorSocketResponse` defensive parsing — would need separate read of model file to confirm).

**Net effect:** Some BE error events are silently dropped on FE. NO_CAPTAIN_SET specifically was обходом захардкожена в Sub-epic 5 C4 captain pre-check (FE-side guard before sending MatchmakingStartMsg). Other 4 errors (INVALID_MATCH_ID/MATCH_NOT_FOUND/CANNOT_SPECTATE_OWN_MATCH/NOT_AUTHORIZED) pertain к spectate flow (Sub-epic 6) — also likely silently swallowed when triggered.

### Q4.2 — Bundle decision factors

**Option A — Bundle с Sub-epic 7 (correct BE shape, single source of truth):**

Pros:
- Single source of truth — `sendError()` helper used by ALL ErrorMsg producers
- 5 callsites → switch к `sendError(ws, code, message)` calls — ~10 lines BE diff
- FE expectations remain unchanged (no breaking change)
- Closes carry-over #31 cleanly

Cons:
- Lesson #33 6th application — backend touches require cherry-pick PR → main → Railway
- Sub-epic 7 closure shape becomes "code-complete + deferred-deploy" (mirror Sub-epic 6 PR #356 pattern) OR Standard linear с extra cherry-pick (mirror Sub-epic 4b PR #355 pattern)
- Adds methodology overhead (6th cherry-pick PR в Эпике 6) — minor risk на streak via PR #355-style mid-flow surprises
- Production fix without immediate v2 frontend benefit (unblocks frontend errors that aren't currently surfaced anywhere в v2 except potentially as console.warn)

**Option B — FE parser tolerance (handle both shapes):**

Pros:
- Pure FE change — no backend touches → no Lesson #33 application → no cherry-pick PR
- Sub-epic 7 closure shape stays Standard linear
- Backwards compatible — handles both old и new shapes simultaneously
- Single file edit — `src/core/state/modules/webSocketState.js:142-144`

Cons:
- Doesn't fix the BE inconsistency (both shapes still emitted)
- "Tolerant parser" pattern accumulates technical debt (always need to support both shapes)
- Backwards compat layer needed forever unless followed by BE fix (which becomes orphan task)

Implementation sketch:
```javascript
case ErrorSocketResponse.TYPE_NAME:
    const errorPayload = message.errorDto || { code: message.code, message: message.error };
    const errorSocketModel = ErrorSocketResponse.fromJSON(errorPayload);
    await store.dispatch('webSocket/handleInternalError', errorSocketModel);
    break;
```

**Option C — Defer Sub-epic 8 cutover hardening:**

Pros:
- Reduces Sub-epic 7 scope (no BE touches, no extra commit)
- Sub-epic 8 is cutover hardening sub-epic anyway — natural fit для bug-fix-cleanup
- Can be combined с другими error pathway fixes (carry-over #10 v2 cutover auth posture audit also Sub-epic 8 territory)

Cons:
- Still requires Lesson #33 application (whenever it surfaces)
- Sub-epic 8 already has large scope (full /v2 cutover sweep + visual-v2 → main merge); adding carry-over #31 risks expanding to L+ size
- Forgetting risk — if not formally tracked as Sub-epic 8 ТЗ requirement

### Q4.3 — Recommendation

**Recommendation: Option B (FE parser tolerance) bundled into B1b quick-wins commit.**

Reasoning:
1. **Minimum-risk path** — single-file edit, no BE touches, no Lesson #33 application, no cherry-pick PR
2. **Closes the user-visible symptom** — silently swallowed errors will surface in toast/log immediately upon parser fix
3. **Defers BE consolidation correctly** — BE inconsistency is debt, not bug; can be fixed во время larger BE refactor (Эпик 7+) without urgency
4. **Pattern parity с Sub-epic 4a precedent** — Sub-epic 4a Recovery #84 had similar "BE-FE shape mismatch" surface and chose tolerant parser path
5. **Preserves Sub-epic 7 scope discipline** — Path γ alternating pattern is already 14-19 commits; adding BE touch + cherry-pick PR pushes к 20+ which exceeds handoff estimate

Bundle suggestion: include в B1b atomic commit (either as 4th sub-item OR split as B1c separate commit if scope expands). Edit:
- `src/core/state/modules/webSocketState.js:142-144` — 3 lines tolerant parser
- Add code comment: `// Tolerant parser handles both nested {errorDto: {...}} and flat {error, code} BE shapes per carry-over #31. BE consolidation deferred к Эпик 7+.`

**Alternative if user prefers Option A (BE fix):** Bundle as separate cluster `B-BE-1` between AW2 and AW1 (mid-Sub-epic-7), creating cherry-pick PR `fix/errormsg-shape-consolidation` from main HEAD. Adds 1-2 commits (BE shape fix + FE optional cleanup) + 1 cherry-pick PR + Lesson #33 6th application. Sub-epic 7 closure shape becomes "code-complete + deferred-deploy" ИЛИ Standard linear с extra cherry-pick.

**Final decision required from design-Claude / user before Phase 1.**

---

## Q5 — Vuetify→v2 port (carry-overs #14-#15)

### Q5.1 — Component inventory (refines Q2.1)

**Vuetify-rendering components mounted в /v2 routes (per Sub-epic 3 AS-IS preservation):**

| Component | File path | Lines | Vuetify primitives | Mounted in v2 via |
|---|---|---|---|---|
| ConfirmEmail | `src/components/fragments/profile/account/ConfirmEmail.vue` | 120 | `InputField` (line 4) + `VBtnDark` (line 20) | HudProfileAccount.vue (Sub-epic 3) |
| ChangeLogin | `src/components/fragments/profile/account/ChangeLogin.vue` | 200 | `InputField` (4) + `VModal` (35, max-width=500) + `VCard` + `v-progress-circular` (23) | HudProfileAccount.vue |
| ChangePassword | `src/components/fragments/profile/account/ChangePassword.vue` | 161 | 3× `InputField` (18, 29, 40) + `VBtnDark` (3, 64) + `VModal` (13) + `VCard` (14) + `v-progress-circular` (54) + `VBtn` (65, `.confirm-btn`) | HudProfileAccount.vue |
| DeleteAccount | `src/components/fragments/profile/account/DeleteAccount.vue` | 79 | `VBtnDark` (3) + `VModal` (12) + `VCard` (13) + `VBtn` (19, `.confirm-delete-btn`, `--hex-danger`) | HudProfileAccount.vue |
| GameBalanceCard | `src/components/fragments/profile/wallet/GameBalanceCard.vue` | 57 | `<VCard>` wrapper (line 2) | HudProfileWallet.vue (Sub-epic 3) |
| Switcher3DPunch | `src/components/fragments/profile/account/Switcher3DPunch.vue` | 87 | `VBtnDark` (3) + `v-switch` (9) | **NOT mounted в v2** (Sub-epic 3 Q-tactical-1 SKIP per carry-over #14) |

**Total Vuetify primitives count в Sub-epic 7 port scope:**
- `VModal` × 3 (ChangeLogin, ChangePassword, DeleteAccount)
- `VCard` × 4 (3 in modals + 1 GameBalanceCard)
- `VBtnDark` × 4+ (ConfirmEmail, ChangePassword × 2, DeleteAccount, Switcher3DPunch)
- `VBtn` × 2 (ChangePassword confirm, DeleteAccount confirm)
- `v-progress-circular` × 2 (ChangeLogin, ChangePassword)
- `v-switch` × 1 (Switcher3DPunch — out-of-scope per #14 SKIP decision)
- `InputField` × 5 (already v2-native, NO migration needed — это **custom UI primitive в `src/components/ui/`** despite being used by all auth + account forms)

**InputField clarification:** Despite the Vuetify-looking name, `src/components/ui/InputField.vue` (174 lines) is **v2-native custom component** using `--hex-*` tokens throughout. NOT a Vuetify wrapper. Already aligned с v2 design system. No port needed.

### Q5.2 — v2 design system primitives readiness — KEY FINDING

**CRITICAL UPDATE — `.hex-modal` CSS classes ALREADY EXIST в `hexlash-ui.css` (lines 440-478):**

```css
/* Lines 440-452 */
.hex-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: var(--hex-blur-sm);
  z-index: 1000;
  /* + flex-center, padding, etc */
}

/* Lines 455-466 */
.hex-modal {
  background: var(--hex-bg-medium);
  border: var(--hex-border-width) solid var(--hex-primary);
  border-radius: var(--hex-radius-xl);
  padding: var(--hex-spacing-xl);
  min-width: min(320px, 90vw);
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: var(--hex-shadow-modal);
}

/* Lines 469-478 */
.hex-modal-title {
  font-family: var(--hex-font-display);
  font-size: 24px;
  color: var(--hex-primary);
  text-transform: uppercase;
  text-shadow: 0 0 12px var(--hex-primary-glow);
}
```

**Implication:** Modal **CSS layer is ready** — no need to define new modal styles. The gap is **dedicated `Modal.vue` SFC primitive в `src/components/ui/`** that wraps these classes + provides Teleport-to-body + `defineExpose({ openModal, closeModal })` API.

**Two implementation options для VModal swap:**

**Option a — Inline modal с existing classes (no new primitive):**
- Each component (ChangeLogin/ChangePassword/DeleteAccount) gets own `<Teleport to="body">` block
- Uses `.hex-modal-overlay` + `.hex-modal` + `.hex-modal-title` classes verbatim
- Manual show/hide ref + Esc handler в каждом компоненте
- ~30 lines boilerplate per component (3× = ~90 lines total)
- **Pro:** No new abstraction — direct port mirroring ConnectWallet.vue (which uses Teleport without `Modal.vue` primitive)
- **Con:** Repetitive scaffolding; harder to maintain consistency if modal patterns drift

**Option b — Create `src/components/ui/Modal.vue` primitive:**
- New SFC ~80-100 lines exposing slots (header, body, footer) + `openModal()`/`closeModal()` + Esc handling + Teleport
- Each consumer = `<Modal ref="myModal">` + slot content
- ~10 lines per consumer (3× = ~30 lines integration)
- **Pro:** DRY abstraction, consistent behavior, easy future-proofing (e.g., add focus-trap, animation polish)
- **Con:** Adds 1 new file + abstraction overhead; need to design slot API thoughtfully

**Other v2 primitives — readiness audit:**

| v2 primitive | Status | File | Notes |
|---|---|---|---|
| Modal SFC | ❌ Missing | (would be `src/components/ui/Modal.vue`) | CSS ready, SFC not yet abstracted. **Negative-space finding.** PhModal.vue exists в `src/components/hud/common/` but uses `.v2-ph-*` namespace (per Epic 2 hub PhModal coming-soon scaffold) — NOT generic enough |
| Card SFC | ✅ Ready | `src/components/ui/HexCard.vue` (3727 bytes) | 5 variants: default/elevated/archetype/active/result; padding none/sm/md/lg |
| Card SFC (legacy) | ✅ Ready | `src/components/ui/Card.vue` (3339 bytes) | Smaller card primitive — verify if legacy or actively used |
| Button SFC | ✅ Ready | `src/components/ui/HexButton.vue` (4813 bytes) | 5 variants: primary/secondary/ghost/danger/archetype; 3 sizes sm/md/lg; loading + block + archetypeColor props |
| Input SFC | ✅ Ready | `src/components/ui/InputField.vue` (3694 bytes, 174 lines) | Already v2-native, used in auth/account forms |
| Progress | ✅ Ready | `src/components/ui/HexProgress.vue` (3451 bytes) | hp/branch/generic variants |
| Badge | ✅ Ready | `src/components/ui/HexBadge.vue` (5674 bytes) | archetype/branch/status/counter/custom variants |
| Belt Badge | ✅ Ready | `src/components/ui/BeltBadge.vue` (4148 bytes) | 33 grades + Hexmaster |
| User+Captain Badge | ✅ Ready | `src/components/ui/UserCaptainBadge.vue` (1213 bytes) | Composite |
| Pixel Icon | ✅ Ready (unused) | `src/components/ui/PixelIcon.vue` (2571 bytes) | 45 icons; preserved but no app file imports it currently |
| Back Button | ✅ Ready | `src/components/ui/BackButton.vue` (1102 bytes) | Generic back button |
| Button Text | ✅ Ready | `src/components/ui/ButtonText.vue` (682 bytes) | Text-link button primitive |
| **NoConnection** | ✅ Ready (минор Vuetify dep) | `src/components/ui/NoConnection.vue` (1995 bytes, 80 lines) | Already в `src/components/ui/`, uses `--hex-*` tokens, ONLY Vuetify dep is `<v-progress-circular>` for loader spinner. See Q7. |

**Vocabulary mapping (Q5 main reference):**

| Vuetify | v2 token / primitive | Status | Migration path |
|---|---|---|---|
| `<VModal v-model="open" max-width="500">` | `<Modal ref="modal">` (Option b) OR inline `.hex-modal-overlay` + `.hex-modal` + Teleport (Option a) | Mixed | Decide a vs b in Phase 1 |
| `<VCard>` | `<HexCard variant="default" padding="md">` | ✅ Ready | 1:1 swap |
| `<VBtnDark>` | `<HexButton variant="secondary">` (or `ghost` depending on visual) | ✅ Ready | Verify visual match (VBtnDark = dark fill; HexButton secondary = outline) — may need new `dark` variant if exact match required |
| `<VBtn>` | `<HexButton variant="primary">` (default action) or `variant="danger"` (destructive) | ✅ Ready | 1:1 swap; check existing classes (`.confirm-btn`, `.confirm-delete-btn`) for tone match |
| `<v-progress-circular size="20" indeterminate>` | Custom CSS spinner (mirror `.tsp-spinner` pattern from training.css OR `.mm-spinner` matchmaking.css) | ✅ Ready (CSS pattern) | New scoped CSS rule per consumer (3× spinner sites) — minimal duplication acceptable |
| `<v-switch>` | (Out of scope — Switcher3DPunch SKIP per #14) | N/A | Decide #14 drop OR port в Q5.3 |
| `<v-text-field>` | `<InputField>` | ✅ Already в use | All forms already use InputField |

### Q5.3 — Switcher3DPunch decision (carry-over #14)

**Current state:**
- File: `src/components/fragments/profile/account/Switcher3DPunch.vue` (87 lines)
- Renders: VBtnDark wrapper + v-switch toggle for "is3DPunch" vs 2D punch view
- State: `is3DPunch` inverts `punch/is2DPunchEnabled` getter; toggle commits `punch/set2DPunch` mutation
- v1 mount: legacy ProfileAccount.vue (legacy v1 profile route)
- v2 mount: **NOT mounted** in HudProfileAccount.vue (Sub-epic 3 Q-tactical-1 explicit SKIP, comment confirms "carry-over #14 polish")

**3 options:**

**Option DROP — drop entirely:**
- Delete `Switcher3DPunch.vue` file + remove `punch/set2DPunch` mutation + `punch/is2DPunchEnabled` getter from `punchState.js` (verify no other consumers)
- Remove "is3dPunch" i18n key from 11 locale files
- Cleanup: ~150 lines deleted across 13 files
- Rationale: 3D vs 2D punch toggle is decoration; default 3D is fine; removes Vuetify v-switch dep

**Option PORT — port to v2 (mount in HudProfileAccount):**
- Replace VBtnDark + v-switch с custom v2 toggle (mirror SoundToggle.vue pattern — green success on-state, no pink)
- Mount в HudProfileAccount.vue (5th account section)
- Effort: ~30 lines of v2 toggle scaffold + 1-line mount
- Risk: Adds 5th item to Account section — may affect HudProfile card-creep monitor IF account becomes a HudProfile card (currently it's standalone HudProfileAccount.vue в /v2/account route, NOT HudProfile card)

**Option PRESERVE — leave Vuetify-style for now:**
- Add to HudProfileAccount.vue mount AS-IS (matches Sub-epic 3 AS-IS preservation pattern)
- Defer Vuetify→v2 swap к later (Эпик 7+)
- 1-line addition to HudProfileAccount.vue
- Risk: Inconsistent с Sub-epic 7 stated Vuetify→v2 port goal

**Recommendation: Option DROP.**

Reasoning:
1. **Aligns с Sub-epic 3 Q-tactical-1 explicit SKIP decision** — that decision noted "niche feature, not migrated к v2"
2. **Closes carry-over #14 cleanly** — DROP is the closure path; PORT/PRESERVE both leave debt
3. **3D punch is default + working** — removing toggle has zero negative gameplay impact; user gets 3D punch by default
4. **Reduces VModal/VBtnDark surface area по carry-over #15** — 1 less Vuetify component to migrate
5. **CLAUDE.md cleanup** — removes legacy `punch/set2DPunch` mutation + `is2DPunchEnabled` getter (verify zero other consumers via grep before delete)

**Pre-edit verification needed before drop:** grep `is2DPunchEnabled\|set2DPunch\|Switcher3DPunch\|is3dPunch` across `src/` to confirm zero other consumers. If consumers exist (e.g., Punch3D.vue conditional rendering), Option DROP escalates к structural concern (Lesson #18 STOP) и нужно reconsider Option PRESERVE.

### Q5 — Bundle decision

**Recommendation: AW3 cluster bundles all Vuetify→v2 port work (3 commits).**

Sequencing within AW3:
1. **AW3-Commit1** — Decide modal strategy + close #14 (drop Switcher3DPunch)
   - If Option a (inline) — proceed direct к AW3-Commit2
   - If Option b (Modal.vue primitive) — create primitive, then proceed
   - Drop Switcher3DPunch.vue + cleanup punchState references
2. **AW3-Commit2** — Port ChangeLogin + ConfirmEmail (smaller surface, ChangeLogin has VModal so test modal pattern early)
3. **AW3-Commit3** — Port ChangePassword + DeleteAccount (modal-heavy, destructive — most risk)

**Phase 1 decision needed: Option a (inline modal) vs Option b (Modal.vue primitive).**

Recommendation: **Option a (inline)** for Sub-epic 7 — matches ConnectWallet.vue precedent (Teleport inline без primitive), preserves Mode A small commit discipline, defers Modal.vue primitive abstraction к Эпик 7+ if pattern proves valuable across more consumers. Adds ~90 lines boilerplate (acceptable trade-off for no new abstraction overhead).

---

## Q6 — Friends entry point closure (carry-over from 6B-3b)

### Current state evidence

**Frontend — Watch Live button already implemented:**

`src/components/hud/HudProfile.vue:150-155`:
```vue
<button
  v-if="f.status === 'in_fight'"
  class="fc-action-btn watch"
  :aria-label="t.spectate.watchLive"
  @click.stop="onWatch(f)"
>{{ t.spectate.watch }}</button>
```

`src/components/hud/HudProfile.vue:591-593`:
```javascript
function onWatch(f) {
  const fightId = f.currentFight?.id || f.id;
  router.push(`/v2/spectate/${fightId}`);
}
```

`f.status === 'in_fight'` triggers Watch button render. Click → `/v2/spectate/${fightId}` navigation (Sub-epic 6 SpectateView).

**Backend — friends list endpoint shape:**

`backend/src/routes/friends.js:225-239`:
```javascript
const friends = friendships.map(f => {
  const friend = f.user1Id === userId ? f.user2 : f.user1;
  const isOnline = clients.has(friend.id);
  return {
    id: friend.id,
    username: friend.name || friend.login,
    login: friend.login,
    rating: friend.rating,
    avatarUrl: friend.avatarUrl,
    skin: friend.skin,
    status: isOnline ? 'online' : 'offline',
    addedAt: f.createdAt.getTime(),
    captain: captainMap.get(friend.id) || null,
  };
});
```

**9 fields returned:** id / username / login / rating / avatarUrl / skin / status / addedAt / captain. **No `currentFight` field populated.** No `in_fight` status (только `'online' | 'offline'`).

**Friends service:** `src/core/services/friendsService.js` — wraps `apiClient.get('/v1/friends')` + `apiClient.post('/v1/friends/...')` for add/remove/respond. No `currentFight` derivation logic.

### Functional gap

Watch Live button **never renders** because `f.status` only takes values `'online'` | `'offline'` (per backend response). `'in_fight'` status is not currently populated by backend. The `f.currentFight?.id || f.id` fallback at line 591-593 is a forward-compat guard that protects future wiring; today's behavior is "Watch button never shown".

User cannot navigate to `/v2/spectate/<fightId>` from Friends list at present. Workaround: direct URL paste OR navigation through... nothing else (no other entry point).

### Bundle decision factors

**Option BUNDLE — Sub-epic 7 closure (BE + FE coordinated):**

To make Watch Live button functional, BE must populate:
1. `friend.status === 'in_fight'` when friend is currently in active PvP match
2. `friend.currentFight = { id: matchId }` for navigation

Required BE work:
- Cross-reference `friend.id` против `pvpCombatEngine.activeMatches` Map (per Sub-epic 4a-4b state)
- Determine if friend is player1 OR player2 in any active match
- Add `currentFight` field to mapped friend object при derivation (lines 225-239)

Required BE testing:
- Verify match-end clears `currentFight` (друг exits "in_fight" status when fight finishes)
- Verify reconnect doesn't double-count (per Sub-epic 4b reconnect handling)
- Verify multi-tab same user не сломает status

Effort: ~1 BE commit (~20 lines) + cherry-pick PR → main → Railway (Lesson #33 6th application).
Sub-epic 7 closure shape becomes "code-complete + deferred-deploy" если bundled.

**Option DEFER — Sub-epic 8 cutover gate:**

Sub-epic 8 acceptance gate включает comprehensive /v2 sweep — Watch Live functional verify naturally fits there. Carry-over passed forward без ТЗ overhead Sub-epic 7.

Pros:
- No BE touches в Sub-epic 7 (no Lesson #33 application risk)
- Sub-epic 8 already needs comprehensive sweep — Watch Live verify becomes part of standard checklist
- Wiring может integrate с PvP-integration sub-epic candidate (carry-over #29 + #33) — natural pairing с broader BE friends/PvP coordination work

Cons:
- Watch Live remains non-functional until Sub-epic 8 closure
- User-visible "broken" feature (button never appears, but conceptually wired)
- Sub-epic 8 scope expands

### Recommendation

**Recommendation: DEFER к Sub-epic 8.**

Reasoning:
1. **Sub-epic 7 scope discipline** — BE touches add Lesson #33 6th application risk; current 14-19 commit estimate already at upper handoff range
2. **Watch Live silent gap** — button doesn't render currently; user doesn't see "broken UI", just "feature unavailable"
3. **Sub-epic 8 comprehensive sweep is natural fit** — pre-cutover gate per CLAUDE.md "Pre-cutover acceptance gate" forward note. Watch Live functional check becomes one item in checklist
4. **Pairing с broader BE work** — `currentFight` field может pair с future `friend_status` WS push improvements (carry-over for PvP-integration sub-epic), avoiding piecemeal BE touches
5. **Lesson #44 re-anchor** — Sub-epic 7 main scope is Auth+Wallet redesign + polish bundle (per handoff Path γ); Watch Live wiring is orthogonal к main scope

**Decision documented в Sub-epic 8 forward checklist (per Phase 1 / closure handoff for Sub-epic 8).**

---

## Q7 — NoConnection v2 restyle (carry-over from 4b)

### Current state evidence

**File location — already migrated к v2:**

`src/components/ui/NoConnection.vue` (80 lines, 1995 bytes). NOT в legacy `src/components/` flat — already in v2 ui directory.

**Template (lines 1-12):**
```vue
<template>
  <transition name="fade">
    <div v-if="showNoConnection" class="no-connection">
      {{ t.connection }}
      <v-progress-circular
          class="loader color-pink"
          size="20"
          indeterminate
      />
    </div>
  </transition>
</template>
```

**Scoped style (lines 49-80) — already uses `--hex-*` tokens:**
```css
.no-connection {
  position: fixed;
  bottom: 12vh;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  background-color: color-mix(in srgb, var(--hex-danger) 62%, transparent);
  color: var(--hex-text-primary);
  padding: 10px 20px;
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 0.7rem;
  max-width: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
```

Uses `var(--hex-danger)` для background tint, `var(--hex-text-primary)` для text. Vue `<transition>` for fade in/out. `position: fixed; bottom: 12vh` puts banner above BottomMenu (legacy) or HUD bottom (v2).

**AppV2 mount:**

`src/AppV2.vue:8, 17`:
```vue
<NoConnection />
```
```javascript
import NoConnection from '@/components/ui/NoConnection.vue';
```

Mounted at top level в AppV2 layout — visible on все /v2/* routes when WS disconnected > 5s.

### Functional analysis

NoConnection component **already substantially v2-aligned:**
- Located в `src/components/ui/`
- Uses `--hex-*` design tokens
- AppV2 mounted (Sub-epic 4b)
- Vue `<transition>` for animation
- Reactive show timer (5s threshold per line 28)

**Single Vuetify dependency:** `<v-progress-circular size="20" indeterminate>` for loader spinner (line 5-9).

Visual issues (subjective polish gaps):
1. `font-family: Arial, sans-serif` — should use v2 mono font token (`var(--font-mono)` or similar)
2. `bottom: 12vh` — magic value; v2 has `--hex-spacing-*` tokens that could replace
3. `font-size: 0.7rem` — magic; should use `--hex-font-size-xs` or similar
4. `padding: 10px 20px` — magic values; should use `--hex-spacing-sm` / `--hex-spacing-md`
5. `border-radius` missing — feels unfinished compared с other v2 banners
6. Banner position `bottom: 12vh` may overlap с BottomMenu legacy view OR v2 HUD bottom-fixed elements (verify scenarios)

### Recommendation

**Recommendation: BUNDLE с B5 Spectate polish (or new B7 standalone) — small CSS-only restyle.**

**Effort:** ~15 lines CSS edit, 1 file (NoConnection.vue scoped style block).

**Changes proposed:**
1. Replace Vuetify `<v-progress-circular>` с CSS spinner (mirror `.tsp-spinner` pattern from training.css OR `.mm-spinner` from matchmaking.css). Removes last Vuetify dep.
2. Replace magic values с design tokens:
   - `font-family: Arial, sans-serif` → `var(--font-mono)` or `var(--hex-font-body)`
   - `font-size: 0.7rem` → `var(--hex-font-size-xs)` (10px) or similar
   - `padding: 10px 20px` → `var(--hex-spacing-sm) var(--hex-spacing-md)`
   - `bottom: 12vh` → Decide: `bottom: var(--hex-spacing-xl)` (32px from edge) OR keep vh-relative для responsive
3. Add subtle improvements:
   - `border-radius: var(--hex-radius-md)` for v2 aesthetic
   - `border: 1px solid var(--hex-danger)` or similar для visual definition
   - `box-shadow: var(--hex-shadow-card)` за visual depth
4. Optional: Update transition `name="fade"` к `name="hex-fade"` if v2 transition class exists (verify hexlash-ui.css — animation utilities section should have hex-fade per CLAUDE.md "Phase 5.2 Animation utilities")

**Bundle decision:**
- **B5 Spectate polish bundle** — natural fit (HUD overlay polish category), single commit для consistency
- **B7 standalone** — если scope expands (e.g., decide also restyle `<v-progress-circular>` к global CSS spinner pattern reusable elsewhere)
- **AW1 Auth header** — handoff suggested "bundle с Auth+Wallet (header/banner styling consistent)", but AW1 is Auth flow (forms+RainView), NOT specifically banner/header styling — couples awkwardly

**Recommended sequencing:** Add к B5 (HudSpectate polish) as 3rd sub-item:
- B5 commit: "feat(polish): close HudSpectate UX + NoConnection token alignment (#34, #35, NoConnection restyle)"
- ~3 file edits, 1 atomic commit

**Pre-edit verification:** grep `bottom: 12vh\|.no-connection\|NoConnection` to confirm only 1 producer + 1 consumer. Verify no v2 routes have BottomMenu collision (BottomMenu hidden on PvP screens per CLAUDE.md, but verify в matchmaking/spectate/fight contexts).

---

**END OF PART 2.**

Continued in PART 3 — 6 mandatory enhancement subsections + Lesson #36 status + Recoveries log + Phase 0 catches + Final summary.
