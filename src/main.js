import './assets/colors.css'
import './assets/main.css'

import {createApp} from 'vue'
import router from './router'


// Components
import App from './App.vue'


// Vuetify
import {createVuetify} from 'vuetify'
import {
    VTooltip, VBtn, VDialog, VCard,
    VCardTitle, VCardText, VCardActions, VSpacer,
    VIcon, VImg, VInput, VRow, VCol, VInfiniteScroll, VCarousel, VCarouselItem
} from 'vuetify/components';
import store from "@/core/state/store.js";

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
    },
    aliases: {
        VBtnDark: VBtn,
    },
    defaults: {
        VBtn: {
            color: 'var(--primary-color)',
            variant: 'elevated',
            class: 'v-btn'

        },
        VBtnDark: {
            color: 'var(--black-opacity-80)',
            variant: 'elevated',
            class: 'v-btn-dark'
        },
    }
});

async function initializeApp() {
    // Дождитесь загрузки данных
    await store.dispatch('master/fetchMaster');
}

initializeApp().then(() => {
    createApp(App)
        .provide('AmmoLib', Ammo())
        .use(vuetify)
        .use(router)
        .mount('#app')
}).catch((error) => {
    console.error("Failed to initialize the app:", error);
});