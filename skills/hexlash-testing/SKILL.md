---
name: hexlash-testing
description: Hexlash testing and QA procedures. Use this skill when verifying changes, checking for regressions, testing PvE/PvP/Auto Fight, validating i18n, ensuring code quality before committing, debugging issues, or investigating bugs. Triggers on mentions of test, testing, QA, verify, check, regression, validate, debug, bug, fix, broken, error, crash, issue, not working, fails, failing, investigate, reproduce, checklist, quality.
---

# Hexlash Testing & QA

## Pre-Commit Checklist

Run through these checks before committing any change:

1. **Build:** `npm run build` completes without errors
2. **Console:** No console errors in browser dev tools
3. **i18n:** All new text has keys in ALL 11 locales (en, ru, de, es, fr, pt, ar, hi, ja, ko, zh)
4. **State:** Vuex state changes persist correctly (localStorage, server sync)
5. **Mobile:** Test on mobile viewport (320px minimum)
6. **Dark theme:** Verify on dark background — no invisible text or elements
7. **PvP screens:** BottomMenu hidden on matchmaking, fight (PvP mode), spectate

## Feature Checklists

### Combat PvE
- [ ] Deck builds correctly (4-8 modules)
- [ ] Opponent generates at appropriate level
- [ ] Rounds simulate with correct damage values
- [ ] HP bars update with animation (1500ms)
- [ ] Dice appears after round 1, respects 3-round cooldown
- [ ] Dice disabled during Overdrive
- [ ] Coach advice triggers from round 6 (once per fight)
- [ ] Coach boost lasts 4 rounds with active bar
- [ ] Emergency protocol at HP <= 30
- [ ] Fight result saves via POST /fight/save
- [ ] AI Trainer analysis displays on results screen
- [ ] XP awarded correctly

### Combat PvP
- [ ] Matchmaking queue works (join/cancel)
- [ ] Opponent Found screen shows fighter skins
- [ ] Both players must send pvp_ready
- [ ] Round results sync to both players
- [ ] Dice: dice_available → dice_roll → dice_rolled
- [ ] Coach: coach_pause → coach_choice → coach_result (both players)
- [ ] Overdrive triggers after MAX_ROUNDS
- [ ] fight_end clears localStorage state
- [ ] BottomMenu hidden during PvP fight
- [ ] No PvP badge on fight screen

### Auto Fight
- [ ] Toggle on/off from Arena screen
- [ ] Fights every 10 min (AUTO_FIGHT_MIN_INTERVAL)
- [ ] Catches up missed fights on tab focus
- [ ] Daily auto-reset on new day (clears log, counters)
- [ ] Limits: 144/day, 288/session
- [ ] Push notifications fire correctly
- [ ] Results sync to server via POST /fight/save
- [ ] localStorage persist: hexlash_autofight_state, hexlash_autofight_history
- [ ] AI series analysis works (Last 5 / Last 10 / All)

### Friends & Challenges
- [ ] Friends list loads correctly
- [ ] Friend requests send/accept/decline
- [ ] Player search works
- [ ] Challenge send checks online status
- [ ] ChallengeNotification appears (top-of-screen, 10s timer)
- [ ] Challenge accept creates match, both navigate to fight
- [ ] Challenge decline notifies sender

### Progression
- [ ] Moves unlock at correct tap/XP requirements
- [ ] Move levels upgrade correctly (1-5)
- [ ] XP distributes to branches
- [ ] Progression syncs to server (debounced 3s)
- [ ] Data restores on login from GET /v1/user/me

### Skins
- [ ] Skin selector loads all images
- [ ] Skin change saves to localStorage + IndexedDB + server
- [ ] Skin displays in fights, matchmaking, profile
- [ ] PvP opponent sees correct skin

## Regression Points

| Area Changed | Check These |
|-------------|-------------|
| Vuex module | All components using that module's getters/actions |
| Router | Auth guards, fight state restore, navigation |
| Combat engine | PvE results, Auto Fight results, damage values |
| WebSocket handler | PvP flow, challenges, matchmaking, punch batches |
| i18n locale file | All 11 locales have same keys, no missing translations |
| CSS/styles | Dark theme contrast, mobile viewport, PvP screen layout |
| Prisma schema | Migrations, seed data, all queries using changed model |
| API route | Auth middleware, response format, error handling |
| Constants | Both frontend (constants.js) AND backend (config.js) if shared |
| Auto Fight | Daily reset, localStorage keys, server sync, limits |

## Debugging Tips

### WebSocket Issues
- Open browser Dev Tools → Network → WS tab
- Check message format (JSON with `type` field)
- Verify JWT token in connection
- Check server logs for connection/disconnection events

### Fight State Issues
- Check localStorage keys:
  - `hexlash_autofight_state` — Auto fight state
  - `hexlash_autofight_history` — Auto fight log
  - `hexlash_fight_state` — Active fight state (cardFightState)
- Verify Vuex state in Vue DevTools

### i18n Issues
- Missing key shows key path in UI (e.g., `fight.lblNewKey`)
- Check all 11 locale files have the key
- Interpolation mismatch: verify placeholder names match
- Legacy Russian text in moves.js — UI should use i18n keys instead

### Build Issues
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for circular imports (Vite warns in console)
- Verify all imports use correct paths (@/ prefix)
- Check that new dependencies are in package.json

### Common Pitfalls
- Forgetting to update BOTH constants.js (frontend) AND config.js (backend)
- Not clearing PvP fight state from localStorage on fight_end
- Hardcoding text instead of using i18n keys
- Not testing Arabic RTL layout
- Modifying existing Prisma migrations instead of creating new ones
