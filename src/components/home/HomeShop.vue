<!-- HomeShop — the SHOP view (/play/home → SHOP). ONE scroll page, three stacked
     zones (no tabs); the persistent strip (HomeView) owns the nav:
       • DECOR     — live visual buy FACADE. BUY → confirm → "unlocked" → done.
                     Nothing is really spent and nothing is saved to ownership
                     (except the hardcoded OWNED Supply Cache, for the demo).
       • CURRENCY  — Stage-2 stub. $HEX top-up packs; every price is SOON and opens
                     the wallet stub.
       • SPECIALS  — Stage-2 stub. Hot deal (live countdown) + free claim + bundle,
                     all SOON-gated → wallet / rewards stubs.

     One flag gates Stage 2: stageTwoLive=false → Currency/Specials are honest SOON
     stubs with their pink accents (ARSENAL frame, HOT DEAL, BEST VALUE) switched
     OFF, so the whole page carries ONE live pink — the matte Decor BUY — and zero
     glow (per the shop's glow discipline). Stage 2 flips the accents back on. Art =
     matte faceted low-poly in the arena grey family — never glows. Cards are a fixed
     height per zone. Styles: src/styles/shop.css. Strings: i18n t.shop.*. -->
<template>
  <div class="shop-root" role="region" aria-label="Shop">
    <!-- One scroll page. The persistent strip (HomeView) sits above and owns the
         nav, so the shop carries no top bar of its own — the three zones simply
         stack. Padded to clear the strip. -->
    <div class="shop-scroll">
      <!-- intro: SHOP title + $HEX balance. Balance is allowed HERE in the shop —
           it is kept OUT of the persistent strip (which never shows $HEX). -->
      <header class="shop-intro">
        <h1 class="shop-h1">{{ t.shop.title }}</h1>
        <div class="shop-bal"><span class="dia" /><b>{{ balanceDisplay }}</b>&nbsp;<i>{{ t.shop.unit }}</i></div>
      </header>

      <!-- ═════════ ZONE · DECOR (the live buy — matte BUY is the shop's one pink) ═════════ -->
      <section class="shop-zone">
        <div class="shop-zone-h">
          <h2 class="shop-zone-t">{{ t.shop.tabDecor }}</h2>
          <p class="shop-zone-l">{{ t.shop.ledeDecor }}</p>
        </div>
        <div class="shop-subtabs">
          <span class="shop-subtab active">{{ t.shop.subDecor }}</span>
          <span class="shop-subtab">{{ t.shop.subSkins }}<i class="soon">{{ t.shop.soon }}</i></span>
          <span class="shop-subtab">{{ t.shop.subFx }}<i class="soon">{{ t.shop.soon }}</i></span>
          <span class="shop-subtab">{{ t.shop.subCores }}<i class="soon">{{ t.shop.soon }}</i></span>
        </div>
        <div class="shop-grid">
          <article v-for="it in DECOR" :key="it.id" class="shop-card" :class="{ featured: it.featured }"
                   :style="{ '--c1': CORE[it.core][0], '--c2': CORE[it.core][1] }">
            <div class="shop-frame">
              <span class="shop-tag" :class="{ new: it.tag === 'new' }">{{ it.tag === 'new' ? t.shop.tagNew : t.shop.subDecor }}</span>
              <svg class="shop-art" viewBox="0 0 88 96" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                <ellipse cx="44" cy="82" rx="30" ry="6" fill="#000" opacity="0.4" />
                <g v-html="DECOR_ART[it.id]" />
              </svg>
            </div>
            <div class="shop-meta">
              <div class="shop-name">{{ t.shop.decor[it.id].name }}</div>
              <div class="shop-sub">{{ t.shop.decor[it.id].sub }}</div>
              <div class="shop-buy">
                <div class="shop-price"><span class="dia" /><b>{{ it.price.toLocaleString() }}</b><i>{{ t.shop.unit }}</i></div>
                <div v-if="ownedItems.has(it.id)" class="shop-chip-owned">{{ t.shop.owned }}</div>
                <button v-else type="button" class="shop-btn buy" @click="openBuy(it)">{{ t.shop.buy }}<span class="ar">→</span></button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- ═════════ ZONE · CURRENCY (Stage-2 — honest SOON; accents gated off) ═════════ -->
      <section class="shop-zone">
        <div class="shop-zone-h">
          <h2 class="shop-zone-t">{{ t.shop.tabCurrency }}</h2>
          <p class="shop-zone-l">{{ t.shop.ledeCurrency }}</p>
        </div>
        <div class="shop-whatis">
          <h3>{{ t.shop.whatIsTitle }}</h3>
          <p>{{ t.shop.whatIsBody }}</p>
        </div>
        <div class="shop-grid">
          <article v-for="p in CURRENCY" :key="p.id" class="shop-pack" :class="{ best: p.best && stageTwoLive }">
            <div class="shop-pack-art">
              <span v-if="p.best && stageTwoLive" class="shop-ribbon">{{ t.shop.bestValue }}</span>
              <span class="shop-value">{{ p.pct }}% {{ t.shop.valueSuffix }}</span>
              <svg class="shop-art" viewBox="0 0 88 96" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                <ellipse cx="44" cy="82" rx="28" ry="6" fill="#000" opacity="0.4" />
                <g v-html="HEX_PILE" />
              </svg>
            </div>
            <div class="shop-pack-meta">
              <div class="shop-pack-name">{{ t.shop.currency[p.id].name }}</div>
              <div class="shop-amount"><span class="dia" /><b>{{ p.amount }}</b><em v-if="p.bonus">{{ p.bonus }}</em></div>
              <button type="button" class="shop-soonbtn" @click="onStageTwo('wallet')">
                {{ p.price }}<span v-if="!stageTwoLive" class="soon">{{ t.shop.soon }}</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- ═════════ ZONE · SPECIALS (Stage-2 — honest SOON; accents gated off) ═════════ -->
      <section class="shop-zone">
        <div class="shop-zone-h">
          <h2 class="shop-zone-t">{{ t.shop.tabSpecials }}</h2>
          <p class="shop-zone-l">{{ t.shop.ledeSpecials }}</p>
        </div>
        <div class="shop-grid">
          <!-- HOT DEAL — accent only when Stage 2 is live (else a neutral SOON stub) -->
          <article class="shop-special" :class="{ hot: stageTwoLive }">
            <div class="shop-special-h"><span class="shop-kicker">{{ t.shop.hotDeal }}</span></div>
            <div class="shop-special-name">{{ t.shop.specials.arenaCache.name }}</div>
            <div class="shop-timer">{{ timerDisplay }}</div>
            <div class="shop-contains">{{ t.shop.specials.arenaCache.contains }}</div>
            <div class="shop-pricerow"><span class="shop-was">$6.99</span><span class="shop-now">$3.99</span></div>
            <button type="button" class="shop-soonbtn" @click="onStageTwo('wallet')">
              $3.99<span v-if="!stageTwoLive" class="soon">{{ t.shop.soon }}</span>
            </button>
          </article>
          <!-- FREE CLAIM -->
          <article class="shop-special">
            <div class="shop-special-h"><span class="shop-kicker">{{ t.shop.freeClaim }}</span></div>
            <div class="shop-special-name">{{ t.shop.specials.dailyDrop.name }}</div>
            <div class="shop-contains">{{ t.shop.specials.dailyDrop.contains }}</div>
            <button type="button" class="shop-soonbtn" @click="onStageTwo('claim')">
              {{ t.shop.claim }}<span v-if="!stageTwoLive" class="soon">{{ t.shop.soon }}</span>
            </button>
          </article>
          <!-- BUNDLE -->
          <article class="shop-special">
            <div class="shop-special-h"><span class="shop-kicker">{{ t.shop.bundleLabel }}</span></div>
            <div class="shop-special-name">{{ t.shop.specials.firstBlood.name }}</div>
            <div class="shop-contains">{{ t.shop.specials.firstBlood.contains }}</div>
            <div class="shop-pricerow"><span class="shop-flat">$2.99</span></div>
            <button type="button" class="shop-soonbtn" @click="onStageTwo('wallet')">
              $2.99<span v-if="!stageTwoLive" class="soon">{{ t.shop.soon }}</span>
            </button>
          </article>
        </div>
      </section>
    </div>

    <!-- ─────────── modals (bottom-sheet mobile / centered desktop) ─────────── -->
    <div v-if="modal" class="shop-overlay" @click.self="closeModal">
      <!-- BUY — confirm → unlocked -->
      <div v-if="modal === 'buy'" class="shop-sheet" role="dialog" aria-modal="true">
        <template v-if="buyStep === 'confirm'">
          <div class="shop-sheet-h">
            <span class="shop-sheet-title">{{ t.shop.confirmTitle }}</span>
            <button type="button" class="shop-x" :aria-label="t.close" @click="closeModal">✕</button>
          </div>
          <div class="shop-name">{{ buyName }}</div>
          <div>
            <div class="shop-row"><span class="k">{{ t.shop.lblPrice }}</span><span class="v">◆ {{ buyItem.price.toLocaleString() }} {{ t.shop.unit }}</span></div>
            <div class="shop-row"><span class="k">{{ t.shop.lblBalance }}</span><span class="v">{{ balanceDisplay }} {{ t.shop.unit }}</span></div>
            <div class="shop-row"><span class="k">{{ t.shop.lblBalanceAfter }}</span><span class="v acc">{{ balanceAfter }} {{ t.shop.unit }}</span></div>
          </div>
          <button type="button" class="shop-sheet-cta" @click="buyStep = 'done'">{{ t.shop.confirm }}</button>
        </template>
        <template v-else>
          <div class="shop-success-ic">✓</div>
          <span class="shop-sheet-title" style="text-align: center">{{ t.shop.unlockedTitle }}</span>
          <div class="shop-sheet-body" style="text-align: center">{{ t.shop.unlockedBody }}</div>
          <button type="button" class="shop-sheet-cta" @click="closeModal">{{ t.shop.done }}</button>
        </template>
      </div>

      <!-- WALLET stub -->
      <div v-else-if="modal === 'wallet'" class="shop-sheet" role="dialog" aria-modal="true">
        <div class="shop-sheet-h">
          <span class="shop-sheet-title">{{ t.shop.walletTitle }}</span>
          <button type="button" class="shop-x" :aria-label="t.close" @click="closeModal">✕</button>
        </div>
        <div class="shop-sheet-body">{{ t.shop.walletHead }}</div>
        <div class="shop-providers">
          <div class="shop-provider">Wallet</div>
          <div class="shop-provider">Card</div>
          <div class="shop-provider">Apple Pay</div>
        </div>
        <div class="shop-sheet-body">{{ t.shop.walletBody }}</div>
        <button type="button" class="shop-sheet-cta ghost" disabled>{{ t.shop.connect }} · {{ t.shop.soon }}</button>
        <div class="shop-stamp">{{ t.shop.walletStamp }}</div>
      </div>

      <!-- CLAIM stub -->
      <div v-else class="shop-sheet" role="dialog" aria-modal="true">
        <div class="shop-sheet-h">
          <span class="shop-sheet-title">{{ t.shop.claimTitle }}</span>
          <button type="button" class="shop-x" :aria-label="t.close" @click="closeModal">✕</button>
        </div>
        <div class="shop-sheet-body">{{ t.shop.claimBody }}</div>
        <div class="shop-stamp">{{ t.shop.claimStamp }}</div>
        <button type="button" class="shop-sheet-cta ghost" @click="closeModal">{{ t.shop.done }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { t } from '@/locales/index.js';
import '@/styles/shop.css';

// HomeView passes :balance (hardcoded "2,480"); absorb it but keep the numeric
// source of truth local — nothing here is a live store (Stage-1 facade).
defineProps({ balance: { type: String, default: '2,480' } });
defineEmits(['back']);

const BALANCE = 2480; // hardcoded $HEX — never actually debited on Stage 1
const stageTwoLive = false; // master flag: false ⇒ Currency/Specials/claim are SOON stubs

const modal = ref(null); // null | 'buy' | 'wallet' | 'claim'
const buyStep = ref('confirm'); // 'confirm' | 'done'
const buyItem = ref(null);
const ownedItems = reactive(new Set(['crates'])); // hardcoded demo ownership (Supply Cache)

// Bright-direction canon cores (brandbook two-tone). "Colour = core": every decor
// item is bound to ONE core, whose colour owns its frame / glyph / glow (the
// product layer). Pink stays the economy layer (price, BUY, balance). Set per-card
// as --c1/--c2 inline. NO colour outside this set.
const CORE = {
  onslaught: ['#FF3344', '#FF7A30'],
  raider:    ['#FFA526', '#FFD930'],
  bulwark:   ['#2ED6B0', '#5DD6E6'],
  ambush:    ['#9461FF', '#D461FF'],
};

// catalogs — structural data; names/copy come from i18n (t.shop.*). `featured` is
// the ONE hero card (the screen's single bloom); `core` paints the product accent.
const DECOR = [
  { id: 'banner', price: 320, core: 'onslaught', featured: true },
  { id: 'corePlinth', price: 540, core: 'ambush', tag: 'new' },
  { id: 'dais', price: 420, core: 'bulwark' },
  { id: 'crates', price: 240, core: 'raider' },
  { id: 'arch', price: 760, core: 'onslaught' },
];
const CURRENCY = [
  { id: 'spark', amount: '600', bonus: '', price: '$0.99', pct: 100 },
  { id: 'fieldKit', amount: '1,300', bonus: '+100', price: '$1.99', pct: 108 },
  { id: 'cache', amount: '3,600', bonus: '+400', price: '$4.99', pct: 116 },
  { id: 'vault', amount: '8,200', bonus: '+1,200', price: '$9.99', pct: 123 },
  { id: 'arsenal', amount: '18,000', bonus: '+4,000', price: '$19.99', pct: 130, best: true },
];

// Matte faceted low-poly silhouettes built from the CANON MATERIALS only (SAND
// #C9B8A0 · RUST #E86134 · TEAL #2F86A8 · CHROME #C8D1D8→#585F68 · AMBER #FFB21D) —
// matte, no glow, never the core neon (the core colour lives on the frame, not the
// object). Static strings → v-html is safe (no user data). viewBox 0 0 88 96.
const DECOR_ART = {
  // Sentry Banner — chrome pole, RUST cloth
  banner: '<polygon points="33,72 35,72 35,16 33,16" fill="#C8D1D8"/><polygon points="35,70 50,70 50,18 35,18" fill="#E86134"/><polygon points="50,18 50,70 53,66 53,22" fill="#a8431f"/><polygon points="29,72 57,72 57,80 29,80" fill="#585F68"/>',
  // Core Plinth — chrome plinth, AMBER dormant gem
  corePlinth: '<polygon points="30,76 58,76 54,58 34,58" fill="#C8D1D8"/><polygon points="58,76 54,58 56,56 60,74" fill="#585F68"/><polygon points="44,52 50,46 44,40 38,46" fill="#FFB21D"/><polygon points="44,52 50,46 44,46" fill="#c98a14"/>',
  // Hex Dais — SAND top, chrome riser
  dais: '<polygon points="24,74 64,74 78,64 38,64" fill="#C9B8A0"/><polygon points="64,74 78,64 78,69 64,79" fill="#585F68"/><polygon points="24,74 64,74 64,78 24,78" fill="#9a8a72"/>',
  // Supply Cache — chrome crates, AMBER top crate
  crates: '<polygon points="28,78 52,78 52,56 28,56" fill="#C8D1D8"/><polygon points="52,78 52,56 58,52 58,74" fill="#585F68"/><polygon points="34,56 54,56 54,42 34,42" fill="#FFB21D"/><polygon points="54,56 54,42 58,38 58,52" fill="#c98a14"/>',
  // Ward Arch — chrome pillars, TEAL lintel
  arch: '<polygon points="26,78 34,78 34,40 26,40" fill="#C8D1D8"/><polygon points="58,78 66,78 66,40 58,40" fill="#C8D1D8"/><polygon points="34,78 34,40 30,40 30,78" fill="#585F68"/><polygon points="26,40 66,40 66,32 26,32" fill="#2F86A8"/>',
};
// $HEX pile — matte faceted CHROME heap (the pink lives on the BEST VALUE ring /
// $HEX glyph, never the object).
const HEX_PILE = '<polygon points="20,80 44,80 38,66 26,66" fill="#C8D1D8"/><polygon points="44,80 68,80 62,66 50,66" fill="#9aa3ad"/><polygon points="32,66 56,66 50,52 38,52" fill="#aeb7c0"/><polygon points="38,52 50,52 44,44 44,44" fill="#C8D1D8"/><polygon points="28,68 36,68 32,60 28,62" fill="#585F68"/><polygon points="52,68 60,68 58,60 52,62" fill="#585F68"/>';

const balanceDisplay = computed(() => BALANCE.toLocaleString());
const buyName = computed(() => (buyItem.value ? t.value.shop.decor[buyItem.value.id].name : ''));
const balanceAfter = computed(() => (buyItem.value ? (BALANCE - buyItem.value.price).toLocaleString() : ''));

function openBuy(it) { buyItem.value = it; buyStep.value = 'confirm'; modal.value = 'buy'; }
function onStageTwo(which) { modal.value = which; } // 'wallet' | 'claim' — Stage-2 stubs
function closeModal() { modal.value = null; }

// Hot-deal countdown — ticks once a second, loops back to 24:00:00 at zero.
// Respects prefers-reduced-motion (static, no ticking).
const LOOP = 24 * 3600;
const remaining = ref(11 * 3600 + 23 * 60 + 45);
const timerDisplay = computed(() => {
  const s = remaining.value;
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
});
let timerId = null;
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // static
  timerId = setInterval(() => { remaining.value = remaining.value <= 0 ? LOOP : remaining.value - 1; }, 1000);
});
onBeforeUnmount(() => { if (timerId) clearInterval(timerId); });
</script>
