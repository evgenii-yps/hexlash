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
import App from "@/App.vue";
import {t, setLanguage, getLanguage} from "@/locales/index.js";
import {initAllAchievements} from "@/core/models/achievementModel.js";


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

async function initializeApp() {
    await store.dispatch('master/initializeMasterData');
    const savedLanguage = localStorage.getItem('hexlash-language') || localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        setLanguage(savedLanguage);
    } else {
        const storeLang = store.getters['master/getLanguage'];
        if (storeLang) setLanguage(storeLang);
    }

    store.commit('achievement/setAllAchievements', initAllAchievements(t))
}

initializeApp().then(() => {
    createApp(App)
        .provide('AmmoLib', Ammo())
        .use(vuetify)
        .use(store)
        .use(router)
        .mount('#app')
}).catch((error) => {
    alert("An error occurred while loading Hexlash. The game will now reload. ", error);
    location.reload();
});
