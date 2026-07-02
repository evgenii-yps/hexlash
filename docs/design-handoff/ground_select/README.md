# Handoff: Ground Select (Arena / Space)

## Overview
The battlefield fork in the pre-fight flow. After the player picks **PVP** on Mode Select, this screen asks *where* to fight: two large "doors" — **ARENA** (live, playable) and **SPACE** (coming soon, locked). Flow position: `FIGHT → Mode Select → PVP → Ground Select → Core Select`. It is a direct younger sibling of Mode Select, one level deeper, and must read as the same family.

## About the Design Files
`Hexlash Ground Select.html` is a **design reference created in HTML/CSS/JS** — a prototype showing the intended look and behavior, not production code to ship. The task is to **recreate this design in the target codebase** using its existing environment, patterns, and libraries (React/Vue/etc.). If no environment exists yet, pick the most appropriate framework and implement it there. The HTML mounts one `SCREEN` template into three canvas frames (desktop, phone-landscape, spec) — in production it is a single responsive screen; the three frames are just for review.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, states, and interactions. Recreate pixel-accurately using the codebase's design system where equivalent tokens exist.

## Screens / Views

### Ground Select (single responsive screen)
- **Purpose**: Player chooses the battlefield for a PVP match. ARENA proceeds to Core Select; SPACE is a locked teaser.
- **Layout**:
  - Full-bleed dark scene. No top chrome/nav bar.
  - Work area: flex column, padding `40px 40px 38px` desktop / `26px 18px 24px` at container width ≤ 560px.
  - Top: matte-chrome **← Back** pill (sole navigation), self-aligned left.
  - Headline block below back, separated by a 1px bottom hairline.
  - Doors: CSS grid, 1 column by default; **2 equal columns** at container width ≥ 720px, `gap: 16px`. Doors fill remaining height (`flex:1`).
  - Uses **container queries** (`container-type: inline-size` on `.scene`), not viewport media queries — the screen adapts to its own width. Phone-landscape (932×430) shows both doors side by side.

- **Components**:

  **Back pill (`.crumb`)**
  - Mono 11px, letter-spacing `.2em`, uppercase, color `#b6b2bc`.
  - Padding `9px 15px 9px 12px`, 1px border `rgba(255,255,255,.08)`, bg `rgba(255,255,255,.022)`, `backdrop-filter: blur(8px)`.
  - Left arrow icon 15px. Hover: color `#EDEDF1`, border `rgba(255,255,255,.16)`, bg `rgba(255,255,255,.05)`, arrow nudges left 3px.
  - Action: back to Mode Select.

  **Headline (`.head h1`)**
  - Saira Condensed 900, `clamp(34px, 6cqi, 62px)`, line-height `.88`, uppercase.
  - Text: `Choose your ground.` — the word **`ground.`** is wrapped in `<em>` (non-italic) and colored **INK `#EDEDF1`**, not pure white (matches `mode.` on Mode Select).

  **ARENA door (`.panel.arena`)** — the live door
  - Panel bg: `linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.006))` over `#16161B`; 1px border `rgba(255,255,255,.08)`.
  - Fight-card corner cut: `clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)`.
  - Two corner ticks (`.tick.tl/.tr`), 11px, 1px `#2a2a31`.
  - Emblem stage: centered SVG glyph (see Assets), `clamp(120px, 44%, 224px)` wide, plus a hidden radial `.p-halo` bloom.
  - Title `ARENA`: Saira 900, `clamp(40px, 7cqi, 72px)`, line-height `.84`, uppercase.
  - Sub: `Short. Sharp. Duel.` — Saira 500, `clamp(15px, 1.9cqi, 19px)`, color `#b6b2bc`.
  - Foot row (top 1px hairline): note `One on one · **core select**` (mono 10.5px, uppercase, "core select" in pink) and `ENTER →` affordance.
  - Bottom accent bar `.p-bar` 3px, `#2a2a31` at rest.
  - **States**:
    - *Rest*: calm, no bloom, muted glyph, no pink glow.
    - *Hover*: lift `translateY(-5px)`, border `rgba(255,0,105,.5)`, faint pink-tinted panel wash, halo bloom fades in (`opacity .95`), ticks + glyph ignite toward white, title gets `text-shadow 0 0 22px rgba(255,0,105,.42)`, ENTER + arrow turn pink and nudge right, accent bar turns pink with glow. Glyph chevrons pulse; center dot floats (reduced-motion aware).
    - *Armed* (after click): the hover-lit state holds; foot note swaps to `Routing → CORE SELECT`.
    - *Focus-visible*: `outline 2px rgba(255,0,105,.85)`, offset 3px.

  **SPACE door (`.panel.space`)** — locked teaser
  - Same shell/clip/ticks, slightly different matte bg: `linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.008))` over `#131318`.
  - `cursor: not-allowed`, `aria-disabled="true"`, all children `pointer-events:none`. Title/sub at `opacity .72`.
  - Title `SPACE`; sub `Big field. Last club standing.`
  - Foot note: `Many clubs · **locked**` (locked in `#8b8790`); ENTER slot reads `LOCKED` in `#57555c`.
  - **SOON badge** (`.soon`), top-right corner: mono 10px 700, letter-spacing `.28em`, color `#cfccd3`, padding `8px 14px`, glass bg `linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03))`, left+bottom 1px borders `rgba(255,255,255,.16)`, blur 6px; leading `#8b8790` diamond.
  - **NEVER pink, NEVER glows.** Hover = *only* a hairline chrome lift: border → `rgba(255,255,255,.34)`, ticks brighten, accent bar → `rgba(255,255,255,.16)`, glyph strokes/dots brighten slightly. No color, no bloom, no rise.
  - Click is a no-op stub.

