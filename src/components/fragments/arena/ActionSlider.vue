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
                :thumb-size="20"
                :thumb-label="false"
                show-ticks="always"
                tick-size="12"
                track-size="5px"
                :color="isBlocked ? 'var(--gray3)' : 'var(--primary-color)'"
                :thumb-color="isBlocked ? 'var(--gray3)' : 'var(--primary-color)'"
                :track-color="isBlocked ? 'var(--gray3)' : 'var(--gray1)'"
                style="margin-bottom: 10px"
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
  width: 5px;
  background-image: linear-gradient(to bottom, var(--gray1) 1px, transparent 1px);
  background-size: 5px 7px;
  margin-top: 20px; /* Добавляем отступ сверху */
  position: absolute;
  height: 77%;
}

.ticks::before,
.ticks::after {
  content: '';
  display: block;

  background: transparent;
}

.slider-background {
  width: 28px;
  height: 100%;
  background-color: var(--dark);
  justify-content: center;
  border-radius: 8px;
  margin: 12px auto 0;
  padding-bottom: 10px;
}
</style>
