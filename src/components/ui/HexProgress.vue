<template>
  <div :class="['hex-progress', `hex-progress--${size}`]">
    <span v-if="label" class="hex-progress__label">{{ label }}</span>
    <div class="hex-progress__track">
      <div
        class="hex-progress__fill"
        :style="fillStyle"
      />
    </div>
    <span v-if="showValue || showPercent" class="hex-progress__value">
      {{ valueText }}
    </span>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'HexProgress',
  props: {
    value: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      default: 100
    },
    variant: {
      type: String,
      default: 'generic',
      validator: v => ['hp', 'branch', 'generic'].includes(v)
    },
    branch: {
      type: String,
      default: null,
      validator: v => !v || ['speed', 'power', 'technique'].includes(v)
    },
    color: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: 'md',
      validator: v => ['sm', 'md', 'lg'].includes(v)
    },
    showValue: {
      type: Boolean,
      default: false
    },
    showPercent: {
      type: Boolean,
      default: false
    },
    animated: {
      type: Boolean,
      default: true
    },
    label: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const percent = computed(() => {
      if (props.max <= 0) return 0
      return Math.round((props.value / props.max) * 100)
    })

    const fillColor = computed(() => {
      if (props.variant === 'hp') {
        const p = percent.value
        if (p > 60) return 'var(--hex-success)'
        if (p > 30) return 'var(--hex-warning)'
        return 'var(--hex-danger)'
      }
      if (props.variant === 'branch' && props.branch) {
        return `var(--hex-branch-${props.branch})`
      }
      return props.color || 'var(--hex-primary)'
    })

    const fillStyle = computed(() => ({
      width: Math.min(percent.value, 100) + '%',
      background: fillColor.value,
      transition: props.animated ? 'width 0.5s ease' : 'none'
    }))

    const valueText = computed(() => {
      if (props.showPercent) return percent.value + '%'
      return props.value + '/' + props.max
    })

    return { percent, fillStyle, valueText }
  }
}
</script>

<style scoped>
.hex-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* — Track — */

.hex-progress__track {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.hex-progress--sm .hex-progress__track {
  height: 4px;
  border-radius: 2px;
}
.hex-progress--md .hex-progress__track {
  height: 8px;
  border-radius: 4px;
}
.hex-progress--lg .hex-progress__track {
  height: 14px;
  border-radius: 7px;
}

/* — Fill — */

.hex-progress__fill {
  height: 100%;
  border-radius: inherit;
  min-width: 0;
}

/* — Label — */

.hex-progress__label {
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hex-text-muted);
  min-width: 30px;
  flex-shrink: 0;
}

/* — Value — */

.hex-progress__value {
  font-family: 'AnonymousBalance', monospace;
  color: var(--hex-text-secondary);
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.hex-progress--sm .hex-progress__value { font-size: 11px; }
.hex-progress--md .hex-progress__value { font-size: 13px; }
.hex-progress--lg .hex-progress__value { font-size: 15px; }
</style>
