---
name: hexlash-vue
description: Vue 3 frontend conventions for Hexlash. Use this skill when working with Vue components, Vuex store modules, Vue Router, Vuetify, component structure, reactive state, computed properties, watchers, template syntax, props, emits, slots, lifecycle hooks, or any frontend logic. Triggers on mentions of views, components, store, modules, router, Vuetify, frontend, SPA, reactive, computed, watch, dispatch, getter, action, mutation, v-model, v-if, v-for, template, script, style, scoped, or frontend files in /src.
---

# Hexlash Vue Frontend

## Tech Stack

- Vue 3.5 with Vite 7
- Vuex 4 (state management)
- Vue Router 4 (routing + auth guards)
- Vuetify 2 (UI component library)
- Three.js (3D punching bag)
- Howler.js (sound effects)
- Ethers.js 6 (blockchain)

## Views (17 Page-Level Components)

| Path | View | Auth | Notes |
|------|------|------|-------|
| `/auth/login` `/auth/signup` `/auth/reset` `/auth/telegram` | RainView | No | Auth screens |
| `/privacy` `/404` `/rules` `/verify-email` | Static | No | Info pages |
| `/` | RainView | Yes | Home |
| `/help` | PageView | Yes | Help content |
| `/arena` | PreparationView | Yes | Mode select, start fight, auto fight |
| `/arena/autofight-log` | AutoFightLogView | Yes | Auto fight history |
| `/fight` | CardFightView | Yes | PvE + PvP combat |
| `/training` | TrainingView | Yes | 3D punch bag, tasks |
| `/training/moves` | MoveTreeView | Yes | Move unlock tree |
| `/training/deck` | DeckBuilderView | Yes | Deck editor |
| `/profile` (+ subtabs) | ProfileView | Yes | Balance, wallet, account, skins |
| `/club/:id` | ClubView | Yes | Club page |
| `/ratings/:type` | RatingsView | Yes | Leaderboards |
| `/friends` | FriendsView | Yes | Friends, requests, search |
| `/matchmaking` | MatchmakingView | Yes | PvP queue |
| `/spectate/:odId` | SpectateView | Yes | Watch live PvP |

## Vuex Modules (13)

| Module | Purpose |
|--------|---------|
| `masterState` | App init, auth status, info/error messages, language |
| `userState` | Current user profile, stats, avatar |
| `cardFightState` | Active fight: rounds, HP, dice, coach, playerModules, localStorage persist |
| `progressionState` | Moves unlocked/levels, taps, XP per branch, server sync (PUT /user/progression) |
| `clubState` | Club info, members, balance |
| `taskState` | Daily + social tasks |
| `punchState` | Punch/tap rate limiting, cooldown, 2D/3D toggle, sound mute |
| `achievementState` | Achievements list + unlocking |
| `contractState` | Web3 wallet, token balance |
| `webSocketState` | WS connection, real-time messages |
| `autoFightState` | Auto fight scheduling, log, notifications, daily reset, AI analysis |
| `pvpState` | Real-time PvP matchmaking and fights |
| `friendsState` | Friends list, requests, challenges (WebSocket) |

## Vuex Patterns

```js
// Components — dispatch actions, use getters
store.dispatch('module/actionName', payload)
store.getters['module/getterName']

// NEVER commit mutations directly from components
// BAD: store.commit('module/MUTATION_NAME', payload)

// Actions handle async logic, call mutations internally
// Getters derive computed state
```

## Router

- Auth guard checks `masterState.isAuthenticated`
- Fight state restore: on page reload, `cardFightState` restores from localStorage
- PvP routes: `/matchmaking`, `/fight?mode=pvp`, `/spectate/:odId`

## Template Patterns

```vue
<!-- i18n text -->
{{ t.section.key }}

<!-- Interpolation -->
{{ interpolate(t.value.moves.lblUnlockFirst, { name: moveName }) }}

<!-- Conditional rendering -->
<div v-if="isAuthenticated">...</div>

<!-- List rendering -->
<div v-for="item in items" :key="item.id">...</div>
```

## Component Structure

```vue
<template>
  <!-- Use Vuetify components: v-btn, v-card, v-dialog, v-img, etc. -->
</template>

<script>
import { t } from '@/locales'

export default {
  name: 'ComponentName',
  // props, data, computed, methods, watch, lifecycle hooks
}
</script>

<style scoped>
/* Use CSS variables from colors.css */
/* Keep styles scoped to prevent leaks */
</style>
```

## Key Components (75+)

- `Logo.vue` — Header logo
- `BottomMenu.vue` — Bottom nav (hidden on PvP screens)
- `Info.vue` / `Error.vue` — Toast notifications
- `HPBar.vue` — Fight health bar
- `Fighter.vue` — Fighter display in combat
- `Punch3D.vue` — Three.js punching bag
- `ModeSelector.vue` — Arena PvE/PvP/Auto selector
- `ChallengeNotification.vue` — PvP challenge popup (z-index: 9999)
- `AiTrainerAnalysis.vue` — Post-fight AI analysis
- `AutoFightAnalysis.vue` — Auto fight series AI analysis

## Data Flow

- Server is source of truth for user data
- Progression syncs to server via `PUT /v1/user/progression` (debounced 3s)
- Login restores all data from `GET /v1/user/me`
- Auto fight state is localStorage-only (fight results sync via POST /fight/save)
- PvP fight state cleared from localStorage on `fight_end`

## Styles

- Use scoped styles in components
- Reference CSS variables: `var(--pink)`, `var(--dark)`, etc.
- See `hexlash-design` skill for full design system
- Mobile-first, support 100dvh
- Dark theme throughout
