<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">

        <button class="modal-close" @click="$emit('close')">✕</button>

        <div class="modal-header">
          <span v-if="!move.unlocked" class="modal-lock">🔒</span>
          <span class="modal-title">{{ t.gameData.moves[moveId].name }}</span>
          <span v-if="move.unlocked" class="modal-level">{{ t.moves.lblLevel }} {{ move.level }}</span>
        </div>

        <p class="modal-desc">{{ t.gameData.moves[moveId].description }}</p>

        <!-- Характеристики (для открытых приёмов) -->
        <div v-if="move.unlocked" class="modal-stats">
          <div class="stat-row">
            <span class="stat-lbl">{{ t.moves.lblDamage }}</span>
            <span class="stat-val">{{ currentDamage }}</span>
            <span v-if="move.level < 5" class="stat-next">→ {{ nextDamage }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-lbl">{{ t.moves.lblSpeed }}</span>
            <span class="stat-val">{{ currentSpeed }}</span>
            <span v-if="move.level < 5" class="stat-next">→ {{ nextSpeed }}</span>
          </div>
        </div>

        <!-- Уровни как точки -->
        <div v-if="move.unlocked" class="level-dots">
          <span v-for="i in 5" :key="i" class="dot" :class="{ filled: i <= move.level }" />
        </div>

        <!-- Прогресс к улучшению -->
        <div v-if="move.unlocked && move.level < 5" class="modal-progress">
          <div class="req-row">
            <span class="req-label">{{ t.moves.lblTaps }}</span>
            <span class="req-bar-wrap">
              <span class="req-bar">
                <span
                    class="req-bar-fill"
                    :style="{ width: Math.min(taps / nextReq.taps * 100, 100) + '%' }"
                />
              </span>
            </span>
            <span class="req-nums" :class="{ enough: taps >= nextReq.taps }">
              {{ taps }} / {{ nextReq.taps }}
            </span>
          </div>
          <div class="req-row">
            <span class="req-label">XP</span>
            <span class="req-bar-wrap">
              <span class="req-bar">
                <span
                    class="req-bar-fill"
                    :style="{ width: Math.min(branchExp / nextReq.exp * 100, 100) + '%' }"
                />
              </span>
            </span>
            <span class="req-nums" :class="{ enough: branchExp >= nextReq.exp }">
              {{ branchExp }} / {{ nextReq.exp }}
            </span>
          </div>
        </div>

        <!-- Требования для открытия -->
        <div v-else-if="!move.unlocked && unlockCost.taps" class="modal-progress">
          <div class="section-hint">{{ t.moves.lblToUnlock }}</div>
          <div class="req-row">
            <span class="req-label">{{ t.moves.lblTaps }}</span>
            <span class="req-bar-wrap">
              <span class="req-bar">
                <span
                    class="req-bar-fill"
                    :style="{ width: Math.min(taps / unlockCost.taps * 100, 100) + '%' }"
                />
              </span>
            </span>
            <span class="req-nums" :class="{ enough: taps >= unlockCost.taps }">
              {{ taps }} / {{ unlockCost.taps }}
            </span>
          </div>
          <div class="req-row">
            <span class="req-label">XP</span>
            <span class="req-bar-wrap">
              <span class="req-bar">
                <span
                    class="req-bar-fill"
                    :style="{ width: Math.min(branchExp / unlockCost.exp * 100, 100) + '%' }"
                />
              </span>
            </span>
            <span class="req-nums" :class="{ enough: branchExp >= unlockCost.exp }">
              {{ branchExp }} / {{ unlockCost.exp }}
            </span>
          </div>
        </div>

        <div v-else-if="!move.unlocked" class="locked-hint">
          {{ lockedHint }}
        </div>

        <!-- Кнопки действий -->
        <div class="modal-actions">
          <button
              v-if="move.unlocked && move.level < 5"
              class="btn-action btn-upgrade"
              :class="{ active: canLevelUp }"
              :disabled="!canLevelUp"
              @click="$emit('levelUp', moveId)"
          >
            {{ t.moves.lblUpgrade }}
          </button>

          <button
              v-if="!move.unlocked"
              class="btn-action btn-upgrade"
              :class="{ active: canUnlock }"
              :disabled="!canUnlock"
              @click="$emit('unlock', moveId)"
          >
            {{ t.moves.lblUnlock }}
          </button>

          <button class="btn-action btn-train" @click="$emit('train')">
            {{ t.moves.lblTrain }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { allMoves as movesData } from '@/data/moves.js';
import { branches } from '@/data/branches.js';
import { levelUpRequirements, unlockRequirements } from '@/data/requirements.js';
import { t, interpolate } from '@/locales/index.js';

const props = defineProps({
  moveId:    { type: String, required: true },
  move:      { type: Object, required: true },
  taps:      { type: Number, default: 0 },
  branchExp: { type: Number, default: 0 },
  canLevelUp: { type: Boolean, default: false },
  canUnlock:  { type: Boolean, default: false },
  allMoveStates: { type: Object, default: () => ({}) }
});

defineEmits(['close', 'levelUp', 'unlock', 'train']);

const moveData = computed(() => movesData[props.moveId] || {});

const currentDamage = computed(() => moveData.value.damage?.[props.move.level - 1] ?? '—');
const nextDamage    = computed(() => moveData.value.damage?.[props.move.level] ?? '—');
const currentSpeed  = computed(() => moveData.value.speed?.[props.move.level - 1] ?? '—');
const nextSpeed     = computed(() => moveData.value.speed?.[props.move.level] ?? '—');

const nextReq = computed(() => {
  if (!props.move.unlocked || props.move.level >= 5) return { taps: 1, exp: 1 };
  return levelUpRequirements[props.move.level + 1] || { taps: 1, exp: 1 };
});

const unlockCost = computed(() => {
  const branch = moveData.value.branch;
  if (!branch) return {};
  const branchMoves = branches[branch].moves;
  const idx = branchMoves.indexOf(props.moveId);
  if (idx <= 0) return {};
  const prevMove = props.allMoveStates[branchMoves[idx - 1]];
  if (!prevMove) return {};
  return unlockRequirements[prevMove.level] || {};
});

const lockedHint = computed(() => {
  const branch = moveData.value.branch;
  if (!branch) return '';
  const branchMoves = branches[branch].moves;
  const idx = branchMoves.indexOf(props.moveId);
  if (idx <= 0) return '';
  const prevMoveId = branchMoves[idx - 1];
  const prevMove = props.allMoveStates[prevMoveId];
  const prevMoveData = movesData[prevMoveId];
  if (!prevMove?.unlocked) return interpolate(t.value.moves.lblUnlockFirst, { name: t.value.gameData.moves[prevMoveId]?.name });
  if (prevMove.level < 3) return interpolate(t.value.moves.lblUpgradeTo3, { name: t.value.gameData.moves[prevMoveId]?.name });
  return t.value.moves.lblInsufficientResources;
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 80px;
}

.modal-card {
  background: #111;
  border: 1px solid var(--gray1);
  border-radius: 8px 8px 4px 4px;
  padding: 20px 20px 16px;
  width: 100%;
  max-width: 480px;
  position: relative;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: var(--gray2);
  font-size: 1rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.modal-lock {
  font-size: 1rem;
}

.modal-title {
  font-family: Anonymous, sans-serif;
  font-size: 1.3rem;
  color: var(--white);
  flex: 1;
}

.modal-level {
  font-family: AnonymousBalance, sans-serif;
  font-size: 1rem;
  color: var(--pink);
}

.modal-desc {
  font-size: 0.82rem;
  color: var(--gray3);
  line-height: 1.5;
  margin: 0 0 12px;
}

.modal-stats {
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.stat-lbl {
  font-size: 0.75rem;
  color: var(--gray2);
  width: 70px;
}

.stat-val {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.95rem;
  color: var(--white);
}

.stat-next {
  font-size: 0.8rem;
  color: var(--pink);
}

.level-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gray1);
  border: 1px solid var(--gray2);
}

.dot.filled {
  background: var(--pink);
  border-color: var(--pink);
}

.modal-progress {
  margin-bottom: 14px;
}

.section-hint {
  font-size: 0.72rem;
  color: var(--gray2);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.req-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.req-label {
  font-size: 0.72rem;
  color: var(--gray2);
  width: 30px;
}

.req-bar-wrap {
  flex: 1;
}

.req-bar {
  display: block;
  height: 4px;
  background: var(--gray1);
  border-radius: 2px;
  overflow: hidden;
}

.req-bar-fill {
  display: block;
  height: 100%;
  background: var(--pink);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.req-nums {
  font-size: 0.72rem;
  color: var(--gray2);
  white-space: nowrap;
}

.req-nums.enough {
  color: #50c878;
}

.locked-hint {
  font-size: 0.82rem;
  color: var(--gray2);
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--black-opacity-80);
  border-radius: 4px;
  border: 1px solid var(--gray1);
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  flex: 1;
  padding: 10px 8px;
  border-radius: 4px;
  border: 1px solid var(--gray1);
  background: transparent;
  color: var(--gray2);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upgrade.active {
  border-color: var(--pink);
  color: var(--pink);
}

.btn-upgrade.active:hover {
  background: var(--pink);
  color: var(--white);
}

.btn-upgrade:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.btn-train {
  border-color: var(--gray1);
  color: var(--gray3);
}

.btn-train:hover {
  color: var(--white);
  border-color: var(--gray2);
}
</style>
