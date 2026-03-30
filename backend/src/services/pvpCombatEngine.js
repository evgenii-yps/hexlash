const allMoves = require('../data/moves');
const config = require('../config');

const {
  MAX_HP,
  MAX_ROUNDS,
  TOTAL_ROUNDS,
  EXTRA_ROUND_DAMAGE_MULTIPLIER,
  COUNTDOWN_MS,
  ROUND_ANIMATION_MS,
  DICE_COOLDOWN_ROUNDS,
  EMERGENCY_HP_THRESHOLD,
  COACH_MIN_ROUND,
  COACH_BOOST_ROUNDS,
  COACH_PAUSE_TIMEOUT_MS,
  SLOT_WEIGHTS,
  ARCHETYPE_MODIFIERS,
} = config;

/**
 * Calculate passive archetype modifiers from 3 module slots.
 * Weights: slot1=50%, slot2=30%, slot3=20%.
 * Returns { dmgBonus, incomingReduction, dodgeChance, critChance, critMult }.
 */
function calculateArchetypeModifiers(modules) {
  const zero = { dmgBonus: 0, incomingReduction: 0, dodgeChance: 0, critChance: 0, critMult: 1.0 };
  if (!modules || !modules.length) return zero;

  let dmgBonus = 0;
  let incomingReduction = 0;
  let dodgeChance = 0;
  let critChance = 0;
  let critMultWeighted = 0;
  let critSlots = 0;

  for (let i = 0; i < Math.min(modules.length, 3); i++) {
    const archId = modules[i];
    const arch = ARCHETYPE_MODIFIERS[archId];
    if (!arch) continue;

    const w = SLOT_WEIGHTS[i];

    let aDmg = arch.dmgBonus;
    let aInc = arch.incomingReduction;
    let aDodge = arch.dodgeChance;
    let aCrit = arch.critChance;

    // Maverick: randomize within ±randomRange per fight
    if (arch.randomRange) {
      const r = arch.randomRange;
      aDmg = (Math.random() * 2 - 1) * r;
      aInc = (Math.random() * 2 - 1) * r;
      // dodge/crit keep base values for maverick (already set)
    }

    dmgBonus += aDmg * w;
    incomingReduction += aInc * w;
    dodgeChance += aDodge * w;
    critChance += aCrit * w;

    if (arch.critMult > 1.0) {
      critMultWeighted += arch.critMult * w;
      critSlots += w;
    }
  }

  // Average crit multiplier across slots that contribute crit
  const critMult = critSlots > 0 ? critMultWeighted / critSlots : 1.5;

  return { dmgBonus, incomingReduction, dodgeChance, critChance, critMult };
}

class PvPCombatEngine {
  constructor(matchId, player1, player2) {
    this.matchId = matchId;

    this.player1 = {
      odId: player1.odId,
      username: player1.username,
      skin: player1.skin || null,
      avatarUrl: player1.avatarUrl || null,
      deck: player1.deck,       // [{id, level}, ...]
      modules: player1.modules || [],
      modifiers: calculateArchetypeModifiers(player1.modules),
      hp: MAX_HP,
      diceUsedRound: -DICE_COOLDOWN_ROUNDS, // available from round 1
      coachUsed: false,
      coachTriggered: false,
      activeEffects: [],
      socket: null,
      ready: false,
    };

    this.player2 = {
      odId: player2.odId,
      username: player2.username,
      skin: player2.skin || null,
      avatarUrl: player2.avatarUrl || null,
      deck: player2.deck,
      modules: player2.modules || [],
      modifiers: calculateArchetypeModifiers(player2.modules),
      hp: MAX_HP,
      diceUsedRound: -DICE_COOLDOWN_ROUNDS,
      coachUsed: false,
      coachTriggered: false,
      activeEffects: [],
      socket: null,
      ready: false,
    };

    this.currentRound = 0;
    this.maxRounds = TOTAL_ROUNDS;
    this.status = 'waiting'; // waiting, running, paused_coach, finished
    this.roundResults = [];
    this.pauseTimer = null;
    this.roundTimer = null;
    this.pendingChoices = {};
  }

