---
name: hexlash-design
description: "Neon Discipline v1.0 — visual system for Hexlash. Use for any UI, CSS, styling, layout, responsive, animation, component, color, font, spacing, border, background, gradient, glow, dark theme, design token task. Triggers on: colors, fonts, CSS, styles, design, theme, UI, layout, responsive, mobile, visual, neon, pink, dark theme, animation, transition, opacity, border, background, gradient, glow, card, button, badge, modal, icon, spacing, typography."
---

# Neon Discipline v1.0 — Operational Reference

> Full visual guide: **Hexlash_Visual_System.pdf v1.0**
> This file is a short operational extract. For examples and rationale — see the PDF.

---

## A. Vision

**Two-layer metaphor:** underground fight club atmosphere (dark, raw, concrete) + neon tech overlay (pink accents, glow, data). Backgrounds = atmosphere. UI = function.

---

## B. Palette — CSS Variables

Source of truth: `/src/styles/hexlash-ui.css`

### Primary (brand pink)

```css
--hex-primary: #FF066F;
--hex-primary-light: #FF3D8E;
--hex-primary-dark: #A50344;
--hex-primary-glow: rgba(255, 6, 111, 0.5);
```

- **Rule:** One pink accent per screen. Pink = the single loudest element (CTA button, active state, key number). If everything is pink, nothing is pink.

### Backgrounds

```css
--hex-bg-deep: #050507;       /* deepest black: shadows, overlays, empty states */
--hex-bg-dark: #090909;       /* page background */
--hex-bg-medium: #111111;     /* panels, nav bar */
--hex-bg-light: #1A1A1A;      /* inputs, elevated surfaces */
--hex-bg-card: rgba(17, 17, 17, 0.85);  /* cards (semi-transparent) */
```

- **Rule:** Darker = further back. `bg-deep` → `bg-dark` → `bg-medium` → `bg-light` → `bg-card`. Never invert.

### Text

```css
--hex-text-primary: #FFFFFF;             /* headings, key values */
--hex-text-secondary: rgba(255,255,255,0.6);  /* body text */
--hex-text-muted: rgba(255,255,255,0.35);     /* labels, hints, timestamps */
```

- **Rule:** 3 tiers only. No custom opacities. If you need emphasis — use `--hex-primary`, not a 4th white tier.

### Borders

```css
--hex-border-default: rgba(255,255,255,0.08);  /* resting cards */
--hex-border-active: rgba(255,255,255,0.15);   /* hover, focus */
--hex-border-strong: rgba(255,255,255,0.25);   /* selected, important */
--hex-border-hi: #4A4A50;                      /* accent border for hover/active neutral elements */
```

### Status

```css
--hex-success: #00FF88;
--hex-danger: #FF3333;
--hex-warning: #FFB800;
```

### Game status

```css
--hex-victory: #00FF88;    --hex-victory-bg: #1A3320;
--hex-defeat: #FF4444;     --hex-defeat-bg: #331010;
--hex-draw: #FFB800;       --hex-draw-bg: #332B08;
--hex-info: #4DA6FF;       --hex-info-bg: #081833;
```

### Branches (3)

```css
--hex-branch-speed: #00E5FF;       /* cyan */
--hex-branch-power: #FF066F;       /* pink = brand */
--hex-branch-technique: #A855F7;   /* purple */
```

Each has `-dark`, `-light`, `-glow` variants.

### Combat actions

```css
--hex-action-attack: #FF2D2D;
--hex-action-defense: #4DA6FF;
--hex-action-position: #A855F7;
```

### Dice effects (6)

```css
--hex-dice-heal: #00FF88;       --hex-dice-adrenaline: #FF9100;
--hex-dice-shield: #4DA6FF;     --hex-dice-blind: #E040FB;
--hex-dice-rage: #FF1744;       --hex-dice-crit: #FFD600;
```

### Mode colors

```css
--hex-mode-pve: #00E5FF;
--hex-mode-pvp: #FF066F;
--hex-mode-club: #00FF88;
```

### Belt System colors (12)

```css
--hex-belt-white: #F5F5F5;    --hex-belt-yellow: #FBBF24;
--hex-belt-orange: #FB923C;   --hex-belt-green: #22C55E;
--hex-belt-blue: #60A5FA;     --hex-belt-purple: #A855F7;
--hex-belt-brown: #8B4513;    --hex-belt-red: #DC2626;
--hex-belt-black: #0A0A0A;    --hex-belt-hexmaster: var(--hex-primary);
--hex-belt-stripe: #FFFFFF;   --hex-belt-outline: rgba(255, 255, 255, 0.25);
```

