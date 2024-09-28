<template>
  <div class="input-field" :style="{ marginBottom: marginBottom }">
    <label :for="label" class="input-label" :style="labelStyles">{{ label }}</label>
    <div class="input-wrapper" :style="wrapperStyles">
      <input
          :type="type"
          :id="label"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="input-element"
          :style="inputStyles"
          :readonly="readonly"
          autocapitalize="none"
          :placeholder="placeholder"
          style="font-size: 0.8em"
      />
      <div v-if="showButton" class="slot-container">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed} from 'vue';

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
    default: '0.5rem'
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
  },
  upperCase:{
    type: Boolean,
    default:false
  },
  center:{
    type: Boolean,
    default:false
  },
  showButton: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '' // Значение по умолчанию для placeholder
  }
});

const emit = defineEmits(['update:modelValue']);

const labelStyles = computed(() => ({
  color: props.labelColor,
  fontSize: props.labelSize
}));

const inputStyles = computed(() => ({
  backgroundColor: 'transparent',
  borderColor: props.inputBorderColor,
  color: props.inputTextColor,
  flexGrow: 1,
  borderRadius: props.showButton ? '4px 0 0 4px' : props.borderRadius,
  padding: props.padding,
  textTransform: props.upperCase ? 'uppercase' : 'none',
  textAlign: props.center ? 'center' : 'none',
}));

const wrapperStyles = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${props.inputBorderColor}`,
  borderRadius: props.borderRadius,
  backgroundColor: props.inputBgColor,

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

.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.input-element {
  border: none;
  outline: none; /* Убираем синюю рамку */
  caret-color: white;
  padding: 0 0.8rem;
  border-radius: 0;
  box-sizing: border-box;
}

.input-element:focus {
  border-color: var(--pink);
}

.slot-container {
  display: flex;
  align-items: center;
  justify-content: center;
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
  -webkit-text-fill-color: white;
  -webkit-box-shadow: 0 0 0 1000px var(--black-opacity) inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
