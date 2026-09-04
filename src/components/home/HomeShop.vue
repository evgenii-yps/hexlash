<!-- HomeShop — the SHOP view (/play/home → SHOP), BRIGHT direction. Ported 1:1
     from the design handoff (docs/design-handoff/_archive/shop_bright/): three tabs DECOR ·
     CURRENCY · SPECIALS, presence cards, a hero card carrying the screen's one
     bloom, core-glyph eyebrows, glowing props, entrance motion, modals.

     "Colour = core": every decor piece is tuned to ONE of the four cores; its
     colour is the LIGHT the matte prop stands in (bloom + ring + glyph + mote) —
     the prop itself stays arena-matte. Brand pink owns the economy (balance, BUY,
     BEST VALUE / HOT). The persistent home strip (HomeView/home.css) is the app
     chrome and is NOT duplicated here — this body sits under it.

     Scroll: the shop is ONE natural-height document — no inner scroller, nothing
     pinned. On mount it adds `home-shop-open` to <body> so shop.css makes the
     shared home strip part of the page flow (it scrolls with everything); the home
     itself is never marked, so its fixed-strip-over-3D behaviour is untouched.

     Stage-2 (Currency/Specials live wallet/real money/rewards) is gated by one
     flag: stageTwoLive=false ⇒ honest SOON (no glow/rings); ON ⇒ fully bright.
     BUY is a Stage-1 facade: confirm → unlocked, nothing is spent or saved (except
     the hardcoded OWNED Supply Cache demo). Styles: src/styles/shop.css. Strings:
     i18n t.shop.*. Art ported from home_stage/shop_art/shop_bright_art. -->
