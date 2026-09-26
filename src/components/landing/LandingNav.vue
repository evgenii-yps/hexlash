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

    <!-- PLAY в шапке. Показывается ТОЛЬКО на время полёта: там кнопка с
         первого экрана уже уехала вверх, а главное действие должно быть под
         рукой всю дорогу (решение владельца 26.09.2026). На обычной части
         страницы её нет — там PLAY стоит на своём месте, на первом экране.
         ⚠️ Оформление НЕ новое: те же три слоя, что у кнопки первого экрана
         (.btn-play), только мельче — см. .nav-play в landing.css. -->
    <a class="btn-play nav-play" href="#play" @click.prevent="$emit('play')">
      <span class="btn-play-bg"></span>
      <span class="btn-play-label">PLAY</span>
      <span class="btn-play-arrow"><ArrowIcon /></span>
    </a>
  </header>
</template>

<script setup>
import { ArrowIcon, DiscordIcon, XIcon } from './icons.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';

defineEmits(['play']);
</script>
