<template>
  <button
    :class="classes"
    :style="rootStyle"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="hex-btn-spinner" />
    <template v-if="!loading">
      <PixelIcon
        v-if="icon"
        :name="icon"
        :size="iconSize"
        :glow="iconGlow"
        :disabled="disabled"
      />
      <slot />
    </template>
  </button>
</template>

<script>
import { computed } from 'vue'
import PixelIcon from './PixelIcon.vue'

export default {
  name: 'HexButton',
  components: { PixelIcon },
  emits: ['click'],
  props: {
    variant: {
      type: String,
      default: 'secondary',
      validator: v => ['primary', 'secondary', 'ghost', 'danger', 'archetype'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: v => ['sm', 'md', 'lg'].includes(v)
    },
    archetypeColor: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    block: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: null
    },
    iconGlow: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const classes = computed(() => [
      'hex-button',
      `hex-button--${props.variant}`,
      `hex-button--${props.size}`,
      {
        'hex-button--block': props.block,
        'hex-button--loading': props.loading,
        'hex-button--has-icon': !!props.icon
      }
    ])

    const rootStyle = computed(() => {
      if (props.variant !== 'archetype' || !props.archetypeColor) return {}
      return {
        '--_arch-color': props.archetypeColor
      }
    })

    const iconSize = computed(() => {
      return { sm: 16, md: 20, lg: 24 }[props.size]
    })

    return { classes, rootStyle, iconSize }
  }
}
</script>

<style scoped>
.hex-button {
  font-family: 'Anonymous', 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.hex-button--has-icon {
  gap: 8px;
}

/* — Sizes — */

.hex-button--sm {
  padding: 6px 12px;
  font-size: 12px;
}
.hex-button--md {
  padding: 10px 20px;
  font-size: 14px;
}
.hex-button--lg {
  padding: 14px 28px;
  font-size: 16px;
}

/* — Block — */

.hex-button--block {
  width: 100%;
}

/* — Variants — */

.hex-button--primary {
  background: var(--hex-primary);
  color: var(--hex-text-primary);
  border: none;
}
.hex-button--primary:hover:not(:disabled) {
  filter: brightness(1.15);
}

.hex-button--secondary {
  background: transparent;
  color: var(--hex-text-secondary);
  border: 1px solid var(--hex-border-active);
}
.hex-button--secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.hex-button--ghost {
  background: transparent;
  color: var(--hex-text-muted);
  border: none;
}
.hex-button--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.03);
}

.hex-button--danger {
  background: var(--hex-danger);
  color: var(--hex-text-primary);
  border: none;
}
.hex-button--danger:hover:not(:disabled) {
  filter: brightness(1.15);
}

.hex-button--archetype {
  background: transparent;
  color: var(--_arch-color);
  border: 1px solid var(--_arch-color);
}
.hex-button--archetype:hover:not(:disabled) {
  background: color-mix(in srgb, var(--_arch-color) 10%, transparent);
}

/* — States — */

.hex-button:active:not(:disabled) {
  transform: scale(0.97);
}

.hex-button:disabled {
  background: var(--hex-bg-card);
  color: var(--hex-text-muted);
  border-color: var(--hex-border-default);
  pointer-events: none;
  cursor: default;
}

/* — Loading spinner — */

.hex-btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: var(--hex-text-primary);
  border-radius: 50%;
  animation: hex-btn-spin 0.7s linear infinite;
}

.hex-button--sm .hex-btn-spinner {
  width: 12px;
  height: 12px;
}

.hex-button--lg .hex-btn-spinner {
  width: 20px;
  height: 20px;
}

@keyframes hex-btn-spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 1024px) {
  .hex-button { letter-spacing: 1.5px; border-radius: 10px; }
  .hex-button--sm { padding: 10px 20px; font-size: 15px; }
  .hex-button--md { padding: 18px 28px; font-size: 18px; }
  .hex-button--lg { padding: 22px 36px; font-size: 20px; letter-spacing: 2px; }
  .hex-button--sm .hex-btn-spinner { width: 14px; height: 14px; }
  .hex-button--lg .hex-btn-spinner { width: 22px; height: 22px; }
}
</style>
