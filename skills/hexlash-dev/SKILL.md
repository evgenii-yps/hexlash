---
name: hexlash-dev
description: Core development workflow and project structure for Hexlash — AI battle platform. Use this skill FIRST before any task in the Hexlash codebase. Triggers on any mention of Hexlash development, project structure, file locations, git workflow, coding conventions, code style, linting, file organization, folder structure, where to find, how to start, new task, feature request, bug fix, refactor, or when starting any new task. Always read CLAUDE.md before making changes.
---

# Hexlash Core Development Workflow

## Rule #1: Read CLAUDE.md First

Before every task, read `/CLAUDE.md` in the project root. It contains the full project memory: structure, constants, conventions, and current state. Never skip this step.

## Project Structure

```
/src
  App.vue                  — Root: header, router-view, BottomMenu, toasts, ChallengeNotification
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex store init
  router/index.js          — Routes + auth guards + fight state restore
  views/                   — 17 page-level components
  components/              — 75+ reusable components
  core/
    state/store.js         — Vuex store
    state/modules/         — 13 Vuex modules
    models/                — 20 data models (internal, ws, etc.)
    services/              — 8 business logic services
    database/              — 7 LocalStorage/IDB repository files
    api/apiClient.js       — Axios HTTP client
    engine/                — Combat system (combatEngine, aiStrategy, opponentGenerator)
    constants.js           — Game constants
    websocket/             — WebSocket client
    mock/mockData.js       — Mock data for development
  data/
    branches.js            — 3 branches: speed, power, technique
    moves.js               — 18 moves with damage/speed per level
    requirements.js        — Tap/XP costs for unlock/levelup
    cardPower.js           — Card/module power balance data
  utils/
    powerRating.js         — Power rating calculations
  styles/
    hexlash-ui.css         — Additional UI styles
  assets/                  — CSS, fonts, images, models, sounds, textures, ABIs
  locales/                 — i18n: 11 languages (en, ru, de, es, fr, hi, ja, ko, pt, zh, ar)

/backend
  src/
    index.js               — Express server + WebSocket on same HTTP server
    config.js              — Constants (PORT, WS_PORT, JWT_SECRET, game balance)
    routes/                — auth, user, club, task, file, fight, stats, friends, ai
    middleware/             — auth.js (JWT guard), upload.js (Multer)
    websocket/             — handler.js, pvpHandler.js
    services/              — matchmaking.js, pvpMatchManager.js, pvpCombatEngine.js
    utils/helpers.js
  prisma/
    schema.prisma          — 12 models
    seed.js
    migrations/            — PostgreSQL migrations

/public
  images/skins/            — 145+ fighter skin images
  images/tgskins/          — Legacy skin path

/skills/                   — 12 Claude Code skill files
```

## Protected Files — DO NOT Modify Without Permission

- `prisma/migrations/` — Never edit existing migrations
- `prisma/seed.js` — Seed data, changes affect all environments
- `src/assets/abi/` — Smart contract ABIs, linked to deployed contracts
- `.github/workflows/` — CI/CD pipelines
- `nginx.prod.conf` / `nginx.test.conf` — Production/test server configs
- `Dockerfile` — Production container definition

## Git Workflow

- Branch naming: `claude/feature-name-XXXXX` (random suffix)
- Commit messages: English, imperative mood, concise
- Always commit related changes together
- Push to feature branch, never directly to main/master

## Task Execution Rules

1. Read CLAUDE.md before starting
2. Take small, incremental steps
3. Provide status after each step
4. Test changes mentally — check for side effects
5. Update CLAUDE.md if you add new modules, routes, components, or constants

## Report Format

After completing a task, provide:

```
Done: [brief description of what was done]
Files changed: [list of modified files]
Notes: [any warnings, caveats, or follow-up items]
```

## Tech Stack Summary

- **Frontend:** Vue 3.5 + Vite 7 + Vuex 4 + Vue Router 4 + Vuetify 2 + Three.js + Howler.js + Ethers.js 6
- **Backend:** Express 4 + Prisma 5 (PostgreSQL) + JWT + WebSocket (ws) + Anthropic SDK
- **Deploy:** Vercel (frontend) + Docker/Nginx (backend) + GitHub Actions CI/CD

## Coding Conventions

- Use Vue 3 Options API or Composition API consistently within each file
- Vuex: dispatch actions from components, never commit mutations directly
- i18n: never hardcode text, use `t.section.key` pattern
- CSS: scoped styles, use CSS variables from `colors.css`
- Naming: camelCase for JS, kebab-case for CSS classes and file names
- Constants: ALL_CAPS in `constants.js` or `config.js`
