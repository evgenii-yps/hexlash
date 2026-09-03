# Handoff: Mode Select (PVE / PVP fork)

## Overview
**Mode Select** is the fork that opens when the player presses **FIGHT** on home.
It sits between FIGHT and the existing Core Select screen:

```
FIGHT → Mode Select → ┬ PVE → Training (passive growth)
                      └ PVP → Core Select → Arena
```

Two large clickable "doors" — **PVE (Training)** and **PVP (Arena)** — each a
preview into its world. The screen is a deliberate sibling of **Core Select**:
same void background, same matte top chrome, same Saira/JetBrains type. EN-only.

## About the Design Files
The file in this bundle (`Hexlash Mode Select.html`) is a **design reference
created in HTML** — a prototype showing intended look and behavior, **not
production code to copy directly**. The task is to **recreate this design in the
Hexlash codebase** (the shell is Vue, per the existing handoffs) using its
established components and patterns — reuse the real `TopBar`, HUD frame, fonts,
and tokens rather than re-deriving them.

The prototype renders three frames on a pannable canvas for review only —
**Desktop**, **Mobile**, and a **Palette & Discipline** spec card. Only the
Desktop/Mobile screen is the deliverable; the spec card is documentation. In the
prototype both frames share one markup template (`SCREEN`) injected via JS, with
**CSS container queries** driving the responsive layout — port that as a single
responsive component.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, emblems, and interaction
states. Recreate pixel-accurately using the codebase's existing shell primitives.

## Screens / Views

