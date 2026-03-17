const pvpMatchManager = require('../services/pvpMatchManager');

function handlePvPMessage(ws, message, user) {
  let data;
  try {
    data = typeof message === 'string' ? JSON.parse(message) : message;
  } catch (e) {
    return;
  }

  console.log('[PVP] handlePvPMessage:', data.type, 'from:', user?.odId);

  switch (data.type) {

    case 'pvp_ready': {
      console.log('[PVP] pvp_ready from:', user.odId, 'matchId:', data.matchId, 'deck:', data.deck?.length, 'modules');

      // Player is ready for the fight, sends their deck
      const match = pvpMatchManager.getMatch(data.matchId);
      console.log('[PVP] Match found:', !!match);
      console.log('[PVP] Active matches:', [...pvpMatchManager.activeMatches.keys()]);

      if (!match) {
        console.log('[PVP] ERROR: Match not found! matchId:', data.matchId);
        ws.send(JSON.stringify({ type: 'error', message: 'Match not found' }));
        return;
      }

      // Bind deck and socket
      if (user.odId === match.player1.odId) {
        match.player1.deck = data.deck;
        match.player1.socket = ws;
        match.player1.ready = true;
      } else if (user.odId === match.player2.odId) {
        match.player2.deck = data.deck;
        match.player2.socket = ws;
        match.player2.ready = true;
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in this match' }));
        return;
      }

      console.log('[PVP] Ready states: p1=', match.player1.ready, 'p2=', match.player2.ready);

      // Both ready → start the fight
      if (match.player1.ready && match.player2.ready) {
        console.log('[PVP] Both ready — starting fight!');
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
        match.onCoachChoice(user.odId, data.choice); // { accept: true/false }
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
