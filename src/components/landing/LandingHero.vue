<template>
  <section class="hero" id="top">
    <div class="kicker reveal" data-d="2">
      <span class="kicker-dot"></span>
      <span class="kicker-txt">{{ kicker }}</span>
    </div>

    <h1 class="headline">
      <span class="line reveal" data-d="3">{{ line1 }}</span>
      <span class="line accent flicker reveal" data-d="4">
        {{ line2 }}<span class="sheen"></span>
      </span>
    </h1>

    <p class="sub reveal" data-d="5">TRAIN<i>.</i> FIGHT<i>.</i> RISE<i>.</i></p>

    <div class="cta-row reveal" data-d="6">
      <a class="btn-play" href="#play" @click.prevent="$emit('play')">
        <span class="btn-play-bg"></span>
        <span class="btn-play-label">PLAY</span>
        <span class="btn-play-arrow"><ArrowIcon /></span>
      </a>
      <a class="btn-ghost" href="#discord">
        <DiscordIcon />
        <span>JOIN DISCORD</span>
      </a>
    </div>

    <a class="scrollcue reveal" data-d="7" href="#manifesto" aria-label="Scroll"><span></span></a>
  </section>
</template>

<script setup>
import { DiscordIcon, ArrowIcon } from './icons.js';
defineProps({
  kicker: { type: String, default: '' },
  line1: { type: String, default: '' },
  line2: { type: String, default: '' },
});
defineEmits(['play']);
</script>
