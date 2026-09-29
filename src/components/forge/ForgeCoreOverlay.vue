<!-- ForgeCoreOverlay — РАЗВОРОТ ЯДРА на весь экран (ТЗ 29.09.2026, работа 2).

     ЗАЧЕМ. Фигура ядра в карточке панели мелкая, и выбирать в ней тесно. Одно
     нажатие по ней открывает этот слой: ядро крупно, зал позади виден сквозь то
     же стекло, что у панелей (работа 1), только вуаль плотнее — под слоем
     читать нечего.

     ⚠️ ЛОГИКИ ЗАЖИГАНИЯ ЗДЕСЬ НЕТ. Внутри стоит тот же ForgeCore, что и в маленькой
     карточке (там он в режиме preview). Он получает те же свойства и шлёт то же
     событие toggle; оно уходит наверх (PveView.onToggle → roster/toggleFacet),
     то есть в то же хранилище и в том же формате. Потолок зажжённых, отказы и
     налив — его собственные, не переписанные.

     ЗАКРЫТИЕ.
       · BACK (внизу, под большим пальцем) — закрывает СРАЗУ, с любого уровня.
       · Касание мимо ядра — пустое место слоя вокруг карточки.
       · Esc — как в зале: сначала на уровень выше внутри ядра, потом закрывает.
     Карточка возвращается в прежний вид, выбранный боец не меняется.

     ⚠️ ПОД СЛОЕМ ЗАЛ НЕ ПРИНИМАЕТ НАЖАТИЙ. Слой лежит выше канваса, а зал слушает
     именно канвас (pointer/touch на его элементе), выше лежащий слой перехватывает
     всё. Закрытие — по click, а не по pointerdown: иначе отпускание пришлось бы
     уже на зал, и предмет под пальцем сработал бы сквозь слой.

     ⚠️ СЛОЙ НЕ ЛЕЖИТ ВНУТРИ .fp. У панели есть transform, а fixed внутри
     трансформированного предка считается от него, а не от экрана.

     ПОЯСНЕНИЕ ПРО ПРОЗРАЧНОСТЬ ПРИ ПОЯВЛЕНИИ. Как и у панелей, она меняется не у
     самого слоя, а у его содержимого и стекла (см. forge.css): предок с
     opacity < 1 делает размытие слепым к сцене. -->
<template>
  <div class="fco" role="dialog" aria-modal="true" :aria-label="coreName" @click.self="$emit('close')">
    <div class="fco-body" @click.self="$emit('close')">
      <ForgeCore
        ref="coreRef"
        :core-id="coreId"
        :tree="tree"
        :spent="spent"
        :resource="resource"
        :gates="gates"
        :fighter-name="fighterName"
        :core-name="coreName"
        @toggle="$emit('toggle', $event)"
      />
    </div>

    <!-- BACK — та же матовая хром-кнопка, что BACK в полосе зала. Стоит внизу: до
         неё достаёт большой палец, а отступ считает системную полосу снизу. -->
    <div class="fco-bar" @click.self="$emit('close')">
      <button type="button" class="hs-chrome fco-back" :aria-label="t.home.back" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { t } from '@/locales/index.js';
import ForgeCore from '@/components/forge/ForgeCore.vue';

defineProps({
  coreId: { type: String, required: true },
  tree: { type: Array, default: () => [] },
  spent: { type: Number, default: 0 },
  resource: { type: Number, default: 5 },
  gates: { type: Object, default: () => ({}) },
  fighterName: { type: String, default: '' },
  coreName: { type: String, default: '' },
});
defineEmits(['toggle', 'close']);

const coreRef = ref(null);
// Esc: сперва вверх по уровням внутри ядра; true — нажатие съедено, слой остаётся.
defineExpose({ stepBack: () => coreRef.value?.stepBack?.() || false });
</script>
