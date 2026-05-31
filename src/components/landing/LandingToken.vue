<template>
  <section class="sec sec-hex" id="hex">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>THE TOKEN</span>
      </div>
      <h2 class="hex-word" data-reveal data-d="1">
        $HEX<span class="sheen"></span>
      </h2>
      <p class="hex-status" data-reveal data-d="2">COMING SOON</p>
      <p class="hex-chain" data-reveal data-d="3">LAUNCHING ON BASE</p>

      <div class="chips" data-reveal data-d="4">
        <div class="chip" v-for="f in facts" :key="f.k">
          <span class="chip-k">{{ f.k }}</span>
          <span class="chip-d">{{ f.d }}</span>
        </div>
      </div>

      <div class="contract" data-reveal data-d="5">
        <span class="contract-l">CONTRACT</span>
        <span class="contract-addr">0x•••••••••••••••••••••••••••••••••••••••••</span>
        <button class="contract-btn" disabled><CopyIcon />REVEALING SOON</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { CopyIcon } from './icons.js';
const facts = [
  { k: 'BUILT ON BASE', d: 'Low fees, fast finality.' },
  { k: 'FAIR LAUNCH', d: 'No insiders. No presale.' },
  { k: 'FUELS THE ARENA', d: 'Entry, rewards, governance.' },
];
</script>
