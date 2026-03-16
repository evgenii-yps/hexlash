/**
 * Matchmaking Service — manages the PvP matchmaking queue.
 * Players join queue via WebSocket, service pairs them by rating proximity.
 */

const SEARCH_RANGE_INITIAL = 100;
const SEARCH_RANGE_STEP = 50;
const SEARCH_RANGE_MAX = 500;
const SEARCH_EXPAND_INTERVAL_MS = 5000;
const SEARCH_TIMEOUT_MS = 120000; // 2 minutes

class MatchmakingService {
  constructor() {
    this.queue = new Map(); // odId -> { odId, username, rating, searchRange, searchingSince }
    this.expandTimers = new Map(); // odId -> intervalId
  }

  /** Add a player to the matchmaking queue. Returns immediate match or null. */
  addToQueue(player) {
    // Remove if already in queue
    this.removeFromQueue(player.odId);

    const entry = {
      odId: player.odId,
      username: player.username,
      rating: player.rating || 1000,
      searchRange: SEARCH_RANGE_INITIAL,
      searchingSince: Date.now(),
    };

    this.queue.set(player.odId, entry);

    // Start expanding search range periodically
    const expandTimer = setInterval(() => {
      const p = this.queue.get(player.odId);
      if (!p) {
        clearInterval(expandTimer);
        this.expandTimers.delete(player.odId);
        return;
      }

      p.searchRange = Math.min(p.searchRange + SEARCH_RANGE_STEP, SEARCH_RANGE_MAX);

      // Timeout — remove after 2 minutes
      if (Date.now() - p.searchingSince > SEARCH_TIMEOUT_MS) {
        this.removeFromQueue(player.odId);
        return;
      }

      // Try to find match with expanded range
      this.tryFindMatch(player.odId);
    }, SEARCH_EXPAND_INTERVAL_MS);

    this.expandTimers.set(player.odId, expandTimer);

    // Try immediate match
    return this.tryFindMatch(player.odId);
  }

  /** Remove a player from the queue. */
  removeFromQueue(odId) {
    this.queue.delete(odId);
    const timer = this.expandTimers.get(odId);
    if (timer) {
      clearInterval(timer);
      this.expandTimers.delete(odId);
    }
  }

  /** Try to find a match for the given player. Returns match pair or null. */
  tryFindMatch(odId) {
    const player = this.queue.get(odId);
    if (!player) return null;

    let bestMatch = null;
    let bestDiff = Infinity;

    for (const [oppId, opponent] of this.queue) {
      if (oppId === odId) continue;

      const ratingDiff = Math.abs(player.rating - opponent.rating);
      const maxRange = Math.max(player.searchRange, opponent.searchRange);

      if (ratingDiff <= maxRange && ratingDiff < bestDiff) {
        bestMatch = opponent;
        bestDiff = ratingDiff;
      }
    }

    if (bestMatch) {
      const match = this.createMatch(player, bestMatch);
      return match;
    }

    return null;
  }

  /** Create a match between two players, removing both from queue. */
  createMatch(player1, player2) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.removeFromQueue(player1.odId);
    this.removeFromQueue(player2.odId);

    return {
      matchId,
      player1: { odId: player1.odId, username: player1.username, rating: player1.rating },
      player2: { odId: player2.odId, username: player2.username, rating: player2.rating },
    };
  }

  /** Get number of players in queue. */
  getQueueSize() {
    return this.queue.size;
  }
}

// Singleton
module.exports = new MatchmakingService();
