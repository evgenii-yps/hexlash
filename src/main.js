// Токены — единственный источник числовых значений интерфейса.
// Подключаются ПЕРВЫМИ: остальные стили читают из них через var().
// Свод — docs/design-system/A-SISTEMA.md, файл — src/styles/tokens.css.
import './styles/tokens.css'
import './assets/main.css'

import {createApp, watch} from 'vue'
import {createVuetify} from 'vuetify'
import * as directives from 'vuetify/directives'
import router from '@/router/index.js'
import store from "@/core/state/store.js";
import {loadingState, noteSceneError, openLoading} from "@/services/sceneLoading.js";
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
            color: 'var(--pink)',
            variant: 'elevated',
        },
        VBtnDark: {
            color: 'var(--panel)',
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

// --- Page-load splash wiring ------------------------------------------------
// #hx-load in index.html is the loading screen's FIRST-LOAD half: it has to paint
// before this bundle exists, so it cannot be the Vue component. It exposes
// window.HexlashLoader (.set / .done / .handoff) and renders the SAME state as
// SceneLoadingOverlay — one screen, two surfaces (see services/sceneLoading.js).
//
// Progress here is NOT a timer. Bootstrap milestones carry it to the point the
// route is known; from there the loading controller carries it on the scene's own
// declared build stages, and the splash just mirrors that number.
const splash = window.HexlashLoader || null;
let splashDone = false;
function splashSet(p) { if (splash) splash.set(p); }
function splashFinish() {
    if (splashDone) return;
    splashDone = true;
    // From here on, in-app navigation is covered by SceneLoadingOverlay (router
    // beforeEach), not this one-shot page-load splash.
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

    // A scene that throws in onMounted will never signal readiness. Let the player
    // out now rather than after the full safety wait — the error itself is logged
    // here, so nothing is swallowed.
    app.config.errorHandler = (err, instance, info) => {
        console.error(`[hexlash] component error (${info}):`, err);
        noteSceneError(info);
    };

    app.mount('#app');
    splashSet(64); // Milestone 3 — app mounted.

    router.isReady().then(() => {
        // Milestone 4 — scene build. This callback runs BEFORE the route
        // component's onMounted, so opening the load session here guarantees the
        // scene finds it and can bind its stages to it.
        const route = router.currentRoute.value;
        const meta = route.meta || {};

        if (meta.arena || meta.scene3d) {
            // The splash IS the surface for this load: no second cover is raised,
            // so the first entry is one continuous screen from HTML to first frame.
            // 64 is not a guess: the bundle is parsed, the store is initialised and
            // the app is mounted. Handing that floor over is what keeps the ONE
            // number the player watches from restarting under itself.
            openLoading(route.name, { surface: 'splash', from: 64 });
            // Mirror the controller's honest number onto the splash, and lift only
            // when the controller says the scene is genuinely standing still.
            watch(() => loadingState.progress, (p) => splashSet(p), { immediate: true });
            watch(() => loadingState.active, (active) => { if (!active) splashFinish(); });
        } else {
            // A 2D route — nothing heavy to wait for; hide once it has painted.
            splashSet(92);
            requestAnimationFrame(() => requestAnimationFrame(() => splashFinish()));
        }
    });
}).catch((error) => {
    splashFinish();
    alert("An error occurred while loading Hexlash. The game will now reload. ", error);
    location.reload();
});
