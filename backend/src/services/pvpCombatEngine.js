const allMoves = require('../data/moves');
const config = require('../config');

const {
  MAX_HP,
  MAX_ROUNDS,
  COUNTDOWN_MS,
  ROUND_ANIMATION_MS,
  DICE_COOLDOWN_ROUNDS,
  DICE_PAUSE_TIMEOUT_MS,
  EMERGENCY_HP_THRESHOLD,
  COACH_MIN_ROUND,
  COACH_BOOST_ROUNDS,
  COACH_PAUSE_TIMEOUT_MS,
} = config;

class PvPCombatEngine {
  constructor(matchId, player1, player2) {
    this.matchId = matchId;

    this.player1 = {
      odId: player1.odId,
      username: player1.username,
      deck: player1.deck,       // [{id, level}, ...]
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
      deck: player2.deck,
      hp: MAX_HP,
      diceUsedRound: -DICE_COOLDOWN_ROUNDS,
      coachUsed: false,
      coachTriggered: false,
      activeEffects: [],
      socket: null,
      ready: false,
    };

    this.currentRound = 0;
    this.maxRounds = MAX_ROUNDS;
    this.status = 'waiting'; // waiting, running, paused_dice, paused_coach, finished
    this.roundResults = [];
    this.pauseTimer = null;
    this.pendingChoices = {};
  }

  // ── START ──────────────────────────────────────────────────────────────

  start() {
    this.status = 'running';

    this.emit('fight_start', {
      matchId: this.matchId,
      player1: { odId: this.player1.odId, username: this.player1.username },
      player2: { odId: this.player2.odId, username: this.player2.username },
      maxRounds: this.maxRounds,
    });

    setTimeout(() => {
      this.nextRound();
    }, COUNTDOWN_MS);
  }

  // ── ROUND FLOW ─────────────────────────────────────────────────────────

