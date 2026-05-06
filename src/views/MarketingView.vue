<template>
  <div class="marketing">
    <section class="marketing-hero" ref="heroRef">
      <!-- Hero content — C2 -->
    </section>

    <section class="marketing-about" ref="aboutRef">
      <!-- About content — C3 -->
    </section>

    <footer class="marketing-footer" ref="footerRef">
      <!-- Footer content — C4 -->
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import logoSrc from '@/assets/images/hexlash-logo.jpg';

const heroRef = ref(null);
const aboutRef = ref(null);
const footerRef = ref(null);

useDocumentMeta({
  title: 'Hexlash',
  description: 'Hexlash — Web3 fighting game. Train your AI agent. Fight in the underground octagon.',
  ogImage: logoSrc,
});
</script>

<style scoped>
.marketing {
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  overflow-x: hidden;
}

.marketing-hero,
.marketing-about,
.marketing-footer {
  /* Section base styles — extended in C2/C3/C4 */
  position: relative;
  width: 100%;
}

.marketing-hero {
  min-height: 100vh;
  min-height: 100dvh;
}

.marketing-about {
  min-height: 60vh;
  padding: 80px 24px;
}

.marketing-footer {
  padding: 40px 24px 24px;
  border-top: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.06));
}
</style>
