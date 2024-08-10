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
    VIcon, VImg, VInput, VRow, VCol, VInfiniteScroll, VCarousel, VCarouselItem,
    VProgressCircular, VSelect, VList, VSlider, VListItem, VAlert, VSwitch, VTextField
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
        VProgressCircular,
        VSelect,
        VList,
        VListItem,
        VSlider,
        VAlert,
        VSwitch,
        VTextField,
    },
    aliases: {
        VBtnDark: VBtn,
        VModal: VDialog
    },
    defaults: {
        VBtn: {
            color: 'var(--primary-color)',
            variant: 'elevated',

        },
        VBtnDark: {
            color: 'var(--black-opacity-80)',
            variant: 'elevated',
        },
        VCard: {
            class: 'v-modal',
        },
        VListItem:{
            class: 'v-list-item',
        }
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