<template>
  <header class="nav" :class="{ scrolled }">
    <a class="nav-logo" href="#top" aria-label="hexlash home"><LogoMark /></a>
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
import { LogoMark, DiscordIcon, XIcon } from './icons.js';
defineProps({ scrolled: { type: Boolean, default: false } });
</script>
