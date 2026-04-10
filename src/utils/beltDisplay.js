/**
 * Belt display data for frontend.
 *
 * DUPLICATE OF backend/src/services/beltService.js BELT_THRESHOLDS
 * Keep in sync manually — there is no shared module between frontend and backend.
 * If beltService thresholds change, update this file too.
 */

// [grade, qualifiedWinsRequired, color, stripes]
const BELT_THRESHOLDS = [
  [0,  0,    'white',  0], [1,  1,    'white',  1], [2,  3,    'white',  2], [3,  6,    'white',  3],
  [4,  10,   'yellow', 0], [5,  16,   'yellow', 1], [6,  24,   'yellow', 2], [7,  35,   'yellow', 3],
  [8,  50,   'orange', 0], [9,  70,   'orange', 1], [10, 95,   'orange', 2], [11, 125,  'orange', 3],
  [12, 160,  'green',  0], [13, 200,  'green',  1], [14, 245,  'green',  2], [15, 295,  'green',  3],
  [16, 350,  'blue',   0], [17, 415,  'blue',   1], [18, 490,  'blue',   2], [19, 575,  'blue',   3],
  [20, 670,  'purple', 0], [21, 775,  'purple', 1], [22, 890,  'purple', 2], [23, 1015, 'purple', 3],
  [24, 1150, 'brown',  0], [25, 1300, 'brown',  1], [26, 1465, 'brown',  2], [27, 1645, 'brown',  3],
  [28, 1840, 'red',    0], [29, 2050, 'red',    1], [30, 2275, 'red',    2], [31, 2515, 'red',    3],
  [32, 2800, 'black',  0],
];

const HEXMASTER_THRESHOLD = 4000;

export const BELT_COLORS = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'];

export function getBeltDisplay(grade) {
  const clamped = Math.max(0, Math.min(32, Math.floor(grade)));
  const t = BELT_THRESHOLDS[clamped];
  return { grade: t[0], color: t[2], stripes: t[3] };
}

/**
 * Returns progress info toward next belt grade.
 * @param {number} qualifiedWins
 * @param {number} currentGrade - 0-32
 * @returns {{ current: number, next: number|null, remaining: number|null, hexmasterRemaining: number|null }}
 */
export function getNextThreshold(qualifiedWins, currentGrade) {
  const hexmasterRemaining = qualifiedWins >= HEXMASTER_THRESHOLD ? null : HEXMASTER_THRESHOLD - qualifiedWins;
  if (currentGrade >= 32) {
    return { current: qualifiedWins, next: null, remaining: null, hexmasterRemaining };
  }
  const next = BELT_THRESHOLDS[currentGrade + 1][1];
  return { current: qualifiedWins, next, remaining: next - qualifiedWins, hexmasterRemaining };
}
