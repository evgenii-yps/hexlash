<!-- Epic 5 — Sub-Epic 5E Step 4. Full HudShop body.
     Source: prototype hexlash_v24.html lines 4983-5023 (HUD markup) +
     12534-12572 (catalog imported via shopMock.js) + 12603-12777 (purchase
     handlers, ported as Vue script setup).

     Conventions:
     - Template root class .shop-hud — scoped style match per lesson #22.
     - <style scoped> with pointer-events reset (lesson #12).
     - Conditional <span> blocks for price rendering — no v-html (safer, no
       XSS surface, idiomatic Vue 3). Cost: spans repeated in grid + detail
       panel; benefit: zero injection risk.
     - Vue 3 Set reactivity: ownedSet re-created via `new Set([...])` on
       purchase (Set.add NOT tracked through ref()). -->
<template>
  <div class="hud shop-hud">
    <button class="shop-back" @click="$emit('back')">← Back</button>

    <div class="shop-title">
      <div class="st-kicker">Hexlash</div>
      <div class="st-name">LOCKER</div>
    </div>

    <div class="shop-balance">
      <div class="balance-chip taps">
        <span class="bc-kicker">Taps</span>
        <span class="bc-val">{{ balance.taps.toLocaleString() }}</span>
      </div>
      <div class="balance-chip xp">
        <span class="bc-kicker">XP</span>
        <span class="bc-val">{{ balance.xp.toLocaleString() }}</span>
      </div>
      <div class="balance-chip eth">
        <span class="bc-kicker">Base</span>
        <span class="bc-val">{{ balance.eth.toFixed(3) }}Ξ</span>
      </div>
    </div>

    <div class="shop-main" :class="{ 'show-detail': mobileShowDetail }">
      <div class="shop-tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="shop-tab"
          :class="{ active: activeCat === cat.id }"
          @click="activeCat = cat.id"
        >{{ cat.label }}</button>
      </div>

      <div class="shop-grid-wrap">
        <div v-if="filteredItems.length === 0" class="empty-cat">Empty category</div>
        <div v-else class="shop-grid">
          <div
            v-for="it in filteredItems"
            :key="it.id"
            class="shop-item"
            :class="{ selected: selectedId === it.id, owned: ownedSet.has(it.id) }"
            @click="selectItem(it)"
          >
            <div class="si-preview" :style="previewStyle(it)">{{ it.ico }}</div>
            <div class="si-name">{{ it.name }}</div>
            <div class="si-rarity" :class="it.rarity">{{ it.rarity }}</div>
            <div class="si-price">
              <span class="si-price-parts">
                <span v-if="it.price.taps" class="sip-val taps">{{ it.price.taps.toLocaleString() }} Taps</span>
                <span v-if="it.price.taps && (it.price.xp || it.price.eth)"> + </span>
                <span v-if="it.price.xp" class="sip-val xp">{{ it.price.xp }} XP</span>
                <span v-if="it.price.xp && it.price.eth"> + </span>
                <span v-if="it.price.eth" class="sip-val eth">{{ it.price.eth.toFixed(3) }}Ξ</span>
              </span>
              <span v-if="it.price.eth" class="si-onchain">On-Chain</span>
            </div>
          </div>
        </div>
      </div>

      <div class="shop-detail">
        <div v-if="!selected" class="sd-empty">Select an item<br>to see details</div>
        <template v-else>
          <div class="sd-big-preview" :style="bigPreviewStyle(selected)">
            {{ selected.ico }}
            <span class="sd-rarity-chip" :style="rarityChipStyle(selected.rarity)">{{ selected.rarity }}</span>
          </div>
          <div class="sd-kicker">
            {{ selected.cat }}<span v-if="selected.price.eth" class="si-onchain" style="margin-left:6px">On-Chain</span>
          </div>
          <div class="sd-name">{{ selected.name }}</div>
          <div class="sd-desc">{{ selected.desc }}</div>
          <div class="sd-effect">
            <div class="sd-effect-label">Effect</div>
            <div class="sd-effect-val">{{ selected.effect }}</div>
          </div>
          <div class="sd-price-row">
            <span class="sdpr-label">Price</span>
            <span class="sdpr-val">
              <span v-if="selected.price.taps" class="sip-val taps">{{ selected.price.taps.toLocaleString() }} Taps</span>
              <span v-if="selected.price.taps && (selected.price.xp || selected.price.eth)"> + </span>
              <span v-if="selected.price.xp" class="sip-val xp">{{ selected.price.xp }} XP</span>
              <span v-if="selected.price.xp && selected.price.eth"> + </span>
              <span v-if="selected.price.eth" class="sip-val eth">{{ selected.price.eth.toFixed(3) }}Ξ</span>
            </span>
          </div>
          <div v-if="ownedSet.has(selected.id)" class="sd-owned">Owned</div>
          <button
            v-else
            class="sd-purchase"
            :class="{ fail: failFlash }"
            :disabled="!canAfford(selected.price)"
            @click="purchase(selected)"
          >{{ canAfford(selected.price) ? 'Purchase' : 'Insufficient Funds' }}</button>
        </template>
      </div>
    </div>

    <div class="purchase-flash" :class="{ flash: flashOn }"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { SHOP_ITEMS, SHOP_OWNED_INIT, INITIAL_BALANCE } from '@/data/shopMock.js';

defineEmits(['back']);

const categories = [
  { id: 'all',    label: 'All' },
  { id: 'skin',   label: 'Skins' },
  { id: 'glove',  label: 'Gloves' },
  { id: 'boost',  label: 'Boosts' },
  { id: 'title',  label: 'Titles' },
  { id: 'banner', label: 'Banners' },
];

const activeCat = ref('all');
const selectedId = ref(null);
const balance = ref({ ...INITIAL_BALANCE });
const ownedSet = ref(new Set(SHOP_OWNED_INIT));
const flashOn = ref(false);
const failFlash = ref(false);
const mobileShowDetail = ref(false);

const filteredItems = computed(() =>
  activeCat.value === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((i) => i.cat === activeCat.value),
);

const selected = computed(() =>
  selectedId.value ? SHOP_ITEMS.find((i) => i.id === selectedId.value) : null,
);

function selectItem(it) {
  selectedId.value = it.id;
  mobileShowDetail.value = true;
}

function canAfford(price) {
  if (price.taps && balance.value.taps < price.taps) return false;
  if (price.xp   && balance.value.xp   < price.xp)   return false;
  if (price.eth  && balance.value.eth  < price.eth)  return false;
  return true;
}

function purchase(it) {
  if (!canAfford(it.price)) {
    failFlash.value = true;
    setTimeout(() => { failFlash.value = false; }, 350);
    return;
  }
  if (it.price.taps) balance.value.taps -= it.price.taps;
  if (it.price.xp)   balance.value.xp   -= it.price.xp;
  if (it.price.eth)  balance.value.eth  -= it.price.eth;
  // Vue 3 reactivity: Set.add NOT tracked through ref() — re-create the Set
  // so consumers (`ownedSet.has(...)` in template) re-evaluate.
  ownedSet.value = new Set([...ownedSet.value, it.id]);
  flashOn.value = false;
  // Force reflow before re-flash so the CSS animation restarts even when
  // user clicks Purchase twice in rapid succession.
  requestAnimationFrame(() => { flashOn.value = true; });
  setTimeout(() => { flashOn.value = false; }, 900);
}

function previewStyle(it) {
  return {
    background: `linear-gradient(135deg, ${it.colorHex}22, ${it.colorHex}08)`,
    color: it.colorHex,
    borderColor: `${it.colorHex}55`,
  };
}
function bigPreviewStyle(it) {
  return {
    background: `linear-gradient(135deg, ${it.colorHex}33, ${it.colorHex}0a)`,
    color: it.colorHex,
    borderColor: `${it.colorHex}55`,
  };
}
function rarityChipStyle(rarity) {
  const colors = { common: '#b0b0bc', rare: '#4dd9ff', epic: '#A855F7', legendary: '#FFD262' };
  return { color: colors[rarity], borderColor: `${colors[rarity]}88` };
}
</script>

<style scoped>
.shop-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.shop-hud > * {
  pointer-events: auto;
}
.shop-hud .purchase-flash {
  /* Explicit override — flash overlay must not catch clicks; would block all
     HUD interaction during the 900ms purchase animation. */
  pointer-events: none;
}
</style>
