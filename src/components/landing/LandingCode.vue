<template>
  <section class="sec sec-code" id="manifesto">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>THE CODE</span>
      </div>
      <h2 class="big-title code-title" data-reveal data-d="1">
        <span class="ghost">NEVER GIVE UP</span>
        <span class="solid">NEVER GIVE UP</span>
      </h2>
      <p class="code-sub" data-reveal data-d="2">TRAIN<i>.</i> FIGHT<i>.</i> RISE<i>.</i></p>
      <div class="pillars">
        <div class="pillar" data-reveal :data-d="i + 3" v-for="(p, i) in pillars" :key="p.k">
          <span class="pillar-n">{{ p.n }}</span>
          <span class="pillar-k">{{ p.k }}</span>
          <span class="pillar-d">{{ p.d }}</span>
          <span class="pillar-bar"></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const pillars = [
  { n: '01', k: 'TRAIN', d: 'Drill the cage. Master every angle before the bell.' },
  { n: '02', k: 'FIGHT', d: 'Step in. Read your rival. Commit to the strike.' },
  { n: '03', k: 'RISE', d: "Climb the ranks. Earn the name they'll remember." },
];
</script>
