# Hexlash Home — design handoff (visual spec)

Source design package for the player **home screen** ("дом игрока"). These files
are the **visual specification** for chrome/layout/copy — they are NOT code to
port verbatim.

| File | Role | Ported? |
|---|---|---|
| `home_screen.jsx` | Home chrome: top bar, dock, nameplate, rail stubs, bind ribbon, decorate hook, three states (`empty` / `lived` / `arrange`), arrange tray. | Layout + copy reused (Vue rewrite). |
| `home_shop.jsx` | Decor shop view: cards, future tabs (skins/FX/cores) `SOON`. | Layout + copy reused. |
| `home.css` | Chrome styling. | Adapted to project tokens (`--hex-*`, Saira Condensed + JetBrains Mono). |
| `home_stage.jsx` | Flat SVG fighter + flat SVG floor + flat SVG props. | **NOT ported** — replaced by the real Three.js scene (arena slab + idle fighter). Prop silhouettes informed the 3D placeholder props + the `u/v` floor placement. |
| `Hexlash_Home.html` | Standalone preview shell. | Reference only. |

## Implementation notes (what shipped vs the spec)

- **3D scene** reuses the arena builders (`buildArena`, `buildFighter`) unmodified.
  The combat **rift glow is suppressed** (no `arenaPresence`, rift-glow materials
  hidden, sparks off) for a calm rift-less slab — "the same slab, without the
  combat rift". Fixed 3/4 camera with a gentle sway, no orbit control.
- **Glow discipline (overrides the reference CSS):** only the 3D fighter **core**
  and the **FIGHT** button glow. Every other pink mark in `home.css` that carried
  a `box-shadow` (balance diamond, bind dot, arrange dot, price diamonds, BUY,
  active shop tab, place button) is rendered **matte solid**. The shop has zero glow.
- **Arrange + BUY are visual stubs** — the tray, snap-grid and ghost render, but
  placement does not persist and BUY purchases nothing. Floor props are a fixed
  default set per state, not player data.
- **$HEX buys cosmetics/decor only** — never combat power, training or progression.
