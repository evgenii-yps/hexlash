<template>
  <div class="ticker-strip">
    <div class="marquee-track">
      <div class="marquee-group" v-for="dup in [0, 1]" :key="dup" :aria-hidden="dup === 1">
        <template v-for="(it, i) in items" :key="i">
          <span class="m-item">{{ it }}</span>
          <span class="m-sep">◆</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } });
</script>
