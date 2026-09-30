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

import { COMBAT_BALANCE } from './combatBalance.js';
import { KLICH_BALANCE } from './klichBalance.js';
const GR = COMBAT_BALANCE.grani;
const NEED = COMBAT_BALANCE.hardNeed;

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

// накал (stalemate safeguard) → pick bias. A rising escalation01 (0..1, from time
// WITHOUT a clean exchange — see combatBalance escalate*) bends the pick toward the
// clash: BOOST the forward attacking intents, DAMP the passive / disengage ones, so
// two patient cores (both CATCH / HOLD) can't stand in гляделки forever. At full
// накал the swing (push + damp ≈ 1.2) overpowers an ambusher's CATCH lead and the
// pick flips to PRESS / STRIKE. escalation01 = 0 → no change (засада plays normally).
const ESC_ATTACK_PUSH = 0.7; // added to PRESS / STRIKE at full накал
const ESC_PASSIVE_DAMP = 0.5; // subtracted from HOLD / CATCH / BREAK / BREATHE at full накал

/* Intention → body MODE. Each intention is a режим the body works in, expressed
   so the EXISTING knobs read it with no new mechanic:
     axes   — additive deltas over the BASE axes (distance / initiative / tempo /
              stick). Composed in buildFighter's per-frame re-derive, so the mode
              shifts the SAME range / aggression / stick / cadence the body already
              drives off. Gravity for the choice is the
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
  // PRESS / STRIKE deltas were −35/+30/+20 and −25/+20/+15: with a base ±20 they pinned ONSLAUGHT's distance and
  // initiative against 0 / 100 (198–199 of 200 bouts bit-identical). Shrunk so the base stays visible (TZ_combat_distance_v1).
  [INTENTIONS.PRESS]:   { axes: { distance: -10, initiative: 0, stick: 10 },               attack: 'free',  guard: -0.10, charge: 'free' },
  [INTENTIONS.STRIKE]:  { axes: { distance: -10, initiative: 10, tempo: 15 },              attack: 'heavy', guard: -0.15, charge: 'spend' },
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
     foe    — observed foe: { has, dist, inStrike, reacting, phase } — `phase` is the
              PERCEIVED foe action phase (noised read, scaled by counter; one of
              'windup'|'commit'|'recovery'|'stagger'|'neutral'), so the pick can
              lean CATCH to set up a pounce on a read
     memory — short ring of OBSERVED foe events [{ t, type:'attack'|'miss' }], newest last
     fight  — shared context: { t, escalation, escalation01 } — escalation01 (0..1) is
              the stalemate накал (rises with silence-without-exchange; see combatBalance
              escalate*); it bends the pick toward the clash so two patient cores can't
              stalemate forever (0 in normal, actively-trading play)
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

// HARD NEEDS — the state sets the FLOOR, the character bends where the floor sits and how the fighter answers
// inside it (TZ_reflex_sees_character_v2). A real extreme still decides for ANY character (out of wind →
// BREATHE; a live swing on a counter-minded fighter → a defensive reply; a loaded haymaker in reach → STRIKE),
// but the threshold at which a need fires and the reply inside it now read the axes and the build — two builds
// of one core no longer meet the same reflex. `NEED.bend` is the ONE new number: how hard the axes push the
// existing situational thresholds (0 = the old flat rule). Every threshold keeps its old value at neutral axes
// (0.5); while bend < 1 none can reach 0, so a truly empty tank always breathes. Returns an intention id or
// null. Shared by the spinal + model paths. Deterministic.
export function hardNeed(self, foe, memory, fight) {
  const a = self.ax01;
  const K = NEED.bend;
  // Out of wind → recover. Pushy (initiative) fighters fight on to a lower reserve, patient ones breathe earlier.
  if (self.stamina01 < 0.22 * (1 - K * (2 * a.initiative - 1))) return INTENTIONS.BREATHE;
  // Foe swing + counter-minded + in reach → answer the swing. A counter-minded fighter waits from farther out;
  // the reply itself (CATCH / BREAK / HOLD) is picked by character and build, see swingReply.
  const foeThreat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
  if (foeThreat && a.counter > 0.55 && foe.has && foe.dist < self.range + 0.8 * (1 + K * (2 * a.counter - 1))) return swingReply(self, foe, memory, fight);
  // Haymaker loaded + foe in reach → land it. Heavy hitters fire at a lower charge, light ones wait for more
  // (never above a full charge: a full haymaker in reach always lands).
  if (self.charge01 >= Math.min(1, 0.85 * (1 - K * (2 * a.weight - 1))) && foe.inStrike) return INTENTIONS.STRIKE;
  return null;
}

// The reply INSIDE the swing need: the SAME score the spinal cord uses (axes, situation, the build's leans),
// restricted to the three defensive answers — wait it out (CATCH), slip off the line (BREAK), stand and trade
// (HOLD). No new behaviour, no new numbers: three existing intentions, one existing score.
const SWING_REPLIES = [INTENTIONS.CATCH, INTENTIONS.BREAK, INTENTIONS.HOLD];
function swingReply(self, foe, memory, fight) {
  return spinalScore(self, foe, memory, fight, SWING_REPLIES);
}

// SCORE — temperament gravity + the situation, deterministic argmax. Differently-
// raised fighters (different cores / facets → different ax01) lean to different
// intentions for free.
export function spinalScore(self, foe, memory, fight, only = INTENTION_IDS) {
  const a = self.ax01;
  const foeThreat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
  const closeBand = foe.has && foe.dist <= self.range + 0.5;
  const far = foe.has && foe.dist > self.range + 0.7;
  const lowStam = 1 - self.stamina01;
  // READ → CATCH gravity: a perceived OPENING (recovery / stagger) pulls a counter-
  // fighter into CATCH to pounce; a perceived WINDUP pulls a little (coil to сбив).
  // Counter-scaled, so only a sharp reader re-plans around what it sees (the body's
  // tryReadReaction does the actual strike; this just makes the pose anticipate it).
  const readPounce = (foe.phase === 'recovery' || foe.phase === 'stagger') ? 0.35 * a.counter
    : foe.phase === 'windup' ? 0.22 * a.counter : 0;
  const s = {
    [INTENTIONS.PRESS]:   0.50 * a.initiative + 0.30 * a.stick + 0.20 * (1 - a.distance) + (far ? 0.20 : 0),
    [INTENTIONS.STRIKE]:  0.35 * a.weight + 0.30 * a.initiative + 0.35 * self.charge01 + (foe.inStrike ? 0.25 : -0.35),
    [INTENTIONS.STING]:   0.45 * a.distance + 0.30 * a.slip + 0.20 * (1 - a.weight) + (far ? 0.20 : 0),
    [INTENTIONS.HOLD]:    0.40 * a.resilience + 0.30 * a.stick + (closeBand ? 0.20 : 0),
    [INTENTIONS.BREAK]:   0.50 * a.slip + 0.20 * (1 - a.stick) + (foeThreat ? 0.20 : 0),
    [INTENTIONS.BREATHE]: 0.70 * lowStam + 0.10 * a.distance,
    [INTENTIONS.CATCH]:   0.45 * a.counter + 0.25 * a.resilience + 0.20 * (1 - a.initiative) + (foeThreat ? 0.25 : 0) + readPounce,
  };
  // ГРАНИ И ТЕГИ (TZ_grani_tags_v1): наклоны из зажжённых кристаллов и резонанс веток. Раньше теги
  // нигде не читались. Ложатся ДО накала — предохранитель от гляделок сильнее любого наклона.
  if (self.leans) {
    // Условие наклона: одно имя или несколько через «&» (все сразу) — «враг ранен И затих».
    const holds = (w) => {
      switch (w) {
        case 'close': return foe.has && foe.inStrike;
        case 'far': return far;
        case 'foeOpen': return foe.phase === 'recovery' || foe.phase === 'stagger';
        case 'foeSwing': return foeThreat || foe.phase === 'windup' || foe.phase === 'commit';
        case 'charged': return self.charge01 >= 0.5;
        // НОВЫЕ условия (TZ_tags_semantics_v2): читают состояние, что уже есть у бойца; пороги — combatBalance.grani.
        case 'selfHpLow': return self.hp01 < GR.selfHpLow;
        case 'foeHpLow': return foe.hp01 != null && foe.hp01 < GR.foeHpLow;
        case 'selfWindLow': return self.stamina01 < GR.selfWindLow;
        case 'foeWindLow': return foe.stamina01 != null && foe.stamina01 < GR.foeWindLow;
        case 'longFight': return (fight.elapsed || 0) > GR.longFightSec;
        case 'foeQuiet': { // враг не бил дольше N с: последний 'attack' в памяти, нет его — с начала боя
          let last = -Infinity;
          for (const e of memory) if (e.type === 'attack' && e.t > last) last = e.t;
          return (last === -Infinity ? (fight.elapsed || 0) : fight.t - last) > GR.foeQuietSec;
        }
        case 'hpDropped': { // своё HP упало на N% максимума за последние M с (пик в окне − сейчас)
          let peak = self.hp01;
          for (const h of self.hpHist || []) if (fight.t - h.t <= GR.hpDropWindSec && h.hp01 > peak) peak = h.hp01;
          return peak - self.hp01 >= GR.hpDropFrac;
        }
        default: return true;
      }
    };
    for (const l of self.leans) {
      if (s[l.i] == null) continue;
      if (String(l.when).split('&').every(holds)) s[l.i] += l.w;
    }
  }
  // КЛИЧ ТРЕНЕРА (TZ_klich_v2): пока он действует, очки намерений его группы получают наклон (вес и состав групп —
  // data/klichBalance.js; сила `self.klich.k` 0…1 идёт по часам клича: полная, затем линейно в ноль). Ложится там же, где наклоны
  // тегов, и ДО накала. В ответе на замах (swingReply) читается этим же spinalScore — выбор там идёт среди трёх защитных намерений.
  if (self.klich && self.klich.k > 0) {
    const grp = KLICH_BALANCE.groups[self.klich.id];
    if (grp) for (const id of grp) if (s[id] != null) s[id] += KLICH_BALANCE.lean[self.klich.id] * self.klich.k;
  }
  // накал (stalemate safeguard): a rising escalation01 (silence-without-exchange)
  // pushes BOTH fighters toward the clash — lift the forward attacking intents, press
  // down the passive / disengage ones — so a гляделка can't last forever. The HARD
  // NEEDS above still win (an exhausted fighter still BREATHEs, a counter-puncher
  // facing a live swing still CATCHes), so this only governs the dead-air stalemate
  // where no threat is firing. 0 escalation → untouched (normal play).
  const esc = fight.escalation01 || 0;
  if (esc > 0) {
    s[INTENTIONS.PRESS] += esc * ESC_ATTACK_PUSH;
    s[INTENTIONS.STRIKE] += esc * ESC_ATTACK_PUSH;
    s[INTENTIONS.HOLD] -= esc * ESC_PASSIVE_DAMP;
    s[INTENTIONS.CATCH] -= esc * ESC_PASSIVE_DAMP;
    s[INTENTIONS.BREAK] -= esc * ESC_PASSIVE_DAMP;
    s[INTENTIONS.BREATHE] -= esc * ESC_PASSIVE_DAMP;
  }
  // Hysteresis: a small bonus to the held intention so it doesn't flip-flop every
  // tick (deterministic — no random). argmax, ties broken by INTENTION_IDS order.
  if (s[self.current] != null) s[self.current] += 0.08;
  let best = only[0];
  for (const id of only) if (s[id] > s[best]) best = id;
  return best;
}
