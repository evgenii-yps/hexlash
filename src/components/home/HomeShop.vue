<!-- HomeShop — the SHOP view (/play/home → SHOP). Three tabs:
       • DECOR     — live visual buy FACADE. BUY → confirm → "unlocked" → done.
                     Nothing is really spent and nothing is saved to ownership
                     (except the hardcoded OWNED Supply Cache, for the demo).
       • CURRENCY  — Stage-2 stub. $HEX top-up packs; every price is SOON and opens
                     the wallet stub. ARSENAL is the one accent (BEST VALUE glow).
       • SPECIALS  — Stage-2 stub. Hot deal (live countdown) + free claim + bundle,
                     all SOON-gated → wallet / rewards stubs.

     One flag gates Stage 2: stageTwoLive=false hides nothing-real, shows SOON and
     routes to stubs. Discipline: one pink (#FF0069), one glow per tab (Currency =
     ARSENAL, Specials = HOT DEAL, Decor = matte BUY). Art = matte faceted low-poly
     in the arena grey family — never glows. Styles: src/styles/shop.css (own file,
     home.css untouched). Strings: i18n t.shop.*. -->
<template>
  <div class="shop-root" role="region" aria-label="Shop">
    <span class="shop-bracket tl" /><span class="shop-bracket tr" />
    <span class="shop-bracket bl" /><span class="shop-bracket br" />

    <!-- header -->
    <header class="shop-head">
      <div class="shop-topbar">
        <button type="button" class="shop-back" @click="$emit('back')">{{ t.shop.back }}</button>
        <div class="shop-topr">
          <span class="shop-brand">{{ t.shop.title }}</span>
          <div class="shop-bal"><span class="dia" /><b>{{ balanceDisplay }}</b>&nbsp;<i>{{ t.shop.unit }}</i></div>
        </div>
      </div>
      <h1 class="shop-h1">{{ activeTitle }}</h1>
      <nav class="shop-tabs">
        <button v-for="tb in TABS" :key="tb.id" type="button" class="shop-tab" :class="{ active: tab === tb.id }" @click="tab = tb.id">
          {{ t.shop[tb.label] }}
        </button>
      </nav>
      <p class="shop-lede">{{ lede }}</p>
    </header>

    <!-- body -->
    <div class="shop-body">
      <!-- ─────────── DECOR ─────────── -->
      <template v-if="tab === 'decor'">
        <div class="shop-subtabs">
          <span class="shop-subtab active">{{ t.shop.subDecor }}</span>
          <span class="shop-subtab">{{ t.shop.subSkins }}<i class="soon">{{ t.shop.soon }}</i></span>
          <span class="shop-subtab">{{ t.shop.subFx }}<i class="soon">{{ t.shop.soon }}</i></span>
          <span class="shop-subtab">{{ t.shop.subCores }}<i class="soon">{{ t.shop.soon }}</i></span>
        </div>
        <div class="shop-grid">
          <article v-for="it in DECOR" :key="it.id" class="shop-card" :class="{ feat: it.featured }">
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
      </template>

      <!-- ─────────── CURRENCY (Stage-2 stub) ─────────── -->
      <template v-else-if="tab === 'currency'">
        <div class="shop-whatis">
          <h3>{{ t.shop.whatIsTitle }}</h3>
          <p>{{ t.shop.whatIsBody }}</p>
        </div>
        <div class="shop-grid">
          <article v-for="p in CURRENCY" :key="p.id" class="shop-pack" :class="{ best: p.best }">
            <div class="shop-pack-art">
              <span v-if="p.best" class="shop-ribbon">{{ t.shop.bestValue }}</span>
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
      </template>

      <!-- ─────────── SPECIALS (Stage-2 stub) ─────────── -->
      <template v-else>
        <div class="shop-grid">
          <!-- HOT DEAL — the one accent here -->
          <article class="shop-special hot">
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
      </template>
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

