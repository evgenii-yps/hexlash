<!-- GroundSelectView — the ARENA / SPACE ground fork (/play/ground). Sits between
     the Mode Select PVP door and Core Select: after PVP the player chooses WHERE
     to fight — ARENA (live → /play, Core Select) or SPACE (locked, SOON). A normal
     2D pre-fight screen (no meta.scene3d / meta.arena — no 3D scene, so it never
     touches the sceneTransition layer). Younger sibling of ModeSelectView, one
     level deeper — same void, same fight-card doors, same type.

     Recreated 1:1 from the design handoff
     (docs/design-handoff/ground_select/Hexlash Ground Select.html). Port notes:
       · single pink = the PROJECT token var(--hex-primary) (#FF0069, inherited
         from the .app-v2 scope AppV2 wraps this route in). No second pink, no
         --pink-rgb: pink-with-alpha is composed via color-mix(... transparent).
       · real router navigation replaces the prototype's
         localStorage['hex.prefight.ground'] stub (dead — not ported).
       · the prototype's three-frame review scaffold, watermark ("CONTENT IS
         STUB") and the dead .hud corner brackets / .eye / .meta are NOT ported
         (same convention as Mode Select). Fonts (Saira Condensed / JetBrains
         Mono) are already loaded by the project — no Google Fonts <link>.
       · SPACE glyph is field + receding rows + 15 club dots, per the handoff's
         SPACE-glyph spec (the prototype's shared hex shell is unstyled on SPACE —
         it renders as a black artifact — so it is omitted here; ARENA keeps it).

     Discipline (hard): pink is the ONLY accent and appears ONLY on the ARENA door;
     exactly ONE bloom on the whole screen — ARENA's halo, on hover/armed; nothing
     glows at rest; SPACE never glows, never pink — matte chrome only (glass +
     hairline). -->
