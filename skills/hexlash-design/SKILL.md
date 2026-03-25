---
name: hexlash-design
description: Hexlash design system — colors, fonts, CSS variables, UI patterns, dark theme with neon pink accents. Use this skill when working on styling, CSS, UI components, visual design, layout, responsive design, animations, transitions, spacing, borders, backgrounds, shadows, opacity, or any visual aspect of the app. Triggers on mentions of colors, fonts, CSS, styles, design, theme, UI, layout, responsive, mobile, visual, neon, pink, dark theme, Vuetify, v-btn, v-card, v-dialog, animation, transition, opacity, border, background, gradient, cyberpunk, dark mode.
---

# Hexlash Design System

## Design Language

Dark cyberpunk aesthetic. Black backgrounds, neon pink accents, semi-transparent layers, thin gray borders. Everything glows subtly. The UI feels like a futuristic fight control panel.

## CSS Variables (`/src/assets/colors.css`)

```css
--pink: #FF066F          /* Primary accent — neon pink. Buttons, highlights, active states */
--pinkDark: #a50344      /* Darker pink — hover states, secondary emphasis */
--dark: #090909          /* Main background — near-black */
--gray1: #3F3F3F66       /* Semi-transparent gray — borders, dividers */
--gray2: #808080         /* Medium gray — secondary text, disabled states */
--gray3: #A0A0A0         /* Light gray — tertiary text, placeholders */
--white: #FFFFFF         /* Text, icons on dark backgrounds */
--black-opacity: #0000005c      /* Overlay — modals, dropdowns */
--black-opacity-80: #090909CC   /* Heavy overlay — fight screens */
--primary-color: var(--pink)    /* Alias for primary accent */
```

## Color Usage Rules

| Context | Color |
|---------|-------|
| Primary buttons, CTAs | `var(--pink)` |
| Button hover | `var(--pinkDark)` |
| Page background | `var(--dark)` |
| Card/panel background | `rgba(0,0,0,0.3)` or `var(--black-opacity)` |
| Primary text | `var(--white)` |
| Secondary text | `var(--gray3)` |
| Disabled text/elements | `var(--gray2)` |
| Borders | `var(--gray1)` or `1px solid rgba(255,255,255,0.1)` |
| Overlays/modals | `var(--black-opacity-80)` |
| Health bar (high HP) | Green gradient |
| Health bar (low HP) | Red gradient |
| Win result | Green accent |
| Loss result | Red accent |
| Draw result | Yellow accent |

## Fonts

| Font | Usage | Notes |
|------|-------|-------|
| `Anonymous` | Titles, special UI elements, headings | Custom font in `/src/assets/fonts/` |
| `AnonymousBalance` | Numeric values — taps, XP, balance, stats | Monospaced numbers for alignment |
| System sans-serif | Compact buttons (Mode, Friends on Arena) | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...` |

## UI Patterns

### Buttons
- **Primary:** Background `var(--pink)`, white text, rounded corners
- **Secondary:** Transparent background, `var(--pink)` border, pink text
- **Disabled:** `var(--gray2)` background, reduced opacity
- **Compact (Arena):** System sans-serif, smaller padding, used for Mode/Friends buttons

### Cards
- Semi-transparent dark background
- Thin border (`var(--gray1)`)
- Rounded corners
- Subtle shadow or none

### HP Bar
- Full width, rounded
- Green → Yellow → Red gradient based on HP percentage
- `EMERGENCY_HP_THRESHOLD = 30` triggers red state
- Animated width transitions

### Fighter Display
- Skin image from `/public/images/skins/`
- `<v-img>` or `<img>` with `:src="/images/skins/${skin}"`
- 145+ skins: `skin_m_1..117.png`, `skin_w_1..26.png`, `vip_k1/k2/t1/t2.png`

### Bottom Menu
- Fixed bottom nav: Arena, Training, Ratings, Profile
- Hidden on PvP screens via `isPvPScreen` computed in App.vue
- Dark background, pink active indicator

### Toasts (Info/Error)
- `Info.vue` — Success/info messages, green/blue accent
- `Error.vue` — Error messages, red accent
- Auto-dismiss, positioned at top or bottom

### Modals/Dialogs
- `var(--black-opacity-80)` backdrop
- Centered content card
- Pink accent on primary action

## Responsive Design

- Mobile-first approach
- Support `100dvh` for full-height screens
- Minimum width: 320px
- Telegram WebApp compatible
- Test on mobile viewport sizes

## Animations

| Context | Duration | Notes |
|---------|----------|-------|
| Round animation | 1500ms | `ROUND_ANIMATION_MS` constant |
| CSS transitions | 200-300ms | Standard hover/state transitions |
| Three.js | Continuous | Only for Punch3D punching bag |
| Challenge notification | 10s auto-dismiss | Top-of-screen, z-index: 9999 |

## Style Files

| File | Purpose |
|------|---------|
| `/src/assets/main.css` | Global styles |
| `/src/assets/colors.css` | CSS variables |
| `/src/styles/hexlash-ui.css` | Additional UI styles |
| Component `<style scoped>` | Per-component styles |

## Rules

- Always use CSS variables instead of hardcoded colors
- Keep styles scoped in components
- Use Vuetify components where possible (v-btn, v-card, v-dialog, v-img)
- Test dark theme — never assume light backgrounds
- Ensure sufficient contrast for text readability
- Avoid heavy shadows — keep the flat cyberpunk feel