const tab = ref('decor'); // 'decor' | 'currency' | 'specials'
const modal = ref(null); // null | 'buy' | 'wallet' | 'claim'
const buyStep = ref('confirm'); // 'confirm' | 'done'
const buyItem = ref(null);
const ownedItems = reactive(new Set(['crates'])); // hardcoded demo ownership (Supply Cache)

const TABS = [
  { id: 'decor', label: 'tabDecor' },
  { id: 'currency', label: 'tabCurrency' },
  { id: 'specials', label: 'tabSpecials' },
];

// catalogs — structural data; names/copy come from i18n (t.shop.*)
const DECOR = [
  { id: 'banner', price: 320, featured: true },
  { id: 'corePlinth', price: 540, tag: 'new' },
  { id: 'dais', price: 420 },
  { id: 'crates', price: 240 },
  { id: 'arch', price: 760 },
];
const CURRENCY = [
  { id: 'spark', amount: '600', bonus: '', price: '$0.99', pct: 100 },
  { id: 'fieldKit', amount: '1,300', bonus: '+100', price: '$1.99', pct: 108 },
  { id: 'cache', amount: '3,600', bonus: '+400', price: '$4.99', pct: 116 },
  { id: 'vault', amount: '8,200', bonus: '+1,200', price: '$9.99', pct: 123 },
  { id: 'arsenal', amount: '18,000', bonus: '+4,000', price: '$19.99', pct: 130, best: true },
];

// Matte faceted low-poly silhouettes (arena grey family, no glow). Static strings
// → v-html is safe (no user data). viewBox 0 0 88 96, baseline ~80.
const DECOR_ART = {
  banner: '<polygon points="36,72 48,72 48,18 36,18" fill="#3a4453"/><polygon points="48,18 48,72 52,68 52,22" fill="#252c37"/><polygon points="30,72 58,72 58,80 30,80" fill="#2b3446"/>',
  corePlinth: '<polygon points="30,76 58,76 54,58 34,58" fill="#3a4453"/><polygon points="58,76 54,58 56,56 60,74" fill="#252c37"/><polygon points="44,52 50,46 44,40 38,46" fill="#1b2233" stroke="#5a6b86" stroke-width="0.6"/>',
  dais: '<polygon points="24,74 64,74 78,64 38,64" fill="#3a4453"/><polygon points="64,74 78,64 78,69 64,79" fill="#252c37"/>',
  crates: '<polygon points="28,78 52,78 52,56 28,56" fill="#3a4453"/><polygon points="52,78 52,56 58,52 58,74" fill="#252c37"/><polygon points="34,56 54,56 54,42 34,42" fill="#46516a"/>',
  arch: '<polygon points="26,78 34,78 34,40 26,40" fill="#3a4453"/><polygon points="58,78 66,78 66,40 58,40" fill="#3a4453"/><polygon points="26,40 66,40 66,32 26,32" fill="#46516a"/>',
};
// $HEX pile — matte faceted heap (NOT a glowing crystal).
const HEX_PILE = '<polygon points="20,80 44,80 38,66 26,66" fill="#3a4453"/><polygon points="44,80 68,80 62,66 50,66" fill="#2b3446"/><polygon points="32,66 56,66 50,52 38,52" fill="#46516a"/><polygon points="38,52 50,52 44,44 44,44" fill="#3a4453"/><polygon points="28,68 36,68 32,60 28,62" fill="#252c37"/><polygon points="52,68 60,68 58,60 52,62" fill="#252c37"/>';

const balanceDisplay = computed(() => BALANCE.toLocaleString());
const activeTitle = computed(() =>
  ({ decor: t.value.shop.tabDecor, currency: t.value.shop.tabCurrency, specials: t.value.shop.tabSpecials }[tab.value]));
const lede = computed(() =>
  ({ decor: t.value.shop.ledeDecor, currency: t.value.shop.ledeCurrency, specials: t.value.shop.ledeSpecials }[tab.value]));
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
