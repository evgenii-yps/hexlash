<template>
  <header class="nav">
    <a class="nav-logo" href="#top" aria-label="hexlash home">
      <!-- Только знак. Слово снято со ВСЕХ ширин 05.09.2026: на первом экране
           теперь стоит заголовок HEXLASH, и слово в шапке его дублировало.
           До этого оно и так пряталось ниже 1241 точки.
           140 — бокс знака, он же наибольший по переломам. Над 48 → ПОЛНАЯ
           отрисовка; от этого же числа берётся srcset, занижать нельзя.
           ⚠️ Менять только вместе с --mark в landing.css: от размера знака
           выведена высота шапки, а от неё — высота первого экрана. -->
      <HexlashMark :size="140" />
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
