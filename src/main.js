import './assets/colors.css'
import './assets/main.css'
import './styles/hexlash-ui.css'

import {createApp} from 'vue'
import {createVuetify} from 'vuetify'
import * as directives from 'vuetify/directives'
import router from '@/router/index.js'
import store from "@/core/state/store.js";
import {
    VAlert,
    VBtn,
    VCard,
    VCardActions,
    VCardText,
    VCardTitle,
    VCarousel,
    VCarouselItem,
    VCol,
    VDialog,
    VIcon,
    VImg,
    VInfiniteScroll,
    VInput,
    VList,
    VListItem,
    VProgressCircular,
    VProgressLinear,
    VRow,
    VSelect,
    VSlider,
    VSpacer,
    VSwitch,
    VTextarea,
    VTextField,
    VTooltip,
    VSnackbar, VCheckbox
} from 'vuetify/components';
import { WagmiPlugin } from '@wagmi/vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { config as wagmiConfig } from '@/core/web3/wagmiConfig.js'
import App from "@/App.vue";


const vuetify = createVuetify({
    components: {
        VTooltip,
        VBtn,
        VDialog,
        VCard,
        VCardTitle,
        VCardText,
        VCardActions,
        VSpacer,
        VIcon,
        VImg,
        VInput,
        VRow,
        VCol,
        VInfiniteScroll,
        VCarousel,
        VCarouselItem,
        VProgressCircular,
        VSelect,
        VList,
        VListItem,
        VSlider,
        VAlert,
        VSwitch,
        VTextField,
        VTextarea,
        VProgressLinear,
        VSnackbar,
        VCheckbox
    },
    directives: {
        ...directives,
    },
    aliases: {
        VBtnDark: VBtn,
        VModal: VDialog
    },
    defaults: {
        VBtn: {
            color: 'var(--hex-primary)',
            variant: 'elevated',
        },
        VBtnDark: {
            color: 'var(--hex-bg-card)',
            variant: 'elevated',
        },
        VCard: {
            class: 'v-modal',
        },
        VListItem: {
            class: 'v-list-item',
        }
    },
});

// --- Pre-load splash wiring ---------------------------------------------------
// The pre-load screen (#hx-load in index.html) exposes window.HexlashLoader:
//   .set(pct)  — 0..100, driven from real bootstrap milestones
//   .done()    — force 100% + fade out + self-remove
// The arena is procedural (no GLTF / heavy assets), so there's almost nothing to
// fetch — "real progress" tracks bootstrap phases, and done() only fires on a
// genuine ready signal: the arena's first rendered frame when we land on /play,
// or the first paint of whatever route loaded otherwise.
const splash = window.HexlashLoader || null;
let splashDone = false;
function splashSet(p) { if (splash) splash.set(p); }
function splashFinish() {
    if (splashDone) return;
    splashDone = true;
    // From here on, in-app navigation is covered by the SPA scene-transition
    // overlay (router beforeEach), not this one-shot page-load splash.
    window.__hexBootstrapped = true;
    if (splash) splash.done();
}

// Milestone 1 — main bundle parsed + executing.
splashSet(18);

async function initializeApp() {
    await store.dispatch('master/initializeMasterData');
}

initializeApp().then(() => {
    splashSet(42); // Milestone 2 — master init data ready.

    const app = createApp(App)
        .provide('AmmoLib', Ammo())
        .use(vuetify)
        .use(store)
        .use(router)
        .use(WagmiPlugin, { config: wagmiConfig })
        .use(VueQueryPlugin, {});

    app.mount('#app');
    splashSet(64); // Milestone 3 — app mounted.

    router.isReady().then(() => {
        // Milestone 4 — scene build + first frame. Heavy 3D routes signal real
        // readiness: the arena (meta.arena) and the home/pve stages
        // (meta.scene3d). On any of them we hold an honest stall near 90 and
        // finish only on the scene's first-frame signal; other (2D) routes hide
        // once the route has painted.
        const route = router.currentRoute.value;
        const meta = route.meta || {};
        // Map the current 3D route to its readiness event + window latch flag.
        let readyEvent = null, readyLatch = null;
        if (meta.arena) {
            readyEvent = 'hexlash:arena-ready'; readyLatch = '__hexArenaReady';
        } else if (meta.scene3d) {
            if (route.name === 'V2Pve') { readyEvent = 'hexlash:pve-ready'; readyLatch = '__hexPveReady'; }
            else if (route.name === 'V2Space') { readyEvent = 'hexlash:space-ready'; readyLatch = '__hexSpaceReady'; }
            else { readyEvent = 'hexlash:home-ready'; readyLatch = '__hexHomeReady'; }
        }

        if (readyEvent) {
            splashSet(80);
            let trickle = 80;
            const trickleTimer = setInterval(() => {
                trickle = Math.min(92, trickle + 1.5);
                splashSet(trickle);
                if (trickle >= 92) clearInterval(trickleTimer);
            }, 220);
            const onReady = () => { clearInterval(trickleTimer); splashSet(100); splashFinish(); };
            // Latch guards the (rare) race where the first frame renders before
            // this listener attaches.
            if (window[readyLatch]) onReady();
            else window.addEventListener(readyEvent, onReady, { once: true });
            // Safety net — never hang the splash if the scene fails to signal.
            setTimeout(() => { clearInterval(trickleTimer); splashFinish(); }, 12000);
        } else {
            splashSet(92);
            requestAnimationFrame(() => requestAnimationFrame(() => splashFinish()));
        }
    });
}).catch((error) => {
    splashFinish();
    alert("An error occurred while loading Hexlash. The game will now reload. ", error);
    location.reload();
});