Belt colors are a **separate namespace** from archetype colors. One belt color per screen as accent (same as one pink accent rule).

---

## C. Archetypes — 6 Colors

| Archetype | Base | CSS var |
|-----------|------|---------|
| Predator | #FF2D2D | `--hex-arch-predator` |
| Sentinel | #4DA6FF | `--hex-arch-sentinel` |
| Ghost | #B44DFF | `--hex-arch-ghost` |
| Analyst | #00FF88 | `--hex-arch-analyst` |
| Maverick | #FFB800 | `--hex-arch-maverick` |
| Juggernaut | #FF6B1A | `--hex-arch-juggernaut` |

Each has 5 variants: base, `-dark`, `-light`, `-bg`, `-glow`.

**Rule:** Archetype colors appear ONLY in:
- Fighter icon/avatar border or glow
- Active archetype context (selected build slot, agent card in focus)
- Small accent (badge dot, thin left border on archetype card)

❌ Never use archetype color as page background, full card fill, or button fill.
❌ Never mix two archetype colors on one element.

Usage in components:
```vue
<HexButton variant="archetype" archetype-color="var(--hex-arch-predator)">Attack</HexButton>
<HexCard variant="active" archetype-color="var(--hex-arch-sentinel)">...</HexCard>
```
Internally sets `--_arch-color` CSS custom property.

---

## D. Typography — Three Voices

| Voice | Font | Usage | CSS |
|-------|------|-------|-----|
| **Display** | `Anonymous` | Titles, headings, logo, section labels, uppercase UI | `font-family: 'Anonymous', 'Courier New', monospace` |
| **Data** | `AnonymousBalance` | Numbers: HP, XP, taps, ELO, balance, damage, timers | `font-family: 'AnonymousBalance', 'Courier New', monospace` |
| **Body** | System sans-serif | Body text, descriptions, compact buttons | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |

**Rules:**
- Anonymous (pixel-font) = impact moments only. Titles, fight labels, key stats. NOT for body text or descriptions.
- AnonymousBalance = any number the player tracks. Always.
- Body = everything else. Default choice when unsure.

### Font sizes (from CSS)

| Token | Size |
|-------|------|
| `--hex-font-size-xs` | 10px |
| `--hex-font-size-sm` | 12px |
| `--hex-font-size-md` | 14px |
| `--hex-font-size-lg` | 16px |
| `--hex-font-size-xl` | 20px |
| `--hex-font-size-xxl` | 24px |
| `--hex-font-size-giant` | 32px |
| `--hex-font-size-huge` | 48px |

---

## E. Spacing

Base: 4px. Tokens from CSS:

| Token | Value |
|-------|-------|
| `--hex-spacing-xs` | 4px |
| `--hex-spacing-sm` | 8px |
| `--hex-spacing-md` | 16px |
| `--hex-spacing-lg` | 24px |
| `--hex-spacing-xl` | 32px |
| `--hex-spacing-xxl` | 48px |

Utility classes: `.hex-mt-sm`, `.hex-mt-md`, `.hex-mt-lg`, `.hex-mb-sm`, `.hex-mb-md`, `.hex-mb-lg`, `.hex-gap-sm`, `.hex-gap-md`, `.hex-gap-lg`.

### Border radius

| Token | Value |
|-------|-------|
| `--hex-radius-sm` | 4px |
| `--hex-radius-md` | 8px |
| `--hex-radius-lg` | 12px |
| `--hex-radius-xl` | 16px |
| `--hex-radius-round` | 50% |

---

## F. Cards — 5 Variants

| Variant | When | Visual |
|---------|------|--------|
| **default** | Generic content | `--hex-bg-card`, `--hex-border-default`, `--hex-radius-lg` |
| **elevated** | Important panel | Same + `--hex-shadow-elevated` |
| **archetype** | Fighter/agent context | Left border 3px in archetype color |
| **active** | Selected/focused item | Tinted bg + archetype color border |
| **result** | Fight outcome | Top border: `--hex-victory`/`--hex-defeat`/`--hex-draw` |

Component: `HexCard.vue`. Slots: default, header, footer. Padding prop: none/sm/md/lg.

Interactive cards add `.hex-card-interactive` (hover → pink border + glow).
Locked cards: `.hex-card-locked` (opacity 0.5, grayscale 50%).

---

## G. Buttons — 4 Types + Sizes

| Type | When | Visual |
|------|------|--------|
| **primary** | Main CTA (1 per screen) | Pink fill, white text, glow |
| **secondary** | Secondary actions | Pink outline, pink text → fill on hover |
| **ghost** | Tertiary, dismiss, cancel | Muted border → pink on hover |
| **danger** | Destructive actions | Red accent (use via HexButton `variant="danger"`) |

