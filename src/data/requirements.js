// Стоимость улучшения приёма до следующего уровня
export const levelUpRequirements = {
  2: { taps: 100, exp: 50 },
  3: { taps: 200, exp: 100 },
  4: { taps: 350, exp: 200 },
  5: { taps: 500, exp: 350 }
};

// Стоимость открытия следующего приёма (зависит от уровня предыдущего)
export const unlockRequirements = {
  3: { taps: 300, exp: 150 },
  4: { taps: 250, exp: 120 },
  5: { taps: 200, exp: 100 }
};
