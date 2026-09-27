<!-- /play/arena — 3D-арена. Сама сцена (ArenaScene) — защищённый файл: в ней
     живут бой и моторика. Всё, что НЕ бой, стоит здесь, поверх неё:

       FightResultPanel — итог обычного боя (VICTORY / DEFEAT). В забеге и на
                     деке не показывается: там свои панели и своя подача.
       ChainPanels — экраны забега (между раундами и итог). Читают ход забега из
                     chainRun и переводят его дальше; внутрь сцены не лезут.
       CollapsePanels — то же самое для турнира: панель между волнами, итог и
                     честное состояние «бойцов не хватает».
       OpenFieldPanels — открытое поле: счётчик живых сторон поверх боя и то же
                     честное состояние «бойцов не хватает». Итог у него ОБЩИЙ
                     (FightResultPanel) — это обычный бой, просто на двадцать тел.
       BuffFightOverlay — баффы поверх боя: нижняя панель карточек и значки над
                     бойцами. Сама сцена про панель не знает, панель про сцену —
                     тоже; между ними services/buffs.js.
       KlichFightOverlay — кличи поверх боя: ряд карт над панелью баффов и значки
                     над бойцами. Устроен так же и по той же причине; между ним и
                     сценой — services/klich.js.
       FighterSelectOverlay — выбранный боец: метка на его месте и узкая панель
                     рычагов у правого края. Палец не ловит вовсе — это показания;
                     нажимаются по-прежнему карты внизу. Между ним и сценой —
                     services/fighterSelect.js.
       CommandOverlay — командование: тумблер «ВЕДУ Я / ВЕДЁТ ЛЕГЕНДА» над панелью
                     рычагов, строка решений легенды и перехват по картам. Стоит
                     ПОСЛЕ панели рычагов нарочно: он меряет её место, чтобы встать
                     над ней. Эта строка — выключатель всего командования: правила
                     (services/command.js) подписываются на кадр боя, когда их
                     подтягивает эта накладка, и больше ниоткуда.
       RunInterrupted — сюда НЕ ставится: брошенный забег или турнир уводит игрока в
                     ворота, и сообщение показывают там (см. сам компонент). -->
<template>
  <ArenaScene />
  <BuffFightOverlay />
  <KlichFightOverlay />
  <FighterSelectOverlay />
  <CommandOverlay />
  <FightResultPanel />
  <ChainPanels />
  <CollapsePanels />
  <OpenFieldPanels />
</template>

<script setup>
import ArenaScene from '@/scene/ArenaScene.vue';
import BuffFightOverlay from '@/components/buff/BuffFightOverlay.vue';
import KlichFightOverlay from '@/components/klich/KlichFightOverlay.vue';
import FighterSelectOverlay from '@/components/select/FighterSelectOverlay.vue';
import CommandOverlay from '@/components/command/CommandOverlay.vue';
import FightResultPanel from '@/components/panel/FightResultPanel.vue';
import ChainPanels from '@/components/chain/ChainPanels.vue';
import CollapsePanels from '@/components/collapse/CollapsePanels.vue';
import OpenFieldPanels from '@/components/openfield/OpenFieldPanels.vue';
</script>