<template>
  <div class="ground-root">
    <div class="ground-bg" aria-hidden="true"></div>
    <div class="ground-grid" aria-hidden="true"></div>

    <!-- work area — no top chrome bar, only the matte ← Back pill -->
    <main class="ground-stage">
      <button type="button" class="ground-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6" /></svg>
        <span>Back</span>
      </button>

      <header class="ground-head">
        <h1 class="ground-title">Choose your <em>ground.</em></h1>
      </header>

      <div class="grounds">
        <!-- ───────── ARENA — live, the sole accent & bloom ───────── -->
        <button
          type="button"
          class="door is-arena"
          :class="{ 'is-armed': armed === 'arena' }"
          aria-label="Arena — short, sharp, duel"
          @click="pickArena"
        >
          <span class="door-tick tl" aria-hidden="true"></span>
          <span class="door-tick tr" aria-hidden="true"></span>

          <div class="door-stage">
            <div class="door-halo" aria-hidden="true"></div>
            <div class="door-glyph" aria-hidden="true">
              <!-- a closed, assembled hex arena: floor ring + two chevrons meeting a lit core -->
              <svg viewBox="0 0 64 64">
                <polygon class="g-hx" points="32,5 55,18.5 55,45.5 32,59 9,45.5 9,18.5" />
                <polygon class="g-hx d" points="32,13 47,21.5 47,42.5 32,51 17,42.5 17,21.5" />
                <polygon class="g-fc d" points="32,20 43,26.5 43,37.5 32,44 21,37.5 21,26.5" />
                <g class="g-duel">
                  <polyline class="g-fc" points="24,27 30,32 24,37" />
                  <polyline class="g-fc" points="40,27 34,32 40,37" />
                </g>
                <circle class="g-sd" cx="32" cy="32" r="2.6" />
              </svg>
            </div>
          </div>

          <div class="door-body">
            <div class="door-title">ARENA</div>
            <div class="door-sub">Short. Sharp. Duel.</div>
          </div>

          <div class="door-foot">
            <span v-if="armed === 'arena'" class="door-note">Routing <b>→ CORE SELECT</b></span>
            <span v-else class="door-note">One on one · <b>core select</b></span>
            <span class="door-enter">ENTER <i>→</i></span>
          </div>

          <span class="door-bar" aria-hidden="true"></span>
        </button>

        <!-- ───────── SPACE — locked teaser, matte chrome, never glows ───────── -->
        <button
          type="button"
          class="door is-space"
          aria-disabled="true"
          aria-label="Space — big field, last club standing. Coming soon."
          @click="pickSpace"
        >
          <span class="door-badge">SOON</span>
          <span class="door-tick tl" aria-hidden="true"></span>
          <span class="door-tick tr" aria-hidden="true"></span>

          <div class="door-stage">
            <div class="door-glyph" aria-hidden="true">
              <!-- a vast field in perspective, dotted with many scattered clubs -->
              <svg viewBox="0 0 64 64">
                <polygon class="g-field" points="32,17 52,50 12,50" />
                <polyline class="g-field d" points="17,42 47,42" />
                <polyline class="g-field d" points="21,34 43,34" />
                <polyline class="g-field d" points="25,26 39,26" />
                <circle class="g-club s" cx="20" cy="24" r="1.7" />
                <circle class="g-club s" cx="31" cy="21" r="1.4" />
                <circle class="g-club" cx="42" cy="25" r="1.7" />
                <circle class="g-club" cx="26" cy="30" r="2.1" />
                <circle class="g-club s" cx="38" cy="31" r="1.6" />
                <circle class="g-club s" cx="48" cy="32" r="1.4" />
                <circle class="g-club s" cx="16" cy="34" r="1.5" />
                <circle class="g-club" cx="32" cy="36" r="2.4" />
                <circle class="g-club" cx="45" cy="39" r="1.7" />
                <circle class="g-club s" cx="22" cy="41" r="1.5" />
                <circle class="g-club" cx="36" cy="43" r="1.9" />
                <circle class="g-club s" cx="50" cy="44" r="1.4" />
                <circle class="g-club s" cx="29" cy="47" r="1.7" />
                <circle class="g-club" cx="41" cy="49" r="1.6" />
                <circle class="g-club s" cx="19" cy="49" r="1.3" />
              </svg>
            </div>
          </div>

          <div class="door-body">
            <div class="door-title">SPACE</div>
            <div class="door-sub">Big field. Last club standing.</div>
          </div>

          <div class="door-foot">
            <span class="door-note">Many clubs · <b>locked</b></span>
            <span class="door-enter is-locked">LOCKED</span>
          </div>

          <span class="door-bar" aria-hidden="true"></span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const armed = ref(null); // 'arena' — brief committed state before navigating

function goBack() { router.push('/play/mode'); }

// ARENA is the only live ground. Arm it for a beat (the foot swaps to
// "Routing → CORE SELECT" and the pink stays lit), then route to Core Select.
// A single ref means arming ARENA inherently clears any neighbour. NO localStorage
// (the reference's hex.prefight.ground stub is dead — real navigation replaces it).
function pickArena() { if (armed.value) return; armed.value = 'arena'; setTimeout(() => router.push('/play'), 190); }

// SPACE is locked (SOON) — click is a deliberate no-op stub.
function pickSpace() { /* locked */ }
</script>

<style scoped>
/* Scene-local palette + display / mono stacks. Pink is the PROJECT token
   var(--hex-primary) (inherited from .app-v2) — no second pink is introduced;
   pink-with-alpha is composed via color-mix(... transparent). Unlike Mode Select
   (which collapsed the prototype's mid-greys to Ink / Ink-dim), this high-fidelity
   screen keeps the reference greys as named tokens. */
