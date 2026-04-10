/**
 * Belt Service — belt system data and calculations for agents.
 *
 * Belts: 9 colors × 4 slots (0-3 stripes) + Black (no stripes) = 33 grades (0-32).
 * Hexmaster: separate boolean flag, requires HEXMASTER_THRESHOLD qualified wins.
 * Quality filter: from grade 8 (Orange-0), only wins vs opponents at grade >= agent-1 count.
 */

const BELT_THRESHOLDS = [
  // [grade, qualifiedWinsRequired, color, stripes]
  [0,    0,    'white',  0],
  [1,    1,    'white',  1],
  [2,    3,    'white',  2],
  [3,    6,    'white',  3],
  [4,    10,   'yellow', 0],
  [5,    16,   'yellow', 1],
  [6,    24,   'yellow', 2],
  [7,    35,   'yellow', 3],
  // --- quality filter kicks in at grade 8 ---
  [8,    50,   'orange', 0],
  [9,    70,   'orange', 1],
  [10,   95,   'orange', 2],
  [11,   125,  'orange', 3],
  [12,   160,  'green',  0],
  [13,   200,  'green',  1],
  [14,   245,  'green',  2],
  [15,   295,  'green',  3],
  [16,   350,  'blue',   0],
  [17,   415,  'blue',   1],
  [18,   490,  'blue',   2],
  [19,   575,  'blue',   3],
  [20,   670,  'purple', 0],
  [21,   775,  'purple', 1],
  [22,   890,  'purple', 2],
  [23,   1015, 'purple', 3],
  [24,   1150, 'brown',  0],
  [25,   1300, 'brown',  1],
  [26,   1465, 'brown',  2],
  [27,   1645, 'brown',  3],
  [28,   1840, 'red',    0],
  [29,   2050, 'red',    1],
  [30,   2275, 'red',    2],
  [31,   2515, 'red',    3],
  [32,   2800, 'black',  0],
];

const HEXMASTER_THRESHOLD = 4000;
const QUALITY_FILTER_GRADE = 8;

/**
 * Checks whether a win counts toward qualifiedWins.
 * @param {number} agentBelt - current belt grade of the winning agent (0-32)
 * @param {number|null} opponentBelt - belt grade of opponent at fight time (null = PvE bot)
 * @returns {boolean}
 */
function isQualifyingWin(agentBelt, opponentBelt) {
  if (agentBelt < QUALITY_FILTER_GRADE) return true;
  const effectiveOpponent = opponentBelt ?? 0; // PvE bot = white-0
  return effectiveOpponent >= agentBelt - 1;
}

/**
 * Calculates target belt grade from qualifiedWins.
 * @param {number} qualifiedWins
 * @returns {number} grade 0-32
 */
function calculateBelt(qualifiedWins) {
  let grade = 0;
  for (const [g, threshold] of BELT_THRESHOLDS) {
    if (qualifiedWins >= threshold) grade = g;
    else break;
  }
  return grade;
}

/**
 * Checks if agent qualifies for Hexmaster.
 * @param {number} qualifiedWins
 * @returns {boolean}
 */
function checkHexmaster(qualifiedWins) {
  return qualifiedWins >= HEXMASTER_THRESHOLD;
}

/**
 * Returns belt color + stripes for a grade.
 * @param {number} grade - 0-32
 * @returns {{ color: string, stripes: number }}
 */
function getBeltDisplay(grade) {
  const entry = BELT_THRESHOLDS[grade];
  if (!entry) return { color: 'white', stripes: 0 };
  return { color: entry[2], stripes: entry[3] };
}

/**
 * Returns next threshold info for progress display.
 * @param {number} qualifiedWins
 * @param {number} currentGrade - 0-32
 * @returns {{ current: number, next: number|null, remaining: number|null }}
 */
function getNextThreshold(qualifiedWins, currentGrade) {
  if (currentGrade >= 32) return { current: qualifiedWins, next: null, remaining: null };
  const nextThreshold = BELT_THRESHOLDS[currentGrade + 1][1];
  return {
    current: qualifiedWins,
    next: nextThreshold,
    remaining: nextThreshold - qualifiedWins,
  };
}

/**
 * Applies belt progression for a winning agent.
 * Pure function — caller is responsible for persisting.
 * @param {{ belt: number, qualifiedWins: number, isHexmaster: boolean }} agent
 * @param {number|null} opponentBelt - opponent belt at fight time (null = PvE bot)
 * @returns {{ belt: number, qualifiedWins: number, isHexmaster: boolean, beltChanged: boolean, hexmasterUnlocked: boolean, qualified: boolean }}
 */
function applyWin(agent, opponentBelt) {
  const qualified = isQualifyingWin(agent.belt, opponentBelt);
  if (!qualified) {
    return {
      belt: agent.belt,
      qualifiedWins: agent.qualifiedWins,
      isHexmaster: agent.isHexmaster,
      beltChanged: false,
      hexmasterUnlocked: false,
      qualified: false,
    };
  }
  const newQualifiedWins = agent.qualifiedWins + 1;
  const newBelt = calculateBelt(newQualifiedWins);
  const newHexmaster = agent.isHexmaster || checkHexmaster(newQualifiedWins);
  return {
    belt: newBelt,
    qualifiedWins: newQualifiedWins,
    isHexmaster: newHexmaster,
    beltChanged: newBelt !== agent.belt,
    hexmasterUnlocked: newHexmaster && !agent.isHexmaster,
    qualified: true,
  };
}

module.exports = {
  isQualifyingWin,
  calculateBelt,
  checkHexmaster,
  getBeltDisplay,
  getNextThreshold,
  applyWin,
  BELT_THRESHOLDS,
  HEXMASTER_THRESHOLD,
  QUALITY_FILTER_GRADE,
};
