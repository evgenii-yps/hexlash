<template>
  <section class="sec sec-roadmap" id="roadmap">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>THE PATH</span>
      </div>
      <h2 class="big-title" data-reveal data-d="1">ROADMAP</h2>
      <div class="timeline" data-reveal data-d="2">
        <span class="timeline-track"><span class="timeline-fill"></span></span>
        <div class="phases">
          <div
            class="phase"
            :class="{ live: p.live }"
            data-reveal
            :data-d="i + 2"
            v-for="(p, i) in phases"
            :key="p.n"
          >
            <span class="phase-node"></span>
            <span class="phase-n">{{ p.n }}</span>
            <span class="phase-k">{{ p.k }}</span>
            <span class="phase-d">{{ p.d }}</span>
            <span class="phase-s" :class="{ on: p.live }">{{ p.s }}</span>
          </div>
        </div>
      </div>
      <div class="partners" data-reveal data-d="3">
        <span class="partners-l">STRATEGIC PARTNERSHIPS</span>
        <span class="partners-v">TBA</span>
      </div>
    </div>
  </section>
</template>

<script setup>
const phases = [
  { n: '01', k: 'FOUNDATION', d: 'Arena online. The community forms.', s: 'IN PROGRESS', live: true },
  { n: '02', k: '$HEX LAUNCH', d: 'Token goes live on Base.', s: 'COMING SOON' },
  { n: '03', k: 'RANKED SEASONS', d: 'Competitive ladders & rewards.', s: 'COMING SOON' },
  { n: '04', k: 'THE LEAGUE', d: 'Tournaments & partnerships.', s: 'COMING SOON' },
];
</script>
