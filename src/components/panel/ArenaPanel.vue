<!-- ArenaPanel — ОДНА панель арены. Всё, что игра говорит поверх замершего боя,
     говорится через неё: итог боя, панель между раундами забега, итог забега.

     ЗАЧЕМ ОДНА. Панели забега появились первыми и были устроены правильно;
     когда понадобилась панель итога обычного боя, выбор был — сделать вторую
     такую же или вынести основание. Две похожие панели расходятся: одну
     поправят, вторую забудут, и игра начнёт говорить двумя голосами.

     ЧТО ЗДЕСЬ ЕСТЬ: затемнение под панелью, сама матовая коробка, заголовок,
     строка под ним и два места — под строки «что изменилось» и под кнопки.
     ЧЕГО ЗДЕСЬ НЕТ: ни одного решения о том, ЧТО показывать. Это знает тот, кто
     панель ставит.

     Дисциплина: матовая коробка и волосяная рамка, как у хрома в воротах;
     розовый — только на главной кнопке, и ставит его тот, кто кнопку кладёт. -->
<template>
  <div class="arena-scrim">
    <div class="arena-panel" role="dialog" aria-modal="true">
      <p class="ap-title" :class="{ 'is-muted': muted }">{{ title }}</p>
      <p v-if="note" class="ap-note">{{ note }}</p>
      <slot />
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  note: { type: String, default: '' },
  // Приглушить заголовок. Для исходов, которые не зовут никуда: забег сгорел,
  // бой проигран. Тревожного цвета у нас для этого нет и заводить его незачем —
  // это конец попытки, а не авария.
  muted: { type: Boolean, default: false },
});
</script>

<style scoped>
/* Затемнение — бой позади замер, взгляд должен уйти на панель. Клики ловит
   только сама панель: промах мимо кнопки ничего не делает, а не закрывает
   панель мимо воли игрока. */
.arena-scrim {
  position: fixed; inset: 0; z-index: var(--z-modal);
  display: flex; align-items: center; justify-content: center;
  padding: var(--sp-5);
  background: color-mix(in srgb, var(--void) 62%, transparent);
  pointer-events: auto;
}

.arena-panel {
  width: min(360px, 100%);
  display: flex; flex-direction: column; align-items: stretch; gap: var(--sp-4);
  padding: var(--sp-5);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid var(--line-strong);
  text-align: center;
}

.ap-title {
  margin: 0;
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-xl);
  line-height: 0.95; letter-spacing: var(--ls-tight); text-transform: uppercase;
  color: var(--ink);
}
.ap-title.is-muted { color: var(--ink-off); }

.ap-note {
  margin: 0;
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); line-height: 1.6; color: var(--ink-dim);
}

@media (max-width: 560px) {
  .ap-title { font-size: var(--t-lg); }
}
</style>
