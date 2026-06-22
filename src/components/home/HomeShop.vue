<!-- HomeShop — the DECOR shop view (visual stub). Same discipline as the home:
     dark, matte, ZERO glow (no bloom anywhere in the shop). Cards are decor only;
     future tabs (fighter skins / FX / cores) are SOON. BUY is a stub — it buys
     nothing. Principle held in the copy: $HEX buys cosmetics / decor / look only,
     never combat power, training or progression. -->
<template>
  <div class="shop-view">
    <div class="sp-bg" />
    <div class="hs-bracket tl" /><div class="hs-bracket tr" />
    <div class="hs-bracket bl" /><div class="hs-bracket br" />

    <div class="hs-top">
      <div class="hs-brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <polygon points="24,3 41.5,13 41.5,35 24,45 6.5,35 6.5,13" fill="none" stroke="currentColor" stroke-width="2.4" />
          <polygon points="24,13 33,18.5 33,29.5 24,35 15,29.5 15,18.5" fill="none" stroke="currentColor" stroke-width="2.4" />
          <path d="M24 13 L24 24 M24 24 L33 18.5 M24 24 L15 29.5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" />
        </svg>
        <span class="wm">HEXLASH</span>
        <span class="season">SHOP</span>
      </div>
      <div class="hs-topr">
        <div class="hs-bal"><span class="dia" /><b>{{ balance }}</b>&nbsp;<i>$HEX</i></div>
        <button type="button" class="sp-back" @click="$emit('back')">← BACK TO HOME</button>
      </div>
    </div>

    <div class="sp-wrap">
      <div class="sp-head">
        <div class="sp-h1">DECOR</div>
        <div class="sp-tabs">
          <span class="tb active">DECOR</span>
          <span class="tb">FIGHTER SKINS <i>SOON</i></span>
          <span class="tb">FX <i>SOON</i></span>
          <span class="tb">CORES <i>SOON</i></span>
        </div>
        <div class="sp-lede">
          Furnish your floor. Every piece is cut from the same low-poly stock as the arena —
          matte, dark, no neon. It's your ground; mark it. Decor is cosmetic only — it never
          touches a fight.
        </div>
      </div>

      <div class="sp-grid">
        <ShopCard :item="ITEMS.banner" :featured="true" />
        <div class="sp-col">
          <ShopCard :item="ITEMS.corePlinth" />
          <ShopCard :item="ITEMS.dais" />
        </div>
        <div class="sp-col">
          <ShopCard :item="ITEMS.crates" :owned="true" />
          <ShopCard :item="ITEMS.arch" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, h } from 'vue';

defineProps({ balance: { type: String, default: '2,480' } });
defineEmits(['back']);

// Decor catalog (stub). name + tag (copy) + price ($HEX) + tag-label.
const ITEMS = {
  banner: { kind: 'banner', name: 'Clan Banner', tag: 'Hanging cloth marker for your floor.', price: 1800, label: 'DECOR' },
  corePlinth: { kind: 'corePlinth', name: 'Core Plinth', tag: 'A pedestal to show your core.', price: 900, label: 'NEW' },
  dais: { kind: 'dais', name: 'Hex Dais', tag: 'A raised stage tile.', price: 600, label: 'DECOR' },
  crates: { kind: 'crates', name: 'Supply Cache', tag: 'Stacked low-poly crates.', price: 400, label: 'DECOR' },
  arch: { kind: 'arch', name: 'Ward Arch', tag: 'A standing gate silhouette.', price: 1200, label: 'DECOR' },
};

// Minimal matte prop silhouettes (NOT the flat-stage drawObject — simple shapes).
const SHAPES = {
  banner: '<polygon points="36,72 48,72 48,18 36,18" fill="#3a4453"/><polygon points="48,18 48,72 52,68 52,22" fill="#252c37"/><polygon points="30,72 58,72 58,80 30,80" fill="#2b3446"/>',
  corePlinth: '<polygon points="30,76 58,76 54,58 34,58" fill="#3a4453"/><polygon points="58,76 54,58 56,56 60,74" fill="#252c37"/><polygon points="44,52 50,46 44,40 38,46" fill="#1b2233" stroke="#5a6b86" stroke-width="0.6"/>',
  dais: '<polygon points="24,74 64,74 78,64 38,64" fill="#3a4453"/><polygon points="64,74 78,64 78,69 64,79" fill="#252c37"/>',
  crates: '<polygon points="28,78 52,78 52,56 28,56" fill="#3a4453"/><polygon points="52,78 52,56 58,52 58,74" fill="#252c37"/><polygon points="34,56 54,56 54,42 34,42" fill="#46516a"/>',
  arch: '<polygon points="26,78 34,78 34,40 26,40" fill="#3a4453"/><polygon points="58,78 66,78 66,40 58,40" fill="#3a4453"/><polygon points="26,40 66,40 66,32 26,32" fill="#46516a"/>',
};

// Card — preview frame + meta + matte BUY/OWNED. Local component; the silhouette
// inner SVG goes through v-html (trusted static strings above, no user data).
const ShopCard = defineComponent({
  props: { item: { type: Object, required: true }, featured: Boolean, owned: Boolean },
  setup(props) {
    return () =>
      h('div', { class: ['sp-card', { feat: props.featured }] }, [
        h('div', { class: 'sp-frame' }, [
          h('span', { class: 'sp-tag' }, props.item.label),
          h('svg', { class: 'sp-prev', viewBox: '0 0 88 96', preserveAspectRatio: 'xMidYMax meet' }, [
            h('ellipse', { cx: 44, cy: 80, rx: 34, ry: 7, fill: '#000', opacity: 0.4 }),
            h('g', { innerHTML: SHAPES[props.item.kind] || '' }),
          ]),
        ]),
        h('div', { class: 'sp-meta' }, [
          h('div', { class: 'sp-name' }, props.item.name),
          h('div', { class: 'sp-sub' }, props.item.tag),
          h('div', { class: 'sp-buy' }, [
            h('div', { class: 'sp-price' }, [h('span', { class: 'dia' }), h('b', props.item.price.toLocaleString()), h('i', '$HEX')]),
            props.owned
              ? h('div', { class: 'sp-btn owned' }, 'OWNED')
              : h('button', { type: 'button', class: 'sp-btn buy' }, ['BUY', h('span', { class: 'ar' }, '→')]),
          ]),
        ]),
      ]);
  },
});
</script>

<style scoped>
.shop-view { position: absolute; inset: 0; }
</style>