Component: `HexButton.vue`. Also supports `variant="archetype"` with `archetypeColor` prop.

| Size | Class | Padding |
|------|-------|---------|
| sm | `.hex-btn-sm` | 8px 16px |
| md | (default) | 16px 24px |
| lg | `.hex-btn-lg` | 24px 32px |
| full | `.hex-btn-full` | width: 100% |

**Rules:**
- ✅ One primary button per screen/modal
- ✅ Disabled = `opacity: 0.5; cursor: not-allowed`
- ❌ Never two primary buttons side by side
- ❌ Never use pink fill for non-CTA elements

---

## H. Icons — Line Style

**Style:** Line icons (Lucide-compatible). Inline SVG or `<img>` with filter.
**PixelIcon system:** Exists in code (`PixelIcon.vue`, `pixelIcons.js`) but currently unused by app. Preserved for future.

Sizes used in project:
- 16px — inline with text, badges
- 20px — buttons, nav items
- 24px — section headers, standalone
- 32px+ — hero/empty states

**Rule:** Icons are `--hex-text-secondary` by default, `--hex-primary` when active.

---

## I. Glow

### Where glow is allowed ✅

- Primary CTA button (`.hex-glow-sm`)
- Active/selected card border
- Active nav item
- Modal border (`--hex-shadow-modal`)
- Hero elements (fight title, victory screen)
- Avatar border in clan header

### Where glow is forbidden ❌

- Body text
- Every card on a list (only the selected one)
- Disabled elements
- Background surfaces
- More than 2 glowing elements visible at once

### Glow tokens

```css
--hex-glow-sm: 0 0 10px var(--hex-primary-glow);
--hex-glow-md: 0 0 20px var(--hex-primary-glow);
--hex-glow-lg: 0 0 30px var(--hex-primary-glow), 0 0 60px var(--hex-primary-glow);
```

---

## J. Animations — 6 Base Timings

| Token | Duration | Use |
|-------|----------|-----|
| `--hex-transition-fast` | 0.15s ease | Hover, press, toggle |
| `--hex-transition-normal` | 0.25s ease | State change, progress bar |
| `--hex-transition-slow` | 0.4s ease | Page transition, modal |

### Keyframe animations

| Class | Animation | Duration |
|-------|-----------|----------|
| `.hex-animate-fade-in` | Fade + slide up 10px | 0.3s |
| `.hex-animate-scale-in` | Fade + scale from 0.9 | 0.3s |
| `.hex-animate-pulse` | Scale pulse 1→1.05 | 1s infinite |
| `.hex-pulse` | Opacity pulse 1→0.6 | 1.5s infinite |
| `.hex-glow-pulse` | Box-shadow pulse | 2s infinite |
| `.hex-float-up` | Float up + fade out | 0.8s forwards |

### Vue transitions

- `hex-fade` — opacity 0.3s (modals, overlays)
- `hex-slide-up` — opacity + translateY 20px 0.3s (toasts, bottom sheets)

### Hover/press utilities

- `.hex-hover-brighten` — `filter: brightness(1.15)` on hover
- `.hex-hover-lift` — `translateY(-1px)` on hover
- `.hex-press` — `scale(0.97)` on `:active`

**Rules:**
- ✅ Transitions on every interactive element
- ❌ No animation >0.5s for UI state changes
- ❌ No bounce/elastic easing (feels gamey, not underground)
- ❌ Never animate more than 2 properties simultaneously (use `will-change`)

---

## K. States — Loading / Empty / Error / Success / Disabled

| State | Pattern |
|-------|---------|
| **Loading** | `.hex-pulse` on skeleton placeholder OR spinner inside HexButton (`loading` prop) |
| **Empty** | Icon (32px+, `--hex-text-muted`) + title (Anonymous, `--hex-text-secondary`) + description (body, `--hex-text-muted`) + CTA button |
| **Error** | `--hex-danger` accent. Toast via `Error.vue` (text interpolation, NOT v-html). Inline: red border + message |
| **Success** | `--hex-success` accent. Toast via `Info.vue`. Brief, auto-dismiss |
| **Disabled** | `opacity: 0.5; cursor: not-allowed; pointer-events: none`. No glow, no hover |

---

## L. TOP-10 Bans (Anti-patterns)

