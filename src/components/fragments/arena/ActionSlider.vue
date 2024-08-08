<template>
  <div class="slider-container">
    <div class="ticks"></div>
    <div class="slider-background">
      <v-slider class="slider"
                v-model="sliderValue"
                @input="updateAction"
                direction="vertical"
                :ticks="tickLabels"
                :max="actionOptions.length - 1"
                :step="1"
                :thumb-size="30"
                :thumb-label="false"
                show-ticks="always"
                tick-size="15"
                track-size="6px"
                :color="isBlocked ? 'var(--gray3)' : 'var(--primary-color)'"
                :thumb-color="isBlocked ? 'var(--gray3)' : 'var(--primary-color)'"
                :track-color="isBlocked ? 'var(--gray3)' : 'var(--gray1)'"
                style="margin-bottom: 0"
      />
      <img src="@/assets/images/icon_hit.svg" alt="">
    </div>

  </div>
</template>

<script setup>
import {ref, watch} from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
});

const tickLabels = ref({
  0: '3',
  1: '5',
  2: '10'
});

const emits = defineEmits(['update:modelValue']);

const actionOptions = [3, 5, 10];

const sliderValue = ref(actionOptions.indexOf(props.modelValue));

watch(sliderValue, (newValue) => {
  emits('update:modelValue', actionOptions[newValue]);
});

const updateAction = (value) => {
  sliderValue.value = value;
  emits('update:modelValue', actionOptions[value]);
};
</script>

<style scoped>
.slider-container {
  display: flex;
  position: relative;
}

.ticks {
  width: 6px;
  background-image: linear-gradient(to bottom, var(--gray1) 1px, transparent 1px);
  background-size: 5px 7px;
  margin-top: 25px; /* Добавляем отступ сверху */
  margin-bottom: 70px; /* Добавляем отступ снизу */
}

.ticks::before,
.ticks::after {
  content: '';
  display: block;
  height: 30px; /* Adjust the height to match the thumb size or desired offset */
  background: transparent;
}

.slider-background {
  width: 28px;
  height: 100%;
  background-color: var(--dark);
  justify-content: center;
  border-radius: 8px;
  margin: 12px auto;
  padding-bottom: 10px;
}
</style>
