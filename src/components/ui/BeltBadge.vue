<template>
  <div class="belt-badge" :class="[sizeClass, { 'is-hexmaster': isHexmaster }]">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <!-- Belt body -->
      <rect
        :x="geom.bodyX" :y="geom.bodyY"
        :width="geom.bodyW" :height="geom.bodyH"
        :rx="geom.rx"
        :fill="fillColor"
        :stroke="strokeColor"
        :stroke-width="strokeW"
      />
      <!-- Buckle: small rectangle at center -->
      <rect
        :x="geom.buckleX" :y="geom.buckleY"
        :width="geom.buckleW" :height="geom.buckleH"
        :rx="0.5"
        fill="none"
        :stroke="buckleStroke"
        :stroke-width="geom.buckleStrokeW"
      />
      <!-- Stripes: thin vertical lines near right edge (md/lg only) -->
      <template v-if="showStripes">
        <line
          v-for="i in display.stripes" :key="i"
          :x1="stripeX(i)" :y1="geom.stripeY1"
          :x2="stripeX(i)" :y2="geom.stripeY2"
          stroke="var(--hex-belt-stripe)"
          :stroke-width="geom.stripeW"
          stroke-linecap="round"
        />
      </template>
    </svg>
  </div>
</template>

<script>
import { getBeltDisplay } from '@/utils/beltDisplay';

export default {
  name: 'BeltBadge',
  props: {
    grade: { type: Number, required: true, validator: v => v >= 0 && v <= 32 },
    isHexmaster: { type: Boolean, default: false },
    size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  },
  computed: {
    display() {
      if (this.isHexmaster) return { color: 'hexmaster', stripes: 0 };
      return getBeltDisplay(this.grade);
    },
    sizeClass() {
      return `size-${this.size}`;
    },
    fillColor() {
      return `var(--hex-belt-${this.display.color})`;
    },
    strokeColor() {
      // White and black need stronger outline for visibility
      if (this.display.color === 'white') return 'rgba(255, 255, 255, 0.4)';
      if (this.display.color === 'black') return 'rgba(255, 255, 255, 0.35)';
      return 'var(--hex-belt-outline)';
    },
    strokeW() {
      if (this.display.color === 'white' || this.display.color === 'black') return 0.7;
      return 0.4;
    },
    buckleStroke() {
      if (this.display.color === 'white') return 'rgba(0, 0, 0, 0.3)';
      if (this.display.color === 'black') return 'rgba(255, 255, 255, 0.4)';
      return 'rgba(255, 255, 255, 0.5)';
    },
    showStripes() {
      return this.size !== 'sm' && this.display.stripes > 0;
    },
    // SVG viewBox: 48x16 landscape belt
    viewBox() {
      return '0 0 48 16';
    },
    geom() {
      return {
        bodyX: 2, bodyY: 4,
        bodyW: 44, bodyH: 8,
        rx: 1.5,
        // Buckle centered
        buckleX: 21, buckleY: 3,
        buckleW: 6, buckleH: 10,
        buckleStrokeW: 0.8,
        // Stripes zone (right side of belt, before buckle area ends)
        stripeY1: 4.5, stripeY2: 11.5,
        stripeW: 1,
      };
    },
  },
  methods: {
    stripeX(i) {
      // Stripes positioned right of buckle, spaced 2.5px apart
      return 31 + (i - 1) * 2.5;
    },
  },
};
</script>

<style scoped>
.belt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.belt-badge svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Sizes: aspect ratio ~3:1 */
.size-sm { width: 16px; height: 6px; }
.size-md { width: 40px; height: 14px; }
.size-lg { width: 120px; height: 40px; }

/* Hexmaster pulse glow — md and lg only */
.is-hexmaster.size-md svg,
.is-hexmaster.size-lg svg {
  filter: drop-shadow(0 0 4px var(--hex-primary-glow));
  animation: hexmaster-pulse 1500ms ease-in-out infinite;
}

/* Hexmaster sm — static glow only, no animation */
.is-hexmaster.size-sm svg {
  filter: drop-shadow(0 0 2px var(--hex-primary-glow));
}

@keyframes hexmaster-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px var(--hex-primary-glow)); }
  50% { filter: drop-shadow(0 0 12px var(--hex-primary-glow)); }
}

@media (prefers-reduced-motion: reduce) {
  .is-hexmaster.size-md svg,
  .is-hexmaster.size-lg svg {
    animation: none;
    filter: drop-shadow(0 0 8px var(--hex-primary-glow));
  }
}
</style>
