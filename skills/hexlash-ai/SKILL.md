---
name: hexlash-ai
description: Hexlash AI system — Claude API integration for AI Trainer post-fight analysis, auto fight series analysis, and future AI features. Use this skill when working on AI Trainer, Claude API calls, Anthropic SDK, fight analysis prompts, AI-related components, prompt engineering, or expanding AI functionality. Triggers on mentions of AI, Claude, Anthropic, trainer, analysis, prompt, AI Trainer, fight analysis, coaching, auto fight analysis, AI series, analyze, Claude API, model, max_tokens, AI feature, machine learning, LLM.
---

# Hexlash AI System

## Architecture

```
Frontend Component          Backend Endpoint              External API
─────────────────          ─────────────────              ────────────
AiTrainerAnalysis.vue  →   POST /v1/ai/analyze-fight  →  Claude API
AutoFightAnalysis.vue  →   POST /v1/ai/auto-fight-summary → Claude API
```

## Backend: AI Routes

**File:** `/backend/src/routes/ai.js`

### POST /v1/ai/analyze-fight
- **Purpose:** Post-fight analysis (PvE and PvP)
- **Model:** `claude-sonnet-4-20250514` (ANTHROPIC_MODEL)
- **Max tokens:** 500 (AI_TRAINER_MAX_TOKENS)
- **Input:** Fight data (rounds, decks, result, dice/coach/emergency usage)
- **Output:** 4-section analysis text

### POST /v1/ai/auto-fight-summary
- **Purpose:** Auto fight series analysis
- **Model:** `claude-haiku-4-5-20251001`
- **Max tokens:** 400
- **Rate limit:** 5 requests/minute
- **Input:** Array of fight results with period selection
- **Output:** 4-section analysis text

## Analysis Sections

### Fight Analysis (analyze-fight)
1. **Fight Summary** — Overview of what happened
2. **What You Did Well** — Positive tactical decisions
3. **What Went Wrong** — Mistakes and missed opportunities
4. **Advice** — Actionable recommendations

### Auto Fight Analysis (auto-fight-summary)
1. **Session Overview** — Win/loss/draw stats for period
2. **Strengths** — What deck/strategy excels at
3. **Weaknesses** — Patterns of failure
4. **Recommendation** — Deck/strategy adjustments

## Config Constants

```js
ANTHROPIC_API_KEY = env            // Required for AI features
ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'  // Fight analysis model
AI_TRAINER_MAX_TOKENS = 500        // Max response tokens (fight analysis)
AI_TRAINER_ENABLED = true          // Feature flag
```

## Frontend Components

### AiTrainerAnalysis.vue
- **Location:** Renders on `CardFightView.vue` results screen
- **Trigger:** Automatically after fight ends (PvE and PvP)
- **Loading state:** Shows spinner with `fight.lblAiLoading` text
- **Error state:** Shows `fight.lblAiError` with graceful degradation
- **Data sent:** Rounds, player deck, opponent deck, result, dice usage/effect, coach usage/choice, emergency usage

### AutoFightAnalysis.vue
- **Location:** Renders on `AutoFightLogView` screen
- **Trigger:** Player clicks "Analyze" button after selecting period
- **Periods:** Last 5 / Last 10 / All fights
- **Vuex state:** `autoFightState.aiAnalysis`, `aiAnalysisLoading`, `aiAnalysisError`, `aiAnalysisPeriod`

## Fight Data Fields

Auto fight log entries include:
- `playerModules` — Player's deck modules
- `opponentModules` — Opponent's deck modules
- `diceUsed` — Whether dice was used
- `diceEffect` — Which effect was rolled
- `coachUsed` — Whether coach advice was used
- `coachChoice` — Which option was chosen (attack/defense/position)
- `emergencyUsed` — Whether emergency protocol triggered

## i18n Keys

- `fight.lblAiTrainer` — "AI Trainer" title
- `fight.lblAiLoading` — Loading message
- `fight.lblAiError` — Error message

## Monetization

- $0.01 per AI analysis via x402 USDC micropayments
- Integrated with Web3 payment system (see hexlash-web3 skill)

## Error Handling

- Feature flag: `AI_TRAINER_ENABLED` — disable without code changes
- Graceful degradation: if API fails, show error message, fight screen still works
- Rate limiting on auto-fight-summary: 5 requests/minute
- Never block fight flow on AI errors

## Adding New AI Features

1. Create endpoint in `/backend/src/routes/ai.js`
2. Design prompt with clear system instructions
3. Create Vue component for the UI
4. Add i18n keys in all 11 locales
5. Add feature flag in config
6. Add error handling with graceful degradation
7. Consider rate limiting
8. Update CLAUDE.md

## Future Features (Planned)

- **Build Description** — AI-generated description of player's fighting style
- **Strategy Advisor** — Pre-fight deck recommendations
- **Fight Predictions** — Win probability before fight
- **Training Recommendations** — Which moves to unlock/upgrade next
