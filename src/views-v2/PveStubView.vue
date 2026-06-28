<!-- PveStubView — temporary placeholder for the PVE space (/play/pve). The Mode
     Select PVE door lands here so navigation never dead-ends; the real PVE space
     lands in a later ТЗ. On-discipline: VOID ground, one calm line in INK DIM, a
     mono ‹ Back to the mode fork. No accent, no bloom. -->
<template>
  <div class="train-stub">
    <button type="button" class="ts-back" @click="onBack">← Back</button>
    <main class="ts-mid">
      <div class="ts-eyebrow">TRAINING</div>
      <h1 class="ts-title">PVE<em>.</em></h1>
      <p class="ts-note">Coming next.</p>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function onBack() { router.push('/play/mode'); }
</script>

<style scoped>
.train-stub {
  position: absolute; inset: 0; overflow: hidden;
  background: #08080a;
  color: #ededf1;
  font-family: "Saira Condensed", "Arial Narrow", system-ui, sans-serif;
  display: flex; align-items: center; justify-content: center;
}
.ts-back {
  position: absolute; top: 22px; left: 18px; z-index: 2;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #5d5d66; background: none; border: 0; cursor: pointer;
  padding: 6px 4px; transition: color 0.15s;
}
.ts-back:hover, .ts-back:focus-visible { color: #ededf1; outline: none; }
.ts-mid { text-align: center; padding: 0 18px; }
.ts-eyebrow {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: #5d5d66; margin-bottom: 14px;
}
.ts-title {
  font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em;
  line-height: 0.88; font-size: clamp(44px, 9vw, 92px); margin: 0;
}
.ts-title em { font-style: normal; color: #ffb21d; }
.ts-note {
  margin-top: 16px; font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #5d5d66;
}
</style>
