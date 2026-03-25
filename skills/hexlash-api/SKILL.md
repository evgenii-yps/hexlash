---
name: hexlash-api
description: Hexlash backend API — Express routes, Prisma database, JWT auth, middleware, error handling, server-side logic. Use this skill when working on API endpoints, database queries, authentication, authorization, middleware, server-side validation, request handling, response format, or any backend code in /backend. Triggers on mentions of API, endpoint, route, Prisma, database, query, auth, JWT, middleware, backend, server, Express, request, response, POST, GET, PUT, DELETE, token, bearer, model, schema, SQL, migration.
---

# Hexlash Backend API

## Architecture

- **Framework:** Express 4
- **Location:** `/backend/src/`
- **Entry point:** `/backend/src/index.js` — Express server + WebSocket on same HTTP server
- **Config:** `/backend/src/config.js` — All constants and environment variables
- **Base path:** `/v1/`

## Route Files

| Route | File | Purpose |
|-------|------|---------|
| `/v1/auth` | `routes/auth.js` | Login, signup, password reset, Telegram auth |
| `/v1/user` | `routes/user.js` | Profile, stats, avatar, achievements, progression, skin |
| `/v1/club` | `routes/club.js` | Create/edit club, members, balance |
| `/v1/task` | `routes/task.js` | Daily + social tasks |
| `/v1/file` | `routes/file.js` | Avatar/file upload |
| `/v1/fight` | `routes/fight.js` | Fight creation, results, history |
| `/v1/stats` | `routes/stats.js` | Player and game statistics |
| `/v1/friends` | `routes/friends.js` | Friends list, requests, search players |
| `/v1/ai` | `routes/ai.js` | AI Trainer fight analysis, auto fight summary |

## Key Endpoints

### Auth
- `POST /v1/auth/signup` — Register new user
- `POST /v1/auth/login` — Login, returns JWT token
- `POST /v1/auth/reset` — Password reset
- `POST /v1/auth/telegram` — Telegram WebApp auth

### User
- `GET /v1/user/me` — Get current user (source of truth for all user data)
- `PUT /v1/user/progression` — Sync progression (moves, XP, taps, deck, playerModules). Debounced 3s on client
- `PUT /v1/user/skin` — Change fighter skin

### Fight
- `POST /v1/fight/save` — Save fight result (PvE auto fight sync)

### AI
- `POST /v1/ai/analyze-fight` — AI Trainer post-fight analysis (Claude API)
- `POST /v1/ai/auto-fight-summary` — Auto fight series analysis (Claude API)

## JWT Auth Flow

```
1. User calls POST /v1/auth/login with credentials
2. Server validates → returns { token: "jwt..." }
3. Client stores token, sends as: Authorization: Bearer <token>
4. middleware/auth.js validates token on protected routes
5. req.user populated with decoded user data
```

## Middleware

| File | Purpose |
|------|---------|
| `middleware/auth.js` | JWT guard — validates Bearer token, populates req.user |
| `middleware/upload.js` | Multer — file upload handling |

## Prisma Database

### 12 Models
User, Club, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship

### Query Patterns
```js
// Find one
const user = await prisma.user.findUnique({ where: { id } })

// Update
await prisma.user.update({ where: { id }, data: { ... } })

// Create
await prisma.fight.create({ data: { ... } })

// Find many with relations
const clubs = await prisma.club.findMany({ include: { members: true } })
```

### Schema Location
`/backend/prisma/schema.prisma`

## Config Constants (`/backend/src/config.js`)

```js
PORT = 3000
WS_PORT = 444
JWT_SECRET = env or 'default-secret'
FRONTEND_URL = 'http://localhost:5173'
UPLOAD_DIR = './uploads'
DECIMALS = 6
COST_PER_CLICK = 2
COST_CREATE_CLUB = 10000
PUNCH_MAX_PER_INTERVAL = 10000
PUNCH_MAX_PER_BATCH = 10000
PUNCH_INTERVAL_MS = 3600000      // 1 hour

// PvP Combat
MAX_HP = 100
MAX_ROUNDS = 10
BASE_DAMAGE = 15
POSITION_BONUS = 5
DICE_COOLDOWN_ROUNDS = 3

// AI
ANTHROPIC_API_KEY = env
ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
AI_TRAINER_MAX_TOKENS = 500
AI_TRAINER_ENABLED = true
```

## Error Handling

Standard response format:
```js
// Success
res.json({ success: true, data: { ... } })

// Error
res.status(400).json({ success: false, error: 'Error message' })
```

Always wrap route handlers in try/catch.

## Adding New Routes

1. Create route file in `/backend/src/routes/`
2. Define Express router with endpoints
3. Apply `auth` middleware for protected routes
4. Register router in `/backend/src/index.js`
5. Update CLAUDE.md API section

```js
// Example: /backend/src/routes/newFeature.js
const router = require('express').Router()
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const data = await prisma.model.findMany()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
```
