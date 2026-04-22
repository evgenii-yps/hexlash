// Epic 4 Step 1 — Cross-view setup for newly created agents.
// Symmetric to 3Bb useFightSetup: producer (CreateView, after backend
// POST /v1/agent/create) writes; consumer (FighterDetailView, on mount)
// reads + clears (one-shot consumption). The clear hop avoids stale state
// leaking into a later direct visit of /v2/fd/:sameId — second visit must
// re-fetch from agentState instead of seeing the ephemeral created data.
//
// Refresh on /v2/fd/:id loses state.current — FighterDetailView falls back
// to store.dispatch('agent/fetchAgent', key). Acceptable because the data
// the composable carries is only a fast-path for the just-created flow;
// the canonical source is always the Vuex store.

import { reactive } from 'vue';

const state = reactive({ current: null });

export function setCreatedFighter(data) {
  state.current = {
    id: data.id,
    name: data.name,
    archetype: data.archetype,
  };
}

export function getCreatedFighter() {
  // Shallow copy — callers cannot mutate the stored payload.
  return state.current ? { ...state.current } : null;
}

export function clearCreatedFighter() {
  state.current = null;
}
