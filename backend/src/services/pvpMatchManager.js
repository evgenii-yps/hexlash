const PvPCombatEngine = require('./pvpCombatEngine');

class PvPMatchManager {
  constructor() {
    this.activeMatches = new Map(); // matchId -> PvPCombatEngine
  }

  createMatch(matchId, player1, player2) {
    const engine = new PvPCombatEngine(matchId, player1, player2);
    this.activeMatches.set(matchId, engine);
    return engine;
  }

  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  removeMatch(matchId) {
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
