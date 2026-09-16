<!-- /play/arena — 3D-арена. Сама сцена (ArenaScene) — защищённый файл: в ней
     живут бой и моторика. Всё, что НЕ бой, стоит здесь, поверх неё:

       FightResultPanel — итог обычного боя (VICTORY / DEFEAT). В забеге и на
                     деке не показывается: там свои панели и своя подача.
       ChainPanels — экраны забега (между раундами и итог). Читают ход забега из
                     chainRun и переводят его дальше; внутрь сцены не лезут.
       ChainInterrupted — сюда НЕ ставится: брошенный забег уводит игрока в
                     ворота, и сообщение показывают там (см. сам компонент). -->
<template>
  <ArenaScene />
  <FightResultPanel />
  <ChainPanels />
</template>

<script setup>
import ArenaScene from '@/scene/ArenaScene.vue';
import FightResultPanel from '@/components/panel/FightResultPanel.vue';
import ChainPanels from '@/components/chain/ChainPanels.vue';
</script>
