<template>
  <div class="slider">
    <input type="range" :min="0" :max="options.length - 1" v-model="sliderValue" @input="updateBet"/>
    <div class="slider-labels">
      <span v-for="(option, index) in options" :key="index">{{ option }}</span>
    </div>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';

const props = defineProps({
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Number,
    required: true
  }
});

const emits = defineEmits(['update:modelValue']);

const sliderValue = ref(props.options.indexOf(props.modelValue));

watch(sliderValue, (newValue) => {
  emits('update:modelValue', props.options[newValue]);
});

const updateBet = () => {
  emits('update:modelValue', props.options[sliderValue.value]);
};
</script>

<style scoped>
.slider {
  display: flex;
  flex-direction: column;
  align-items: center;
}

input[type="range"] {
  width: 100%;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.slider-labels span {
  font-size: 0.8em;
}
</style>
