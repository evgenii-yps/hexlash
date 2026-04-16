# Visual Audit — April 2026

**Date:** 2026-04-11
**Branch:** `claude/visual-audit` (from `main`)
**Type:** Read-only analysis. No code changes.
**Skills used:** hexlash-dev, hexlash-design, hexlash-vue (all read in full before audit)
**AP source:** hexlash-design/SKILL.md (PDF not available — see section 2)

---

## 1. Summary

The Hexlash frontend has **partial** design system adoption. The Neon Discipline migration (Road 1) successfully replaced legacy CSS variables in style sections, but **component-level adoption is low** — only 7 of 20 views import any Hex UI components. Most views still use custom `<button>`, `<div class="card">` patterns instead of HexButton/HexCard.

**Top 3 problems:**
1. **Pixel-font overuse (AP-2)** — 50+ `Anonymous`/`AnonymousBalance` blocks across views. SKILL.md says "one impact block per screen." AgentDetailView alone has 17.
2. **Low Hex component adoption** — 11/20 views score 1/5 (zero Hex imports). The design system components exist but aren't used.
3. **Hardcoded colors outside system (AP-8)** — League/rank colors (#FFD700, #CD7F32, #C0C0C0), gradient endpoints (#33CC77, #FF3399) bypass `--hex-*` tokens.

---

## 2. Documentation Hygiene

### CLAUDE.md status
- **One file**, `/CLAUDE.md`. No duplicates.
- **Internal contradiction found:** Line 11 Tech Stack lists `Vue-i18n 11` — **WRONG**. Line 541 correctly states "Custom reactive i18n (not vue-i18n)". Code confirms: zero vue-i18n imports in `src/`, no vue-i18n in package.json.
- **Web3 inconsistency:** Tech Stack (line 11) lists `Ethers.js 6` — **correct per code** (used in contractService.js, nftMintService.js). User instructions say "NOT ethers on frontend" but code currently uses it. contractState.js has `// TODO: Phase 2 — migrate to wagmi composables`. This is a documented migration in progress, not an error.

### i18n — verified
- **Custom reactive i18n** (locales/index.js). NOT vue-i18n.
- Zero `vue-i18n`, `createI18n`, `useI18n` imports anywhere in `src/`.
- Not in package.json.

### Web3 stack — verified
- **package.json:** `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `@wagmi/core`, `@wagmi/vue`, `ethers`
- **Active in code:** `@wagmi/vue` (main.js, wagmiConfig.js, ProfileWallet.vue, ConnectWallet.vue), `ethers` (contractService.js, nftMintService.js)
- **@reown/appkit:** in package.json but not directly imported in any .vue/.js source file (likely used by wagmi adapter internally)

### Handoff vs reality discrepancies
| Item | Expected | Reality |
|------|----------|---------|
| `Hexlash_Visual_System.pdf` | Referenced in SKILL.md, CLAUDE.md, hexlash-dev | **Not in repo.** Only `Hexlash_Combat_System_Documentation.pdf` exists |
| Branch `claude/sync-api-skill` | Referenced in prior handoff | **Does not exist** — not locally, not in remote |
| CLAUDE.md Tech Stack: `Vue-i18n 11` | Should say "Custom i18n" | **Wrong in CLAUDE.md**, correct in i18n System section |
| SKILL.md references to PDF | `hexlash-design` line 270: "/Hexlash_Visual_System.pdf v1.1" | **Dangling reference** — file doesn't exist |

---

## 3. Problem Map by Category

### A. Legacy CSS tokens (AP-10)

| Scope | Files | Violations |
|-------|-------|------------|
| PrivacyView.vue | 1 | 184 (38 `--primary-color` + 146 rgb() hardcodes) |
| Rest of codebase | 0 | 0 legacy vars |

**Verdict:** PrivacyView is the documented exception (auto-generated legal HTML). **No legacy `--pink`/`--dark`/`--gray` vars found outside PrivacyView.** Road 1 migration successful for legacy vars.

### B. Hardcoded colors outside system (AP-8)

| File | Count | Colors | Context |
|------|-------|--------|---------|
| PvPStatsCard.vue | 6 | #CD7F32, #C0C0C0, #FFD700, #00CED1, #00BFFF | League rank colors in JS data |
| AgentLeaderboard.vue | 3 | #FFD700, #C0C0C0, #CD7F32 | Rank 1/2/3 gold/silver/bronze |
| HexCard.vue | 3 | #00FF88, #FF4444, #FFB800 | RESULT_COLORS in JS (should use --hex-victory/defeat/draw) |
| HexButton.vue | 3 | #FFFFFF (×3) | White text in button variants |
| ReferralModal.vue | 2 | #FFFFFF, #00000000 | QR code colors |
| PixelIcon.vue | 2 | #FFFFFF (×2) | Default pixel color |
| RetirementPanel.vue | 1 | #FF3399 | Gradient endpoint (should be --hex-primary-light) |
| ClanPageContent.vue | 1 | #33CC77 | Gradient endpoint (not in system) |
| ClanActivityFeed.vue | 1 | #FF9800 | Event dot color |
| ClanView.vue | 1 | #33CC77 | Level progress gradient |
| HexBadge.vue | 1 | #FFFFFF | White text |
| PageView.vue | 1 | #bac | Inline style from i18n HTML |

**Total outside PrivacyView:** 25 hardcoded color instances across 12 files.

### C. Antipattern violations

| AP | Name | Severity | Status |
|----|------|----------|--------|
| AP-1 | Multiple pink accents | HIGH | CardFightView (3 pink buttons), AgentDetailView (6 pink elements), CreateAgentView (3 pink elements) |
| AP-2 | Pixel-font everywhere | CRITICAL | 50+ blocks. AgentDetailView (17), CardFightView (8), MatchmakingView (5), SpectateView (5) |
| AP-3 | Competing backgrounds | LOW | Clean. All backgrounds properly overlaid. |
| AP-4 | Semi-transparent cards | MEDIUM | 5 files use opacity 0.3-0.4 for disabled/locked states (should use muted colors instead) |
| AP-5 | Gray dashed placeholders | MEDIUM | 3 files: CreateAgentView:230, AgentRoster:97, ModuleBuilder:234 |
| AP-6 | Inconsistent terminology | LOW | Club/Clan split is architectural (FightClub vs social Clan). No single-view mixing. |
| AP-7 | Mix outlined/filled icons | LOW | Clean. Consistent icon style. |
| AP-8 | Second palette | MEDIUM | 25 hardcoded colors across 12 files (see section B above) |
| AP-9 | Bright photo background | LOW | Clean. All backgrounds properly darkened. |
| AP-10 | Legacy vars | LOW | Only PrivacyView (documented exception) |

### D. Hex component adoption gap

Only **7 of 20 views** import any Hex UI components. 13 views use zero.

Views with Hex components: AgentDetailView, CardFightView, ClanView, CreateAgentView, MatchmakingView, PreparationView, RatingsView, ProfileView.

Views with zero Hex components: ArenaHubView, DeckBuilderView, FightClubView, FriendsView, MoveTreeView, NotFoundView, PageView, PrivacyView, RainView, SpectateView, TrainingView, VerifyEmailView.

---

## 4. Per-View Assessment

| View | Lines | Hex Components | Custom Btns | Pixel-font blocks | Score (1-5) | Comment |
|------|-------|---------------|-------------|-------------------|-------------|---------|
| AgentDetailView | 619 | HexButton, HexBadge, HexProgress, BeltBadge | 15 | 17 | 2 | Imports Hex but heavily mixes custom. Worst pixel-font offender. |
| ArenaHubView | 222 | none | 0 | 2 | 2 | Custom hub-card divs instead of HexCard |
| CardFightView | 2173 | HexButton | 8 | 8 | 3 | Largest view. Multiple pink accents (AP-1). |
| ClanView | 489 | HexButton | 1 | 4 | 4 | Good adoption. Minor hardcoded gradient color. |
| CreateAgentView | 329 | HexButton | 1 | 7 | 3 | Dashed placeholder (AP-5). Multiple pixel-font blocks. |
| DeckBuilderView | 395 | none | 3 | 0 | 1 | Zero Hex. All custom buttons. |
| FightClubView | 106 | none | 1 | 2 | 1 | Thin wrapper. Uses ClubLevelBar but no Hex UI. |
| FriendsView | 356 | none | 1 | 0 | 1 | Zero Hex. Custom cards. |
| MatchmakingView | 645 | — | 3 | 5 | 2 | Some Hex but heavy custom + pixel-font. |
| MoveTreeView | 403 | none | 3 | 2 | 1 | Zero Hex. Custom sidebar buttons. |
| NotFoundView | 36 | none | 0 | 2 | 1 | Tiny. Pixel-font for 404 title — acceptable for impact. |
| PageView | 107 | none | 0 | 0 | 1 | Static HTML from i18n. No interactive elements. |
| PreparationView | 270 | HexButton | 1 | 0 | 4 | Good: all buttons Hex, no pixel-font abuse. |
| PrivacyView | 2648 | none | 0 | 0 | 1 | Auto-generated legal. Documented exception. |
| ProfileView | 314 | BeltBadge | 0 | 3 | 2 | BeltBadge only. Custom tab/card patterns. |
| RainView | 1212 | none | 0 | 1 | 1 | Auth forms. No scoped style. 3D scene. |
| RatingsView | 687 | HexButton | 0 | 0 | 4 | Good adoption. Clean from Hex perspective. |
| SpectateView | 566 | none | 1 | 5 | 1 | Zero Hex. Heavy pixel-font. |
| TrainingView | 622 | none | 2 | 1 | 1 | Zero Hex. 3D scene + custom UI. |
| VerifyEmailView | 98 | none | 0 | 1 | 1 | Small utility page. |

**Average score: 1.85 / 5**

---

## 5. Top 10 Most Problematic Files

Priority = (severity of violations) × (user visibility).

| # | File | Issues | Priority |
|---|------|--------|----------|
| 1 | **AgentDetailView.vue** | 17 pixel-font blocks (AP-2), 15 custom buttons, 7 custom cards, 6 pink elements (AP-1), opacity 0.4 on locked (AP-4) | CRITICAL — high-traffic view, worst AP-2 offender |
| 2 | **CardFightView.vue** | 8 custom buttons, 8 pixel-font blocks (AP-2), 3 pink accents (AP-1). 2173 lines — largest view | HIGH — core gameplay, most visible |
| 3 | **SpectateView.vue** | Zero Hex components, 5 pixel-font blocks, custom button. Score 1/5 | HIGH — live PvP feature |
| 4 | **CreateAgentView.vue** | 7 pixel-font blocks, dashed placeholder (AP-5), 3 pink accents (AP-1) | HIGH — onboarding flow |
| 5 | **MatchmakingView.vue** | 3 custom buttons, 5 pixel-font blocks, partial Hex adoption | MEDIUM — PvP entry point |
| 6 | **DeckBuilderView.vue** | Zero Hex, 3 custom buttons. Score 1/5 | MEDIUM — core gameplay |
| 7 | **PvPStatsCard.vue** | 6 hardcoded league colors outside system (AP-8) | MEDIUM — visible in ratings |
| 8 | **MoveTreeView.vue** | Zero Hex, 3 custom buttons, 2 pixel-font blocks | MEDIUM — core gameplay |
| 9 | **TrainingView.vue** | Zero Hex, 2 custom buttons. Score 1/5 | MEDIUM — main landing screen |
| 10 | **FriendsView.vue** | Zero Hex, custom cards. Score 1/5 | LOW — social feature |

---

## 6. Code vs Docs Discrepancies

| # | Location | CLAUDE.md / SKILL.md says | Code reality |
|---|----------|--------------------------|--------------|
| 1 | CLAUDE.md line 11 | Tech Stack: `Vue-i18n 11` | Custom i18n (locales/index.js). No vue-i18n anywhere. |
| 2 | CLAUDE.md line 11 | Tech Stack: `Ethers.js 6` | Present and used in contractService.js, nftMintService.js. contractState.js has TODO to migrate to wagmi. Docs are accurate but conflict with stated policy "NOT ethers on frontend." |
| 3 | hexlash-design/SKILL.md line 270 | References `/Hexlash_Visual_System.pdf v1.1` | File does not exist in repo. |
| 4 | hexlash-dev/SKILL.md line 120 | References `/Hexlash_Visual_System.pdf` | File does not exist in repo. |
| 5 | CLAUDE.md "Design System" section | `PixelIcon` — "Currently unused — preserved" | Confirmed: PixelIcon.vue exists but is not imported by any app file. |
| 6 | hexlash-design/SKILL.md line 81 | Font aliases: `--hex-font-display` (Impact), `--hex-font-body` (Inter) | Components use `Anonymous`, `AnonymousBalance`, system-sans directly. Two parallel font systems. SKILL.md documents this correctly as a known state. |
| 7 | CLAUDE.md line 11 | Tech Stack: `@tanstack/vue-query` | Present in package.json and main.js (VueQueryPlugin). Correct. |
| 8 | CLAUDE.md line 11 | Tech Stack: `Amplitude` | Not verified — outside scope of visual audit. |
| 9 | hexlash-design/SKILL.md | AP-4 rule: "not opacity — disabled variant" | HexButton.vue:190 uses `opacity: 0.35` for disabled state. **Design system component itself violates AP-4.** |

**Total discrepancies found: 9**

---

## 7. Recommended Work Order

Sorted by pain/effort ratio (highest value first):

| # | Micro-TЗ | Rationale |
|---|----------|-----------|
| 1 | **Fix hardcoded colors in Hex UI components** (HexCard RESULT_COLORS, HexButton #FFFFFF) | Design system components should be clean first. 6 fixes in 2 files. Low effort, high symbolic value. |
| 2 | **Fix HexButton disabled opacity → muted colors** | AP-4 violation in the design system itself. One component, one fix. Cascades to all consumers. |
| 3 | **Add --hex-rank-gold/silver/bronze tokens + migrate** | PvPStatsCard + AgentLeaderboard share same 3 rank colors. Add to hexlash-ui.css, replace in 2 files. |
| 4 | **AgentDetailView pixel-font audit** | Worst AP-2 offender (17 blocks). Reduce to <=3 intentional blocks: name, stats numbers, section headers. |
| 5 | **Resolve PDF reference in docs** | Either add PDF to repo or remove all references from SKILL.md + CLAUDE.md. 4 dangling references. |
| 6 | **Fix CLAUDE.md Tech Stack line** | Replace `Vue-i18n 11` with `Custom i18n (11 locales)`. One line fix. |

---

*Audit completed 2026-04-11. Agents used: frontend-inventory (Explore), css-tokens-audit (Explore), hex-components-usage (Explore), antipatterns-check (Explore). AP source: hexlash-design/SKILL.md. PDF not available for cross-reference.*
