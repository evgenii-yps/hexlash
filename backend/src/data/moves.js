const allMoves = {
  // === SPEED ===
  jab: {
    id: "jab",
    branch: "speed",
    damage: [8, 10, 12, 15, 18],
    speed: [1.2, 1.3, 1.4, 1.5, 1.6]
  },
  double_jab: {
    id: "double_jab",
    branch: "speed",
    damage: [12, 15, 18, 22, 26],
    speed: [1.1, 1.2, 1.3, 1.4, 1.5]
  },
  rapid_fire: {
    id: "rapid_fire",
    branch: "speed",
    damage: [15, 18, 22, 27, 32],
    speed: [1.0, 1.1, 1.2, 1.3, 1.4]
  },
  combo_strike: {
    id: "combo_strike",
    branch: "speed",
    damage: [20, 24, 29, 35, 42],
    speed: [0.9, 1.0, 1.1, 1.2, 1.3]
  },
  flurry: {
    id: "flurry",
    branch: "speed",
    damage: [25, 30, 36, 43, 52],
    speed: [0.8, 0.9, 1.0, 1.1, 1.2]
  },
  hurricane: {
    id: "hurricane",
    branch: "speed",
    damage: [32, 38, 46, 55, 66],
    speed: [0.7, 0.8, 0.9, 1.0, 1.1]
  },

  // === POWER ===
  straight: {
    id: "straight",
    branch: "power",
    damage: [12, 15, 18, 22, 27],
    speed: [0.8, 0.85, 0.9, 0.95, 1.0]
  },
  hook: {
    id: "hook",
    branch: "power",
    damage: [16, 20, 24, 29, 35],
    speed: [0.75, 0.8, 0.85, 0.9, 0.95]
  },
  uppercut: {
    id: "uppercut",
    branch: "power",
    damage: [20, 25, 30, 36, 44],
    speed: [0.7, 0.75, 0.8, 0.85, 0.9]
  },
  haymaker: {
    id: "haymaker",
    branch: "power",
    damage: [26, 32, 38, 46, 56],
    speed: [0.6, 0.65, 0.7, 0.75, 0.8]
  },
  hammer_fist: {
    id: "hammer_fist",
    branch: "power",
    damage: [32, 40, 48, 58, 70],
    speed: [0.5, 0.55, 0.6, 0.65, 0.7]
  },
  knockout_blow: {
    id: "knockout_blow",
    branch: "power",
    damage: [42, 52, 62, 75, 90],
    speed: [0.4, 0.45, 0.5, 0.55, 0.6]
  },

  // === TECHNIQUE ===
  block_strike: {
    id: "block_strike",
    branch: "technique",
    damage: [10, 12, 15, 18, 22],
    speed: [1.0, 1.05, 1.1, 1.15, 1.2]
  },
  counter_jab: {
    id: "counter_jab",
    branch: "technique",
    damage: [14, 17, 21, 25, 30],
    speed: [0.95, 1.0, 1.05, 1.1, 1.15]
  },
  feint_cross: {
    id: "feint_cross",
    branch: "technique",
    damage: [18, 22, 27, 32, 39],
    speed: [0.9, 0.95, 1.0, 1.05, 1.1]
  },
  parry_punish: {
    id: "parry_punish",
    branch: "technique",
    damage: [22, 27, 33, 40, 48],
    speed: [0.85, 0.9, 0.95, 1.0, 1.05]
  },
  slip_counter: {
    id: "slip_counter",
    branch: "technique",
    damage: [28, 34, 41, 50, 60],
    speed: [0.8, 0.85, 0.9, 0.95, 1.0]
  },
  precision_strike: {
    id: "precision_strike",
    branch: "technique",
    damage: [35, 43, 52, 63, 76],
    speed: [0.75, 0.8, 0.85, 0.9, 0.95]
  }
};

module.exports = allMoves;
