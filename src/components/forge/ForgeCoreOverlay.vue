<!-- ForgeCoreOverlay — РАЗВОРОТ ЯДРА на весь экран (ТЗ 29.09.2026, работа 2).

     ЗАЧЕМ. Фигура ядра в карточке панели мелкая, и выбирать в ней тесно. Одно
     нажатие по ней открывает этот слой: ядро крупно, зал позади виден сквозь то
     же стекло, что у панелей (работа 1), только вуаль плотнее — под слоем
     читать нечего.

     ⚠️ ЛОГИКИ ЗАЖИГАНИЯ ЗДЕСЬ НЕТ. Внутри стоит тот же ForgeCore, что и в маленькой
     карточке (там он в режиме preview). Он получает те же свойства и шлёт то же
     событие toggle; оно уходит наверх (PveView.onToggle → roster/toggleFacet),
     то есть в то же хранилище и в том же формате. Потолок зажжённых (RESOURCE),
     счётчик и налив — его собственные, не переписанные.

     НАЗАД — ОДИН, В ЛЕВОМ ВЕРХНЕМ УГЛУ (правка 1 к ТЗ 29.09.2026). Та же хром-
     кнопка, что BACK зала, на том же месте и того же размера. Шагает на один
     уровень назад: кристалл → грань → ядро → закрыть разворот, вернуться в зал.
     Esc делает ровно то же самое. Внутренних кнопок «назад» у ядра здесь нет
     (expanded), нижней кнопки тоже, а BACK зала на это время скрыт зал.
     Касание мимо ядра — пустое место слоя вокруг карточки — по-прежнему закрывает
     разворот целиком, с любого уровня. Выбранный боец не меняется.

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
  <div class="fco" role="dialog" aria-modal="true" :aria-label="coreName" @click="onTap">
    <div class="fco-body">
      <ForgeCore
        ref="coreRef"
        expanded
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

    <!-- BACK — та же матовая хром-кнопка семьи .hs-chrome, что BACK зала: та же
         форма и размер, угол тот же. Сам BACK зала на время разворота скрыт. -->
    <button type="button" class="hs-chrome fco-back" :aria-label="t.home.back" @click="back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
      <span class="n">{{ t.home.back }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { t } from '@/locales/index.js';
import ForgeCore from '@/components/forge/ForgeCore.vue';
import { RESOURCE } from '@/data/upgradeData.js';

defineProps({
  coreId: { type: String, required: true },
  tree: { type: Array, default: () => [] },
  spent: { type: Number, default: 0 },
  resource: { type: Number, default: RESOURCE },
  gates: { type: Object, default: () => ({}) },
  fighterName: { type: String, default: '' },
  coreName: { type: String, default: '' },
});
const emit = defineEmits(['toggle', 'close']);

const coreRef = ref(null);

// КАСАНИЕ МИМО ФИГУРЫ закрывает разворот целиком, с любого уровня. «Мимо» — это
// пустое место: сам слой и его раскладочные коробки. Фигура, кнопки и строки текста
// в счёт не идут. Список коробок, а не «всё, что не фигура», нарочно: описание
// кристалла можно тронуть, чтобы прочитать, и слой от этого не должен исчезнуть.
const EMPTY = '.fco, .fco-body, .fc, .fc-who, .fc-read, .fc-head, .fc-foot, .fc-lines';
function onTap(e) { if (e.target.matches(EMPTY)) emit('close'); }
// Шаг назад на уровень выше внутри ядра; true — шаг сделан и слой остаётся.
const stepBack = () => coreRef.value?.stepBack?.() || false;
// BACK и Esc делают одно и то же: на уровень выше, а с уровня «ядро» — закрыть.
function back() { if (!stepBack()) emit('close'); }
defineExpose({ stepBack, back });
</script>
