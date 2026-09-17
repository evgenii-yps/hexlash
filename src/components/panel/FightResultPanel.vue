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
// Готовая строка от того, кто считал бой, сильнее своей: у открытого поля исход
// — это МЕСТО, и панель его сама не знает (см. titleOver в services/fightResult).
const title = computed(() => state.titleOver
  || (won.value ? t.value.fight.victory : t.value.fight.defeat));
// Строка под заголовком: у рейда своя — он выигран падением босса, а не тем, что
// своя сторона осталась одна, и общая строка про него соврала бы.
const note = computed(() => {
  if (state.noteOver) return state.noteOver;
  const f = t.value.fight;
  if (state.kind === 'raid') return won.value ? f.victoryNoteRaid : f.defeatNoteRaid;
  return won.value ? f.victoryNote : f.defeatNote;
});

// ⚠️ Двойное нажатие закрыто в самом ходе итога (fightAgainNow): панель гасится
//    первой строкой, и второе нажатие уже ничего не делает.
function onAgain() {
  fightAgainNow();
}

function onGate() {
  hideFightResult();
  // НА ВТОРОЙ ШАГ ворот, а не на первый. Режим игрок уже выбрал, и показывать
  // ему выбор режима заново — значит просить сделать тот же шаг дважды ради
  // того же боя. Раскладка и состав лежат в сейфе, так что следующий бой
  // начинается в два нажатия: кнопка старта и всё.
  router.push({ name: 'V2ArenaGate', query: { step: 'squad' } });
}
</script>

<style scoped>
/* Две кнопки столбиком: главная сверху, дверь под ней. На узком экране порядок
   тот же — так палец первым встречает то, что игрок нажмёт чаще. */
.fr-actions { display: flex; flex-direction: column; gap: var(--sp-2); }
</style>
