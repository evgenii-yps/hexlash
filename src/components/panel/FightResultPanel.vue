<!-- FightResultPanel — ИТОГ БОЯ. Выиграл игрок или проиграл, и что дальше.
     Показывается в любом бою, кроме забега (у него свои панели) и кроме деки.

     ВИД — из общей панели арены. Розовая кнопка ровно одна: «драться снова».
     «В ворота» матовая — уходить никуда не зовут, это просто дверь. -->
<template>
  <ArenaPanel
    v-if="state.visible"
    :title="title"
    :note="note"
    :muted="state.outcome === 'defeat'"
  >
    <template #actions>
      <div class="fr-actions">
        <button type="button" class="ap-go" @click="onAgain">{{ t.fight.again }}</button>
        <button type="button" class="ap-back" @click="onGate">{{ t.fight.toGate }}</button>
      </div>
    </template>
  </ArenaPanel>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t } from '@/locales/index.js';
import { fightResultState as state, fightAgainNow, hideFightResult } from '@/services/fightResult.js';
import ArenaPanel from '@/components/panel/ArenaPanel.vue';
import '@/components/panel/panel.css';

const router = useRouter();

const won = computed(() => state.outcome === 'victory');
const title = computed(() => (won.value ? t.value.fight.victory : t.value.fight.defeat));
const note = computed(() => (won.value ? t.value.fight.victoryNote : t.value.fight.defeatNote));

// ⚠️ Двойное нажатие закрыто в самом ходе итога (fightAgainNow): панель гасится
//    первой строкой, и второе нажатие уже ничего не делает.
function onAgain() {
  fightAgainNow();
}

function onGate() {
  hideFightResult();
  router.push({ name: 'V2ArenaGate' });
}
</script>

<style scoped>
/* Две кнопки столбиком: главная сверху, дверь под ней. На узком экране порядок
   тот же — так палец первым встречает то, что игрок нажмёт чаще. */
.fr-actions { display: flex; flex-direction: column; gap: var(--sp-2); }
</style>
