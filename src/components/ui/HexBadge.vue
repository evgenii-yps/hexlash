<template>
  <span :class="classes" :style="rootStyle">
    <PixelIcon
      v-if="icon"
      :name="icon"
      :size="iconSize"
      :color="textColorResolved"
    />
    <template v-if="variant === 'counter'">{{ count }}</template>
    <slot v-else />
  </span>
</template>

<script>
import { computed } from 'vue'
import PixelIcon from './PixelIcon.vue'

const ARCHETYPE_COLORS = {
  predator:   { text: 'var(--hex-arch-predator)',   bg: 'var(--hex-arch-predator-bg)' },
  sentinel:   { text: 'var(--hex-arch-sentinel)',   bg: 'var(--hex-arch-sentinel-bg)' },
  ghost:      { text: 'var(--hex-arch-ghost)',      bg: 'var(--hex-arch-ghost-bg)' },
  analyst:    { text: 'var(--hex-arch-analyst)',     bg: 'var(--hex-arch-analyst-bg)' },
  maverick:   { text: 'var(--hex-arch-maverick)',    bg: 'var(--hex-arch-maverick-bg)' },
  juggernaut: { text: 'var(--hex-arch-juggernaut)', bg: 'var(--hex-arch-juggernaut-bg)' }
}

const BRANCH_COLORS = {
  speed:     'var(--hex-branch-speed)',
  power:     'var(--hex-branch-power)',
  technique: 'var(--hex-branch-technique)'
}

const STATUS_COLORS = {
  victory: { text: 'var(--hex-victory)', bg: 'var(--hex-victory-bg)' },
  defeat:  { text: 'var(--hex-defeat)',  bg: 'var(--hex-defeat-bg)' },
  draw:    { text: 'var(--hex-draw)',    bg: 'var(--hex-draw-bg)' },
  info:    { text: 'var(--hex-info)',    bg: 'var(--hex-info-bg)' }
}

export default {
  name: 'HexBadge',
  components: { PixelIcon },
  props: {
    variant: {
      type: String,
      default: 'custom',
      validator: v => ['archetype', 'branch', 'status', 'counter', 'custom'].includes(v)
    },
    archetype: {
      type: String,
      default: null
    },
    branch: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    count: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: null
    },
    bgColor: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: 'sm',
      validator: v => ['sm', 'md'].includes(v)
    },
    icon: {
      type: String,
      default: null
    },
    uppercase: {
      type: Boolean,
      default: true
    },
    pulse: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const isCircle = computed(() =>
      props.variant === 'counter' && props.count < 10
    )

    const classes = computed(() => [
      'hex-badge',
      `hex-badge--${props.size}`,
      {
        'hex-badge--uppercase': props.uppercase,
        'hex-badge--pulse': props.pulse,
        'hex-badge--counter': props.variant === 'counter',
        'hex-badge--circle': isCircle.value,
        'hex-badge--has-icon': !!props.icon
      }
    ])

    const textColorResolved = computed(() => {
      if (props.variant === 'archetype' && props.archetype) {
        return ARCHETYPE_COLORS[props.archetype]?.text || 'var(--hex-text-primary)'
      }
      if (props.variant === 'branch' && props.branch) {
        return BRANCH_COLORS[props.branch] || 'var(--hex-text-primary)'
      }
      if (props.variant === 'status' && props.status) {
        return STATUS_COLORS[props.status]?.text || 'var(--hex-text-primary)'
      }
      if (props.variant === 'counter') return 'var(--hex-text-primary)'
      return props.color || 'var(--hex-text-primary)'
    })

    const bgColorResolved = computed(() => {
      if (props.variant === 'archetype' && props.archetype) {
        return ARCHETYPE_COLORS[props.archetype]?.bg || 'rgba(255,255,255,0.1)'
      }
      if (props.variant === 'branch' && props.branch) {
        return `color-mix(in srgb, ${BRANCH_COLORS[props.branch]} 15%, transparent)`
      }
      if (props.variant === 'status' && props.status) {
        return STATUS_COLORS[props.status]?.bg || 'rgba(255,255,255,0.1)'
      }
      if (props.variant === 'counter') return 'var(--hex-primary)'
      return props.bgColor || 'rgba(255,255,255,0.1)'
    })

    const rootStyle = computed(() => ({
      color: textColorResolved.value,
      background: bgColorResolved.value
    }))

    const iconSize = computed(() => props.size === 'sm' ? 12 : 16)

    return { classes, rootStyle, textColorResolved, iconSize }
  }
}
</script>

<style scoped>
.hex-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 20px;
  font-family: 'Anonymous', monospace;
  letter-spacing: 0.5px;
  white-space: nowrap;
  line-height: 1;
}

.hex-badge--uppercase {
  text-transform: uppercase;
}

/* — Sizes — */

.hex-badge--sm {
  padding: 2px 8px;
  font-size: 10px;
}
.hex-badge--md {
  padding: 4px 12px;
  font-size: 12px;
}

/* — Counter — */

.hex-badge--counter {
  font-family: 'AnonymousBalance', monospace;
  justify-content: center;
  padding: 0;
}
.hex-badge--counter.hex-badge--sm {
  min-width: 18px;
  height: 18px;
  font-size: 10px;
}
.hex-badge--counter.hex-badge--md {
  min-width: 22px;
  height: 22px;
  font-size: 12px;
}
.hex-badge--circle {
  border-radius: 50%;
}
/* pill for >= 10 */
.hex-badge--counter:not(.hex-badge--circle) {
  padding: 0 6px;
  border-radius: 20px;
}

/* — Pulse — */

.hex-badge--pulse {
  animation: hex-badge-pulse 1.5s ease infinite;
}

@keyframes hex-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (min-width: 1024px) {
  .hex-badge { letter-spacing: 0.8px; }
  .hex-badge--sm { padding: 3px 10px; font-size: 12px; }
  .hex-badge--md { padding: 5px 14px; font-size: 13px; }
  .hex-badge--counter.hex-badge--sm { min-width: 20px; height: 20px; font-size: 11px; }
  .hex-badge--counter.hex-badge--md { min-width: 24px; height: 24px; font-size: 13px; }
}
</style>
