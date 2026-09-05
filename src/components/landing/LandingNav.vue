<template>
  <header class="nav">
    <a class="nav-logo" href="#top" aria-label="hexlash home">
      <!-- Связка «знак + слово». Слово — живой текст, картинкой не ставится
           (правило эталона docs/design-handoff/hexlash_mark). 92 — наибольший бокс
           знака по всем переломам: десктоп 71.7, телефон 92 (там слово скрыто).
           Оба над 48 → ПОЛНАЯ отрисовка; от этого же числа берётся srcset, поэтому
           занижать нельзя. ⚠️ Менять только вместе с --word в landing.css. -->
      <HexlashMark :size="92" />
      <span class="nav-word">HEXLASH</span>
    </a>
    <nav class="nav-links">
      <a href="#gameplay"><span>GAMEPLAY</span></a>
      <a href="#hex"><span>$HEX</span></a>
      <a href="#roadmap"><span>ROADMAP</span></a>
    </nav>
    <div class="nav-social">
      <a href="#discord" aria-label="Discord"><DiscordIcon /></a>
      <a href="#x" aria-label="X"><XIcon /></a>
    </div>
  </header>
</template>

<script setup>
import { DiscordIcon, XIcon } from './icons.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';
</script>
