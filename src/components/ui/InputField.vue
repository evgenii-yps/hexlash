<template>
  <div class="input-field" :style="{ marginBottom: marginBottom }">
    <label :for="label" class="input-label" :style="labelStyles">{{ label }}</label>
    <input
        :type="type"
        :id="label"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="input-element"
        :style="inputStyles"
        autocapitalize="none"
    />
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  modelValue: String,
  labelColor: {
    type: String,
    default: 'var(--gray2)'
  },
  labelSize: {
    type: String,
    default: '12px'
  },
  inputBgColor: {
    type: String,
    default: 'var(--white)'
  },
  inputBorderColor: {
    type: String,
    default: 'var(--gray1)'
  },
  inputTextColor: {
    type: String,
    default: 'var(--dark)'
  },
  borderRadius: {
    type: String,
    default: '4px'
  },
  padding: {
    type: String,
    default: '10px'
  },
  focusBorderColor: {
    type: String,
    default: 'var(--pink)' // Цвет розовой рамки при фокусе
  },
  marginBottom: {
    type: String,
    default: '1rem' // Значение по умолчанию
  }
});

const labelStyles = computed(() => ({
  color: props.labelColor,
  fontSize: props.labelSize
}));

const inputStyles = computed(() => ({
  backgroundColor: props.inputBgColor,
  borderColor: props.inputBorderColor,
  color: props.inputTextColor,
  width: '100%',
  height: '100%',
  borderRadius: props.borderRadius,
  padding: props.padding
}));
</script>

<style scoped>
.input-field {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.input-label {
  margin-bottom: 5px;
  text-align: center;
  font-weight: 800;
}
.input-element {
  border: 1px solid var(--gray1);
  width: 100%;
  box-sizing: border-box;
  outline: none; /* Убираем синюю рамку */
  caret-color: white;
}

.input-element:focus {
  border-color: var(--pink);
}



input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus {
  border: 1px solid var(--gray1);
  -webkit-text-fill-color: white;
  -webkit-box-shadow: 0 0 0px 1000px var(--black-opacity) inset;
  transition: background-color 5000s ease-in-out 0s;
}

</style>
