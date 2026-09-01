<template>
  <footer class="footer">
    <div class="footer-top">
      <a class="footer-brand" href="#top">
        <HexlashMark :size="44" />
        <span class="footer-word">HEXLASH</span>
      </a>
      <span class="footer-tag">NEVER GIVE UP</span>
    </div>
    <div class="footer-social">
      <a v-for="s in socials" :key="s.l" :href="s.h" :aria-label="s.l">
        <component :is="s.i" />
      </a>
    </div>
    <div class="footer-bottom">
      <nav class="footer-links">
        <router-link to="/privacy">Privacy</router-link>
      </nav>
      <span class="footer-copy">© 2026 HEXLASH — ALL RIGHTS RESERVED</span>
    </div>
  </footer>
</template>

<script setup>
import {
  DiscordIcon,
  XIcon,
  TelegramIcon,
  YoutubeIcon,
  InstagramIcon,
} from './icons.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';

// Order matches the reference (sections.jsx): Telegram, X, YouTube, Discord, Instagram.
const socials = [
  { i: TelegramIcon, l: 'Telegram', h: '#telegram' },
  { i: XIcon, l: 'X', h: '#x' },
  { i: YoutubeIcon, l: 'YouTube', h: '#youtube' },
  { i: DiscordIcon, l: 'Discord', h: '#discord' },
  { i: InstagramIcon, l: 'Instagram', h: '#instagram' },
];
</script>