  nextRound() {
    if (this.status === 'finished') return;

    this.currentRound++;

    // Fight over?
    if (this.currentRound > this.maxRounds || this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.endFight();
      return;
    }

    // Check dice availability
    const p1Dice = (this.currentRound - this.player1.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;
    const p2Dice = (this.currentRound - this.player2.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;

    if (p1Dice || p2Dice) {
      this.pauseForDice(p1Dice, p2Dice);
      return;
    }

    // Check coach — after COACH_MIN_ROUND, once per fight
    if (this.currentRound >= COACH_MIN_ROUND && !this.player1.coachTriggered && !this.player2.coachTriggered) {
      this.pauseForCoach();
      return;
    }

    this.simulateRound();
  }

  simulateRound() {
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
      setTimeout(() => this.nextRound(), ROUND_ANIMATION_MS);
      return;
    }

    const level1 = Math.min(Math.max(module1.level || 1, 1), 5);
    const level2 = Math.min(Math.max(module2.level || 1, 1), 5);

    // Speed determines who attacks first
    const speed1 = moveData1.speed[level1 - 1];
    const speed2 = moveData2.speed[level2 - 1];

    // Base damage from move data
    let damage1 = moveData1.damage[level1 - 1];
    let damage2 = moveData2.damage[level2 - 1];

    // Apply dice effects
    damage1 = this.applyEffects(damage1, this.player1, this.player2);
    damage2 = this.applyEffects(damage2, this.player2, this.player1);

    // Determine attack order by speed
    let firstAttacker, firstDamage, secondDamage, firstModule, secondModule;

    if (speed1 >= speed2) {
      firstAttacker = 'player1';
      firstDamage = damage1;
      secondDamage = damage2;
      firstModule = module1;
      secondModule = module2;
    } else {
      firstAttacker = 'player2';
      firstDamage = damage2;
      secondDamage = damage1;
      firstModule = module2;
      secondModule = module1;
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

    // Build round result
    const result = {
      round: this.currentRound,
      firstAttacker,
      player1: {
        module: module1,
        damage: firstAttacker === 'player1' ? firstDamage : secondDamage,
        hp: this.player1.hp,
        effects: [...this.player1.activeEffects],
      },
      player2: {
        module: module2,
        damage: firstAttacker === 'player2' ? firstDamage : secondDamage,
        hp: this.player2.hp,
        effects: [...this.player2.activeEffects],
      },
    };

    this.roundResults.push(result);
    this.emit('round_result', result);

    setTimeout(() => {
      this.nextRound();
    }, ROUND_ANIMATION_MS);
  }

  // ── DICE EFFECTS ───────────────────────────────────────────────────────

  applyEffects(baseDamage, attacker, defender) {
    let damage = baseDamage;

    for (const effect of attacker.activeEffects) {
      switch (effect.type) {
        case 'rage':
          damage = Math.round(damage * 1.5);
          break;
        case 'crit':
          damage = Math.round(damage * 2);
          break;
        case 'adrenaline':
          damage = Math.round(damage * 1.3);
          break;
      }
    }

    for (const effect of defender.activeEffects) {
      switch (effect.type) {
        case 'shield':
          damage = Math.round(damage * 0.5);
          break;
        case 'blind':
          if (Math.random() < 0.5) damage = 0;
          break;
      }
    }

    return damage;
  }

  rollDice() {
    const effects = [
      { type: 'heal', duration: 0 },       // instant: +20 HP
      { type: 'adrenaline', duration: 2 },  // 2 rounds: +30% damage
      { type: 'shield', duration: 2 },      // 2 rounds: -50% incoming damage
      { type: 'blind', duration: 2 },       // 2 rounds: 50% miss chance for opponent
      { type: 'rage', duration: 2 },        // 2 rounds: +50% damage
      { type: 'crit', duration: 1 },        // 1 round: x2 damage
    ];
    return effects[Math.floor(Math.random() * effects.length)];
  }

  applyDiceEffect(player, effect) {
    if (effect.type === 'heal') {
      player.hp = Math.min(MAX_HP, player.hp + 20);
    } else {
      player.activeEffects.push({ ...effect, roundsLeft: effect.duration });
    }
  }

  tickEffects(player) {
    player.activeEffects = player.activeEffects.filter(e => {
      e.roundsLeft--;
      return e.roundsLeft > 0;
    });
  }

  // ── DICE PAUSE ─────────────────────────────────────────────────────────

  pauseForDice(p1Available, p2Available) {
    this.status = 'paused_dice';
    this.pendingChoices = {
      player1: p1Available ? null : { roll: false },
      player2: p2Available ? null : { roll: false },
    };

    this.sendToPlayer(this.player1, 'dice_pause', {
      round: this.currentRound,
      timeLimit: DICE_PAUSE_TIMEOUT_MS,
      available: p1Available,
      waitingForOpponent: !p1Available,
    });

    this.sendToPlayer(this.player2, 'dice_pause', {
      round: this.currentRound,
      timeLimit: DICE_PAUSE_TIMEOUT_MS,
      available: p2Available,
      waitingForOpponent: !p2Available,
    });

    this.pauseTimer = setTimeout(() => {
      // Timeout — whoever didn't choose, doesn't roll
      if (this.pendingChoices.player1 === null) this.pendingChoices.player1 = { roll: false };
      if (this.pendingChoices.player2 === null) this.pendingChoices.player2 = { roll: false };
      this.resolveDicePause();
    }, DICE_PAUSE_TIMEOUT_MS);
  }

  onDiceChoice(odId, choice) {
    if (this.status !== 'paused_dice') return;

    if (odId === this.player1.odId) this.pendingChoices.player1 = choice;
    else if (odId === this.player2.odId) this.pendingChoices.player2 = choice;

    if (this.pendingChoices.player1 !== null && this.pendingChoices.player2 !== null) {
      clearTimeout(this.pauseTimer);
      this.resolveDicePause();
    }
  }

  resolveDicePause() {
    this.status = 'running';

    let p1Effect = null;
    let p2Effect = null;

    if (this.pendingChoices.player1?.roll) {
      p1Effect = this.rollDice();
      this.applyDiceEffect(this.player1, p1Effect);
      this.player1.diceUsedRound = this.currentRound;
    }

    if (this.pendingChoices.player2?.roll) {
      p2Effect = this.rollDice();
      this.applyDiceEffect(this.player2, p2Effect);
      this.player2.diceUsedRound = this.currentRound;
    }

    this.emit('dice_result', {
      player1: { rolled: !!this.pendingChoices.player1?.roll, effect: p1Effect },
      player2: { rolled: !!this.pendingChoices.player2?.roll, effect: p2Effect },
    });

    setTimeout(() => {
      this.simulateRound();
    }, ROUND_ANIMATION_MS);
  }

  // ── COACH PAUSE ────────────────────────────────────────────────────────

  pauseForCoach() {
    this.status = 'paused_coach';
    this.pendingChoices = { player1: null, player2: null };

    const advice1 = this.generateCoachAdvice(this.player1);
    const advice2 = this.generateCoachAdvice(this.player2);

    this.sendToPlayer(this.player1, 'coach_pause', {
      round: this.currentRound,
      timeLimit: COACH_PAUSE_TIMEOUT_MS,
      advice: advice1,
    });

    this.sendToPlayer(this.player2, 'coach_pause', {
      round: this.currentRound,
      timeLimit: COACH_PAUSE_TIMEOUT_MS,
      advice: advice2,
    });

    this.pauseTimer = setTimeout(() => {
      if (this.pendingChoices.player1 === null) this.pendingChoices.player1 = { accept: false };
      if (this.pendingChoices.player2 === null) this.pendingChoices.player2 = { accept: false };
      this.resolveCoachPause();
    }, COACH_PAUSE_TIMEOUT_MS);
  }

  onCoachChoice(odId, choice) {
    if (this.status !== 'paused_coach') return;

    if (odId === this.player1.odId) this.pendingChoices.player1 = choice;
    else if (odId === this.player2.odId) this.pendingChoices.player2 = choice;

    if (this.pendingChoices.player1 !== null && this.pendingChoices.player2 !== null) {
      clearTimeout(this.pauseTimer);
      this.resolveCoachPause();
    }
  }

  resolveCoachPause() {
    this.status = 'running';

    if (this.pendingChoices.player1?.accept) {
      this.applyCoachAdvice(this.player1);
    }
    if (this.pendingChoices.player2?.accept) {
      this.applyCoachAdvice(this.player2);
    }

    this.player1.coachTriggered = true;
    this.player2.coachTriggered = true;

    this.emit('coach_result', {
      player1: { accepted: !!this.pendingChoices.player1?.accept },
      player2: { accepted: !!this.pendingChoices.player2?.accept },
    });

    setTimeout(() => {
      this.simulateRound();
    }, ROUND_ANIMATION_MS);
  }

  generateCoachAdvice(player) {
    if (player.hp <= EMERGENCY_HP_THRESHOLD) {
      return { type: 'use_dice', message: 'coach_advice_low_hp' };
    }
    return { type: 'keep_fighting', message: 'coach_advice_keep_going' };
  }

  applyCoachAdvice(player) {
    // Adrenaline boost for COACH_BOOST_ROUNDS rounds
    player.activeEffects.push({ type: 'adrenaline', roundsLeft: COACH_BOOST_ROUNDS });
  }

  // ── END FIGHT ──────────────────────────────────────────────────────────

  endFight() {
    if (this.status === 'finished') return;
    this.status = 'finished';
    clearTimeout(this.pauseTimer);

    let winner = null;
    if (this.player1.hp <= 0 && this.player2.hp <= 0) winner = 'draw';
    else if (this.player1.hp <= 0) winner = this.player2.odId;
    else if (this.player2.hp <= 0) winner = this.player1.odId;
    else if (this.player1.hp > this.player2.hp) winner = this.player1.odId;
    else if (this.player2.hp > this.player1.hp) winner = this.player2.odId;
    else winner = 'draw';

    const result = {
      matchId: this.matchId,
      winner,
      rounds: this.currentRound,
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
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

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

      // Update ELO ratings
      if (result.winner && result.winner !== 'draw') {
        const winnerId = result.winner;
        const loserId = winnerId === result.player1.odId ? result.player2.odId : result.player1.odId;

        const winnerUser = await prisma.user.findUnique({ where: { id: winnerId } });
        const loserUser = await prisma.user.findUnique({ where: { id: loserId } });

        if (winnerUser && loserUser) {
          const elo = this.calculateElo(winnerUser.rating || 1000, loserUser.rating || 1000);
          await prisma.user.update({ where: { id: winnerId }, data: { rating: elo.winnerNew } });
          await prisma.user.update({ where: { id: loserId }, data: { rating: elo.loserNew } });
        }
      } else if (result.winner === 'draw') {
        // Draw — still adjust ratings
        const p1 = await prisma.user.findUnique({ where: { id: result.player1.odId } });
        const p2 = await prisma.user.findUnique({ where: { id: result.player2.odId } });

        if (p1 && p2) {
          const elo = this.calculateElo(p1.rating || 1000, p2.rating || 1000, true);
          await prisma.user.update({ where: { id: p1.id }, data: { rating: elo.winnerNew } });
          await prisma.user.update({ where: { id: p2.id }, data: { rating: elo.loserNew } });
        }
      }

      await prisma.$disconnect();
    } catch (e) {
      console.error('Failed to save fight result:', e);
    }

    // Remove match from manager
    const pvpMatchManager = require('./pvpMatchManager');
    pvpMatchManager.removeMatch(this.matchId);
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
    try { this.player1.socket?.send(msg); } catch (_) { /* socket closed */ }
    try { this.player2.socket?.send(msg); } catch (_) { /* socket closed */ }
  }

  sendToPlayer(player, type, data) {
    try {
      player.socket?.send(JSON.stringify({ type, ...data }));
    } catch (_) { /* socket closed */ }
  }
}

module.exports = PvPCombatEngine;
