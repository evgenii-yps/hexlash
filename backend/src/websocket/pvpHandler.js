const pvpMatchManager = require('../services/pvpMatchManager');

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

      // Bind deck, modules and socket
      if (user.odId === match.player1.odId) {
        match.player1.deck = data.deck;
        match.player1.modules = data.modules || [];
        match.player1.socket = ws;
        match.player1.ready = true;
      } else if (user.odId === match.player2.odId) {
        match.player2.deck = data.deck;
        match.player2.modules = data.modules || [];
        match.player2.socket = ws;
        match.player2.ready = true;
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in this match' }));
        return;
      }

      // Both ready → start the fight
      if (match.player1.ready && match.player2.ready) {
        match.start();
      }
      break;
    }

    case 'dice_roll': {
      const match = pvpMatchManager.getMatchByPlayer(user.odId);
      if (match) {
        match.onDiceRoll(user.odId);
      }
      break;
    }

    case 'coach_choice': {
      const match = pvpMatchManager.getMatchByPlayer(user.odId);
      if (match) {
        match.onCoachChoice(user.odId, data.choice); // { action: 'attack'|'defense'|'position' }
      }
      break;
    }
  }
}

function handlePvPDisconnect(odId) {
  const match = pvpMatchManager.getMatchByPlayer(odId);
  if (match && match.status !== 'finished') {
    match.onPlayerDisconnect(odId);
    pvpMatchManager.removeMatch(match.matchId);
  }
}

module.exports = { handlePvPMessage, handlePvPDisconnect };
