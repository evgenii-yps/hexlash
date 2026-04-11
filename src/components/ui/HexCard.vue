<template>
  <div :class="classes" :style="rootStyle">
    <div v-if="$slots.header" class="hex-card__header">
      <slot name="header" />
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
    <div v-if="$slots.footer" class="hex-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

const RESULT_COLORS = {
  victory: 'var(--hex-victory)',
  defeat: 'var(--hex-defeat)',
  draw: 'var(--hex-draw)'
}

export default {
  name: 'HexCard',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: v => ['default', 'elevated', 'archetype', 'active', 'result'].includes(v)
    },
    archetypeColor: {
      type: String,
      default: null
    },
    resultType: {
      type: String,
      default: null,
      validator: v => !v || ['victory', 'defeat', 'draw'].includes(v)
    },
    clickable: {
      type: Boolean,
      default: false
    },
    padding: {
      type: String,
      default: 'md',
      validator: v => ['none', 'sm', 'md', 'lg'].includes(v)
    }
  },
  setup(props) {
    const classes = computed(() => [
      'hex-card',
      `hex-card--${props.variant}`,
      {
        'hex-card--clickable': props.clickable
      }
    ])

    const bodyClass = computed(() => [
      'hex-card__body',
      `hex-card__body--pad-${props.padding}`
    ])

    const rootStyle = computed(() => {
      const s = {}
      if ((props.variant === 'archetype' || props.variant === 'active') && props.archetypeColor) {
        s['--_arch-color'] = props.archetypeColor
      }
      if (props.variant === 'result' && props.resultType) {
        s['--_result-color'] = RESULT_COLORS[props.resultType]
      }
      return s
    })

    return { classes, bodyClass, rootStyle }
  }
}
</script>

<style scoped>
.hex-card {
  color: var(--hex-text-primary);
}

/* — Variants — */

.hex-card--default {
  background: var(--hex-bg-medium);
  border: 0.5px solid var(--hex-border-default);
  border-radius: 12px;
}

.hex-card--elevated {
  background: var(--hex-bg-light);
  border: 0.5px solid var(--hex-border-active);
  border-radius: 12px;
}

.hex-card--archetype {
  background: var(--hex-bg-medium);
  border: 0.5px solid var(--hex-border-default);
  border-left: 3px solid var(--_arch-color);
  border-radius: 0;
}

.hex-card--active {
  background: color-mix(in srgb, var(--_arch-color) 5%, transparent);
  border: 1px solid var(--_arch-color);
  border-radius: 12px;
}

.hex-card--result {
  background: var(--hex-bg-medium);
  border: 0.5px solid var(--hex-border-default);
  border-top: 3px solid var(--_result-color);
  border-radius: 12px;
}

/* — Clickable — */

.hex-card--clickable {
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.hex-card--clickable:hover {
  border-color: var(--hex-border-strong);
}

/* — Padding — */

.hex-card__body--pad-none {
  padding: 0;
}
.hex-card__body--pad-sm {
  padding: 8px 12px;
}
.hex-card__body--pad-md {
  padding: 16px;
}
.hex-card__body--pad-lg {
  padding: 24px;
}

/* — Header / Footer — */

.hex-card__header {
  padding: 16px 16px 12px;
  border-bottom: 0.5px solid var(--hex-border-default);
  margin-bottom: 0;
}

.hex-card__footer {
  padding: 12px 16px 16px;
  border-top: 0.5px solid var(--hex-border-default);
  margin-top: 0;
}
</style>