<template>
  <div class="shopb" role="region" aria-label="Shop">
    <div class="sb-bg" aria-hidden="true"></div>

    <!-- head — the first blocks of the single page flow (NOT pinned): balance
         ($HEX allowed in the shop body, never the strip) + SHOP title + tabs.
         Brand / cabinet / back live in the strip (which scrolls with the page). -->
    <div class="sb-head">
      <div v-if="tab !== 'dev'" class="sb-top">
        <div class="sb-bal"><span class="hx-dia"></span><b>{{ balanceDisplay }}</b>&nbsp;<i>{{ t.shop.unit }}</i></div>
      </div>
      <h1 class="sb-h1">{{ t.shop.title }}</h1>
      <div class="sb-tabs">
        <button v-for="tb in TABS" :key="tb" type="button" class="sb-tab" :class="{ on: tab === tb, dev: tb === 'dev' }" @click="tab = tb">{{ t.shop['tab' + cap(tb)] }}</button>
      </div>
    </div>

    <!-- body — part of the single page flow (no inner scroller) -->
    <div class="sb-body">
      <span v-if="tab !== 'dev'" class="sb-creed"><span class="dot"></span>{{ t.shop.creed }}</span>
      <div class="sb-lede">{{ t.shop['lede' + cap(tab)] }}</div>

      <!-- ═════════ DECOR ═════════ -->
      <template v-if="tab === 'decor'">
        <div class="sub-tabs">
          <span class="sub-tab on">{{ t.shop.subDecor }}</span>
          <span class="sub-tab">{{ t.shop.subSkins }}<i>{{ t.shop.soon }}</i></span>
          <span class="sub-tab">{{ t.shop.subFx }}<i>{{ t.shop.soon }}</i></span>
          <span class="sub-tab">{{ t.shop.subCores }}<i>{{ t.shop.soon }}</i></span>
        </div>
        <div class="grid decor">
          <div v-for="(it, i) in DECOR" :key="it.kind" class="dcard sb-anim" :class="{ hero: it.hero, neutral: !it.core }"
               :style="{ ...coreVars(it.core), animationDelay: (0.05 + i * 0.06) + 's' }">
            <div class="dframe">
              <span class="dcore" :class="{ neutral: !it.core }">
                <template v-if="it.core"><svg class="cglyph" :width="it.hero ? 15 : 13" :height="it.hero ? 15 : 13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="coreGlyphInner(it.core)"></svg>{{ CORES[it.core].name }}</template>
                <template v-else>{{ t.shop.neutral.toUpperCase() }}</template>
              </span>
              <span v-if="it.hero" class="dtag feat">{{ t.shop.tagFeatured.toUpperCase() }}</span>
              <span v-else-if="it.isNew" class="dtag new">{{ t.shop.tagNew.toUpperCase() }}</span>
              <span v-else-if="ownedItems.has(it.kind)" class="dtag">{{ t.shop.tagOwned.toUpperCase() }}</span>
              <div class="gp-host" v-html="glowPropSVG(it.kind, it.core, it.hero ? 'hero' : 'rest', it.hero ? 1.18 : 1.02)"></div>
            </div>
            <div class="dmeta">
              <div v-if="it.hero" class="hero-eye">{{ t.shop.featuredTuning.toUpperCase() }} · {{ CORES[it.core].name }}</div>
              <div class="dname">{{ t.shop.decor[it.kind].name }}</div>
              <div class="dsub">{{ t.shop.decor[it.kind].sub }}</div>
              <div class="buy-row">
                <div class="price"><span class="hx-dia"></span><b>{{ it.price.toLocaleString() }}</b><i>{{ t.shop.unit }}</i></div>
                <div v-if="ownedItems.has(it.kind)" class="btn owned">{{ t.shop.owned.toUpperCase() }}</div>
                <button v-else type="button" class="btn buy" @click="openBuy(it)">{{ t.shop.buy.toUpperCase() }}<span aria-hidden="true">→</span></button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═════════ CURRENCY ═════════ -->
      <template v-else-if="tab === 'currency'">
        <div class="grid currency">
          <div class="cur-info sb-anim">
            <div class="ci-l">
              <div class="ci-h"><span class="hx-dia"></span>{{ t.shop.curWhatIs.toUpperCase() }}</div>
              <p>{{ t.shop.curWhatIsBody }}</p>
            </div>
            <div class="ci-rule"><b>{{ t.shop.curRule }}</b> {{ t.shop.curRuleBody }}</div>
          </div>
          <div v-for="(p, i) in CURRENCY" :key="p.id" class="ccard sb-anim" :class="{ best: p.best, soon: p.best && !stageTwoLive }"
               :style="{ animationDelay: (0.05 + i * 0.05) + 's' }">
            <span v-if="p.best" class="cc-ribbon">{{ t.shop.bestValue.toUpperCase() }}</span>
            <div class="cc-top">
              <div class="cc-frame"><div class="bhp" :class="{ best: p.best }" v-html="hexPileSVG(p.tier)"></div></div>
              <div class="cc-body">
                <div class="cc-amt"><b>{{ p.amount.toLocaleString() }}</b><i>{{ t.shop.unit }}</i></div>
                <div v-if="p.bonus > 0" class="cc-bonus"><em>+{{ p.bonus.toLocaleString() }} {{ t.shop.bonusFree }}</em> {{ t.shop.bonusIncluded }}</div>
                <div v-else class="cc-bonus">{{ t.shop.baseRate }}</div>
                <span class="cval">{{ t.shop.valueWord.toUpperCase() }} <b>{{ p.value }}</b></span>
              </div>
            </div>
            <div class="buy-row">
              <button type="button" class="btn soon" @click="onStageTwo('wallet')">{{ p.price }}<span v-if="!stageTwoLive" class="sbadge">{{ t.shop.soon.toUpperCase() }}</span></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ═════════ SPECIALS ═════════ -->
      <template v-else-if="tab === 'specials'">
        <div class="grid specials">
          <div v-for="(sp, i) in SPECIALS" :key="sp.id" class="scard sb-anim" :class="[sp.kind, { live: stageTwoLive }]"
               :style="{ ...coreVars(sp.core), animationDelay: (0.05 + i * 0.06) + 's' }">
            <div class="sc-head">
              <span class="sc-kind" :class="sp.kind">
                <span v-if="sp.kind === 'hot' || sp.kind === 'bundle'" class="dot"></span>
                {{ sp.kind === 'hot' ? t.shop.hotDeal.toUpperCase() : sp.kind === 'free' ? t.shop.freeClaim.toUpperCase() : t.shop.bundle.toUpperCase() }}
              </span>
              <span v-if="sp.kind === 'hot'" class="timer">{{ timerDisplay }}</span>
            </div>
            <div class="sc-body">
              <div class="sc-name">{{ t.shop.specials[sp.id].name }}</div>
              <!-- free claim -->
              <div v-if="sp.kind === 'free'" class="sc-set" style="flex-direction: row; align-items: center; gap: var(--sp-4)">
                <div class="sc-free-art"><svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="13" width="22" height="14" /><path d="M3 13h26v4H3z" fill="rgba(255,255,255,0.04)" /><path d="M16 9v18M16 9c-3-4-7-1-4 2 M16 9c3-4 7-1 4 2" /></svg></div>
                <div style="display: flex; flex-direction: column; gap: 5px">
                  <div class="sc-line" style="color: var(--ink); font-weight: 700">{{ t.shop.specials[sp.id].reward }}</div>
                  <div class="sc-note">{{ t.shop.specials[sp.id].note }}</div>
                </div>
              </div>
              <!-- hot / bundle: a contains set -->
              <div v-else class="sc-set">
                <div class="sc-line"><span class="pl">┌</span><span class="hx-dia"></span><span>{{ t.shop.specials[sp.id].l1 }}</span></div>
                <div class="sc-line"><span class="pl">└</span><span v-if="sp.core" class="cdia"></span><span class="hx-dia" v-else></span><span>{{ t.shop.specials[sp.id].l2 }}</span></div>
                <div class="sc-note">{{ t.shop.specials[sp.id].sub }}</div>
              </div>
              <div class="buy-row">
                <div v-if="sp.was" class="price"><span class="was">{{ sp.was }}</span><b>{{ sp.price }}</b></div>
                <button v-if="sp.kind === 'free'" type="button" class="btn claim" :class="{ live: stageTwoLive }" @click="onStageTwo('claim')">{{ t.shop.claim.toUpperCase() }}<span v-if="!stageTwoLive" class="sbadge">{{ t.shop.soon.toUpperCase() }}</span></button>
                <button v-else type="button" class="btn soon" @click="onStageTwo('wallet')">{{ sp.price }}<span v-if="!stageTwoLive" class="sbadge">{{ t.shop.soon.toUpperCase() }}</span></button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═════════ DEV (owner console, temporary) ═════════
           Deliberately unlike the rest of the shop: flat, grey, mono, no cards,
           no glow, no motion, no pink. It must never read as a game feature, and
           it must be obvious that it is meant to be torn out. Removing it is
           devTabLive = false plus one entry in TABS. -->
      <template v-else-if="tab === 'dev'">
        <div class="dv">
          <p class="dv-warn">{{ t.shop.dev.warn }}</p>

          <div class="dv-bar">
            <span class="dv-count">{{ t.shop.dev.rosterLabel }} <b>{{ rosterCount }}</b> / {{ rosterMax }}</span>
          </div>

          <div class="dv-give">
            <span class="dv-lbl">{{ t.shop.dev.coreLabel }}</span>
            <div class="dv-cores">
              <button
                type="button" class="dv-core" :class="{ on: giveCore === 'random' }"
                @click="giveCore = 'random'"
              >{{ t.shop.dev.random }}</button>
              <button
                v-for="c in ROSTER_CORES" :key="c.id"
                type="button" class="dv-core" :class="{ on: giveCore === c.id }"
                :style="{ '--dvc': c.hue }"
                @click="giveCore = c.id"
              ><span class="dv-swatch" aria-hidden="true"></span>{{ c.name }}</button>
            </div>
            <button
              type="button" class="dv-btn" :disabled="rosterFull"
              @click="onRecruit"
            >{{ t.shop.dev.recruit }}</button>
            <p v-if="rosterFull" class="dv-reason">{{ t.shop.dev.full }}</p>
          </div>

          <ul v-if="roster.length" class="dv-list">
            <li v-for="f in roster" :key="f.id" class="dv-row">
              <span class="dv-sign">{{ f.callsign }}</span>
              <span class="dv-core-tag" :style="{ '--dvc': coreHue(f.core) }">{{ coreName(f.core) }}</span>
              <button type="button" class="dv-del" @click="onDismiss(f.id)">{{ t.shop.dev.remove }}</button>
            </li>
          </ul>
          <p v-else class="dv-empty">{{ t.shop.dev.empty }}</p>
        </div>
      </template>
    </div>

    <!-- ─────────── modals ─────────── -->
    <div v-if="modal" class="sb-scrim" @click.self="closeModal">
      <!-- BUY — confirm → unlocked -->
      <div v-if="modal === 'buy'" class="sheet" role="dialog" aria-modal="true">
        <span class="sh-bk tl"></span><span class="sh-bk tr"></span>
        <template v-if="buyStep === 'done'">
          <div class="sh-ok"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6" /></svg></div>
          <div class="sh-title">{{ t.shop.unlockedTitle.toUpperCase() }}</div>
          <div class="sh-sub">{{ buyName }} {{ t.shop.unlockedYours }} <b>{{ t.shop.arrangeMode.toUpperCase() }}</b> {{ t.shop.unlockedTail }}</div>
          <div class="sh-rows"><div class="sh-r"><span>{{ t.shop.newBalance }}</span><b><span class="hx-dia"></span>{{ balanceAfter }} {{ t.shop.unit }}</b></div></div>
          <div class="sh-actions"><button type="button" class="btn buy" @click="closeModal">{{ t.shop.done.toUpperCase() }}</button></div>
        </template>
        <template v-else>
          <div class="sh-eye">{{ t.shop.confirmEye.toUpperCase() }}</div>
          <div class="sh-title">{{ buyName }}</div>
          <div class="sh-sub">{{ buyTuning }}. {{ t.shop.cosmeticLine }}</div>
          <div class="sh-rows">
            <div class="sh-r"><span>{{ t.shop.lblPrice }}</span><b><span class="hx-dia"></span>{{ buyItem.price.toLocaleString() }} {{ t.shop.unit }}</b></div>
            <div class="sh-r"><span>{{ t.shop.lblBalance }}</span><b><span class="hx-dia"></span>{{ balanceDisplay }} {{ t.shop.unit }}</b></div>
            <div class="sh-r neg"><span>{{ t.shop.lblBalanceAfter }}</span><b><span class="hx-dia"></span>{{ balanceAfter }} {{ t.shop.unit }}</b></div>
          </div>
          <div class="sh-actions">
            <button type="button" class="btn ghost" @click="closeModal">{{ t.shop.cancel.toUpperCase() }}</button>
            <button type="button" class="btn buy" @click="buyStep = 'done'">{{ t.shop.confirm.toUpperCase() }}<span aria-hidden="true">→</span></button>
          </div>
        </template>
      </div>

      <!-- WALLET stub -->
      <div v-else-if="modal === 'wallet'" class="sheet" role="dialog" aria-modal="true">
        <span class="sh-bk tl"></span><span class="sh-bk tr"></span>
        <div class="sh-eye">{{ t.shop.walletEye.toUpperCase() }}</div>
        <div class="sh-title">{{ t.shop.walletTitle.toUpperCase() }}</div>
        <div class="sh-sub">{{ t.shop.walletBody }}</div>
        <div class="wprov">
          <div class="wrow"><span class="wic">◇</span>{{ t.shop.provBase }}</div>
          <div class="wrow"><span class="wic">▣</span>{{ t.shop.provMeta }}</div>
          <div class="wrow"><span class="wic">○</span>{{ t.shop.provOther }}</div>
        </div>
        <div class="sh-actions">
          <button type="button" class="btn ghost" @click="closeModal">{{ t.shop.close.toUpperCase() }}</button>
          <button type="button" class="btn soon" style="flex: 1" disabled>{{ t.shop.connect.toUpperCase() }}<span class="sbadge">{{ t.shop.soon.toUpperCase() }}</span></button>
        </div>
        <div class="sh-stage"><span class="hx-dia"></span>{{ t.shop.walletStamp }}</div>
      </div>

      <!-- CLAIM stub -->
      <div v-else class="sheet" role="dialog" aria-modal="true">
        <span class="sh-bk tl"></span><span class="sh-bk tr"></span>
        <div class="sh-eye">{{ t.shop.claimEye.toUpperCase() }}</div>
        <div class="sh-title">{{ t.shop.claimTitle.toUpperCase() }}</div>
        <div class="sh-sub">{{ t.shop.claimBody }}</div>
        <div class="sh-actions"><button type="button" class="btn ghost" style="flex: 1" @click="closeModal">{{ t.shop.gotIt.toUpperCase() }}</button></div>
        <div class="sh-stage"><span class="hx-dia"></span>{{ t.shop.claimStamp }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';
import { CORES as ROSTER_CORES } from '@/data/upgradeData.js';
import '@/styles/shop.css';
import { CORE_HUE, coreSup, coreRgb } from '@/data/sceneTokens.js';

defineProps({ balance: { type: String, default: '2,480' } });
defineEmits(['back']);

const BALANCE = 2480;           // hardcoded $HEX — never actually debited on Stage 1
const stageTwoLive = false;     // master flag: false ⇒ Currency/Specials/claim are SOON stubs

// DEV console — owner tool, temporary. One flag + one TABS entry to remove it.
const devTabLive = true;
const TABS = devTabLive ? ['decor', 'currency', 'specials', 'dev'] : ['decor', 'currency', 'specials'];
const tab = ref('decor');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const modal = ref(null);        // null | 'buy' | 'wallet' | 'claim'
const buyStep = ref('confirm'); // 'confirm' | 'done'
const buyItem = ref(null);
const ownedItems = reactive(new Set(['crates'])); // hardcoded demo ownership (Supply Cache)

// ── четыре ядра: цвет = к какому ядру подогнан предмет ──────────────────────
// У каждого ядра РОВНО ОДИН цвет (Документ А 2.3). Вторые тона здесь были
// объявлены отдельными значениями и расходились с деревом прокачки во всех
// четырёх случаях — они удалены, второй тон выводится осветлением по общему
// правилу (coreSup из src/data/sceneTokens.js).
const CORES = {
  // rgb-копии цвета убраны: это было пятое объявление тех же четырёх цветов,
  // просто в другой записи. Выводится из основного (Правка 1.3 §1).
  onslaught: { name: 'ONSLAUGHT', get main() { return CORE_HUE.natisk; }, glyph: 'onslaught' },
  raider:    { name: 'RAIDER',    get main() { return CORE_HUE.nalet;  }, glyph: 'raider' },
  bulwark:   { name: 'BULWARK',   get main() { return CORE_HUE.skala;  }, glyph: 'bulwark' },
  ambush:    { name: 'AMBUSH',    get main() { return CORE_HUE.zasada; }, glyph: 'ambush' },
};
function coreVars(core) {
  const c = CORES[core];
  return c ? { '--c': c.main, '--c-sup': coreSup(c.main), '--c-rgb': coreRgb(c.main) } : {};
}
function coreGlyphInner(core) {
  switch (CORES[core] && CORES[core].glyph) {
    case 'onslaught': return '<path d="M5 14l7-8 7 8M5 19l7-8 7 8" />';
    case 'raider':    return '<path d="M7 19L15 5M12 19L20 5" />';
    case 'bulwark':   return '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z" />';
    case 'ambush':    return '<path d="M12 3l8 9-8 9-8-9z" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />';
    default: return '';
  }
}

// ── catalogs (structure; copy via t.shop.*) ──
const DECOR = [
  { kind: 'banner',     core: 'onslaught', price: 480, hero: true },
  { kind: 'dais',       core: 'bulwark',   price: 420 },
  { kind: 'corePlinth', core: 'raider',    price: 540, isNew: true },
  { kind: 'arch',       core: 'ambush',    price: 760 },
  { kind: 'crates',     core: null,        price: 240 },
  { kind: 'plinth',     core: null,        price: 180 },
];
const CURRENCY = [
  { id: 'spark',   amount: 600,   bonus: 0,    price: '$0.99',  value: '100%', tier: 1 },
  { id: 'kit',     amount: 1300,  bonus: 100,  price: '$1.99',  value: '108%', tier: 2 },
  { id: 'cache',   amount: 3600,  bonus: 400,  price: '$4.99',  value: '116%', tier: 3 },
  { id: 'vault',   amount: 8200,  bonus: 1200, price: '$9.99',  value: '123%', tier: 4 },
  { id: 'arsenal', amount: 18000, bonus: 4000, price: '$19.99', value: '130%', tier: 5, best: true },
];
const SPECIALS = [
  { id: 'hot',     kind: 'hot',    core: null,     was: '$6.99', price: '$3.99' },
  { id: 'daily',   kind: 'free',   core: null },
  { id: 'starter', kind: 'bundle', core: 'ambush', price: '$2.99' },
];

// ── matte arena material (mirrors MAT in home_stage) + prop builders ──
const MAT = { top: 'var(--chrome-lo)', lit: 'var(--chrome-lo)', side: 'var(--panel)', dark: 'var(--panel)', rim: 'rgba(190,205,226,0.42)', edge: 'rgba(228,236,248,0.5)' };
const fmtN = (n) => Math.round(n * 10) / 10;
function box(hw, dep, h, opts = {}) {
  const m = opts.mat || MAT;
  const dx = dep * 0.84, dy = dep * 0.5;
  const P = { FBL: [-hw, 0], FBR: [hw, 0], FTL: [-hw, -h], FTR: [hw, -h], BTL: [-hw + dx, -h - dy], BTR: [hw + dx, -h - dy], BBR: [hw + dx, -dy] };
  const pp = (a) => a.map((p) => `${fmtN(p[0])},${fmtN(p[1])}`).join(' ');
  const top = opts.topMat || m.top;
  return `
    <polygon points="${pp([P.FBR, P.BBR, P.BTR, P.FTR])}" fill="${m.side}"/>
    <polygon points="${pp([P.FBL, P.FBR, P.FTR, P.FTL])}" fill="${m.lit}"/>
    <polygon points="${pp([P.FTL, P.FTR, P.BTR, P.BTL])}" fill="${top}"/>
    <polyline points="${pp([P.FTL, P.FTR, P.BTR])}" fill="none" stroke="${m.edge}" stroke-width="1.1" opacity="0.7"/>
    <polyline points="${pp([P.FTR, P.BTR, P.BBR])}" fill="none" stroke="${m.rim}" stroke-width="1" opacity="0.6"/>`;
}
const PROPS = {
  plinth: () => box(46, 30, 30),
  crates: () => `<g transform="translate(-30,0)">${box(30, 22, 40)}</g><g transform="translate(34,0)">${box(26, 20, 30)}</g><g transform="translate(2,-40) scale(0.92)">${box(28, 20, 30)}</g>`,
  banner: () => box(13, 12, 150) + `
    <polygon points="13,-150 64,-141 64,-86 13,-99" fill="${MAT.lit}"/>
    <polygon points="13,-150 13,-99 6,-103 6,-146" fill="${MAT.side}"/>
    <polyline points="13,-150 64,-141 64,-86" fill="none" stroke="${MAT.rim}" stroke-width="1" opacity="0.5"/>
    <polygon points="20,-128 57,-122 57,-114 20,-119" fill="${MAT.dark}" opacity="0.55"/>`,
  arch: () => `
    <g transform="translate(-70,0)">${box(16, 14, 150)}</g>
    <g transform="translate(70,0)">${box(16, 14, 150)}</g>
    <g transform="translate(0,-150)">
      <polygon points="-86,4 86,4 86,-26 -86,-26" fill="${MAT.lit}"/>
      <polygon points="-86,-26 86,-26 98,-38 -74,-38" fill="${MAT.top}"/>
      <polygon points="86,4 98,-8 98,-38 86,-26" fill="${MAT.side}"/>
      <polyline points="-86,-26 86,-26 98,-38" fill="none" stroke="${MAT.edge}" stroke-width="1.1" opacity="0.65"/>
    </g>`,
  dais: () => `
    <polygon points="-90,-6 -50,-30 50,-30 90,-6 50,18 -50,18" fill="${MAT.side}"/>
    <polygon points="-90,-22 -50,-46 50,-46 90,-22 50,2 -50,2" fill="${MAT.top}"/>
    <polyline points="-90,-22 -50,-46 50,-46 90,-22" fill="none" stroke="${MAT.edge}" stroke-width="1.2" opacity="0.7"/>
    <polygon points="-58,-23 -32,-38 32,-38 58,-23 32,-8 -32,-8" fill="${MAT.lit}" opacity="0.85"/>`,
  corePlinth: () => box(40, 26, 46) + `
    <g transform="translate(0,-78)">
      <polygon points="0,-26 22,0 0,26 -22,0" fill="${MAT.lit}"/>
      <polygon points="0,-26 22,0 0,26" fill="${MAT.side}"/>
      <polygon points="0,-26 -22,0 0,0 22,0" fill="${MAT.top}" opacity="0.9"/>
      <polyline points="-22,0 0,-26 22,0" fill="none" stroke="${MAT.rim}" stroke-width="1" opacity="0.55"/>
      <circle cx="0" cy="0" r="3.4" fill="var(--chrome-lo)"/>
    </g>`,
};
function drawObject(kind) { return PROPS[kind] ? PROPS[kind]() : ''; }

// ── glowing prop preview — the matte prop standing in a core-coloured bloom ──
function glowPropSVG(kind, core, lvl, scale) {
  const c = CORES[core];
  const id = `${kind}-${core || 'n'}`;
  const main = c ? c.main : 'var(--chrome-hi)';
  const sup = c ? c.sup : 'var(--chrome-hi)';
  const bloomO = c ? (lvl === 'hero' ? 0.55 : 0.26) : 0.1;
  const ringO = c ? (lvl === 'hero' ? 0.9 : 0.5) : 0.22;
  const motY = (kind === 'banner' || kind === 'arch') ? 70 : 150;
  return `
    <svg viewBox="0 0 260 210" preserveAspectRatio="xMidYMax meet" class="gp-prev${lvl === 'hero' ? ' is-hero' : ''}">
      <defs>
        <radialGradient id="gp-bloom-${id}" cx="0.5" cy="0.46" r="0.5">
          <stop offset="0" stop-color="${sup}" stop-opacity="${bloomO}"/>
          <stop offset="0.45" stop-color="${main}" stop-opacity="${bloomO * 0.7}"/>
          <stop offset="1" stop-color="${main}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="gp-ring-${id}" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="${main}" stop-opacity="0"/>
          <stop offset="0.7" stop-color="${main}" stop-opacity="${ringO}"/>
          <stop offset="1" stop-color="${main}" stop-opacity="0"/>
        </radialGradient>
        <filter id="gp-soft-${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse class="gp-bloom" cx="130" cy="118" rx="120" ry="96" fill="url(#gp-bloom-${id})"/>
      <polygon points="60,182 130,148 200,182 130,216" fill="none" stroke="var(--ink)" stroke-opacity="0.07" stroke-width="1"/>
      <ellipse class="gp-ring" cx="130" cy="184" rx="${64 * scale}" ry="${15 * scale}" fill="url(#gp-ring-${id})" filter="url(#gp-soft-${id})"/>
      <g transform="translate(130,184) scale(${scale})">${drawObject(kind)}</g>
      ${c ? `<circle class="gp-mote" cx="130" cy="${motY}" r="3.4" fill="${sup}"/>` : ''}
    </svg>`;
}

// ── currency pile — matte hex chips (the pink lives on the card frame) ──
const PILES = {
  1: [{ x: 130, y: 150, h: 3 }],
  2: [{ x: 112, y: 152, h: 4 }, { x: 160, y: 156, h: 2 }],
  3: [{ x: 100, y: 154, h: 5 }, { x: 150, y: 150, h: 3 }, { x: 180, y: 160, h: 2 }],
  4: [{ x: 92, y: 156, h: 6 }, { x: 140, y: 150, h: 4 }, { x: 182, y: 158, h: 3 }, { x: 120, y: 168, h: 2 }],
  5: [{ x: 80, y: 158, h: 7 }, { x: 126, y: 149, h: 5 }, { x: 172, y: 160, h: 4 }, { x: 106, y: 169, h: 3 }, { x: 152, y: 171, h: 3 }, { x: 196, y: 166, h: 2 }],
};
function hexCoin(cx, cy, rx, tk) {
  const ry = rx * 0.5, a = rx * 0.5;
  const f = (x, y) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  const top = [f(cx - rx, cy), f(cx - a, cy - ry), f(cx + a, cy - ry), f(cx + rx, cy), f(cx + a, cy + ry), f(cx - a, cy + ry)].join(' ');
  const side = [f(cx - rx, cy), f(cx - a, cy + ry), f(cx + a, cy + ry), f(cx + rx, cy), f(cx + rx, cy + tk), f(cx + a, cy + ry + tk), f(cx - a, cy + ry + tk), f(cx - rx, cy + tk)].join(' ');
  const ir = rx * 0.46, ia = ir * 0.5, iry = ir * 0.5;
  const inner = [f(cx - ir, cy), f(cx - ia, cy - iry), f(cx + ia, cy - iry), f(cx + ir, cy), f(cx + ia, cy + iry), f(cx - ia, cy + iry)].join(' ');
  return `
    <polygon points="${side}" fill="${MAT.side}"/>
    <polygon points="${top}" fill="${MAT.top}"/>
    <polygon points="${inner}" fill="${MAT.lit}" opacity="0.85"/>
    <polyline points="${f(cx - rx, cy)} ${f(cx - a, cy - ry)} ${f(cx + a, cy - ry)} ${f(cx + rx, cy)}" fill="none" stroke="${MAT.edge}" stroke-width="1" opacity="0.55"/>`;
}
function hexPileSVG(tier) {
  const rx = 30, tk = 9;
  const stacks = (PILES[tier] || PILES[1]).slice().sort((a, b) => a.y - b.y);
  let body = '';
  for (const s of stacks) for (let i = 0; i < s.h; i++) body += hexCoin(s.x, s.y - i * tk, rx, tk);
  return `
    <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMax meet" class="hx-prev">
      <defs><radialGradient id="hxdrop-${tier}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
      <polygon points="64,182 130,150 196,182 130,214" fill="none" stroke="var(--ink)" stroke-opacity="0.07" stroke-width="1"/>
      <ellipse cx="130" cy="184" rx="${48 + tier * 8}" ry="${13 + tier}" fill="url(#hxdrop-${tier})"/>
      <g>${body}</g>
    </svg>`;
}

// ── derived + handlers ──
const balanceDisplay = computed(() => BALANCE.toLocaleString());
const buyName = computed(() => (buyItem.value ? t.value.shop.decor[buyItem.value.kind].name : ''));
const buyTuning = computed(() => {
  if (!buyItem.value) return '';
  const c = CORES[buyItem.value.core];
  return c ? `${c.name.charAt(0) + c.name.slice(1).toLowerCase()} ${t.value.shop.tuningWord}` : t.value.shop.neutralPiece;
});
const balanceAfter = computed(() => (buyItem.value ? (BALANCE - buyItem.value.price).toLocaleString() : ''));

function openBuy(it) { buyItem.value = it; buyStep.value = 'confirm'; modal.value = 'buy'; }
function onStageTwo(which) { modal.value = which; } // 'wallet' | 'claim' — Stage-2 stubs
function closeModal() { modal.value = null; }

// Hot-deal countdown — ticks once a second when Stage 2 is live (static otherwise),
// loops back to 24:00:00 at zero. Respects prefers-reduced-motion.
const LOOP = 24 * 3600;
const remaining = ref(23 * 3600 + 14 * 60 + 8);
const timerDisplay = computed(() => {
  const s = remaining.value;
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
});
let timerId = null;
onMounted(() => {
  // Single-scroll decoupling: mark the document so shop.css turns .home-root into
  // the one page scroller and drops the shared home strip into the flow. The home
  // is never marked, so its fixed-strip-over-3D behaviour stays untouched.
  document.body.classList.add('home-shop-open');
  if (!stageTwoLive) return; // static until the economy is live
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  timerId = setInterval(() => { remaining.value = remaining.value <= 0 ? LOOP : remaining.value - 1; }, 1000);
});
onBeforeUnmount(() => {
  document.body.classList.remove('home-shop-open');
  if (timerId) clearInterval(timerId);
});
// ── DEV console — roster wiring ──────────────────────────────────────────────
// Reads/writes the roster store directly; the canonical core ids come from
// upgradeData (the same vocabulary the fight understands), and the flat colour
// chips take their hue from there too — colour of its own core is allowed, glow
// is not (see shop.css .dv-core-tag).
const store = useStore();
const roster = computed(() => store.getters['roster/fighters']);
const rosterCount = computed(() => store.getters['roster/count']);
const rosterMax = computed(() => store.getters['roster/max']);
const rosterFull = computed(() => store.getters['roster/isFull']);
const giveCore = ref('random');
const coreOf = (id) => ROSTER_CORES.find((c) => c.id === id) || null;
const coreName = (id) => (coreOf(id) ? coreOf(id).name : id);
const coreHue = (id) => (coreOf(id) ? coreOf(id).hue : 'var(--ink-off)');
function onRecruit() { store.dispatch('roster/recruit', giveCore.value); }
function onDismiss(id) { store.dispatch('roster/dismiss', id); }
</script>
