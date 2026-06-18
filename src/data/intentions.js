/* HEXLASH — intention layer. Between the fighter's TEMPERAMENT (the 8 axes in
   behavior.js) and its BODY (the sb.* mechanics in scene/buildFighter.js) sits a
   thin layer of INTENTION: ~once a second the fighter picks ONE of 7 intentions,
   and the body works in that mode until the next pick.

   The pick is isolated behind ONE seam — chooseIntention(self, foe, memory,
   fight, brain). This pass ships the deterministic "spinal cord" (a pure function
   of the context, no random); a future model drops into the SAME seam (brain
   'model') without the body changing. The body never learns WHY a mode was chosen
   — it only reads the mode (an axis bias + a few flags) and executes it with the
   mechanics it already has. No new combat ability is added here.

   The 7 intentions:
     PRESS   — давить    : drive forward, close the distance, force the exchange.
     STRIKE  — рубить    : commit a heavy series NOW (foe in reach).
     STING   — жалить    : light pokes from spacing; build the haymaker.
     HOLD    — держать   : stand the ground, trade blows, guard up.
     BREAK   — разорвать : break off, slip aside, reset the rhythm.
     BREATHE — дышать    : retreat, recover wind (stamina).
     CATCH   — ловить    : wait out the foe's swing and punish it. */

export const INTENTIONS = {
  PRESS: 'press',
  STRIKE: 'strike',
  STING: 'sting',
  HOLD: 'hold',
  BREAK: 'break',
  BREATHE: 'breathe',
  CATCH: 'catch',
};
export const INTENTION_IDS = Object.values(INTENTIONS);
export const INTENTION_SET = new Set(INTENTION_IDS); // membership check for model answers

// How often the brain re-picks an intention (s). The body HOLDS the current
// intention between ticks. Lives here beside the other combat numbers so the
// cadence tunes in one place. ~1/sec per the brief.
export const INTENTION_TICK_SEC = 1.0;

/* Intention → body MODE. Each intention is a режим the body works in, expressed
   so the EXISTING knobs read it with no new mechanic:
     axes   — additive deltas over the BASE axes (distance / initiative / tempo /
              stick). Composed alongside the klich delta in buildFighter's per-frame
              re-derive, so the mode shifts the SAME range / aggression / stick /
              cadence the body already drives off. Gravity for the choice is the
              temperament; once chosen, the mode is a firm bias on the body.
     attack — 'none' | 'light' | 'heavy' | 'free' : the strike style this mode wants
              (none = don't initiate; light = quick singles; heavy = the DOUBLE /
              COMBO series; free = the fighter's own weight-led style).
     guard  — additive bias on the block-raise tendency (CATCH / HOLD lean high,
              PRESS / STRIKE lean low). Clamped by the body.
     charge — 'build' | 'spend' | 'free' : how the mode treats the haymaker charge
              (build = save it; spend = release what's loaded; free = the default
              threshold release). */
export const INTENTION_PROFILES = {
  [INTENTIONS.PRESS]:   { axes: { distance: -35, initiative: 30, stick: 20 },              attack: 'free',  guard: -0.10, charge: 'free' },
  [INTENTIONS.STRIKE]:  { axes: { distance: -25, initiative: 20, tempo: 15 },              attack: 'heavy', guard: -0.15, charge: 'spend' },
  [INTENTIONS.STING]:   { axes: { distance: 30, initiative: 10, tempo: -10, stick: -25 },  attack: 'light', guard: -0.05, charge: 'build' },
  [INTENTIONS.HOLD]:    { axes: {},                                                        attack: 'none',  guard: 0.20,  charge: 'free' },
  [INTENTIONS.BREAK]:   { axes: { distance: 35, initiative: -25, stick: -30 },             attack: 'none',  guard: 0.10,  charge: 'free' },
  [INTENTIONS.BREATHE]: { axes: { distance: 45, initiative: -35, stick: -25 },             attack: 'none',  guard: 0.0,   charge: 'build' },
  [INTENTIONS.CATCH]:   { axes: { distance: 10, initiative: -20 },                         attack: 'none',  guard: 0.35,  charge: 'free' },
};

// Resolve a profile (unknown id falls back to HOLD — the neutral mode).
export const intentionProfile = (id) => INTENTION_PROFILES[id] || INTENTION_PROFILES[INTENTIONS.HOLD];

