// Epic 3A Step 8b — branch move rosters for Fighter Detail.
// Source: prototype hexlash_v24.html lines 7681-7715 (FD_BRANCH_DATA).
// Static mocks — Epic 4 will fetch per-branch level + per-move levels from
// the backend via the agent API.

export const FD_BRANCH_DATA = {
  speed: {
    kicker: 'SPEED', title: 'SPEED BRANCH',
    moves: [
      { name: 'Jab',          lvl: 4 },
      { name: 'Slip',         lvl: 3 },
      { name: 'Counter Hook', lvl: 2 },
      { name: 'Footwork',     lvl: 5 },
      { name: 'Burst',        lvl: 1 },
    ],
  },
  power: {
    kicker: 'POWER', title: 'POWER BRANCH',
    moves: [
      { name: 'Cross',     lvl: 5 },
      { name: 'Overhand',  lvl: 4 },
      { name: 'Body Shot', lvl: 4 },
      { name: 'Haymaker',  lvl: 3 },
      { name: 'Knockdown', lvl: 2 },
    ],
  },
  technique: {
    kicker: 'TECHNIQUE', title: 'TECHNIQUE BRANCH',
    moves: [
      { name: 'Block',        lvl: 3 },
      { name: 'Parry',        lvl: 2 },
      { name: 'Read',         lvl: 1 },
      { name: 'Bait',         lvl: 1 },
      { name: 'Conditioning', lvl: 2 },
    ],
  },
};
