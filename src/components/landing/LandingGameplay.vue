<template>
  <section class="sec sec-gameplay" id="gameplay">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>FIRST LOOK</span>
      </div>
      <h2 class="big-title" data-reveal data-d="1">GAMEPLAY</h2>
      <div class="player" data-reveal data-d="2">
        <span class="player-hex-bg"></span>
        <span class="player-scan"></span>
        <span class="hud-c tl"></span><span class="hud-c tr"></span>
        <span class="hud-c bl"></span><span class="hud-c br"></span>
        <button class="play-hex" aria-label="Video incoming">
          <span class="play-hex-shape"><PlayIcon /></span>
        </button>
        <span class="player-label">VIDEO INCOMING</span>
        <span class="player-bar"><i></i></span>
        <span class="player-rec"><b></b>REC · STANDBY</span>
      </div>
      <p class="player-cap" data-reveal data-d="3">First match recordings drop with the next release.</p>
    </div>
  </section>
</template>

<script setup>
import { PlayIcon } from './icons.js';
</script>
