/**
 * Belt display data for frontend.
 *
 * DUPLICATE OF backend/src/services/beltService.js BELT_THRESHOLDS
 * Keep in sync manually — there is no shared module between frontend and backend.
 * If beltService thresholds change, update this file too.
 */

const BELT_GRADES = [
  { grade: 0,  color: 'white',  stripes: 0 },
  { grade: 1,  color: 'white',  stripes: 1 },
  { grade: 2,  color: 'white',  stripes: 2 },
  { grade: 3,  color: 'white',  stripes: 3 },
  { grade: 4,  color: 'yellow', stripes: 0 },
  { grade: 5,  color: 'yellow', stripes: 1 },
  { grade: 6,  color: 'yellow', stripes: 2 },
  { grade: 7,  color: 'yellow', stripes: 3 },
  { grade: 8,  color: 'orange', stripes: 0 },
  { grade: 9,  color: 'orange', stripes: 1 },
  { grade: 10, color: 'orange', stripes: 2 },
  { grade: 11, color: 'orange', stripes: 3 },
  { grade: 12, color: 'green',  stripes: 0 },
  { grade: 13, color: 'green',  stripes: 1 },
  { grade: 14, color: 'green',  stripes: 2 },
  { grade: 15, color: 'green',  stripes: 3 },
  { grade: 16, color: 'blue',   stripes: 0 },
  { grade: 17, color: 'blue',   stripes: 1 },
  { grade: 18, color: 'blue',   stripes: 2 },
  { grade: 19, color: 'blue',   stripes: 3 },
  { grade: 20, color: 'purple', stripes: 0 },
  { grade: 21, color: 'purple', stripes: 1 },
  { grade: 22, color: 'purple', stripes: 2 },
  { grade: 23, color: 'purple', stripes: 3 },
  { grade: 24, color: 'brown',  stripes: 0 },
  { grade: 25, color: 'brown',  stripes: 1 },
  { grade: 26, color: 'brown',  stripes: 2 },
  { grade: 27, color: 'brown',  stripes: 3 },
  { grade: 28, color: 'red',    stripes: 0 },
  { grade: 29, color: 'red',    stripes: 1 },
  { grade: 30, color: 'red',    stripes: 2 },
  { grade: 31, color: 'red',    stripes: 3 },
  { grade: 32, color: 'black',  stripes: 0 },
];

export const BELT_COLORS = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'];

export function getBeltDisplay(grade) {
  const clamped = Math.max(0, Math.min(32, Math.floor(grade)));
  return BELT_GRADES[clamped];
}
