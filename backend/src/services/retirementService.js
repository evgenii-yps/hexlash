/**
 * Retirement Service — manages fighter retirement and legend buffs.
 */

const prisma = require('../lib/prisma');

const TOTAL_MOVES = 18;
const MIN_LEVEL3_MOVES = 12;
const MIN_LEVEL5_MOVES = 3;

/**
 * Calculate retirement progress from progression data.
 */
function calculateRetirementProgress(progression) {
  const moves = progression?.moves || {};
  const entries = Object.values(moves);
  const unlockedMoves = entries.filter(m => m.unlocked).length;
  const movesAtLevel3Plus = entries.filter(m => m.unlocked && m.level >= 3).length;
  const movesAtLevel5 = entries.filter(m => m.unlocked && m.level >= 5).length;

  // Weighted progress: unlock=40%, lv3+=35%, lv5=25%
  const unlockPct = Math.min(1, unlockedMoves / TOTAL_MOVES) * 40;
  const lv3Pct = Math.min(1, movesAtLevel3Plus / MIN_LEVEL3_MOVES) * 35;
  const lv5Pct = Math.min(1, movesAtLevel5 / MIN_LEVEL5_MOVES) * 25;
  const overallProgress = Math.round(unlockPct + lv3Pct + lv5Pct);

  return { totalMoves: TOTAL_MOVES, unlockedMoves, movesAtLevel3Plus, movesAtLevel5, overallProgress };
}

/**
 * Calculate legend buff based on progression.
 */
function calculateLegendBuff(progression, primaryModule) {
  const moves = progression?.moves || {};
  const entries = Object.values(moves);
  const movesAtLv5 = entries.filter(m => m.unlocked && m.level >= 5).length;
  const movesAtLv4Plus = entries.filter(m => m.unlocked && m.level >= 4).length;

  return {
    xpBonus: parseFloat((0.05 + movesAtLv5 * 0.01).toFixed(2)),
    dmgBonus: parseFloat((0.02 + movesAtLv4Plus * 0.005).toFixed(3)),
    archetype: primaryModule,
  };
}

/**
 * Check if a user's fighter can retire.
 */
async function checkRetirementEligibility(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { progression: true },
  });

  if (!user) return { canRetire: false, progress: null, reasons: ['User not found'] };

  const isRetired = user.progression?.retired === true;
  if (isRetired) return { canRetire: false, progress: calculateRetirementProgress(user.progression), reasons: ['Already retired'], isRetired: true };

  const progress = calculateRetirementProgress(user.progression);
  const reasons = [];

  const allUnlocked = progress.unlockedMoves >= TOTAL_MOVES;
  const minLevel3 = progress.movesAtLevel3Plus >= MIN_LEVEL3_MOVES;
  const minLevel5 = progress.movesAtLevel5 >= MIN_LEVEL5_MOVES;

  // FightClub check (auto-created, so always exists if user has accessed Fight Club)
  const fightClub = await prisma.fightClub.findUnique({ where: { ownerId: userId }, select: { id: true, legendSkin: true } });
  const hasFightClub = !!fightClub;

  if (!allUnlocked) reasons.push(`Need all ${TOTAL_MOVES} moves unlocked (have ${progress.unlockedMoves})`);
  if (!minLevel3) reasons.push(`Need ${MIN_LEVEL3_MOVES} moves at Level 3+ (have ${progress.movesAtLevel3Plus})`);
  if (!minLevel5) reasons.push(`Need ${MIN_LEVEL5_MOVES} moves at Level 5 (have ${progress.movesAtLevel5})`);
  if (!hasFightClub) reasons.push('Must have a Fight Club');

  let noExistingLegend = true;
  if (hasFightClub) {
    noExistingLegend = !fightClub.legendSkin;
    if (!noExistingLegend) reasons.push('Fight Club already has a legend');
  }

  const requirements = { allUnlocked, minLevel3, minLevel5, hasClub: hasFightClub, noExistingLegend };
  const canRetire = allUnlocked && minLevel3 && minLevel5 && hasFightClub && noExistingLegend;

  return { canRetire, progress, requirements, reasons, isRetired: false };
}

/**
 * Retire a fighter — set legend on club.
 */
async function retireFighter(userId, primaryModule) {
  const eligibility = await checkRetirementEligibility(userId);
  if (!eligibility.canRetire) {
    return { success: false, reasons: eligibility.reasons };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { skin: true, progression: true },
  });

  const fightClub = await prisma.fightClub.findUnique({ where: { ownerId: userId } });
  if (!fightClub) return { success: false, reasons: ['No Fight Club'] };

  const buff = calculateLegendBuff(user.progression, primaryModule || 'predator');
  const updatedProgression = { ...user.progression, retired: true, retiredAt: new Date().toISOString() };

  await prisma.$transaction([
    prisma.fightClub.update({
      where: { id: fightClub.id },
      data: {
        legendSkin: user.skin,
        legendArchetype: primaryModule || 'predator',
        legendBuff: buff,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { progression: updatedProgression },
    }),
  ]);

  return {
    success: true,
    legend: { skin: user.skin, archetype: primaryModule, buff },
  };
}

module.exports = {
  calculateRetirementProgress,
  calculateLegendBuff,
  checkRetirementEligibility,
  retireFighter,
  TOTAL_MOVES,
  MIN_LEVEL3_MOVES,
  MIN_LEVEL5_MOVES,
};
