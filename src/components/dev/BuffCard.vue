<!-- BuffCard — карточка нижней панели боя (Блок 3 страницы /dev/buffs), 4
     состояния: normal / selected / empty / locked. Отдельный SFC-файл (не
     defineComponent внутри родительского <script setup>) — скоуп стилей Vue
     проставляет data-v-атрибут только корню такого компонента, поэтому вложенным
     узлам он не достаётся; собственный <style scoped> у SFC это чинит. -->
<template>
  <div class="bc-card" :class="`is-${state}`">
    <div class="bc-icon">
      <img v-if="icon" :src="icon" :alt="item.name" />
      <span v-else class="bc-ph">{{ item.mono }}</span>
    </div>
    <div class="bc-name">{{ item.name }}</div>
    <div class="bc-count">×{{ count }}</div>
    <div v-if="state === 'locked'" class="bc-lock">●</div>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true },
  icon: { type: String, default: null },
  state: { type: String, default: 'normal' },
  count: { type: Number, default: 3 },
});
</script>

<style scoped>
.bc-card {
  /* Макет состояния, не рабочая кнопка (клика нет) — курсор обычный, честная
     заглушка, не ложная афорданс. */
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  width: 84px;
  padding: var(--sp-2);
  border: 1px solid var(--line-strong);
  background: var(--fill-1);
}
.bc-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.bc-icon img { width: 100%; height: 100%; object-fit: contain; }
.bc-ph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--r-round);
  border: 1px solid var(--line-strong);
  color: var(--ink-off);
  font-family: var(--font-mono);
  font-size: var(--t-md);
}
.bc-name { font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.bc-count { font-family: var(--font-mono); font-size: var(--t-xs); color: var(--ink-soft); font-variant-numeric: tabular-nums; }

.bc-card.is-selected {
  color: var(--pink);
  border-color: var(--pink);
  box-shadow: var(--glow-select);
}
.bc-card.is-empty { opacity: var(--o-dim); }
.bc-card.is-locked { border-color: var(--chrome-hi); }
.bc-lock {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: var(--t-micro);
  line-height: 1;
  color: var(--chrome-hi);
}
</style>