  // ── START ──────────────────────────────────────────────────────────────

  start() {
    if (this._readyTimeout) {
      clearTimeout(this._readyTimeout);
      this._readyTimeout = null;
    }
    this.status = 'running';

    console.log('[ENGINE] Fight started:', this.matchId, 'P1:', this.player1.odId, 'P2:', this.player2.odId);

    this.emit('fight_start', {
      matchId: this.matchId,
      player1: { odId: this.player1.odId, username: this.player1.username, skin: this.player1.skin, avatarUrl: this.player1.avatarUrl },
      player2: { odId: this.player2.odId, username: this.player2.username, skin: this.player2.skin, avatarUrl: this.player2.avatarUrl },
      maxRounds: this.maxRounds,
      overdriveStartRound: MAX_ROUNDS + 1,
    });

    this.roundTimer = setTimeout(() => {
      this.nextRound();
    }, COUNTDOWN_MS);
  }

  // ── ROUND FLOW ─────────────────────────────────────────────────────────

  nextRound() {
    if (this.status === 'finished') return;

    this.currentRound++;
    const isOverdrive = this.currentRound > MAX_ROUNDS;

    // Fight over?
    if (this.currentRound > this.maxRounds || this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.endFight();
      return;
    }

    // After MAX_ROUNDS, only enter Overdrive if both alive
    if (isOverdrive && (this.player1.hp <= 0 || this.player2.hp <= 0)) {
      this.endFight();
      return;
    }

    // Notify Overdrive start
    if (this.currentRound === MAX_ROUNDS + 1) {
      this.emit('overdrive_start', { round: this.currentRound });
    }

    // Dice and coach disabled in Overdrive
    if (!isOverdrive) {
      // Notify players of dice availability
      const p1Dice = (this.currentRound - this.player1.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;
      const p2Dice = (this.currentRound - this.player2.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;

      if (p1Dice) {
        this.sendToPlayer(this.player1, 'dice_available', { round: this.currentRound });
      }
      if (p2Dice) {
        this.sendToPlayer(this.player2, 'dice_available', { round: this.currentRound });
      }

      // Check coach — after COACH_MIN_ROUND, once per fight
      if (this.currentRound >= COACH_MIN_ROUND && !this.player1.coachTriggered && !this.player2.coachTriggered) {
        this.pauseForCoach();
        return;
      }
    }

    this.simulateRound();
  }

  simulateRound() {
    // Guard against empty decks
    if (!this.player1.deck?.length || !this.player2.deck?.length) {
      console.error('[ENGINE] Empty deck! P1:', this.player1.deck?.length, 'P2:', this.player2.deck?.length);
      this.endFight();
      return;
    }

    // Pick module for each player — cycle through deck
    const deckIndex1 = (this.currentRound - 1) % this.player1.deck.length;
    const deckIndex2 = (this.currentRound - 1) % this.player2.deck.length;

    const module1 = this.player1.deck[deckIndex1];
    const module2 = this.player2.deck[deckIndex2];

    // Look up move data
    const moveData1 = allMoves[module1.id];
    const moveData2 = allMoves[module2.id];

    if (!moveData1 || !moveData2) {
      // Invalid move — skip round with 0 damage
      this.roundResults.push({ round: this.currentRound, error: 'invalid_move' });
      this.roundTimer = setTimeout(() => this.nextRound(), ROUND_ANIMATION_MS);
      return;
    }

    const level1 = Math.min(Math.max(module1.level || 1, 1), 5);
    const level2 = Math.min(Math.max(module2.level || 1, 1), 5);

    // Speed determines who attacks first
    const speed1 = moveData1.speed[level1 - 1];
    const speed2 = moveData2.speed[level2 - 1];

    // Base damage from move data (doubled in Overdrive)
    const isOverdrive = this.currentRound > MAX_ROUNDS;
    const overdriveMult = isOverdrive ? EXTRA_ROUND_DAMAGE_MULTIPLIER : 1;
    let damage1 = moveData1.damage[level1 - 1] * overdriveMult;
    let damage2 = moveData2.damage[level2 - 1] * overdriveMult;

    // Apply dice effects (effects cleared in Overdrive via tickEffects)
    damage1 = this.applyEffects(damage1, this.player1, this.player2);
    damage2 = this.applyEffects(damage2, this.player2, this.player1);

    // Apply archetype passive modifiers: dmgBonus, incomingReduction, dodge, crit
    const mod1 = this.player1.modifiers;
    const mod2 = this.player2.modifiers;

    // Damage bonus (attacker) and incoming reduction (defender)
    damage1 = Math.round(damage1 * (1 + mod1.dmgBonus) * (1 - mod2.incomingReduction));
    damage2 = Math.round(damage2 * (1 + mod2.dmgBonus) * (1 - mod1.incomingReduction));

    // Dodge check (defender avoids all damage)
    const p1Dodged = Math.random() < mod1.dodgeChance;
    const p2Dodged = Math.random() < mod2.dodgeChance;
    if (p2Dodged) damage1 = 0;
    if (p1Dodged) damage2 = 0;

    // Crit check (attacker deals bonus damage, only if not dodged)
    const p1Critted = !p2Dodged && Math.random() < mod1.critChance;
    const p2Critted = !p1Dodged && Math.random() < mod2.critChance;
    if (p1Critted) damage1 = Math.round(damage1 * mod1.critMult);
    if (p2Critted) damage2 = Math.round(damage2 * mod2.critMult);

    // Determine attack order by speed
    let firstAttacker, firstDamage, secondDamage, firstModule, secondModule;
    let firstDodged, secondDodged, firstCritted, secondCritted;

    if (speed1 >= speed2) {
      firstAttacker = 'player1';
      firstDamage = damage1;
      secondDamage = damage2;
      firstModule = module1;
      secondModule = module2;
      firstDodged = p2Dodged;
      secondDodged = p1Dodged;
      firstCritted = p1Critted;
      secondCritted = p2Critted;
    } else {
      firstAttacker = 'player2';
      firstDamage = damage2;
      secondDamage = damage1;
      firstModule = module2;
      secondModule = module1;
      firstDodged = p1Dodged;
      secondDodged = p2Dodged;
      firstCritted = p2Critted;
      secondCritted = p1Critted;
    }

    // Apply damage — faster attacker hits first, second only hits if alive
    if (firstAttacker === 'player1') {
      this.player2.hp = Math.max(0, this.player2.hp - firstDamage);
      if (this.player2.hp > 0) {
        this.player1.hp = Math.max(0, this.player1.hp - secondDamage);
      }
    } else {
      this.player1.hp = Math.max(0, this.player1.hp - firstDamage);
      if (this.player1.hp > 0) {
        this.player2.hp = Math.max(0, this.player2.hp - secondDamage);
      }
    }

    // Tick effect durations
    this.tickEffects(this.player1);
    this.tickEffects(this.player2);

    // Build round result (enriched with name/branch for frontend display)
    const result = {
      round: this.currentRound,
      isOverdrive,
      firstAttacker,
      player1: {
        module: { id: module1.id, level: level1, name: moveData1.id, branch: moveData1.branch },
        damage: firstAttacker === 'player1' ? firstDamage : secondDamage,
        hp: this.player1.hp,
        effects: [...this.player1.activeEffects],
        dodged: firstAttacker === 'player1' ? firstDodged : secondDodged,
        critted: firstAttacker === 'player1' ? firstCritted : secondCritted,
      },
      player2: {
        module: { id: module2.id, level: level2, name: moveData2.id, branch: moveData2.branch },
        damage: firstAttacker === 'player2' ? firstDamage : secondDamage,
        hp: this.player2.hp,
        effects: [...this.player2.activeEffects],
        dodged: firstAttacker === 'player2' ? firstDodged : secondDodged,
        critted: firstAttacker === 'player2' ? firstCritted : secondCritted,
      },
    };

    this.roundResults.push(result);
    this.emit('round_result', result);

    this.roundTimer = setTimeout(() => {
      this.nextRound();
    }, ROUND_ANIMATION_MS);
  }

  // ── DICE EFFECTS ───────────────────────────────────────────────────────

  applyEffects(baseDamage, attacker, defender) {
    let damage = baseDamage;

    for (const effect of attacker.activeEffects) {
      switch (effect.type) {
        case 'adrenaline':
          damage = Math.round(damage * 2);
          break;
        case 'coach_attack':
          damage = Math.round(damage * 1.25);
          break;
        case 'coach_position':
          damage = Math.round(damage * 1.15);
          break;
      }
    }

    for (const effect of defender.activeEffects) {
      switch (effect.type) {
        case 'shield':
          damage = 0; // full block
          break;
        case 'blind':
          damage = 0; // guaranteed miss
          break;
        case 'coach_defense':
          damage = Math.round(damage * 0.7);
          break;
        case 'coach_position':
          damage = Math.round(damage * 0.85);
          break;
      }
    }

    return damage;
  }

  rollDice() {
    const effects = [
      { type: 'heal', duration: 0 },       // instant: +15 HP
      { type: 'adrenaline', duration: 1 },  // 1 round: x2 damage
      { type: 'shield', duration: 1 },      // 1 round: full block incoming
      { type: 'blind', duration: 1 },       // 1 round: guaranteed miss for opponent
      { type: 'rage', duration: 0 },        // instant: -20 HP to opponent
      { type: 'crit', duration: 0 },        // instant: -30 HP to opponent
    ];
    return effects[Math.floor(Math.random() * effects.length)];
  }

  applyDiceEffect(player, effect, opponent) {
    switch (effect.type) {
      case 'heal':
        player.hp = Math.min(MAX_HP, player.hp + 15);
        break;
      case 'rage':
        opponent.hp = Math.max(0, opponent.hp - 20);
        break;
      case 'crit':
        opponent.hp = Math.max(0, opponent.hp - 30);
        break;
      default:
        // Adrenaline, Shield, Blind — 1-round buffs
        player.activeEffects.push({ ...effect, roundsLeft: effect.duration });
        break;
    }
  }

  tickEffects(player) {
    player.activeEffects = player.activeEffects.filter(e => {
      e.roundsLeft--;
      return e.roundsLeft > 0;
    });
  }

  // ── INSTANT DICE ROLL (no pause) ───────────────────────────────────────

  onDiceRoll(odId) {
    if (this.status === 'finished') return;
    // Dice disabled in Overdrive
    if (this.currentRound > MAX_ROUNDS) return;

    let player = null;
    let opponent = null;
    if (odId === this.player1.odId) {
      player = this.player1;
      opponent = this.player2;
    } else if (odId === this.player2.odId) {
      player = this.player2;
      opponent = this.player1;
    } else return;

    // Check cooldown
    const available = (this.currentRound - player.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;
    if (!available) {
      this.sendToPlayer(player, 'dice_error', { message: 'dice_on_cooldown' });
      return;
    }

    const effect = this.rollDice();
    this.applyDiceEffect(player, effect, opponent);
    player.diceUsedRound = this.currentRound;

    // Notify the rolling player of their result
    const isInstantDamage = effect.type === 'rage' || effect.type === 'crit';
    this.sendToPlayer(player, 'dice_rolled', {
      effect,
      hp: player.hp,
      oppHp: isInstantDamage ? opponent.hp : undefined,
      killed: isInstantDamage && opponent.hp <= 0,
    });

    // If instant damage killed opponent — end fight immediately
    if (isInstantDamage && opponent.hp <= 0) {
      this.endFight();
    }
  }

  // ── COACH PAUSE ────────────────────────────────────────────────────────

  pauseForCoach() {
    this.status = 'paused_coach';
    this.pendingChoices = { player1: null, player2: null };

    // Send same 3 options as PvE: attack, defense, position
    this.sendToPlayer(this.player1, 'coach_pause', {
      round: this.currentRound,
      timeLimit: COACH_PAUSE_TIMEOUT_MS,
    });

    this.sendToPlayer(this.player2, 'coach_pause', {
      round: this.currentRound,
      timeLimit: COACH_PAUSE_TIMEOUT_MS,
    });

    this.pauseTimer = setTimeout(() => {
      if (this.pendingChoices.player1 === null) this.pendingChoices.player1 = { action: null };
      if (this.pendingChoices.player2 === null) this.pendingChoices.player2 = { action: null };
      this.resolveCoachPause();
    }, COACH_PAUSE_TIMEOUT_MS);
  }

  onCoachChoice(odId, choice) {
    if (this.status !== 'paused_coach') return;

    if (odId === this.player1.odId) this.pendingChoices.player1 = choice;
    else if (odId === this.player2.odId) this.pendingChoices.player2 = choice;

    // Notify the other player that this one has chosen
    const otherPlayer = (odId === this.player1.odId) ? this.player2 : this.player1;
    this.sendToPlayer(otherPlayer, 'coach_opponent_ready', {});

    if (this.pendingChoices.player1 !== null && this.pendingChoices.player2 !== null) {
      clearTimeout(this.pauseTimer);
      this.resolveCoachPause();
    }
  }

  resolveCoachPause() {
    this.status = 'running';

    const p1Action = this.pendingChoices.player1?.action;
    const p2Action = this.pendingChoices.player2?.action;

    if (p1Action) {
      this.applyCoachAdvice(this.player1, p1Action);
    }
    if (p2Action) {
      this.applyCoachAdvice(this.player2, p2Action);
    }

    this.player1.coachTriggered = true;
    this.player2.coachTriggered = true;

    this.emit('coach_result', {
      player1: { action: p1Action || null },
      player2: { action: p2Action || null },
    });

    // Coach pause consumed the current round — simulate it now
    // (currentRound was already incremented in nextRound() before pauseForCoach())
    this.roundTimer = setTimeout(() => {
      this.simulateRound();
    }, ROUND_ANIMATION_MS);
  }

  applyCoachAdvice(player, action) {
    // Same as PvE: boost chosen priority for COACH_BOOST_ROUNDS rounds
    // attack: +25% damage, defense: -30% incoming, position: +15% dmg & -15% incoming
    player.activeEffects.push({ type: `coach_${action}`, roundsLeft: COACH_BOOST_ROUNDS });
  }

  // ── END FIGHT ──────────────────────────────────────────────────────────

  endFight() {
    if (this.status === 'finished') return;
    this.status = 'finished';
    clearTimeout(this.pauseTimer);
    clearTimeout(this.roundTimer);

    let winner = null;
    if (this.player1.hp <= 0 && this.player2.hp <= 0) winner = 'draw';
    else if (this.player1.hp <= 0) winner = this.player2.odId;
    else if (this.player2.hp <= 0) winner = this.player1.odId;
    else if (this.player1.hp > this.player2.hp) winner = this.player1.odId;
    else if (this.player2.hp > this.player1.hp) winner = this.player2.odId;
    else winner = 'draw';

    // Calculate XP: win=10, lose=5, draw=7
    const xp = this.calculateXP(winner);

    const result = {
      matchId: this.matchId,
      winner,
      rounds: this.currentRound,
      xp,
      player1: {
        odId: this.player1.odId,
        username: this.player1.username,
        finalHp: this.player1.hp,
      },
      player2: {
        odId: this.player2.odId,
        username: this.player2.username,
        finalHp: this.player2.hp,
      },
      roundLog: this.roundResults,
    };

    this.emit('fight_end', result);
    this.saveFightResult(result);
    return result;
  }

  // ── DISCONNECT ─────────────────────────────────────────────────────────

  onPlayerDisconnect(odId) {
    if (this.status === 'finished') return;

    this.status = 'finished';
    clearTimeout(this.pauseTimer);
    clearTimeout(this.roundTimer);

    const winner = odId === this.player1.odId ? this.player2 : this.player1;

    const result = {
      matchId: this.matchId,
      winner: winner.odId,
      reason: 'disconnect',
      rounds: this.currentRound,
      player1: { odId: this.player1.odId, finalHp: this.player1.hp },
      player2: { odId: this.player2.odId, finalHp: this.player2.hp },
    };

    this.sendToPlayer(winner, 'fight_end', {
      ...result,
      reason: 'opponent_disconnected',
    });

    this.saveFightResult(result);
    return result;
  }

  // ── PERSISTENCE ────────────────────────────────────────────────────────

  async saveFightResult(result) {
    try {
      const prisma = require('../lib/prisma');

      await prisma.fight.create({
        data: {
          mode: 'pvp',
          matchId: result.matchId,
          fighterOneId: result.player1.odId,
          fighterTwoId: result.player2.odId,
          player1Id: result.player1.odId,
          player2Id: result.player2.odId,
          player1Hp: result.player1.finalHp,
          player2Hp: result.player2.finalHp,
          winner: result.winner,
          winnerId: result.winner !== 'draw' ? result.winner : null,
          reason: result.reason || 'normal',
          rounds: result.rounds,
          roundLog: result.roundLog || [],
          isCompleted: true,
        },
      });

      // Update ELO ratings and PvP statistics in a transaction
      if (result.winner && result.winner !== 'draw') {
        const winnerId = result.winner;
        const loserId = winnerId === result.player1.odId ? result.player2.odId : result.player1.odId;

        const winnerUser = await prisma.user.findUnique({ where: { id: winnerId } });
        const loserUser = await prisma.user.findUnique({ where: { id: loserId } });

        if (winnerUser && loserUser) {
          const elo = this.calculateElo(winnerUser.rating || 1000, loserUser.rating || 1000);
          await prisma.$transaction([
            prisma.user.update({
              where: { id: winnerId },
              data: {
                rating: elo.winnerNew,
                pvpTotalFights: { increment: 1 },
                pvpWins: { increment: 1 },
                totalFights: { increment: 1 },
                wins: { increment: 1 },
              },
            }),
            prisma.user.update({
              where: { id: loserId },
              data: {
                rating: elo.loserNew,
                pvpTotalFights: { increment: 1 },
                pvpLosses: { increment: 1 },
                totalFights: { increment: 1 },
                losses: { increment: 1 },
              },
            }),
          ]);
        }
      } else if (result.winner === 'draw') {
        const p1 = await prisma.user.findUnique({ where: { id: result.player1.odId } });
        const p2 = await prisma.user.findUnique({ where: { id: result.player2.odId } });

        if (p1 && p2) {
          const elo = this.calculateElo(p1.rating || 1000, p2.rating || 1000, true);
          await prisma.$transaction([
            prisma.user.update({
              where: { id: p1.id },
              data: {
                rating: elo.winnerNew,
                pvpTotalFights: { increment: 1 },
                pvpDraws: { increment: 1 },
                totalFights: { increment: 1 },
                draws: { increment: 1 },
              },
            }),
            prisma.user.update({
              where: { id: p2.id },
              data: {
                rating: elo.loserNew,
                pvpTotalFights: { increment: 1 },
                pvpDraws: { increment: 1 },
                totalFights: { increment: 1 },
                draws: { increment: 1 },
              },
            }),
          ]);
        }
      }

      // Update club stats + award clan XP for both players
      const { awardClanXP } = require('../utils/clanLevel');
      const { createClanEvent } = require('../utils/clanEvents');
      const player1 = await prisma.user.findUnique({ where: { id: result.player1.odId }, select: { clubId: true } });
      const player2 = await prisma.user.findUnique({ where: { id: result.player2.odId }, select: { clubId: true } });
      const clubIds = new Set([player1?.clubId, player2?.clubId].filter(Boolean));
      for (const cId of clubIds) {
        const isP1Club = player1?.clubId === cId;
        const isP2Club = player2?.clubId === cId;
        const isP1Win = result.winner === result.player1.odId && isP1Club;
        const isP2Win = result.winner === result.player2.odId && isP2Club;
        const clubUpdate = { battles: { increment: 1 } };
        if (isP1Win || isP2Win) {
          clubUpdate.wins = { increment: 1 };
        }
        await prisma.club.update({ where: { id: cId }, data: clubUpdate });

        // Award clan XP per player in this club + log events
        if (isP1Club) {
          const p1Result = result.winner === 'draw' ? 'draw' : (result.winner === result.player1.odId ? 'win' : 'lose');
          awardClanXP(cId, p1Result).catch(e => console.error('Clan XP error:', e));
          const p1EventType = p1Result === 'win' ? 'fight_win' : p1Result === 'draw' ? 'fight_draw' : 'fight_lose';
          createClanEvent(cId, p1EventType, result.player1.odId, null, {
            opponentName: result.player2.login || 'Opponent',
            playerHp: result.player1.finalHp,
            opponentHp: result.player2.finalHp,
            mode: 'pvp',
          });
        }
        if (isP2Club) {
          const p2Result = result.winner === 'draw' ? 'draw' : (result.winner === result.player2.odId ? 'win' : 'lose');
          awardClanXP(cId, p2Result).catch(e => console.error('Clan XP error:', e));
          const p2EventType = p2Result === 'win' ? 'fight_win' : p2Result === 'draw' ? 'fight_draw' : 'fight_lose';
          createClanEvent(cId, p2EventType, result.player2.odId, null, {
            opponentName: result.player1.login || 'Opponent',
            playerHp: result.player2.finalHp,
            opponentHp: result.player1.finalHp,
            mode: 'pvp',
          });
        }
      }

    } catch (e) {
      console.error('Failed to save fight result:', e);
    }

    // Remove match from manager
    const pvpMatchManager = require('./pvpMatchManager');
    pvpMatchManager.removeMatch(this.matchId);
  }

  calculateXP(winner) {
    const BASE_XP = 5;
    const WIN_BONUS = 5;
    const DRAW_BONUS = 2;

    if (winner === 'draw') {
      return { player1: BASE_XP + DRAW_BONUS, player2: BASE_XP + DRAW_BONUS };
    }

    const p1Won = winner === this.player1.odId;
    return {
      player1: p1Won ? BASE_XP + WIN_BONUS : BASE_XP,
      player2: p1Won ? BASE_XP : BASE_XP + WIN_BONUS,
    };
  }

  calculateElo(winnerRating, loserRating, isDraw = false) {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));

    if (isDraw) {
      return {
        winnerNew: Math.round(winnerRating + K * (0.5 - expected)),
        loserNew: Math.round(loserRating + K * (0.5 - (1 - expected))),
      };
    }

    return {
      winnerNew: Math.round(winnerRating + K * (1 - expected)),
      loserNew: Math.round(loserRating + K * (0 - (1 - expected))),
    };
  }

  // ── UTILITIES ──────────────────────────────────────────────────────────

  emit(type, data) {
    const msg = JSON.stringify({ type, ...data });
    try { this.player1.socket?.send(msg); } catch (e) { console.error('[ENGINE] Failed to send to P1:', e.message); }
    try { this.player2.socket?.send(msg); } catch (e) { console.error('[ENGINE] Failed to send to P2:', e.message); }
  }

  sendToPlayer(player, type, data) {
    try {
      player.socket?.send(JSON.stringify({ type, ...data }));
    } catch (_) { /* socket closed */ }
  }
}

PvPCombatEngine.calculateArchetypeModifiers = calculateArchetypeModifiers;
module.exports = PvPCombatEngine;
