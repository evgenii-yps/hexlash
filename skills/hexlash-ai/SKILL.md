---
name: hexlash-ai
description: AI система Hexlash — Anthropic Claude API. Триггерится на AI, Claude, Anthropic, prompt, промпт, AI Trainer, analyze-fight, build-description, morning-report, premium-report, claude-haiku, model, max_tokens, system prompt, генерация. Грузить вместе с hexlash-dev. Для endpoints — hexlash-api. Для UI — hexlash-vue + hexlash-design. Для контекста боя — hexlash-combat.
---

# hexlash-ai — Claude API Integration

## Главное правило

AI — **вспомогательный слой**, не критичный путь. Любая AI-фича → **graceful degradation** на ошибке: понятное сообщение, не ломает UX. Не блокировать flow ожиданием AI. Промпты — **детерминированная структура** (фиксированные секции), фронт парсит по заголовкам.

---

## Стек

- **SDK:** `@anthropic-ai/sdk` (Node.js, backend only)
- **Модель:** `claude-haiku-4-5-20251001` (env `ANTHROPIC_MODEL`)
- **API key:** `ANTHROPIC_API_KEY` env (без неё AI endpoints → 503)
- **Feature flag:** `AI_TRAINER_ENABLED` (default true)
- **Client:** singleton `getAnthropicClient()` в `ai.js`

---

## Endpoints (реальные, из кода)

| Endpoint | Назначение | Rate limit | Timeout | Max tokens | Auth |
|----------|------------|------------|---------|------------|------|
| `POST /v1/ai/analyze-fight` | Анализ одного боя (PvE + PvP) | 5/min | 15s | 300 | JWT |
| `POST /v1/ai/build-description` | Описание боевого стиля (2 предложения) | 10/min | 10s | 60 | JWT |
| `POST /v1/ai/morning-report` | Утренний отчёт FightClub (Lv1+Lv2) | 3/hr | 15s | 400+150/agent (max 1200) | JWT |
| `POST /v1/ai/premium-report` | Premium отчёт с мета-анализом (Lv3) | 10/day | 25s | 2000 | JWT + x402 |

**Нет endpoint `auto-fight-summary`** — был в ранней версии, удалён. Нет `AutoFightAnalysis.vue`.

---

## Промпты — структура

### analyze-fight (4 секции, фиксированные EN заголовки)

```
Fight Summary (2-3 предложения)
What You Did Well (конкретные позитивы)
What Went Wrong (конкретные проблемы)
Advice (рекомендации по модулям и мувам)
```

- **Заголовки ВСЕГДА на EN** даже при ответе на другом языке — это в system prompt
- **Без markdown** (no **, no ##, no bullets)
- **Max 150 слов**, temperature 0.7
- Фронт парсит по этим заголовкам

### build-description (короткий)

- 2 предложения, <25 слов, tone: bold ring announcer
- Не упоминать имена модулей напрямую
- Temperature 0.8, max 60 tokens
- **Кэшируется** по sorted modules + locale

### morning-report (JSON)

Ответ — JSON с полями: `summary`, `highlights`, `concerns`, `recommendation`, `agents[]`
- Per-agent: assessment, tactics advice, build advice
- Temperature 0.7, dynamic tokens 400 + 150/agent (cap 1200)
- **30 мин кэш** по fightClubId + period + hour

### premium-report (JSON)

Ответ — JSON с: `metaSummary`, `agents[]`, `trainingPlan`, `forecast`
- Temperature 0.7, max 2000 tokens
- **x402 payment required** (когда X402_ENABLED=true)

---

## Данные в промптах

### analyze-fight получает:
- result (win/loss/draw), playerDeck, playerModules, opponentDeck
- playerHP, opponentHP, totalRounds
- diceUsed + diceEffect, coachUsed + coachChoice, emergencyUsed + emergencyType
- rounds[] (round-by-round JSON)
- locale

### morning-report получает:
- Club name, level, period (today/yesterday/last_7d)
- Aggregated stats: totalFights, wins, losses, draws, winRate
- Per-agent: name, skin, elo, eloChange, tactics, build, recentResults, dice/coach/emergency rates

---

## Обработка ошибок

| Ситуация | Код | Поведение |
|----------|-----|-----------|
| `AI_TRAINER_ENABLED=false` | 503 | "AI Trainer is disabled" |
| `ANTHROPIC_API_KEY` отсутствует | 503 | "AI Trainer temporarily unavailable" |
| Claude API ошибка | 500 | "Analysis failed" (лог на сервере) |
| Claude API timeout | 503 | "Analysis timed out" (AbortController) |
| Anthropic rate limit | 429 | "Too many requests" |
| App rate limit | 429 | "Max N per minute/hour/day" |
| Пустой ответ Claude | 502 | "Empty response from AI" |

**Frontend:** loading → error → fallback (raw text если парсинг не удался).

---

## i18n

- **Тело ответа Claude** — на языке из `locale` param (analyze-fight, build-description) или EN
- **Заголовки секций** analyze-fight — **всегда EN** (Fight Summary, What You Did Well, etc.)
- **UI обёртка** — через i18n: `fight.lblAiTrainer`, `fight.lblAiLoading`, `fight.lblAiError`
- 11 локалей поддерживаются в `SUPPORTED_LOCALES` массиве в ai.js

---

## Запрещено

- Хардкодить `ANTHROPIC_API_KEY`
- Вызывать Claude с фронта — только через backend
- Пользовательский ввод в промпт **без валидации** (prompt injection)
- Логировать API key или полные ответы в production
- Блокировать flow ожиданием AI
- Менять 4 секции промпта без синхронизации фронт-парсера
- Дорогие модели (Sonnet/Opus) для рутинных задач
- Claude в цикле без ограничения частоты
- Stack traces Anthropic SDK клиенту

---

## Чеклист

- [ ] Прочитан `/backend/src/routes/ai.js`
- [ ] Структура секций сохранена или фронт обновлён
- [ ] Стоимость модели рассмотрена
- [ ] max_tokens в config.js
- [ ] Fight log данные соответствуют промпту
- [ ] Rate limit обновлён
- [ ] i18n ключи в 11 локалях
- [ ] Graceful degradation: spinner → error → fallback
- [ ] Тест: success, 500, 429, feature flag off

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Все AI endpoints + промпты | `/backend/src/routes/ai.js` |
| Модель, tokens, flags | `/backend/src/config.js` |
| Morning report stats gathering | `/backend/src/services/morningReportService.js` |
| Meta stats (premium) | `/backend/src/services/metaAnalysisService.js` |
| UI Trainer (single fight) | `/src/components/AiTrainerAnalysis.vue` |
| UI Morning Report | `/src/components/club/MorningReport.vue` |
| x402 payment middleware | `/backend/src/middleware/x402.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-api` — endpoints, rate limits, env
- `hexlash-vue` — UI компоненты
- `hexlash-design` — UI правила
- `hexlash-combat` — контекст данных боя
- `hexlash-i18n` — i18n ключи
- `hexlash-web3` — x402 premium