| # | ❌ DON'T | ✅ DO INSTEAD |
|---|---------|--------------|
| 1 | Use legacy `--pink`, `--dark`, `--gray*` vars | Use `--hex-*` vars exclusively |
| 2 | Hardcode colors (`#FF066F`, `rgba(...)` inline) | Use CSS variable tokens |
| 3 | Make everything pink / multiple pink CTAs | One pink accent per screen |
| 4 | Use Anonymous font for body text or descriptions | Anonymous = titles/labels only. Body = system sans |
| 5 | Apply glow to every card in a list | Glow on selected/active element only |
| 6 | Use `v-html` for user-supplied or error content | Text interpolation `{{ }}`. v-html only for trusted i18n |
| 7 | Invent custom opacity/color values | Use the 3-tier text system + defined status colors |
| 8 | Add bounce/elastic animations | Use `ease` only. Underground, not cartoon |
| 9 | Skip disabled/loading/empty states | Every interactive element needs all states |
| 10 | Use archetype colors as fills/backgrounds for non-fighter elements | Archetype color = icons, borders, small accents in fighter context only |

---

## Additional Tokens (defined in hexlash-ui.css, available for use)

These are not primary design tokens but cover practical gaps.

### Shadows

```css
--hex-shadow-card: 0 4px 20px rgba(0, 0, 0, 0.5);       /* default card elevation */
--hex-shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.7);    /* elevated panels, popovers */
--hex-shadow-modal: 0 0 40px var(--hex-primary-glow), 0 20px 60px rgba(0, 0, 0, 0.8);  /* modal overlays */
```

### Blur (for backdrop-filter)

```css
--hex-blur-sm: blur(5px);
--hex-blur-md: blur(10px);
--hex-blur-lg: blur(20px);
```

### Misc

```css
--hex-border-width: 2px;   /* default border width for consistency */
--hex-line-height: 1.5;    /* default body text line-height */
```

### Font aliases (defined in CSS, used only by hexlash-ui.css utility classes, NOT by .vue components)

```css
--hex-font-display: 'Impact', 'Anton', 'Bebas Neue', sans-serif;       /* NOT Anonymous — hex-title-* classes only */
--hex-font-body: 'Inter', 'Roboto', 'SF Pro', -apple-system, sans-serif; /* NOT the system sans stack used in .vue files */
--hex-font-mono: 'JetBrains Mono', 'Fira Code', monospace;              /* NOT AnonymousBalance — hex utility classes only */
```

**Important:** .vue components use `'Anonymous'`, `'AnonymousBalance'`, and `-apple-system, BlinkMacSystemFont...` directly. These CSS aliases are a parallel system in hexlash-ui.css utility classes that components don't reference. Do NOT substitute one for the other.

---

## M. Screen Readiness Checklist

Before marking a screen done, verify:

- [ ] All colors use `--hex-*` variables (zero hardcoded values)
- [ ] Text hierarchy: max 3 tiers (`primary` / `secondary` / `muted`)
- [ ] One pink CTA maximum
- [ ] Numbers in `AnonymousBalance`, titles in `Anonymous`, body in system sans
- [ ] Cards use `HexCard` variants (not raw divs with ad-hoc styles)
- [ ] Buttons use `HexButton` or `.hex-btn-*` classes
- [ ] Loading state exists (skeleton or spinner)
- [ ] Empty state exists (icon + title + description + CTA)
- [ ] Error state exists (toast or inline)
- [ ] Disabled elements: opacity 0.5, no glow, no hover
- [ ] No glow on more than 2 elements at once
- [ ] Animations use `--hex-transition-*` tokens
- [ ] Responsive: works at 320px min-width, tested at 360px breakpoint
- [ ] `100dvh` for full-height screens
- [ ] No `v-html` with user/error data
- [ ] Scoped styles in component (no global leaks)

---

## N. File Map

| File | Purpose |
|------|---------|
| `/src/styles/hexlash-ui.css` | All CSS variables, utility classes, base component styles |
| `/src/assets/colors.css` | **LEGACY** — only used by PrivacyView. Do NOT use in new code |
| `/src/assets/main.css` | Global resets |
| `/src/components/ui/HexButton.vue` | Button component (5 variants) |
| `/src/components/ui/HexCard.vue` | Card component (5 variants) |
| `/src/components/ui/HexProgress.vue` | Progress bar (hp/branch/generic) |
| `/src/components/ui/HexBadge.vue` | Badge (archetype/branch/status/counter) |
| `/src/components/ui/PixelIcon.vue` | Pixel icon renderer (preserved, currently unused) |
| `/src/data/pixelIcons.js` | 45 pixel icon data (preserved, currently unused) |

---

> **Version:** Neon Discipline v1.0
> **Full guide:** Hexlash_Visual_System.pdf v1.0
> **This file:** operational extract for Claude Code. When in doubt — check the PDF.
