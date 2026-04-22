<!-- Epic 3Bc — Create HUD.
     Steps 1/7: stepper + panel shell.
     Step 8: Step 1 Archetype cards (6 × ARCHETYPES, click-select,
     glow colour wiring through setArchetypeColor prop).
     Steps 9/10: Name + Confirm panels.

     NOT scoped — all rules live in v24/create.css (pattern 3Ba
     HudTraining / 3Bb HudMatchmaking). -->
<template>
  <div class="create-hud">
    <button class="create-back" @click="$emit('back')">&larr; Back</button>

    <div class="create-stepper">
      <div
        class="step"
        :class="{
          active: createState.step === 1,
          done:   createState.step > 1,
        }"
      >
        <span class="step-num">1</span>Archetype
      </div>
      <div class="step-sep"></div>
      <div
        class="step"
        :class="{
          active: createState.step === 2,
          done:   createState.step > 2,
        }"
      >
        <span class="step-num">2</span>Name
      </div>
      <div class="step-sep"></div>
      <div class="step" :class="{ active: createState.step === 3 }">
        <span class="step-num">3</span>Confirm
      </div>
    </div>

    <div class="create-panel">
      <!-- ===== Step 1 — Archetype (prototype 9098-9129) ===== -->
      <div v-if="createState.step === 1">
        <div class="cp-step-title">Choose Archetype</div>
        <div class="cp-step-sub">Defines your fighter&#8217;s personality</div>
        <div class="arch-list">
          <div
            v-for="a in ARCHETYPES"
            :key="a.id"
            class="arch-item"
            :class="{ selected: createState.archetypeId === a.id }"
            :style="createState.archetypeId === a.id
              ? { borderLeftColor: colorHex(a.color) }
              : {}"
            @click="selectArchetype(a.id)"
          >
            <div class="arch-icon" :style="iconStyle(a.color)">
              {{ a.short }}
            </div>
            <div class="arch-info">
              <div class="arch-name">{{ a.name }}</div>
              <div class="arch-tagline">{{ a.tagline }}</div>
              <div class="arch-stats">
                <div
                  v-for="k in STAT_KEYS"
                  :key="k"
                  class="arch-stat"
                >
                  <div class="arch-stat-label">{{ k.slice(0, 3) }}</div>
                  <div class="arch-stat-bar">
                    <div
                      class="arch-stat-fill"
                      :style="{
                        width: Math.round(a.stats[k] * 100) + '%',
                        background: colorHex(a.color),
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="create-nav">
          <button class="cn-btn" disabled>Back</button>
          <button
            class="cn-btn primary"
            :disabled="!createState.archetypeId"
            @click="goToStep(2)"
          >Next</button>
        </div>
      </div>

      <!-- ===== Step 2 — Name (prototype 9149-9175) ===== -->
      <div v-else-if="createState.step === 2">
        <div class="cp-step-title">Name Your Fighter</div>
        <div class="cp-step-sub">A handle the arena will remember</div>
        <div class="name-input-wrap">
          <input
            class="name-input"
            maxlength="16"
            v-model="createState.name"
            placeholder="Type a name..."
          />
          <button
            class="name-roll"
            @click="onRoll"
            title="Roll random"
          >&#127922;</button>
        </div>
        <div
          class="cp-step-sub"
          style="margin-top: 0; margin-bottom: 6px"
        >Suggestions</div>
        <div class="name-suggestions">
          <div
            v-for="s in suggestions"
            :key="s"
            class="name-chip"
            @click="onChip(s)"
          >{{ s }}</div>
        </div>
        <div class="create-nav">
          <button class="cn-btn" @click="goToStep(1)">Back</button>
          <button
            class="cn-btn primary"
            :disabled="!createState.name.trim()"
            @click="goToStep(3)"
          >Next</button>
        </div>
      </div>

      <!-- Step 10 — Confirm summary + Create Fighter (Epic 4 Step 5: backend
           persistence + inline error). -->
      <div v-else-if="createState.step === 3">
        <div class="cp-step-title">Confirm</div>
        <div class="cp-step-sub">Last check before they hit the pit</div>
        <div class="confirm-summary">
          <div class="confirm-row">
            <div class="cf-label">Name</div>
            <div class="cf-value">{{ createState.name }}</div>
          </div>
          <div class="confirm-row">
            <div class="cf-label">Archetype</div>
            <div
              class="cf-value"
              :style="{ color: archetypeColor }"
            >{{ archetypeName }}</div>
          </div>
          <div class="confirm-row">
            <div class="cf-label">Belt</div>
            <div class="cf-value">White Belt</div>
          </div>
          <div class="confirm-row">
            <div class="cf-label">Starting ELO</div>
            <div class="cf-value">1000</div>
          </div>
        </div>
        <div class="create-nav">
          <button
            class="cn-btn"
            :disabled="createState.creating || createState.materializing"
            @click="goToStep(2)"
          >Back</button>
          <button
            class="cn-btn primary"
            :disabled="createState.creating || createState.materializing"
            @click="onCreate"
          >{{ createState.creating ? 'Creating…' : 'Create Fighter' }}</button>
        </div>
        <div v-if="createState.error" class="cp-error">{{ createState.error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  createState,
  ARCHETYPES,
  onArchetypeChange,
} from '@/scene/interaction/useCreateState.js';
import {
  randomName,
  generateSuggestions,
} from '@/scene/interaction/useCreateNames.js';

// Default skin sent to backend when creating an agent. Validated against
// SKIN_REGEX (backend/src/routes/agent.js:30) — `skin_m_1.png` matches the
// `skin_(m|w)_\d{1,3}\.png` branch and is the same default used by the
// User.skin Prisma column (CLAUDE.md Skins section). Real skin picker is
// part of a later epic.
const DEFAULT_SKIN = 'skin_m_1.png';

const props = defineProps({
  // Callback into CreateView that proxies to sceneApi.setArchetypeColor.
  // Non-reactive let sceneApi on the parent is hidden behind a closure
  // here, so by the time user clicks a card CreateView.onMounted has
  // already assigned the real scene and the callback fires with the
  // concrete glow.setColor under it. onArchetypeChange itself guards on
  // truthy setGlow, so a stray click before mount is a no-op.
  onArchetypeColor: { type: Function, default: null },
});

// 'create-persist' carries the agent payload to CreateView, which dispatches
// to Vuex agent/createAgent and then runs materialize on success.
// Epic 4 Step 5 — HUD no longer owns the materialize animation; CreateView
// holds sceneApi + flashRef and the cancel handle, so co-locating that side
// of the lifecycle there is cleaner (HUD becomes pure-presentation).
const emit = defineEmits(['back', 'create-persist']);

const STAT_KEYS = ['aggression', 'patience', 'risk'];

// Format a 0xRRGGBB integer as '#rrggbb' (prototype 9104).
function colorHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

// Icon bg/colour/border derived from archetype colour (prototype 9109).
// background: color + '22' = 13% alpha, border: color + '55' = 33% alpha.
function iconStyle(hex) {
  const c = colorHex(hex);
  return {
    background: c + '22',
    color: c,
    border: '1px solid ' + c + '55',
  };
}

function selectArchetype(id) {
  onArchetypeChange(id, { setGlow: props.onArchetypeColor });
}

function goToStep(n) {
  createState.step = n;
}

// ===== Step 10 — Confirm + materialize (prototype 9195-9258) =====
// Computeds read off the selected archetype; fallback em-dash / white
// matches prototype 9208 `a ? a.name : '—'`.
const archetypeName = computed(() => {
  const a = ARCHETYPES.find((x) => x.id === createState.archetypeId);
  return a ? a.name : '—';
});
const archetypeColor = computed(() => {
  const a = ARCHETYPES.find((x) => x.id === createState.archetypeId);
  return a ? colorHex(a.color) : '#ffffff';
});

// onCreate — collects payload + delegates to CreateView via 'create-persist'.
// Epic 4 Step 5: backend POST happens first, then materialize, then nav.
// Guard on creating/materializing — rapid double-clicks are no-op.
// Archetype id maps 1-to-1 onto backend VALID_ARCHETYPES (Step 0 verified),
// so we send the v2 id straight as primaryModule. secondary/tertiary are
// echoed for now — Epic 5+ will add a real module picker on the panel.
function onCreate() {
  if (createState.creating || createState.materializing) return;
  if (!createState.archetypeId || !createState.name.trim()) return;

  createState.error = null;
  emit('create-persist', {
    name: createState.name.trim(),
    skin: DEFAULT_SKIN,
    primaryModule:   createState.archetypeId,
    secondaryModule: createState.archetypeId,
    tertiaryModule:  createState.archetypeId,
  });
}

// ===== Step 2 — Name (prototype 9149-9175) =====
// Suggestions regenerate on every entry into step 2 — prototype 9150
// calls Array.from({length:5}, () => randomName()) inside renderNameStep,
// which is invoked on each panel mount. Back → step 1 → Next → step 2
// therefore produces a fresh roll. Stable while the user types (no
// re-generation on v-model changes since watcher keys on step only).
const suggestions = ref([]);

watch(() => createState.step, (newStep) => {
  if (newStep === 2) suggestions.value = generateSuggestions(5);
});

onMounted(() => {
  // Edge case: direct URL entry while createState.step === 2 (e.g. HMR
  // preserves state across reload). Initial watcher doesn't fire on
  // mount, so seed suggestions explicitly.
  if (createState.step === 2 && suggestions.value.length === 0) {
    suggestions.value = generateSuggestions(5);
  }
});

function onRoll() {
  createState.name = randomName();
}

function onChip(s) {
  createState.name = s;
}
</script>
