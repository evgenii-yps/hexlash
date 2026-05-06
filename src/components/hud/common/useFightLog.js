// Epic 3A — Fight combat log.
// Step 15: reactive log store + logFight / clearFightLog. The HUD binds
// `fightLog.lines` via v-for; Step 16's useFightSimulation writes lines
// during doExchange/runRound. Auto-trim keeps the DOM light under long
// matches.
//
// Pattern parity with Epic 2: useHoverState, useClickState.

import { reactive } from 'vue';

const MAX_LINES = 50;

export const fightLog = reactive({ lines: [] });

export function logFight(html, cls) {
  fightLog.lines.push({ html, cls: cls || '' });
  if (fightLog.lines.length > MAX_LINES) {
    fightLog.lines.shift();
  }
}

export function clearFightLog() {
  fightLog.lines = [];
}
