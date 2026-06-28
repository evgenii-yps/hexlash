# Mode Select — design handoff

The PVE / PVP fork shown after pressing **FIGHT** on the home (`/play/home`).
Implemented as `src/views-v2/ModeSelectView.vue` on the real project shell.

> ⚠️ **Source bundle note.** The original `Hexlash Mode Select.html` reference was
> **not present in the repo** when this screen was built, so the implementation was
> reconstructed from the written spec below (colours, layout, clip-path, copy,
> states, animations). The decorative **emblem internals** (PVE floating legend over
> a slab with roster marks; PVP ragged rift) are an interpretation of the written
> description — drop the original HTML here and they can be reconciled 1:1.

## Flow

```
/play/home  ──FIGHT──▶  /play/mode  ──┬─ PVE ─▶ /play/training   (stub)
                                      └─ PVP ─▶ /play             (core select)
        ◀── Back (mono ‹ Back) ─────────────── /play/home
```

Routes (`src/router/index.js`, children of `/play`): `V2ModeSelect` (`mode`) and
`V2Training` (`training`). Both are normal pre-fight screens — **no `meta.arena`,
no `requireCore`** (the fork must be reachable without a core, since PVP is where
a core-less player goes to pick one).

## Screen spec (as built)

- **Ground:** VOID `#08080A` + top ember halo
  `radial-gradient(95% 52% at 50% -6%, rgba(255,0,105,.10), transparent 58%)` +
  edge-masked discipline grid (58px cells, `opacity:.28`, radial mask).
- **Title:** `Choose your mode.` — Saira 900, uppercase, `clamp(34px, 6cqi, 62px)`,
  `line-height:.88`; the word `mode.` is an `<em>` in **INK `#EDEDF1`** with a soft
  pink `text-shadow` (the only pink glow on the heading). 1px hairline divider under.
- **Two doors** (`.panels`): one column under 760px container width, `1fr 1fr` at
  ≥760px, `gap:16px`, doors stretch full height. ≤560px viewport → tighter working
  zone padding `78px 18px 30px`. Container queries drive the grid + type scale; the
  ≤560px stage padding is a media query (the stage is itself the query container).
- **Each door** = one `<button>` (whole surface clickable). PANEL `#16161B` + hairline
  border + fight-card chevron
  `clip-path: polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%)`.
  Order: eyebrow · emblem · title · subtitle · foot row · accent bar.
  - **PVE** — eyebrow `TRAINING`, title `PVE`, sub `Your legend raises the club.`,
    foot `Passive · watch or walk away`, **accent amber `#FFB21D`**, emblem = floating
    legend over a slab with roster marks.
  - **PVP** — eyebrow `ARENA`, title `PVP`, sub `Pick a core. Step in.`,
    foot `Core select · arena`, **accent pink `#FF0069`**, emblem = ragged rift.
- **States:** `hover` / `focus-visible` (visible ring) / `active` / `armed` (brief
  committed state before navigation). At most **one bloom per door**, only on
  hover/armed. Idle motion under `@media (prefers-reduced-motion: no-preference)`:
  PVE `mode-float` 2.6s, PVP `mode-riftPulse` 1.6s.

## Brand-book deviations from the prototype (intentional)

- **Top bar:** the real shared `.hs-strip` (home.css) is reused verbatim — brand
  `LogoMark` 40px + `HEXLASH` + `SHOP` + cabinet chip — **not** the prototype's bare
  brand bar / 26px mark. **No `SEASON 0`.** Brand + SHOP → `/play/home` (the shop
  toggle lives on the home); cabinet chip opens the real `PlayerCabinet` drawer.
- **`mode.`** is INK `#EDEDF1` (not pure white `#fff`); soft pink text-shadow only.
- All intermediate prototype greys (`#cfccd3`, `#bdbac2`, `#a9a5af`, …) collapsed to
  the two tokens **INK `#EDEDF1`** / **INK DIM `#5D5D66`**.
- The prototype's `hex.prefight.mode` localStorage stub is **not** ported — real
  router navigation replaces it.
- Watermark, screen HUD corners and the second CTA are **not** ported.

## Discipline (do not break)

One accent per door (PVE amber / PVP pink, never together, never a core colour);
the scene's pink glow lives only on the PVP door + the system chrome (top ember);
at rest the screen is calm — no bloom, accent bars are `#2a2a31`; the top strip is
matte. Tokens defined on `.mode-root` mirror `.home-root` so the shared strip is
portable to this route without editing `home.css`.
