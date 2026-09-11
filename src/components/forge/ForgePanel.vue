<!-- ForgePanel — the FORGE hall's panel: everything the player reads and touches
     beside the 3D hall, in one column.

     Six blocks, top to bottom:
       head    — who is selected: name, his core in the core's own colour, fights
       tree    — the existing upgrade mechanic (ForgeTree), unchanged
       style   — what he is built out of, in words
       roster  — the whole roster as a list, so picking never depends on hitting a
                 body in the 3D hall (that still works; it is no longer the only way)
       fight   — the way OUT of the hall. The screen's one hero glow
       guest   — the honesty line, kept quiet

     WHAT SCROLLS. The head and the foot (fight + guest) are pinned; the tree, the
     style line and the roster share what is left and scroll. The main action is
     never below the fold, in any of the three layouts.

     WHAT GLOWS. Exactly two things, and both are spoken for: the FIGHT plate
     carries --glow-hero, the core sign in the head carries --glow-select. The
     tree's core used to have a third (a blurred, endlessly breathing halo) — it
     is gone, see ForgeTree.vue.

     OWNS NOTHING. Roster, selection, spend and status all arrive as props; every
     change leaves as an event. Whose roster it is and where it is stored is the
     hall's business (PveView → the roster store). -->
<template>
  <aside class="fp" :class="{ 'is-guest': isGuest }" :style="coreVars">

    <!-- ── 1 · head — who is selected ───────────────────────────────────── -->
    <header class="fp-head">
      <p class="fp-kicker">{{ t.forge.selected }}</p>

      <!-- a fighter, and his data is here -->
      <template v-if="status === 'ready' && picked">
        <h2 class="fp-name" :title="picked.callsign">{{ picked.callsign }}</h2>
        <p class="fp-core">
          <span class="fp-sign" aria-hidden="true"></span>{{ pickedCore.name }}
        </p>
        <p class="fp-fights">
          <span class="k">{{ t.forge.fightsLabel }}</span>
          <span class="v">{{ fightsOf(picked) }}</span>
        </p>
      </template>

      <!-- the four honest alternatives -->
      <template v-else>
        <h2 class="fp-name fp-name--state">{{ headTitle }}</h2>
        <p v-if="headSub" class="fp-sub">{{ headSub }}</p>
      </template>
    </header>

    <!-- ── the scrolling middle: tree, style, roster ─────────────────────── -->
    <div class="fp-scroll">

      <!-- ── 2 · tree ───────────────────────────────────────────────────── -->
      <section class="fp-tree" :class="{ 'is-fresh': treeState === 'live' && !litNames.length }">
        <!-- the mechanic, untouched -->
        <ForgeTree
          v-if="treeState === 'live'"
          ref="treeRef"
          :core-id="picked.core"
          :tree="picked.upgrade || []"
          :spent="spent"
          :resource="resource"
          @toggle="$emit('toggle', $event)"
        />

        <!-- …and the four ways it can have nothing to show -->
        <div v-else class="fp-note" :class="{ 'is-error': treeState === 'error' }">
          <template v-if="treeState === 'loading'">
            <span class="sp" aria-hidden="true"></span>
            <p class="t">{{ treeLoadingText }}</p>
          </template>
          <template v-else-if="treeState === 'error'">
            <p class="t">{{ t.forge.treeErrorTitle }}</p>
            <p class="b">{{ t.forge.treeErrorBody }}</p>
            <button type="button" class="fp-retry" :disabled="retrying" @click="$emit('retry')">
              {{ t.forge.retry }}
            </button>
          </template>
          <template v-else>
            <p class="t">{{ t.forge.treeNoFighter }}</p>
          </template>
        </div>

        <!-- One line under the tree, whichever of the two applies: nothing put in
             yet, or nothing left to put in. The second does NOT take the tree
             away — the pool is given back by quenching a facet, so the tree has
             to stay reachable exactly when it is full. -->
        <p v-if="treeState === 'live' && !litNames.length" class="fp-hint">{{ t.forge.treeHint }}</p>
        <p v-else-if="treeState === 'live' && spent >= resource" class="fp-hint">{{ t.forge.treeSpent }}</p>
      </section>

      <!-- ── 3 · style — what he is built out of ────────────────────────── -->
      <section class="fp-style">
        <p class="fp-label">{{ t.forge.styleLabel }}</p>
        <p class="fp-style-v">
          <span v-if="!litNames.length" class="ph">{{ t.forge.buildEmpty }}</span>
          <template v-else><span v-for="(n, i) in litNames" :key="i" class="b">{{ n }}</span></template>
        </p>
      </section>

      <!-- ── 4 · roster ─────────────────────────────────────────────────── -->
      <section class="fp-roster">
        <p class="fp-label">
          {{ t.forge.rosterLabel }}
          <span v-if="fighters.length" class="c">{{ fighters.length }} / {{ rosterMax }}</span>
        </p>

        <ul v-if="fighters.length" class="fp-list">
          <li v-for="f in fighters" :key="f.id">
            <button
              type="button" class="fp-row"
              :class="{ on: f.id === pickedId }"
              :style="rowVars(f)"
              :aria-current="f.id === pickedId ? 'true' : 'false'"
              @click="$emit('pick', f.id)"
            >
              <span class="sw" aria-hidden="true"></span>
              <span class="nm">{{ f.callsign }}</span>
              <span class="ft">{{ fightsOf(f) }}</span>
            </button>
          </li>
        </ul>

        <div v-else class="fp-note">
          <p class="t">{{ t.forge.rosterEmptyTitle }}</p>
          <p class="b">{{ t.forge.rosterEmptyBody }}</p>
          <button type="button" class="fp-retry" @click="$emit('new-fighter')">{{ t.forge.newFighter }}</button>
        </div>
      </section>
    </div>

    <!-- ── 5 · the way out — the screen's one hero glow ──────────────────── -->
    <footer class="fp-foot">
      <button
        type="button" class="fp-fight" :disabled="!canFight"
        :aria-describedby="canFight ? null : 'fp-why'"
        @click="$emit('fight')"
      >
        <span class="plinth" aria-hidden="true"></span>
        <span class="face">{{ t.forge.fight }}</span>
      </button>
      <p v-if="!canFight" id="fp-why" class="fp-why">{{ t.forge.fightBlocked }}</p>

      <!-- ── 6 · guest ──────────────────────────────────────────────────── -->
      <p v-if="isGuest" class="fp-guest">{{ t.forge.guestLine }}</p>
    </footer>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { t, interpolate } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import ForgeTree from '@/components/forge/ForgeTree.vue';

