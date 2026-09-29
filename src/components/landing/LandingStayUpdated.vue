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
        <!-- ⚠️ ЧЕСТНАЯ ЗАГЛУШКА (ТЗ 29.09.2026, v2): форма закрыта — вместо подписи
             SUBSCRIBE на кнопке стоит слово SOON, ровно и цветом обычной подписи.
             ⚠️ Косая печать .soon-stamp здесь ПРОБОВАЛАСЬ (v1) и снята: лежа поверх
             подписи, две приглушённые надписи сливались и не читались.
             Поле не принимает ввод (disabled — ни курсора, ни клавиатуры на
             телефоне; autocomplete="off" — чтобы браузер его не заполнял), кнопка
             не нажимается. Проверка адреса и «YOU'RE ON THE LIST» ниже в скрипте
             НЕ удалены, а отключены флагом FORM_OPEN.
             Снимается: FORM_OPEN = true в скрипте — вернётся SUBSCRIBE, поле и кнопка
             оживут сами. Сначала нужен настоящий приём адресов: сейчас форма
             никуда ничего не отправляет. -->
        <input
          type="email"
          class="join-input"
          placeholder="enter your email"
          autocomplete="off"
          v-model="email"
          :disabled="!FORM_OPEN"
          @input="onInput"
        />
        <button type="submit" class="join-btn" :disabled="!FORM_OPEN">
          <span class="join-btn-bg"></span>
          <span>{{ FORM_OPEN ? 'SUBSCRIBE' : 'SOON' }}</span>
        </button>
      </form>
      <p v-if="status === 'error'" class="join-err" data-reveal>Enter a valid email to join.</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

/* Главный выключатель формы. false — форма закрыта заглушкой SOON (сейчас так:
   адреса некуда отправлять). true — прежнее поведение целиком. */
const FORM_OPEN = false;

const email = ref('');
const status = ref('idle'); // idle | error | done

function submit() {
  if (!FORM_OPEN) return; // закрыто: даже Enter ничего не показывает и не отправляет
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  status.value = ok ? 'done' : 'error';
}

function onInput() {
  if (status.value === 'error') status.value = 'idle';
}
</script>