.ground-root {
  --void: #08080a; --panel: #16161b; --panel-space: #131318;
  --ink: #ededf1; --ink-dim: #5d5d66;
  --ink-2: #b6b2bc;      /* sub text + Back pill */
  --ink-3: #9b97a1;      /* ENTER affordance (rest) */
  --chrome-txt: #cfccd3; /* SOON label */
  --locked: #8b8790;     /* SPACE "locked" note */
  --locked-2: #57555c;   /* SPACE LOCKED enter */
  --line: rgba(255, 255, 255, 0.08);
  --line2: rgba(255, 255, 255, 0.16);
  --line3: #2a2a31;
  --chrome: rgba(255, 255, 255, 0.34);
  --ease: cubic-bezier(0.4, 0.05, 0.1, 1);
  --spring: cubic-bezier(0.34, 1.4, 0.5, 1);
  --hs-disp: "Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --hs-mono: "JetBrains Mono", ui-monospace, monospace;

  /* .ground-root IS the query container — its width drives every @container below
     (stage padding, doors grid), so the screen adapts to its OWN width, not the
     viewport. It is position:absolute inset:0, so it is also the containing block
     for its absolute children. */
  position: absolute; inset: 0; overflow: hidden; container-type: inline-size;
  background: var(--void); color: var(--ink);
  font-family: var(--hs-disp); -webkit-font-smoothing: antialiased; user-select: none;
}
.ground-root * { box-sizing: border-box; }
.ground-root button { font: inherit; color: inherit; background: none; border: 0; -webkit-tap-highlight-color: transparent; }

/* ── background: top ember halo over a neutral void radial, + edge-masked grid ── */
.ground-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    radial-gradient(95% 52% at 50% -6%, rgba(255, 0, 105, 0.10), transparent 58%),
    radial-gradient(130% 80% at 50% 8%, #140a10 0%, #0c0a0d 40%, var(--void) 80%); }
.ground-grid { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.28;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 58px 58px;
  -webkit-mask-image: radial-gradient(120% 92% at 50% 46%, #000, transparent 78%);
          mask-image: radial-gradient(120% 92% at 50% 46%, #000, transparent 78%); }

/* ── work area (no top strip — only the matte ← Back chrome pill) ── */
.ground-stage { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; padding: 40px 40px 38px; }
@container (max-width: 560px) { .ground-stage { padding: 26px 18px 24px; } }

/* Back — matte chrome pill, sole navigation */
.ground-back {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 9px;
  font-family: var(--hs-mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-2); padding: 9px 15px 9px 12px; margin-bottom: 16px; cursor: pointer;
  border: 1px solid var(--line); background: rgba(255, 255, 255, 0.022); backdrop-filter: blur(8px);
  transition: color 0.18s, border-color 0.25s var(--ease), background 0.25s var(--ease);
}
.ground-back svg { width: 15px; height: 15px; transition: transform 0.2s var(--spring); }
.ground-back:hover { color: var(--ink); border-color: var(--line2); background: rgba(255, 255, 255, 0.05); }
.ground-back:hover svg { transform: translateX(-3px); }
.ground-back:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; color: var(--ink); }

/* headline + hairline divider */
.ground-head { padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: clamp(16px, 2.6cqi, 26px); }
.ground-title {
  font-weight: 900; font-size: clamp(34px, 6cqi, 62px); line-height: 0.88; letter-spacing: 0.005em;
  text-transform: uppercase; margin-top: 11px; text-wrap: balance; color: var(--ink);
}
/* the word "ground." — INK #EDEDF1 (not white, not italic). No glow: the sole glow
   is the ARENA hover bloom (discipline: nothing glows at rest). */
.ground-title em { font-style: normal; color: var(--ink); }

/* ── the two doors ── */
.grounds { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; grid-auto-rows: 1fr; gap: 16px; }
@container (min-width: 720px) { .grounds { grid-template-columns: 1fr 1fr; grid-auto-rows: auto; } }

/* shared door shell — glass wash over panel, hairline, fight-card corner cut */
.door {
  position: relative; display: flex; flex-direction: column; text-align: left; overflow: hidden;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.022), rgba(255, 255, 255, 0.006)), var(--panel);
  padding: clamp(18px, 2.4cqi, 26px) clamp(20px, 2.6cqi, 30px);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  transition: transform 0.22s var(--spring), border-color 0.3s var(--ease), background 0.3s var(--ease);
}

/* corner ticks */
.door-tick { position: absolute; width: 11px; height: 11px; border: 1px solid var(--line3); pointer-events: none; transition: border-color 0.3s var(--ease); }
.door-tick.tl { top: 11px; left: 11px; border-right: 0; border-bottom: 0; }
.door-tick.tr { top: 11px; right: 11px; border-left: 0; border-bottom: 0; }

/* emblem stage + halo + glyph */
.door-stage { position: relative; flex: 1; display: grid; place-items: center; min-height: 120px; margin: 6px 0; }
.door-halo {
  position: absolute; width: 64%; aspect-ratio: 1; border-radius: 50%; pointer-events: none;
  filter: blur(20px); opacity: 0; transition: opacity 0.4s var(--ease); mix-blend-mode: screen;
}
.door-glyph { position: relative; z-index: 2; width: clamp(120px, 44%, 224px); aspect-ratio: 1; }
.door-glyph svg { width: 100%; height: 100%; overflow: visible; display: block; }

/* body */
.door-body { z-index: 3; }
.door-title { font-weight: 900; font-size: clamp(40px, 7cqi, 72px); line-height: 0.84; letter-spacing: 0.01em; text-transform: uppercase; transition: text-shadow 0.35s var(--ease); }
.door-sub { font-weight: 500; font-size: clamp(15px, 1.9cqi, 19px); letter-spacing: 0.01em; color: var(--ink-2); margin-top: 6px; }

/* foot — note + enter affordance, over a hairline */
.door-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 14px; z-index: 3;
  margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--line);
  font-family: var(--hs-mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
}
.door-note { color: var(--ink-dim); }
.door-enter { display: inline-flex; align-items: center; gap: 8px; color: var(--ink-3); font-weight: 500; transition: color 0.25s var(--ease); }
.door-enter i { font-style: normal; transition: transform 0.25s var(--spring); }