const props = defineProps({
  fighters: { type: Array, default: () => [] },
  pickedId: { type: String, default: null },
  picked: { type: Object, default: null },
  spent: { type: Number, default: 0 },
  resource: { type: Number, required: true },
  rosterMax: { type: Number, required: true },
  isGuest: { type: Boolean, default: false },
  canFight: { type: Boolean, default: false },
  // 'ready' | 'loading' | 'error' — what the HEAD knows about the picked fighter
  status: { type: String, default: 'ready' },
  // the same three for the TREE, which can fail on its own while the head is fine
  treeStatus: { type: String, default: 'ready' },
  // an honest step counter for the loading line, e.g. { n: 2, total: 3 }
  loadStep: { type: Object, default: null },
  retrying: { type: Boolean, default: false },
});

defineEmits(['pick', 'toggle', 'fight', 'new-fighter', 'retry']);

const treeRef = ref(null);

// The picked fighter's core. Colour is NOT declared here: getCore reads the one
// declaration in tokens.css (via coreHue). With nobody picked there is no colour
// to show at all — a stand-in value would be a second declaration of it.
const pickedCore = computed(() => (props.picked ? getCore(props.picked.core) : null));
const coreVars = computed(() => (pickedCore.value
  ? { '--core': pickedCore.value.hue, '--core-sup': pickedCore.value.sup }
  : {}));
// Each roster row wears its OWN core, read the same way.
function rowVars(f) { const c = getCore(f.core); return { '--core': c.hue }; }

// Fights are not recorded yet (roster stores `record: null` and nothing writes
// it). So the count is not invented — the honest "none yet" is shown instead.
function fightsOf(f) { return f && f.record ? f.record.fights : t.value.forge.noFights; }

// ── the head's five states ────────────────────────────────────────────────
const headTitle = computed(() => {
  if (props.status === 'loading') return t.value.forge.headLoading;
  if (props.status === 'error') return props.picked ? props.picked.callsign : t.value.forge.headError;
  if (!props.fighters.length) return t.value.forge.headEmpty;
  return t.value.forge.headNoPick;
});
const headSub = computed(() => {
  if (props.status === 'error') return t.value.forge.headError;
  if (props.status === 'loading' || !props.fighters.length) return '';
  return props.picked ? '' : t.value.forge.headNoPickSub;
});

// ── the tree's six states ─────────────────────────────────────────────────
// 'live' means the mechanic renders. Being fully spent is NOT one of the silent
// states: the only way to free a point is to quench a facet in the tree, so
// taking the tree away at exactly that moment would lock the build.
const treeState = computed(() => {
  if (props.treeStatus === 'loading') return 'loading';
  if (props.treeStatus === 'error') return 'error';
  if (!props.picked) return 'nofighter';
  return 'live';
});
const treeLoadingText = computed(() => interpolate(t.value.forge.treeLoading, {
  n: props.loadStep?.n ?? 1, total: props.loadStep?.total ?? 3,
}));

// What he is built out of — the same read the tree's footer used to do, one
// level up, because it is a block of the panel now rather than part of the tree.
const litNames = computed(() => {
  const out = [];
  (props.picked?.upgrade || []).forEach((cr) => cr.faces.forEach((f) => {
    if (f.state === 'lit') out.push(f.name);
  }));
  return out;
});

// Esc walks back up the tree before it leaves the work state — the hall asks.
function stepBack() { return treeRef.value?.stepBack?.() || false; }
defineExpose({ stepBack });
</script>
