<!-- /play/upgrade — Upgrade screen (Заход 2).

     TEMPORARY SHELL. The real screen is a drill-down core → crystal → face
     (Claude Design handoff: HTML/CSS/vanilla JS + data.js + README) ported 1:1
     to Vue. That handoff is not in the repo yet — see
     docs/visual-migration/PREFIGHT_UPGRADE_HANDOFF_BRIEF.md for the brief sent to
     Claude Design. This shell only keeps the loop whole (выбрал → увидел → в бой):
     it shows the chosen core and the «В БОЙ» button, nothing is invented for the
     drill-down itself.

     Per the 06.06 decision the upgrade screen rolls back to canon pink #FF0069
     (the per-core hue lives on selection + on the arena fighter). -->
<template>
  <div class="upgrade">
    <button type="button" class="upgrade__back" @click="goBack">‹ Назад</button>

    <header class="upgrade__head">
      <h1 class="upgrade__title">ПРОКАЧКА</h1>
      <p v-if="core" class="upgrade__core">
        Ядро:
        <span class="upgrade__core-name" :style="{ color: core.color }">{{ core.name }}</span>
      </p>
    </header>

    <div class="upgrade__placeholder">
      <p class="upgrade__ph-title">Drill-down ядро → кристалл → грань</p>
      <p class="upgrade__ph-note">
        Заглушка. Сюда портируется хэндоф Claude Design (drill-down, грани из data.js).
      </p>
    </div>

    <button type="button" class="upgrade__fight" @click="toBattle">В БОЙ</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getCore } from '@/data/cores.js';

const store = useStore();
const router = useRouter();

const core = computed(() => getCore(store.getters['prefight/selectedCoreId']));

function goBack() {
  router.push({ name: 'PrefightSelect' });
}
function toBattle() {
  router.push({ name: 'V2Arena' });
}
</script>

<style scoped>
.upgrade {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 32px 20px;
  overflow-y: auto;
  text-align: center;
  background:
    radial-gradient(ellipse 70% 60% at 50% 40%, #0d0f1c 0%, #070811 60%, #030308 100%);
}

.upgrade__back {
  position: absolute;
  top: 16px;
  left: 16px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  padding: 7px 12px;
  cursor: pointer;
}
.upgrade__back:hover {
  color: #fff;
  border-color: var(--hex-primary, #ff0069);
}

.upgrade__head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.upgrade__title {
  margin: 0;
  font-family: var(--font-display, sans-serif);
  font-size: clamp(26px, 5vw, 42px);
  letter-spacing: 0.04em;
  color: #fff;
}
.upgrade__core {
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}
.upgrade__core-name {
  font-weight: 700;
}

.upgrade__placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  padding: 26px 22px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(10, 12, 22, 0.5);
}
.upgrade__ph-title {
  margin: 0;
  font-family: var(--font-body, sans-serif);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
}
.upgrade__ph-note {
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0.06em;
  color: var(--text-dim, rgba(255, 255, 255, 0.45));
}

.upgrade__fight {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  letter-spacing: 0.1em;
  color: #fff;
  background: var(--hex-primary, #ff0069);
  border: none;
  border-radius: 10px;
  padding: 16px 56px;
  cursor: pointer;
  box-shadow: 0 0 24px rgba(255, 0, 105, 0.45);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.upgrade__fight:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 34px rgba(255, 0, 105, 0.65);
}

@media (prefers-reduced-motion: reduce) {
  .upgrade__fight {
    transition: none;
  }
}
</style>
