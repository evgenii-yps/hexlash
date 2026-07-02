<!-- GroundSelectView — the ARENA / SPACE ground fork (/play/ground). Sits between
     the Mode Select PVP door and core selection: after picking PVP the player
     chooses WHERE to fight — ARENA (live → /play, core select) or SPACE (locked,
     SOON). A normal 2D pre-fight screen (no meta.arena / meta.scene3d — no 3D
     scene, so it never touches the sceneTransition layer). Structural parent:
     ModeSelectView.vue (same family — VOID ground, top ember, #16161B panels,
     18px fight-card corner cut, hairlines, calm at rest, glow only on hover).

     NOTE: the design reference (docs/design-handoff/ground_select/Hexlash Ground
     Select.html) was NOT present in the repo when this screen was built, so — as
     with Mode Select — it is reconstructed from the written spec + reference
     values. The reference's README misnames two routes (ARENA → /play/core-select,
     BACK → /play/mode-select); the real routes are /play (core select) and
     /play/mode (Mode Select). Its localStorage['hex.prefight.ground'] stub is dead
     code and is intentionally NOT ported — real router navigation replaces it. The
     decorative emblem internals (ARENA duel clash / SPACE locked field) interpret
     the written description in the family's stroke language.

     Discipline: exactly ONE pink on the screen (var(--hex-primary), only on the
     live ARENA door); exactly ONE glow source (the ARENA bloom, only on hover /
     armed); at rest the screen is calm — no bloom, accent bars are #2a2a31. SPACE
     is never pink and never glows — matte chrome only (glass + hairline frame);
     its strongest hover state lifts the frame one tone, no colour, no halo, no
     lift. -->
<template>
  <div class="ground-root">
    <div class="ground-bg-ember" aria-hidden="true"></div>
    <div class="ground-bg-grid" aria-hidden="true"></div>

    <!-- .ground-stage IS the layout container (container-type: inline-size); the
         doors respond to ITS width via @container, not the viewport. -->
    <main class="ground-stage">
      <button type="button" class="ground-back" @click="goBack">← Back</button>

      <header class="ground-head">
        <h1 class="ground-title">Choose your <em>ground.</em></h1>
        <div class="ground-divider" aria-hidden="true"></div>
      </header>

      <div class="grounds">
        <!-- ───────── ARENA — live, pink, a one-on-one clash ───────── -->
        <button
          type="button"
          class="door is-arena"
          :class="{ 'is-armed': armed === 'arena' }"
          @click="pickArena"
        >
          <span class="door-bloom" aria-hidden="true"></span>
          <span class="door-emblem" aria-hidden="true">
            <!-- brand hex shell + two duelists (.clash) colliding at a seed -->
            <svg viewBox="0 0 64 64">
              <polygon class="hx" points="32,5 55,18.5 55,45.5 32,59 9,45.5 9,18.5" />
              <polygon class="hx d" points="32,13 47,21.5 47,42.5 32,51 17,42.5 17,21.5" />
              <line class="fc d" x1="32" y1="21" x2="32" y2="43" />
              <g class="clash">
                <polyline class="fc" points="24,25 30,32 24,39" />
                <polyline class="fc" points="40,25 34,32 40,39" />
              </g>
              <circle class="sd" cx="32" cy="32" r="2.4" />
            </svg>
          </span>
          <span class="door-title">ARENA</span>
          <span class="door-sub">Short. Sharp. Duel.</span>
          <span class="door-foot">
            <span v-if="armed === 'arena'" class="door-foot-copy is-routing">Routing → CORE SELECT</span>
            <span v-else class="door-foot-copy">One on one <i>·</i> <span class="hot">core select</span></span>
            <span class="door-enter">ENTER →</span>
          </span>
          <span class="door-accent" aria-hidden="true"></span>
        </button>

        <!-- ───────── SPACE — locked, matte chrome, a big walled field ───────── -->
        <button
          type="button"
          class="door is-space"
          aria-disabled="true"
          @click="pickSpace"
        >
          <span class="door-badge">SOON</span>
          <span class="door-emblem" aria-hidden="true">
            <!-- brand hex shell + a wide field of club marks under a padlock -->
            <svg viewBox="0 0 64 64">
              <polygon class="hx" points="32,5 55,18.5 55,45.5 32,59 9,45.5 9,18.5" />
              <polygon class="hx d" points="32,13 47,21.5 47,42.5 32,51 17,42.5 17,21.5" />
              <line class="fc d" x1="19" y1="44" x2="45" y2="44" />
              <circle class="sd" cx="22" cy="44" r="1.3" />
              <circle class="sd" cx="28" cy="44" r="1.3" />
              <circle class="sd" cx="36" cy="44" r="1.3" />
              <circle class="sd" cx="42" cy="44" r="1.3" />
              <path class="fc" d="M27,29 v-3 a5,5 0 0 1 10,0 v3" />
              <rect class="fc" x="25.5" y="29" width="13" height="10" rx="1.6" />
            </svg>
          </span>
          <span class="door-title">SPACE</span>
          <span class="door-sub">Big field. Last club standing.</span>
          <span class="door-foot">
            <span class="door-foot-copy">Many clubs <i>·</i> locked</span>
            <span class="door-enter is-locked">LOCKED</span>
          </span>
          <span class="door-accent" aria-hidden="true"></span>
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
// "Routing → CORE SELECT" and the pink stays lit), then route to core select.
// A single ref means arming ARENA inherently clears any neighbour. NO localStorage
// (the reference's hex.prefight.ground stub is dead — real navigation replaces it).
function pickArena() { if (armed.value) return; armed.value = 'arena'; setTimeout(() => router.push('/play'), 190); }

