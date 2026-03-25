const PvPCombatEngine = require('./pvpCombatEngine');
const { PVP_READY_TIMEOUT_MS } = require('../config');

class PvPMatchManager {
  constructor() {
    this.activeMatches = new Map(); // matchId -> PvPCombatEngine
  }

  createMatch(matchId, player1, player2) {
    const engine = new PvPCombatEngine(matchId, player1, player2);
    this.activeMatches.set(matchId, engine);

    // Cancel match if both players aren't ready within timeout
    engine._readyTimeout = setTimeout(() => {
      if (!engine.player1.ready || !engine.player2.ready) {
        const reason = 'ready_timeout';
        const msg = JSON.stringify({ type: 'match_cancelled', matchId, reason });

        if (engine.player1.socket && engine.player1.socket.readyState === engine.player1.socket.OPEN) {
          engine.player1.socket.send(msg);
        }
        if (engine.player2.socket && engine.player2.socket.readyState === engine.player2.socket.OPEN) {
          engine.player2.socket.send(msg);
        }

        this.activeMatches.delete(matchId);
        console.log(`[PVP] Match ${matchId} cancelled: players not ready within ${PVP_READY_TIMEOUT_MS}ms`);
      }
    }, PVP_READY_TIMEOUT_MS);

    return engine;
  }

  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  removeMatch(matchId) {
    const engine = this.activeMatches.get(matchId);
    if (engine && engine._readyTimeout) {
      clearTimeout(engine._readyTimeout);
    }
    this.activeMatches.delete(matchId);
  }

  getMatchByPlayer(odId) {
    for (const [, engine] of this.activeMatches) {
      if (engine.player1.odId === odId || engine.player2.odId === odId) {
        return engine;
      }
    }
    return null;
  }
}

module.exports = new PvPMatchManager();