/* accent bar */
.door-bar { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; background: var(--line3); transition: background 0.35s var(--ease), box-shadow 0.35s var(--ease); }

/* ═══════════ ARENA — live, hot, the sole accent & bloom ═══════════ */
.is-arena { cursor: pointer; }
.is-arena:hover { transform: translateY(-5px); border-color: color-mix(in srgb, var(--hex-primary) 50%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--hex-primary) 5%, transparent), color-mix(in srgb, var(--hex-primary) 1.2%, transparent)), var(--panel); }
.is-arena:active { transform: translateY(-1px) scale(0.992); }
.is-arena:focus-visible { outline: 2px solid color-mix(in srgb, var(--hex-primary) 85%, transparent); outline-offset: 3px; }
.is-arena.is-armed { border-color: color-mix(in srgb, var(--hex-primary) 60%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--hex-primary) 7%, transparent), color-mix(in srgb, var(--hex-primary) 1.5%, transparent)), var(--panel); }

/* the "core select" / routing note reads pink */
.is-arena .door-note b { color: color-mix(in srgb, var(--hex-primary) 95%, transparent); font-weight: 500; }

/* the single glow source: the halo, only on hover / armed */
.is-arena .door-halo { background: radial-gradient(circle, color-mix(in srgb, var(--hex-primary) 42%, transparent) 0%, color-mix(in srgb, var(--hex-primary) 12%, transparent) 38%, transparent 64%); }
.is-arena:hover .door-halo, .is-arena.is-armed .door-halo { opacity: 0.95; }
.is-arena:hover .door-tick, .is-arena.is-armed .door-tick { border-color: color-mix(in srgb, var(--hex-primary) 60%, transparent); }
.is-arena:hover .door-title, .is-arena.is-armed .door-title { text-shadow: 0 0 22px color-mix(in srgb, var(--hex-primary) 42%, transparent); }
.is-arena:hover .door-enter, .is-arena.is-armed .door-enter { color: var(--hex-primary); }
.is-arena:hover .door-enter i, .is-arena.is-armed .door-enter i { transform: translateX(5px); }
.is-arena:hover .door-bar, .is-arena.is-armed .door-bar { background: var(--hex-primary); box-shadow: 0 0 16px color-mix(in srgb, var(--hex-primary) 60%, transparent); }

