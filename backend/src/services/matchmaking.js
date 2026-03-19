/**
 * Matchmaking Service — manages the PvP matchmaking queue.
 * Players join queue via WebSocket, service pairs them by rating proximity.
 */

const pvpMatchManager = require('./pvpMatchManager');

const SEARCH_RANGE_INITIAL = 300;
const SEARCH_RANGE_STEP = 100;
const SEARCH_RANGE_MAX = 1000;
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
      skin: player.skin || null,
      avatarUrl: player.avatarUrl || null,
      searchRange: SEARCH_RANGE_INITIAL,
      searchingSince: Date.now(),
    };

    this.queue.set(player.odId, entry);
    console.log('[MATCHMAKING] Adding to queue:', player.odId, 'rating:', entry.rating, 'queue size:', this.queue.size);
    console.log('[MATCHMAKING] Queue players:', [...this.queue.keys()]);

    // Start expanding search range periodically (matching is done by periodic check in handler.js)
    const expandTimer = setInterval(() => {
      const p = this.queue.get(player.odId);
      if (!p) {
        clearInterval(expandTimer);
        this.expandTimers.delete(player.odId);
        return;
      }

      p.searchRange = Math.min(p.searchRange + SEARCH_RANGE_STEP, SEARCH_RANGE_MAX);
      console.log('[MATCHMAKING] Expanded range for', player.odId, 'to', p.searchRange);

      // Timeout — remove after 2 minutes
      if (Date.now() - p.searchingSince > SEARCH_TIMEOUT_MS) {
        console.log('[MATCHMAKING] Timeout, removing:', player.odId);
        this.removeFromQueue(player.odId);
        return;
      }
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
    if (!player) {
      console.log('[MATCHMAKING] tryFindMatch: player not in queue:', odId);
      return null;
    }

    console.log('[MATCHMAKING] Trying to find match for:', odId, 'rating:', player.rating, 'range:', player.searchRange);

    let bestMatch = null;
    let bestDiff = Infinity;

    for (const [oppId, opponent] of this.queue) {
      if (oppId === odId) continue;

      const ratingDiff = Math.abs(player.rating - opponent.rating);
      const maxRange = Math.max(player.searchRange, opponent.searchRange);

      console.log('[MATCHMAKING] Comparing with:', oppId, 'rating:', opponent.rating, 'diff:', ratingDiff, 'maxRange:', maxRange, 'match:', ratingDiff <= maxRange);

      if (ratingDiff <= maxRange && ratingDiff < bestDiff) {
        bestMatch = opponent;
        bestDiff = ratingDiff;
      }
    }

    if (bestMatch) {
      console.log('[MATCHMAKING] MATCH FOUND:', odId, 'vs', bestMatch.odId, 'diff:', bestDiff);
      const match = this.createMatch(player, bestMatch);
      return match;
    }

    console.log('[MATCHMAKING] No match found for', odId);
    return null;
  }

  /** Create a match between two players, removing both from queue. */
  createMatch(player1, player2) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log('[MATCHMAKING] Creating match:', matchId, 'P1:', player1.odId, player1.username, 'P2:', player2.odId, player2.username);

    this.removeFromQueue(player1.odId);
    this.removeFromQueue(player2.odId);

    // Register the match in PvP match manager (decks come later via pvp_ready)
    pvpMatchManager.createMatch(matchId, {
      odId: player1.odId,
      username: player1.username,
      deck: [],
    }, {
      odId: player2.odId,
      username: player2.username,
      deck: [],
    });

    return {
      matchId,
      player1: { odId: player1.odId, username: player1.username, rating: player1.rating, skin: player1.skin, avatarUrl: player1.avatarUrl },
      player2: { odId: player2.odId, username: player2.username, rating: player2.rating, skin: player2.skin, avatarUrl: player2.avatarUrl },
    };
  }

  /** Get number of players in queue. */
  getQueueSize() {
    return this.queue.size;
  }
}

// Singleton
module.exports = new MatchmakingService();
