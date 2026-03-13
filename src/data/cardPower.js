/**
 * Base power values for all cards (moves), grouped by branch.
 * Used by the power rating system for matchmaking.
 */

export const CARD_BASE_POWER = {
    // Speed branch (fast but weaker)
    jab: 8,
    double_jab: 10,
    rapid_fire: 12,
    combo_strike: 14,
    flurry: 16,
    hurricane: 18,

    // Power branch (slow but strong)
    straight: 10,
    hook: 13,
    uppercut: 16,
    haymaker: 19,
    hammer_fist: 22,
    knockout_blow: 25,

    // Technique branch (balanced with bonuses)
    block_strike: 9,
    counter_jab: 11,
    feint_cross: 13,
    parry_punish: 15,
    slip_counter: 17,
    precision_strike: 20,
};

/**
 * Module (archetype) base power — all modules are equally strong.
 */
export const MODULE_BASE_POWER = 15;

/**
 * Level multipliers for card power calculation.
 * level 1 = x1.0, level 2 = x1.2, ..., level 5 = x1.8
 */
export const LEVEL_MULTIPLIERS = {
    1: 1.0,
    2: 1.2,
    3: 1.4,
    4: 1.6,
    5: 1.8,
};
