<template>
  <div class="bag-wrapper" @click="handleTap" @touchstart.passive="handleTap">
    <div class="bag-glow" :class="{ 'bag-hit': hitting }" />
    <div class="bag-body" :class="{ 'bag-hit': hitting }">
      <div class="bag-chain" />
      <div class="bag-top" />
      <div class="bag-main">
        <div class="bag-stripe" />
        <div class="bag-stripe" />
      </div>
      <div class="bag-bottom" />
    </div>

    <div
        v-for="num in floatingNums"
        :key="num.id"
        class="tap-float"
        :style="{ left: num.x + 'px', top: num.y + 'px' }"
    >
      +1
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['tap']);

const hitting = ref(false);
const floatingNums = ref([]);

const handleTap = (e) => {
  hitting.value = true;
  setTimeout(() => { hitting.value = false; }, 150);

  const rect = e.currentTarget.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const num = {
    id: Date.now() + Math.random(),
    x: clientX - rect.left + (Math.random() * 20 - 10),
    y: clientY - rect.top - 20
  };
  floatingNums.value.push(num);
  if (floatingNums.value.length > 10) floatingNums.value.shift();
  setTimeout(() => {
    floatingNums.value = floatingNums.value.filter(n => n.id !== num.id);
  }, 800);

  emit('tap');
};
</script>

<style scoped>
.bag-wrapper {
  position: relative;
  width: 90px;
  height: 180px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bag-glow {
  position: absolute;
  width: 80px;
  height: 140px;
  top: 30px;
  border-radius: 40%;
  background: radial-gradient(ellipse, rgba(255, 6, 111, 0.15) 0%, transparent 70%);
  transition: opacity 0.15s;
}

.bag-glow.bag-hit {
  opacity: 3;
  background: radial-gradient(ellipse, rgba(255, 6, 111, 0.4) 0%, transparent 70%);
}

.bag-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.1s ease;
}

.bag-body.bag-hit {
  transform: rotate(3deg) scale(0.97);
}

.bag-chain {
  width: 4px;
  height: 20px;
  background: var(--gray2);
  border-radius: 2px;
}

.bag-top {
  width: 50px;
  height: 12px;
  background: #555;
  border-radius: 6px 6px 0 0;
}

.bag-main {
  width: 70px;
  height: 110px;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%);
  border-radius: 12px;
  border: 1px solid var(--gray1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.bag-stripe {
  width: 60px;
  height: 3px;
  background: var(--pink);
  opacity: 0.6;
  border-radius: 2px;
}

.bag-bottom {
  width: 55px;
  height: 10px;
  background: #444;
  border-radius: 0 0 8px 8px;
}

.tap-float {
  position: absolute;
  font-size: 1rem;
  color: var(--pink);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  pointer-events: none;
  animation: floatUp 0.8s ease-out forwards;
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-50px); }
}
</style>
