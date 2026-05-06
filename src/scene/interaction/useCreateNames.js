// Epic 3Bc Step 1 — Name generator pools + random + suggestions.
// 1-to-1 port of prototype hexlash_v24.html lines 9069-9077.
// Own pool — NOT reused from mmCandidatesMock (MM_POOL_NAMES is for opponent
// names, different aesthetic). Formula A + B = 16 × 10 = 160 combinations.

export const NAME_PARTS_A = [
  'Kestrel', 'Frost', 'Echo', 'Dusk', 'Razor', 'Ember', 'Vex', 'Crow',
  'Halo', 'Slate', 'Nova', 'Trace', 'Wraith', 'Ruin', 'Noble', 'Sable',
];

export const NAME_PARTS_B = [
  '', '-7', '-9', '-X', '.01', '.02', '.03', '-K', '-V', '-M',
];

export function randomName() {
  const a = NAME_PARTS_A[Math.floor(Math.random() * NAME_PARTS_A.length)];
  const b = NAME_PARTS_B[Math.floor(Math.random() * NAME_PARTS_B.length)];
  return a + b;
}

export function generateSuggestions(n = 5) {
  return Array.from({ length: n }, () => randomName());
}
