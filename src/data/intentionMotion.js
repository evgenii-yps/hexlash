/* HEXLASH — intention MOTION profiles (EXECUTION, tunable in one place). The
   intention layer picks WHICH of the 7 intentions a fighter holds (intentions.js);
   THIS file says how the body SHOWS it — a distinct physical signature per
   intention so a watcher reads "press / strike / sting / hold / catch / break /
   breathe" at a glance. Numbers here are meant to be tuned by eye. The active
   intention LEADS the body; the fighter's character (core/facets/axes) only tints
   the manner on top.

   Two parts per intention:
     speedMul — scales the locomotion band speed (BREATHE slow, STING/BREAK fast).
     style    — how it navigates at range:
        'press'   — relentless straight chase, cuts the approach angle, never circles.
        'strike'  — plant loaded at strike range; the heavy clip + sag does the work.
        'sting'   — bounce OUT between quick pokes (the strike darts back in).
        'plant'   — hold ground (HOLD/CATCH); `brace` says which way the weight sits.
        'retreat' — give ground, then settle into the stance (BREAK/BREATHE).
     brace    — 'forward' (HOLD digs in / body-presses) | 'back' (CATCH keeps distance).
     stance   — the PLANTED silhouette (sign matches buildFighter's pose channels):
        lean   — hips Z: − toward the foe (forward) / + away (back).
        crouch — hips Y: − lower (settle / crouch).
        torso  — torso X: − lean forward / + close-up or slump back.
        sh, el — shoulder + elbow raise = guard height (0 = arms down).
        knee   — knee bend (coiled crouch); 0 = straight legs.
   The three "calm" silhouettes are deliberately split: HOLD = tall, weight FORWARD,
   guard HIGH; CATCH = low, weight BACK, knees bent, coiled; BREATHE = settled,
   arms DOWN, slumped. BREAK (sharp, alert, facing) vs BREATHE (slow, sunk). */
import { INTENTIONS } from './intentions.js';

export const INTENTION_MOTION = {
  // PRESS — настойчиво идёт НА врага, режет отход, корпус вперёд, ровный нажим.
  [INTENTIONS.PRESS]: {
    speedMul: 1.10, style: 'press',
    stance: { lean: -0.07, crouch: -0.01, torso: -0.12, sh: 0.30, el: 1.15 },
  },
  // STRIKE — пауза-замах у дистанции удара → тяжёлый вложенный удар (клип) → просадка.
  [INTENTIONS.STRIKE]: {
    speedMul: 1.0, style: 'strike',
    stance: { lean: -0.05, crouch: -0.02, torso: -0.06, sh: 0.28, el: 1.05 },
  },
  // STING — отскок ОТ врага между быстрыми тычками; лёгкий, на носках, дёрганый.
  [INTENTIONS.STING]: {
    speedMul: 1.35, style: 'sting',
    stance: { lean: 0.0, crouch: 0.02, torso: 0.0, sh: 0.32, el: 0.85 },
  },
  // HOLD — упёрся, вес ВПЕРЁД, защита ВЫСОКО, глухо стоит; может теснить корпусом.
  [INTENTIONS.HOLD]: {
    speedMul: 0.55, style: 'plant', brace: 'forward',
    stance: { lean: -0.08, crouch: -0.03, torso: 0.12, sh: 0.58, el: 1.72 },
  },
  // CATCH — присел, вес НАЗАД, колени согнуты, собран, держит дистанцию, взведён.
  [INTENTIONS.CATCH]: {
    speedMul: 0.65, style: 'plant', brace: 'back',
    stance: { lean: 0.07, crouch: -0.13, torso: -0.02, sh: 0.45, el: 1.40, knee: 0.55 },
  },
  // BREAK — резкий отход, рвёт дистанцию, но корпус НА враге (бодрый, прямой).
  [INTENTIONS.BREAK]: {
    speedMul: 1.30, style: 'retreat',
    stance: { lean: 0.05, crouch: 0.0, torso: -0.03, sh: 0.36, el: 1.20 },
  },
  // BREATHE — оседает в нейтраль ОТ врага, руки ОПУЩЕНЫ, заметно медленно, сник.
  [INTENTIONS.BREATHE]: {
    speedMul: 0.45, style: 'retreat',
    stance: { lean: 0.08, crouch: -0.10, torso: 0.07, sh: 0.0, el: 0.0 },
  },
};

// Resolve a motion profile (unknown id → HOLD, the neutral plant).
export const motionFor = (id) => INTENTION_MOTION[id] || INTENTION_MOTION[INTENTIONS.HOLD];
