const pvpMatchManager = require('../services/pvpMatchManager');
const { MIN_PVP_DECK_SIZE, MAX_DECK_SIZE } = require('../config');

const VALID_COACH_ACTIONS = ['attack', 'defense', 'position'];
const DICE_ROLL_COOLDOWN_MS = 2000; // max 1 dice_roll per 2s per player

const lastDiceRoll = new Map();   // userId -> timestamp
const coachChoiceSent = new Map(); // matchId:odId -> true (one choice per pause)

function handlePvPMessage(ws, message, user) {
  let data;
  try {
    data = typeof message === 'string' ? JSON.parse(message) : message;
  } catch (e) {
    return;
  }

  switch (data.type) {

    case 'pvp_ready': {
      // Player is ready for the fight, sends their deck
      const match = pvpMatchManager.getMatch(data.matchId);

      if (!match) {
        ws.send(JSON.stringify({ type: 'error', message: 'Match not found' }));
        return;
      }

      // Validate deck
      const deck = data.deck;
      if (!Array.isArray(deck) || deck.length < MIN_PVP_DECK_SIZE || deck.length > MAX_DECK_SIZE) {
        ws.send(JSON.stringify({ type: 'error', message: `Deck must have ${MIN_PVP_DECK_SIZE}-${MAX_DECK_SIZE} moves` }));
        return;
      }

      // Validate each deck entry has id and level
      for (const entry of deck) {
        if (!entry || !entry.id || typeof entry.level !== 'number' || entry.level < 1 || entry.level > 5) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid deck entry' }));
          return;
        }
      }

      const modules = Array.isArray(data.modules) ? data.modules : [];

      // Bind deck, modules and socket
      if (user.odId === match.player1.odId) {
        match.player1.deck = deck;
        match.player1.modules = modules;
        match.player1.socket = ws;
        match.player1.ready = true;
      } else if (user.odId === match.player2.odId) {
        match.player2.deck = deck;
        match.player2.modules = modules;
        match.player2.socket = ws;
        match.player2.ready = true;
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in this match' }));
        return;
      }

      // Recalculate archetype modifiers now that modules are set
      const { calculateArchetypeModifiers } = require('../services/pvpCombatEngine');
      if (user.odId === match.player1.odId) {
        match.player1.modifiers = calculateArchetypeModifiers(modules);
      } else {
        match.player2.modifiers = calculateArchetypeModifiers(modules);
      }

      // Both ready → start the fight
      if (match.player1.ready && match.player2.ready) {
        match.start();
      }
      break;
    }

    case 'dice_roll': {
      // Rate limit: max 1 per 2s per player
      const now = Date.now();
      const lastTime = lastDiceRoll.get(user.odId) || 0;
      if (now - lastTime < DICE_ROLL_COOLDOWN_MS) {
        ws.send(JSON.stringify({ type: 'dice_error', message: 'rate_limited' }));
        break;
      }
      lastDiceRoll.set(user.odId, now);

      const match = pvpMatchManager.getMatchByPlayer(user.odId);
      if (!match) {
        ws.send(JSON.stringify({ type: 'dice_error', message: 'no_active_match' }));
        break;
      }
      if (match.status !== 'running') {
        ws.send(JSON.stringify({ type: 'dice_error', message: 'fight_not_running' }));
        break;
      }
      match.onDiceRoll(user.odId);
      break;
    }

    case 'coach_choice': {
      const match = pvpMatchManager.getMatchByPlayer(user.odId);
      if (!match) break;
      if (match.status !== 'paused_coach') break;

      // Rate limit: max 1 coach_choice per pause session
      const coachKey = `${match.matchId}:${user.odId}`;
      if (coachChoiceSent.has(coachKey)) break;
      coachChoiceSent.set(coachKey, true);

      const action = data.choice?.action;
      // Validate: must be a valid action or null (timeout)
      if (action !== null && action !== undefined && !VALID_COACH_ACTIONS.includes(action)) {
        break; // silently ignore invalid action
      }

      match.onCoachChoice(user.odId, data.choice);
      break;
    }
  }
}

function handlePvPDisconnect(odId) {
  const match = pvpMatchManager.getMatchByPlayer(odId);
  if (match && match.status !== 'finished') {
    // Clean up rate limit state for both players
    lastDiceRoll.delete(match.player1.odId);
    lastDiceRoll.delete(match.player2.odId);
    coachChoiceSent.delete(`${match.matchId}:${match.player1.odId}`);
    coachChoiceSent.delete(`${match.matchId}:${match.player2.odId}`);

    match.onPlayerDisconnect(odId);
    pvpMatchManager.removeMatch(match.matchId);
  }
}

module.exports = { handlePvPMessage, handlePvPDisconnect };
