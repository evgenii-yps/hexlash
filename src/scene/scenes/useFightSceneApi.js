// Epic 3A — Fight scene ↔ HUD bridge.
// Step 14: tiny composable that lets the Fight HUD call setCamMode /
// playMove / getState / resetFight without props drilling. FightScene binds
// its real implementations on build; dispose() unbinds so a late HUD event
// after unmount doesn't touch freed closures.
//
// Pattern parity with Epic 2: useHoverState, useClickState; Epic 3A Step 6:
// useCanvasRef; Epic 3A Step 8a: useFdLabels.

import { reactive } from 'vue';

const NOOP = () => {};
const NULL_STATE = () => null;

export const fightSceneApi = reactive({
  setCamMode: NOOP,
  playMove:   NOOP,
  getState:   NULL_STATE,
  resetFight: NOOP,
});

export function bindFightSceneApi(api) {
  Object.assign(fightSceneApi, api);
}

export function unbindFightSceneApi() {
  fightSceneApi.setCamMode = NOOP;
  fightSceneApi.playMove   = NOOP;
  fightSceneApi.getState   = NULL_STATE;
  fightSceneApi.resetFight = NOOP;
}