### Mode Select
- **Name:** Mode Select (`/play/mode` — suggested route)
- **Purpose:** Player chooses PVE or PVP after pressing FIGHT.
- **Layout:**
  - Fullscreen game surface on **Void** (`#08080A`) with one soft top ember halo
    (`radial-gradient(95% 52% at 50% -6%, rgba(255,0,105,.10), transparent 58%)`)
    plus a faint, edge-masked 58px discipline grid at `opacity:.28`.
  - **Top chrome bar** (matte, shared with home): height **64px**, padding `0 26px`,
    bottom hairline. Contains **only the brand lockup** on the left
    (hex mark 26px + `HEXLASH` wordmark + `SEASON 0` segment). No utility cluster,
    no glow. *(The original shop/balance/cabinet cluster was removed for this screen.)*
  - **Work area:** padding `84px 40px 38px` (mobile `78px 18px 30px`).
    - **Back** affordance top-left: mono, `← Back`, unobtrusive, color `--ink-dim`,
      arrow nudges left on hover. No second CTA anywhere.
    - **Headline:** `Choose your mode.` (Saira 900, uppercased via CSS,
      `clamp(34px,6cqi,62px)`, line-height `.88`). The word `mode.` is `<em>` →
      pure white with a soft pink text-shadow. A **1px hairline divider** sits
      directly below (the head block's `border-bottom`). No eyebrow, no counter.
    - **The two doors:** `.panels` grid. `1fr` single column on narrow widths;
      **`1fr 1fr` side-by-side at container width ≥ 760px**. Gap 16px. Doors fill
      remaining height (`flex:1`, `grid-auto-rows:1fr` when stacked).
  - **Watermark:** bottom-center mono `HEXLASH · MODE SELECT · CONTENT IS STUB`,
    color `#37353c`.
  - **No HUD corner brackets** on this screen and **no corner ticks** on the panels.

- **Components:**

  **Top chrome — brand lockup**
  - Hex mark `26×26`, color `--ink` (`#EDEDF1`). Nested-hexagon + Y-strike (the
    shared brand mark — reuse the existing asset).
  - Wordmark `HEXLASH`: Saira 900, 21px, `letter-spacing:.03em`, uppercase.
  - Segment `SEASON 0`: JetBrains Mono 9.5px, `letter-spacing:.26em`, `--ink-dim`,
    left hairline divider, `0` is `#bdbac2`.

  **Door panel (PVE & PVP)** — one big `<button>`, the entire surface is the click target.
  - Container: `background: linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.006)), var(--panel)` over **Panel** `#16161B`; `1px` hairline border; padding `clamp(18px,2.4cqi,26px) clamp(20px,2.6cqi,30px)`.
  - **Fight-card chevron clip-path** (bottom-right notch): `polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%)`.
  - **Eyebrow** (top strip, mono 10.5px, `letter-spacing:.24em`, uppercase, in the
    panel accent): `TRAINING` (PVE) / `ARENA` (PVP), preceded by a 5px rotated
    accent diamond.
  - **Emblem stage** (center, flex:1): faceted hex emblem ~`clamp(118px,42%,210px)`
    wide, plus a hidden radial **bloom** behind it (`--p-halo`) that only appears on
    hover/armed (`opacity 0 → .9`, `blur(20px)`, `mix-blend-mode:screen`). **Max one
    bloom per panel.**
  - **Title:** `PVE` / `PVP` — Saira 900, `clamp(40px,7cqi,72px)`, line-height `.84`,
    uppercase. Gains a soft accent text-shadow when lit.
  - **Subtitle:** Saira 500, `clamp(15px,1.9cqi,19px)`, color `#b6b2bc`.
    - PVE: `Your legend raises the club.`
    - PVP: `Pick a core. Step in.`
  - **Foot row** (mono 10.5px, `letter-spacing:.16em`, uppercase, top hairline):
    - Telemetry note (left), `--ink-dim` with accent `<b>`:
      - PVE: `Passive · watch or walk away`
      - PVP: `Core select · arena`
    - **Enter affordance** (right): `ENTER →`, color `#9b97a1` → accent on hover,
      arrow translates `+5px`. This is an affordance inside the door, **not** a
      separate CTA.
  - **Accent bar:** full-width `3px` strip pinned to the panel bottom; `--line3`
    (`#2a2a31`) at rest → solid accent + glow when lit.

  **Emblems** (faceted, low-poly, authored in a `0 0 64 64` SVG box; outer shell
  is the shared brand hexagon):
  - **PVE — amber legend over the stage:** nested hex shell + a small floating
    low-poly figure (diamond body + head, class `.lift`) hovering above a stage
    **slab** baseline with two small roster marks. Reads as the legend training
    the roster.
  - **PVP — pink arena rift:** nested hex shell + a jagged glowing **rift**
    polyline splitting it vertically (class `.rift`), flanked by two opposing
    collision chevrons and a small center seed dot.
  - Stroke classes: `.hx` (hex shell), `.fc` (facets/glyph), `.sd` (seed/fill).
    At rest strokes are muted (`color-mix` of accent into `--ink-dim`); when lit
    they shift toward white tinted with accent and gain width/glow.

## Interactions & Behavior
- **Hover / focus:** panel lifts `translateY(-5px)`; border → `rgba(accent,.5)`;
  background gains a faint accent tint; emblem strokes ignite; the single bloom
  fades in; accent bar lights with glow; `ENTER →` arrow nudges. Keyboard focus is
  **visibly** ringed: `outline:2px solid rgba(accent,.85); outline-offset:3px`.
- **Pressed (`:active`):** `translateY(-1px) scale(.992)` — a slight settle.
- **Armed (selected on click):** persistent lit state on the clicked door, siblings
  cleared. The foot note swaps to `Routing → TRAINING` / `Routing → CORE SELECT`.
- **Motion** (`prefers-reduced-motion: no-preference` only):
  - PVE floating figure: `float` 2.6s ease-in-out (translateY ±2.4px) while lit.
  - PVP rift: `riftPulse` 1.6s ease-in-out (opacity .7↔1) while lit.
  - Transitions: panel transform `.22s cubic-bezier(.34,1.4,.5,1)`; color/bg
    `.3s cubic-bezier(.4,.05,.1,1)`; bloom `.4s`.
- **Navigation contract (implement in the real router):**
  - PVE click → `router.push('/play/training')`
  - PVP click → `router.push('/play/core-select')`  (existing Core Select screen)
  - Back → `router.push('/home')`
  - Prototype stubs these as an armed state + `localStorage('hex.prefight.mode')`
    so the review canvas stays put — replace with real navigation.

## State Management
- `mode: 'pve' | 'pvp' | null` — the chosen door (drives the armed state).
- On select: set `mode`, route per the contract above. No data fetching on this
  screen.

## Responsive Behavior
- Layout is driven by **container width**, not viewport (the prototype uses
  `container-type: inline-size` so two frames can coexist on the review canvas).
  Port as a single responsive screen:
  - **≥ 760px:** doors **side-by-side 50/50**, full height.
  - **< 760px:** doors **stacked**, full-width, tall (each `1fr` of the column).
  - **≤ 560px:** tighter work-area padding (`78px 18px 30px`).
- Fluid type uses `cqi`/`clamp` — substitute `vw`/breakpoints if the codebase
  doesn't use container queries.

## Design Tokens

**Color**
| Token | Hex | Role |
|---|---|---|
| Void | `#08080A` | Background |
| Panel | `#16161B` | Door / surface |
| Ink | `#EDEDF1` | Text |
| Ink Dim | `#5D5D66` | Meta / mono |
| Amber | `#FFB21D` | **PVE accent — this door only** |
| Hexlash Pink | `#FF0069` | **PVP accent + neutral system pink** |
| Line | `rgba(255,255,255,.08)` | Hairline |
| Line 2 | `rgba(255,255,255,.16)` | Stronger hairline / focus |
| Line 3 | `#2a2a31` | Accent bar (rest) |

**Type**
- Display / impact: **Saira Condensed** (700–900, uppercase) — `PVE`, `PVP`, headline.
- Telemetry / eyebrow / notes: **JetBrains Mono** (400–700, tracked wide).
- Load: `Saira+Condensed:wght@400;500;600;700;800;900` + `JetBrains+Mono:wght@400;500;700`.

**Easing**
- `--ease: cubic-bezier(.4,.05,.1,1)`
- `--spring: cubic-bezier(.34,1.4,.5,1)`

## Discipline (the points handoffs usually break)
- Background stays **neutral dark** — never flood a door with saturated color.
- **One accent per door:** PVE = amber, PVP = pink. Never both, never mixed, never
  a core color.
- Accent lives on **rim · glyph · eyebrow · hover bloom** — not a solid fill.
- **Max one soft bloom per panel**, on hover/armed. At rest the screen is calm.
- Top chrome bar is **matte** — no glow.
- The whole panel is one click target. **No second CTA.**

## Assets
- **Brand hex mark** — inline SVG (nested hexagon + Y-strike). Reuse the existing
  Hexlash mark asset from the shell rather than the inline copy here.
- **Door emblems** — original inline SVGs built from the brand hex vocabulary
  (PVE floating legend, PVP rift). Geometric, no raster assets.
- **Back / shop icons** — inline stroke SVGs.
- Fonts: Google Fonts (Saira Condensed, JetBrains Mono).

## Files
- `Hexlash Mode Select.html` — the prototype (this bundle). All CSS + JS inline.
- Reference siblings in the main project (not bundled): `select_handoff/Hexlash
  Core Select.html` (the screen PVP routes into) and the Vue shell
  (`design_handoff_hexlash_shell/`) for the real `TopBar`, tokens, and HUD frame.
