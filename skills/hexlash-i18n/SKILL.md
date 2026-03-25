---
name: hexlash-i18n
description: Hexlash localization system — 11 languages, custom reactive i18n, game data translations, page content. Use this skill when adding new text, translating content, working with locale files, fixing missing translations, adding new i18n keys, or dealing with text display issues. Triggers on mentions of i18n, translation, translate, locale, language, text, label, localization, multilingual, RTL, Arabic, locale file, missing text, hardcoded text, string, message, internationalization, lang, t.value, setLanguage, interpolate.
---

# Hexlash i18n Localization

## Architecture

Custom reactive i18n system (NOT vue-i18n).

**File:** `/src/locales/index.js`

**Exports:**
- `t` — Computed ref with all translations for current language
- `setLanguage(lang)` — Switch active language
- `interpolate(template, values)` — Replace `{placeholders}` in strings

## Supported Languages (11)

| Code | Language | RTL |
|------|----------|-----|
| `en` | English | No |
| `ru` | Russian | No |
| `de` | German | No |
| `es` | Spanish | No |
| `fr` | French | No |
| `pt` | Portuguese | No |
| `ar` | Arabic | **Yes** |
| `hi` | Hindi | No |
| `ja` | Japanese | No |
| `ko` | Korean | No |
| `zh` | Chinese | No |

## Locale File Structure

Each locale file contains these sections:

```js
{
  menu: { ... },          // Navigation labels
  auth: { ... },          // Login/signup/reset
  profile: { ... },       // Profile page
  arena: { ... },         // Arena/preparation
  fight: { ... },         // Fight screen
  training: { ... },      // Training screen
  moves: { ... },         // Move tree
  deck: { ... },          // Deck builder
  cards: { ... },         // Card/module names
  rating: { ... },        // Ratings/leaderboards
  club: { ... },          // Club page
  info: { ... },          // Info messages
  nav: { ... },           // Navigation
  autoFight: { ... },     // Auto fight
  friends: { ... },       // Friends
  pvp: { ... },           // PvP
  spectate: { ... },      // Spectate
  xpAllocation: { ... },  // XP distribution
  gameData: {
    branches: {
      speed: { name, description },
      power: { name, description },
      technique: { name, description }
    },
    moves: {
      jab: { name, description },
      double_jab: { name, description },
      // ... all 18 moves
    }
  }
}
```

## Page Content

Stored as separate JSON files:

- `/src/locales/pages/rules/{lang}.json` — Game rules (11 files)
- `/src/locales/pages/help/{lang}.json` — Help pages (en, ru)

## Usage Patterns

### In Templates
```vue
<!-- Direct access (auto-unwrapped ref) -->
{{ t.fight.lblRound }}
{{ t.profile.lblBalance }}
{{ t.gameData.moves.jab.name }}

<!-- With interpolation -->
{{ interpolate(t.value.moves.lblUnlockFirst, { name: moveName }) }}
```

### In Script
```js
import { t, interpolate } from '@/locales'

// Access translation (ref — need .value)
const label = t.value.fight.lblRound

// Interpolation
const msg = interpolate(t.value.moves.lblUnlockFirst, { name: 'Jab' })
```

### Game Data
```vue
<!-- Branch name -->
{{ t.gameData.branches.speed.name }}

<!-- Move name and description -->
{{ t.gameData.moves[moveId].name }}
{{ t.gameData.moves[moveId].description }}
```

## Key Naming Convention

| Prefix | Usage | Example |
|--------|-------|---------|
| `lbl` | Labels, titles | `lblRound`, `lblBalance` |
| `msg` | Messages, descriptions | `msgFightWon`, `msgNoFriends` |
| `btn` | Button text | `btnStart`, `btnCancel` |

## Rules

1. **NEVER hardcode text** in templates or scripts. Always use i18n keys.
2. **Add keys to ALL 11 locales** when adding new text. Missing keys show the key path in UI.
3. **Use English as the primary locale** — write English text first, then add translations.
4. **Prefix convention** — Use `lbl`, `msg`, `btn` prefixes consistently.
5. **Game data translations** go in `gameData.branches` and `gameData.moves` sections.
6. **Page content** goes in `/src/locales/pages/` as separate JSON files.
7. **Test Arabic (ar)** — it uses RTL direction. Verify layout doesn't break.

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Key path shown in UI (e.g., `fight.lblNew`) | Key missing from locale file | Add key to all 11 locale files |
| Interpolation shows `{placeholder}` literally | Wrong placeholder name or missing `interpolate()` call | Match placeholder names exactly |
| Russian text in move names | Legacy fallback from `moves.js` | UI should use `t.gameData.moves[id].name` |
| RTL layout broken | Arabic text without proper CSS | Add `direction: rtl` support, test with `ar` locale |
| Wrong language on load | Language preference not restored | Check `masterState.language` and localStorage |

## Adding New Text

1. Define the key in English locale first
2. Copy to all 10 other locale files with translated values
3. Use consistent prefix (lbl/msg/btn)
4. Place in the correct section (fight, profile, arena, etc.)
5. Test with at least 2 languages (en + one other)
6. Test Arabic for RTL layout if the text is in a new UI area

## Locale Files Location

```
/src/locales/
  index.js          — i18n system (t, setLanguage, interpolate)
  en.js             — English
  ru.js             — Russian
  de.js             — German
  es.js             — Spanish
  fr.js             — French
  pt.js             — Portuguese
  ar.js             — Arabic (RTL)
  hi.js             — Hindi
  ja.js             — Japanese
  ko.js             — Korean
  zh.js             — Chinese
  pages/
    rules/          — Rules content per language
    help/           — Help content per language
```
