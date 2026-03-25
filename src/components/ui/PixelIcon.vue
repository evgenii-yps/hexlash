<template>
  <canvas
    ref="canvas"
    :width="16"
    :height="16"
    :style="canvasStyle"
  />
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { pixelIcons } from '@/data/pixelIcons'

export default {
  name: 'PixelIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 48
    },
    color: {
      type: String,
      default: null
    },
    glow: {
      type: Boolean,
      default: false
    },
    glowColor: {
      type: String,
      default: null
    },
    glowSize: {
      type: Number,
      default: 6
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const canvas = ref(null)

    const resolvedColor = computed(() => {
      if (props.color) return props.color
      const icon = pixelIcons[props.name]
      return icon?.defaultColor || '#FFFFFF'
    })

    const effectiveGlowColor = computed(() => {
      if (props.glowColor) return props.glowColor
      // For CSS variables we can't easily derive alpha, use a fallback
      const c = resolvedColor.value
      if (c.startsWith('var(')) return c
      return c
    })

    const canvasStyle = computed(() => ({
      width: props.size + 'px',
      height: props.size + 'px',
      imageRendering: 'pixelated',
      filter: props.glow
        ? `drop-shadow(0 0 ${props.glowSize}px ${effectiveGlowColor.value})`
        : 'none',
      opacity: props.disabled ? 0.35 : 1,
      transition: 'filter 0.3s ease, opacity 0.3s ease'
    }))

    function draw() {
      const el = canvas.value
      if (!el) return

      const ctx = el.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, 16, 16)

      const icon = pixelIcons[props.name]
      if (!icon) return

      // Resolve CSS variable to actual color for canvas
      const fillColor = resolvedColor.value
      if (fillColor.startsWith('var(')) {
        const varName = fillColor.replace(/^var\(/, '').replace(/\)$/, '')
        const computed = getComputedStyle(el).getPropertyValue(varName).trim()
        ctx.fillStyle = computed || '#FFFFFF'
      } else {
        ctx.fillStyle = fillColor
      }

      icon.grid.forEach((pixel, index) => {
        if (pixel === 1) {
          const x = index % 16
          const y = Math.floor(index / 16)
          ctx.fillRect(x, y, 1, 1)
        }
      })
    }

    onMounted(draw)

    watch(() => [props.name, props.color], draw)

    return {
      canvas,
      canvasStyle
    }
  }
}
</script>