/* chooseIntention — THE SEAM. The single point the body calls to pick the next
   intention. Swap nothing in the body to put a model here: brain 'model' routes to
   the model path below; 'spinal' (default) routes to the deterministic function.

   Context (full now, so the model needs no new plumbing later — the spinal cord
   uses it primitively):
     self   — own state: { ax01 (base axes 0..1), hp01, stamina01, charge01,
              blocking, staggered, range (current preferred), current (held intent),
              model ({ intention, read, fresh }|null — last valid model answer, the
              model path reads this) }
     foe    — observed foe: { has, dist, inStrike, reacting }
     memory — short ring of OBSERVED foe events [{ t, type:'attack'|'miss' }], newest last
     fight  — shared context: { t, escalation, activeKlich }
   Returns an intention id, or null to KEEP the current one (a laggy / absent model
   never freezes the body — it just falls through to the held mode). */
export function chooseIntention(self, foe, memory, fight, brain = 'spinal') {
  if (brain === 'model') return chooseIntentionModel(self, foe, memory, fight);
  return chooseIntentionSpinal(self, foe, memory, fight);
}

/* MODEL path. The actual Claude call happens elsewhere (on the body's break
   detector, async, server-side) — its last valid answer is handed in via
   self.model. THIS function only composes the hybrid each tick:
     1. spinal HARD NEEDS always win, instantly — the safety net is NEVER off,
        even in model mode (low wind → BREATHE, foe swing + counter → CATCH, …).
     2. a fresh valid model answer → use it (held until the next break replaces it).
     3. otherwise (no answer yet, or it went stale) → the deterministic spinal
        score, so the body is never frozen waiting on the network.
   self.model is the seat the real model fills; everything else is unchanged. */
export function chooseIntentionModel(self, foe, memory, fight) {
  const need = hardNeed(self, foe, memory, fight);
  if (need) return need; // hard needs override any mode, no waiting on the model
  const m = self.model;
  if (m && m.fresh && INTENTION_SET.has(m.intention)) return m.intention; // held model pick
  return spinalScore(self, foe, memory, fight); // between breaks / before first answer
}

/* SPINAL CORD — deterministic, no random (so replay is stable): the hard needs
   first, then the temperament-weighted score. Used directly when brain='spinal',
   and as the safety net + fallback under brain='model'. */
export function chooseIntentionSpinal(self, foe, memory, fight) {
  return hardNeed(self, foe, memory, fight) || spinalScore(self, foe, memory, fight);
}

// HARD NEEDS — state overrides temperament, fires instantly (no model round-trip).
// Returns an intention id or null. Shared by the spinal + model paths so the safety
// net is identical in both. Deterministic.
export function hardNeed(self, foe, memory, fight) {
  const a = self.ax01;
  const foeThreat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
  if (self.stamina01 < 0.22) return INTENTIONS.BREATHE; // out of wind → must recover
  if (foeThreat && a.counter > 0.55 && foe.has && foe.dist < self.range + 0.8) return INTENTIONS.CATCH; // counter-puncher waits out the swing
  if (self.charge01 >= 0.85 && foe.inStrike) return INTENTIONS.STRIKE; // haymaker loaded + foe in reach → land it
  return null;
}

// SCORE — temperament gravity + the situation, deterministic argmax. Differently-
// raised fighters (different cores / facets → different ax01) lean to different
// intentions for free.
export function spinalScore(self, foe, memory, fight) {
  const a = self.ax01;
  const foeThreat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
  const closeBand = foe.has && foe.dist <= self.range + 0.5;
  const far = foe.has && foe.dist > self.range + 0.7;
  const lowStam = 1 - self.stamina01;
  const s = {
    [INTENTIONS.PRESS]:   0.50 * a.initiative + 0.30 * a.stick + 0.20 * (1 - a.distance) + (far ? 0.20 : 0),
    [INTENTIONS.STRIKE]:  0.35 * a.weight + 0.30 * a.initiative + 0.35 * self.charge01 + (foe.inStrike ? 0.25 : -0.35),
    [INTENTIONS.STING]:   0.45 * a.distance + 0.30 * a.slip + 0.20 * (1 - a.weight) + (far ? 0.20 : 0),
    [INTENTIONS.HOLD]:    0.40 * a.resilience + 0.30 * a.stick + (closeBand ? 0.20 : 0),
    [INTENTIONS.BREAK]:   0.50 * a.slip + 0.20 * (1 - a.stick) + (foeThreat ? 0.20 : 0),
    [INTENTIONS.BREATHE]: 0.70 * lowStam + 0.10 * a.distance,
    [INTENTIONS.CATCH]:   0.45 * a.counter + 0.25 * a.resilience + 0.20 * (1 - a.initiative) + (foeThreat ? 0.25 : 0),
  };
  // Hysteresis: a small bonus to the held intention so it doesn't flip-flop every
  // tick (deterministic — no random). argmax, ties broken by INTENTION_IDS order.
  if (s[self.current] != null) s[self.current] += 0.08;
  let best = INTENTION_IDS[0];
  for (const id of INTENTION_IDS) if (s[id] > s[best]) best = id;
  return best;
}