/* arena emblem — muted pink tint at rest, ignites toward white when lit */
.is-arena .g-hx { fill: none; stroke: color-mix(in srgb, var(--hex-primary) 30%, var(--ink-dim)); stroke-width: 1.7; transition: stroke 0.35s var(--ease), stroke-width 0.35s var(--ease); }
.is-arena .g-hx.d { opacity: 0.5; stroke-width: 1.2; }
.is-arena .g-fc { fill: none; stroke: color-mix(in srgb, var(--hex-primary) 26%, var(--ink-dim)); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.35s var(--ease); }
.is-arena .g-fc.d { opacity: 0.5; }
.is-arena .g-sd { fill: color-mix(in srgb, var(--hex-primary) 48%, var(--ink-dim)); transition: fill 0.35s var(--ease); }
.is-arena:hover .g-hx, .is-arena.is-armed .g-hx { stroke: color-mix(in srgb, var(--hex-primary) 24%, #fff); stroke-width: 2; }
.is-arena:hover .g-hx.d, .is-arena.is-armed .g-hx.d { stroke-width: 1.4; }
.is-arena:hover .g-fc, .is-arena.is-armed .g-fc { stroke: color-mix(in srgb, var(--hex-primary) 42%, #fff); }
.is-arena:hover .g-sd, .is-arena.is-armed .g-sd { fill: #fff; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--hex-primary) 85%, transparent)); }

/* ═══════════ SPACE — matte chrome, locked, never glows, never pink ═══════════ */
.is-space { cursor: not-allowed; background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.008)), var(--panel-space); }
.is-space > * { pointer-events: none; } /* click lands on the button surface — a no-op */
.is-space .door-title, .is-space .door-sub { opacity: 0.72; }
.is-space .door-note b { color: var(--locked); }
.is-space .door-enter.is-locked { color: var(--locked-2); }
.is-space:focus-visible { outline: 2px solid var(--chrome); outline-offset: -2px; }
/* the ONLY hover response: a hairline chrome lift — no colour, no bloom, no rise */
.is-space:hover { border-color: var(--chrome); }
.is-space:hover .door-tick { border-color: var(--chrome); }
.is-space:hover .door-bar { background: var(--line2); }

/* space emblem — pure matte chrome */
.is-space .g-field { fill: none; stroke: rgba(255, 255, 255, 0.26); stroke-width: 1.5; stroke-linejoin: round; transition: stroke 0.3s var(--ease); }
.is-space .g-field.d { stroke: rgba(255, 255, 255, 0.12); }
.is-space .g-club { fill: rgba(255, 255, 255, 0.34); transition: fill 0.3s var(--ease); }
.is-space .g-club.s { fill: rgba(255, 255, 255, 0.18); }
.is-space:hover .g-field { stroke: rgba(255, 255, 255, 0.4); }
.is-space:hover .g-club { fill: rgba(255, 255, 255, 0.5); }

/* SOON badge — matte-chrome corner tab, top-right */
.door-badge {
  position: absolute; top: 0; right: 0; z-index: 5; pointer-events: none;
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--hs-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--chrome-txt); padding: 8px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03));
  border-left: 1px solid var(--line2); border-bottom: 1px solid var(--line2); backdrop-filter: blur(6px);
}
.door-badge::before { content: ""; width: 6px; height: 6px; background: var(--locked); transform: rotate(45deg); }

/* ── signature motion — only when ARENA is lit; at rest the screen is calm ── */
@media (prefers-reduced-motion: no-preference) {
  .is-arena:hover .g-duel, .is-arena.is-armed .g-duel { animation: ground-duel 1.6s ease-in-out infinite; }
}
@keyframes ground-duel { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
</style>