// SPACE is locked (SOON) — click is a deliberate no-op.
function pickSpace() { /* locked */ }
</script>

<style scoped>
/* Scene-local palette + display / mono font stacks. Pink is the PROJECT token
   var(--hex-primary) (#FF0069, inherited from the .app-v2 scope AppV2 wraps this
   route in) — no second pink is introduced. */
.ground-root {
  --void: #08080a; --panel: #16161b; --panel-space: #131318;
  --ink: #ededf1; --ink-dim: #5d5d66; --accent-rest: #2a2a31;
  --line: rgba(255, 255, 255, 0.08);   /* hairlines: grid, divider, door base border */
  --line-2: rgba(255, 255, 255, 0.16); /* one tone up: SPACE hover frame */
  --chrome: rgba(255, 255, 255, 0.34); /* crisp matte-chrome edge: Back, SOON */
  --bone: #f6f4f6;
  --ease: cubic-bezier(0.4, 0.05, 0.1, 1); /* emblem ignite easing */
  --hs-disp: "Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --hs-mono: "JetBrains Mono", ui-monospace, monospace;

  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--hs-disp); -webkit-font-smoothing: antialiased;
}
.ground-root * { box-sizing: border-box; }

/* ── background: void + top ember halo + edge-masked discipline grid ── */
.ground-bg-ember { position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(95% 52% at 50% -6%, rgba(255, 0, 105, 0.10), transparent 58%); }
.ground-bg-grid { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.28;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 58px 58px;
  -webkit-mask: radial-gradient(120% 92% at 50% 28%, #000 38%, transparent 80%);
          mask: radial-gradient(120% 92% at 50% 28%, #000 38%, transparent 80%); }

/* ── working zone (no top strip — only the matte ← Back chrome chip) ── */
.ground-stage {
  position: absolute; inset: 0; z-index: 1;
  container-type: inline-size;
  display: flex; flex-direction: column;
  padding: 32px 28px 36px;
}

/* matte chrome chip: glass + hairline that lifts to the crisp chrome edge on hover */
.ground-back {
  align-self: flex-start; margin-bottom: 14px;
  font-family: var(--hs-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-dim); cursor: pointer; padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.ground-back:hover { color: var(--ink); border-color: var(--chrome); background: rgba(255, 255, 255, 0.06); }
.ground-back:focus-visible { outline: 2px solid var(--bone); outline-offset: 3px; color: var(--ink); }

.ground-head { flex: 0 0 auto; }
.ground-title {
  margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em;
  line-height: 0.88; font-size: clamp(34px, 6cqi, 62px); color: var(--ink);
}
/* the word "ground." — INK #EDEDF1 (not white, not italic). No glow: the
   discipline is "at rest nothing glows", and the sole glow is the ARENA hover
   bloom — so, unlike Mode Select's heading, this em carries no pink text-shadow. */
.ground-title em { font-style: normal; color: var(--ink); }
.ground-divider { height: 1px; margin-top: 18px; background: var(--line); }

/* ── the two grounds ── */
.grounds {
  flex: 1 1 auto; min-height: 0; margin-top: 22px;
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
/* two equal columns once the STAGE (the query container) is ≥720px wide */
@container (min-width: 720px) { .grounds { grid-template-columns: 1fr 1fr; } }

/* shared door shell — panel, hairline, fight-card corner cut, chrome accent bar */
.door {
  position: relative; height: 100%; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
  padding: 26px 26px 30px;
  background: var(--panel); border: 1px solid var(--line); color: var(--ink);
  font-family: var(--hs-disp);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  transition: border-color 0.2s, transform 0.12s, background 0.2s;
}
.door-bloom {
  position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(70% 52% at 50% 42%, color-mix(in srgb, var(--hex-primary) 22%, transparent), transparent 70%);
  transition: opacity 0.25s;
}
.door > :not(.door-bloom) { position: relative; z-index: 1; }

.door-emblem {
  flex: 1 1 auto; align-self: stretch; min-height: 0; margin-top: 4px;
  display: flex; align-items: center; justify-content: center;
}
.door-emblem svg { width: clamp(96px, 26cqi, 168px); height: auto; overflow: visible; display: block; }

.door-title {
  font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em; line-height: 0.9;
  font-size: clamp(34px, 8cqi, 56px); color: var(--ink); margin-top: 6px;
  transition: text-shadow 0.25s;
}
.door-sub {
  margin-top: 8px; font-size: clamp(15px, 2.4cqi, 19px); letter-spacing: 0.01em; color: var(--ink);
}
.door-foot {
  margin-top: 14px; align-self: stretch;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  font-family: var(--hs-mono); font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-dim);
}
.door-foot-copy { min-width: 0; }
.door-foot-copy i { font-style: normal; margin: 0 4px; }
.door-enter { flex: 0 0 auto; white-space: nowrap; transition: color 0.25s; }

.door-accent {
  position: absolute; left: 0; right: 0; bottom: 0; height: 3px; z-index: 1;
  background: var(--accent-rest); transition: background 0.25s;
}

/* ══════════ ARENA — the one live, pink door ══════════ */
.is-arena { cursor: pointer; }
.is-arena:hover { border-color: var(--hex-primary); transform: translateY(-2px); }
.is-arena:active { transform: scale(0.992); }
.is-arena:focus-visible { outline: 2px solid var(--hex-primary); outline-offset: -2px; }
.is-arena.is-armed { border-color: var(--hex-primary); }

/* the single glow source: bloom only on hover / armed */
.is-arena:hover .door-bloom, .is-arena.is-armed .door-bloom { opacity: 1; }
/* title ignites pink; accent bar + ENTER go pink */
.is-arena:hover .door-title, .is-arena.is-armed .door-title { text-shadow: 0 0 18px color-mix(in srgb, var(--hex-primary) 55%, transparent); }
.is-arena:hover .door-accent, .is-arena.is-armed .door-accent { background: var(--hex-primary); }
.is-arena:hover .door-enter, .is-arena.is-armed .door-enter { color: var(--hex-primary); }

/* the word "core select" reads pink at rest (the one pink, on the live door) */
.is-arena .hot { color: var(--hex-primary); }
.is-arena .is-routing { color: var(--hex-primary); }

/* emblem strokes — muted pink tint at rest, ignite toward white when lit */
.is-arena .door-emblem .hx { fill: none; stroke: color-mix(in srgb, var(--hex-primary) 32%, var(--ink-dim)); stroke-width: 1.7;
  transition: stroke 0.35s var(--ease), stroke-width 0.35s var(--ease); }
.is-arena .door-emblem .hx.d { opacity: 0.45; stroke-width: 1.2; }
.is-arena .door-emblem .fc { fill: none; stroke: color-mix(in srgb, var(--hex-primary) 26%, var(--ink-dim)); stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.35s var(--ease); }
.is-arena .door-emblem .fc.d { opacity: 0.5; }
.is-arena .door-emblem .sd { fill: color-mix(in srgb, var(--hex-primary) 48%, var(--ink-dim)); transition: fill 0.35s var(--ease); }
.is-arena .door-emblem .clash { transform-box: fill-box; transform-origin: center; }

.is-arena:hover .door-emblem .hx, .is-arena.is-armed .door-emblem .hx { stroke: color-mix(in srgb, var(--hex-primary) 24%, #fff); stroke-width: 2; }
.is-arena:hover .door-emblem .hx.d, .is-arena.is-armed .door-emblem .hx.d { stroke-width: 1.4; }
.is-arena:hover .door-emblem .fc, .is-arena.is-armed .door-emblem .fc { stroke: color-mix(in srgb, var(--hex-primary) 40%, #fff); }
.is-arena:hover .door-emblem .sd, .is-arena.is-armed .door-emblem .sd { fill: #fff; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--hex-primary) 85%, transparent)); }

/* ══════════ SPACE — locked, matte chrome, never pink, never glows ══════════ */
.is-space { background: var(--panel-space); cursor: not-allowed; }
.is-space > * { pointer-events: none; } /* click lands on the button surface — a no-op */
/* the ONLY hover response: frame lifts one tone. No colour, no bloom, no lift. */
.is-space:hover { border-color: var(--line-2); }
.is-space:focus-visible { outline: 2px solid var(--bone); outline-offset: -2px; }

/* emblem strokes — pure chrome, no accent, no ignite */
.is-space .door-emblem .hx { fill: none; stroke: var(--ink-dim); stroke-width: 1.7; }
.is-space .door-emblem .hx.d { opacity: 0.45; stroke-width: 1.2; }
.is-space .door-emblem .fc { fill: none; stroke: color-mix(in srgb, var(--ink-dim) 80%, #fff); stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
.is-space .door-emblem .fc.d { opacity: 0.5; }
.is-space .door-emblem .sd { fill: var(--ink-dim); }

.is-space .door-title, .is-space .door-sub { color: color-mix(in srgb, var(--ink) 62%, transparent); }
.is-space .door-enter.is-locked { color: var(--ink-dim); }

/* SOON badge — crisp matte-chrome pill, top-right */
.door-badge {
  position: absolute; top: 16px; right: 16px; z-index: 2;
  font-family: var(--hs-mono); font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--ink-dim); padding: 3px 8px;
  background: rgba(255, 255, 255, 0.03); border: 1px solid var(--chrome);
}

/* ── signature motion — ONLY when ARENA is lit; at rest the screen is calm ── */
@media (prefers-reduced-motion: no-preference) {
  .is-arena:hover .door-emblem .clash, .is-arena.is-armed .door-emblem .clash { animation: ground-clash 1.5s ease-in-out infinite; }
}
@keyframes ground-clash { 0%, 100% { transform: scale(1); opacity: 0.82; } 50% { transform: scale(0.92); opacity: 1; } }

/* ≤560px — tighter working zone. (Media query, not @container: .ground-stage is
   itself the query container, so it can't be styled by its own container query —
   only its descendants can.) */
@media (max-width: 560px) {
  .ground-stage { padding: 24px 18px 30px; }
}
</style>