## Interactions & Behavior
- **ARENA click**: clear `.armed` on sibling doors, add `.armed` to ARENA, swap foot note to `Routing → CORE SELECT`, persist `localStorage['hex.prefight.ground'] = 'arena'`. Production route: `router.push('/play/core-select')`.
- **SPACE click**: no-op (locked).
- **Back click**: `router.push('/play/mode-select')`.
- **Animations**: panel transitions `transform .22s spring, border/bg .3s ease`; halo `opacity .4s`; glyph strokes `.35s ease`. Springs: `cubic-bezier(.34,1.4,.5,1)`; ease: `cubic-bezier(.4,.05,.1,1)`. Idle glyph motion (`float`, `duelPulse`) gated behind `@media (prefers-reduced-motion: no-preference)`.
- **Discipline (hard rules — enforce in code review):**
  1. Pink `#FF0069` is the **only** accent and appears **only** on the ARENA door.
  2. **Exactly one bloom** on the whole screen: ARENA's halo, on hover/armed. Nothing glows at rest.
  3. SPACE never glows, never uses pink — matte chrome only (glass + hairline).

## State Management
- `ground: 'arena' | null` (selected door; armed state). Persist to storage key `hex.prefight.ground`.
- SPACE has no reachable state (locked constant).

## Design Tokens
- **Colors**: Void `#08080A` (bg), Panel `#16161B`, Space panel `#131318`, Ink `#EDEDF1`, Ink-dim `#5D5D66`, Pink `#FF0069` (rgb `255,0,105`), Chrome edge `rgba(255,255,255,.34)`. Lines: `rgba(255,255,255,.08)`, `rgba(255,255,255,.16)`, `#2a2a31`.
- **Scene bg**: top ember `radial-gradient(95% 52% at 50% -6%, rgba(255,0,105,.10), transparent 58%)` over a neutral void radial; faint 58px edge-masked grid at `opacity .28`.
- **Type**: Saira Condensed (display / door titles), JetBrains Mono (labels: SOON, foot notes, back). No pixel font.
- **Radius**: 0 (sharp; fight-card 18px corner via clip-path).
- **Accent bar**: 3px. **Corner cut**: 18px.

## Assets
All glyphs are inline SVG (0..64 viewBox), no external images:
- Shared hex shell (outer + inner hexagon), reused from the brand mark.
- **ARENA glyph**: a *closed, assembled* arena — inner hex floor ring + two chevrons colliding at a lit center dot (the duel). Contrast intent: "sealed / whole."
- **SPACE glyph**: a vast field in perspective (triangle field + receding rows) dotted with ~15 scattered "club" points of varying size — reads instantly as scale + many participants. Contrast intent: "open / torn."
- Back arrow icon: inline SVG.
- Fonts via Google Fonts (`Saira Condensed`, `JetBrains Mono`).

## Files
- `Hexlash Ground Select.html` — the design reference (this bundle).
- Sibling reference in the main project: `Hexlash Mode Select.html` — the structural parent; match its rhythm, spacing, door anatomy, and type.
