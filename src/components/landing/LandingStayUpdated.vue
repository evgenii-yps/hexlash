<template>
  <section class="sec sec-join" id="join">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>DON'T MISS THE DROP</span>
      </div>
      <h2 class="big-title" data-reveal data-d="1">STAY UPDATED</h2>
      <p class="join-sub" data-reveal data-d="2">Be first when the arena opens.</p>

      <div v-if="status === 'done'" class="join-done" data-reveal data-d="3">
        <span class="join-check">✓</span> YOU'RE ON THE LIST. SEE YOU IN THE CAGE.
      </div>
      <form
        v-else
        class="join-form"
        :class="{ err: status === 'error' }"
        @submit.prevent="submit"
        data-reveal
        data-d="3"
      >
        <input
          type="email"
          class="join-input"
          placeholder="enter your email"
          v-model="email"
          @input="onInput"
        />
        <button type="submit" class="join-btn">
          <span class="join-btn-bg"></span>
          <span>SUBSCRIBE</span>
        </button>
      </form>
      <p v-if="status === 'error'" class="join-err" data-reveal>Enter a valid email to join.</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const status = ref('idle'); // idle | error | done

function submit() {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  status.value = ok ? 'done' : 'error';
}

function onInput() {
  if (status.value === 'error') status.value = 'idle';
}
</script>
