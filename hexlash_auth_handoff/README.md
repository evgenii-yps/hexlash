# Hexlash — Auth Screen (visual reference for Vue build)

One screen, login + sign-up together (no Login/Sign-up tabs). The moment after
**PLAY** — "you're among the first." Calm confidence, not a wall of buttons.
Dark, tactical, one pink strike. Consistent with the Hexlash landing + brandbook.

---

## Files

| File | What it is |
|------|------------|
| `Hexlash Auth.html` | **Main deliverable.** A pan/zoom design canvas: one live interactive frame + every state frozen side-by-side + a spec sheet. Open this. |
| `preview.html` | Single full-screen render of the component, no canvas chrome. `?v=` selects the state: `live` · `default` · `more` · `email-empty` · `email-focus` · `email-filled` · `email-error`. |
| `auth_screen.jsx` | The `AuthScreen` React component — all states, styles, validation, state machine. **The thing to port to Vue.** |
| `auth_parts.jsx` | Brand mark (`HexMark`) + monochrome icon set (Google, X, Wallet, Farcaster, Discord, Email, chevrons, ticket). |
| `design-canvas.jsx`, `tweaks-panel.jsx` | Presentation/scaffolding only — **not** part of the product. Ignore for the Vue build. |
| `reference/Hexlash Brandbook.html` | The brand book these tokens come from. |

> Loads React + Babel from CDN purely so this reference runs by double-click.
> The production build re-implements `AuthScreen` natively in Vue — copy the
> markup, tokens and logic, drop React/Babel.

---

## States (all in `Hexlash Auth.html`)

1. **Default** — methods: `GOOGLE`, `X`, `WEB3 WALLET`, `MORE OPTIONS ›`
2. **More options** — `‹ BACK`, then `EMAIL`, `FARCASTER`, `DISCORD`
3. **Email** — our native field. Sub-states: **empty / focus / filled / error**
   - placeholder `your@email.com`, `Submit` button, fine print (Terms / Privacy)
   - focus → pink border + glow · filled (valid) → pink Submit · error → red border + message
4. **Provider stub** — clicking Google / X / Wallet / Farcaster / Discord / Referral / Guest
   opens a thin *"External · Privy"* placeholder. **Do not design this** — real input
   lives in the third-party (Privy) modal. The only native field we own is **Email**.
5. **Success** — valid email Submit → "Magic link sent" toast.

Validation regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

## Design tokens

### Color (from brandbook)
| Token | Value | Use |
|-------|-------|-----|
| Lash Pink | `#FF0069` (rgb 255,0,105) | **Accent — submit + field focus ONLY.** One per screen. |
| Void | `#08080A` | Page background |
| Carbon | `#0D0A0D` | Canvas / surface |
| Bone | `#F6F4F6` | Primary text |
| Ash | `#6E6A72` | Muted / meta / labels |
| Line | `rgba(255,255,255,.08)` | Hairline borders |
| Line-2 | `rgba(255,255,255,.14)` | Hover border / referral dashed |
| Panel | `rgba(255,255,255,.022)` | Card fill |
| Field | `rgba(255,255,255,.03)` | Inputs / method buttons |
| Error | `#D6534C` | **Email validation only** — not in brandbook, added here, kept restrained |
| Ember glow | `radial-gradient(120% 78% at 50% -14%, #160A11 0%, #0B070A 44%, #08080A 78%)` | Backdrop wash |

Alt accents (Volt Cyan `#00E5FF`, Hex Purple `#B026FF`, Acid Green `#39FF14`) are
**event re-skins only** — exposed in the Tweaks panel for exploration, not for prod.

### Type (from brandbook)
- **Saira Condensed** — display. `WELCOME` = 800 / 34px / uppercase / .02em
- **JetBrains Mono** — all UI: button labels (12.5px, .16em, uppercase), subtitle
  (10.5px, .24em), fine print (10.5px), footer (10px, .18em)

### Sizes
| Element | Value |
|---------|-------|
| Card width | 364–372px (default 372) |
| Card radius | 16px · padding 34/30/30 (top 50 when BACK shown) |
| Method button | height 52 · radius 10 |
| Email field row | height 54 · radius 11 |
| Submit | height 42 · radius 8 |
| Referral button | height 46 · dashed border |
| Footer bar | height 54 |

### Logo
Faceted **hex-aperture** mark (6 interlocked blades + inner hex ring + center hex) —
same mark as the live landing header / loading screen. **Monochrome, no glow** (the
logo's territory is separate from the neon). Geometry is parametric in
`auth_parts.jsx → HexMark`. Note: the brandbook *file* draws a different "primary"
mark (nested hex + Y-strike); this screen follows the live product logo per the brief.

---

## Layout (top → bottom)
Logo (centered, above card) → Card (WELCOME / subtitle / option list) →
`I have a referral code` (under card) → `Play as Guest` (quiet link) →
Footer (left: Privacy Policy / Terms of Use · right: X / Discord icons).

No viewfinder corner brackets — removed, per owner preference. Clean card.

---

## Tweaks panel (exploration only, strip for prod)
Accent color · Glow on/off · Hex lattice motif on/off · Card width · Headline copy.
