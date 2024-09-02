import './assets/colors.css'
import './assets/main.css'

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
import {createI18n} from "vue-i18n";
import App from "@/App.vue";
import {messages, ruCountRule} from "@/locales/index.js";


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
        VListItem: {
            class: 'v-list-item',
        }
    },
});

export const i18n = createI18n({
    warnHtmlMessage: false,
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    pluralRules: {
        ru: ruCountRule
    },
    messages: Object.assign(messages),
})


async function initializeApp() {
    // загрузки данных
    await store.dispatch('master/fetchMaster');

    i18n.global.locale.value = store.getters['master/getLanguage'];
}

initializeApp().then(() => {
    createApp(App)
        .provide('AmmoLib', Ammo())
        .use(vuetify)
        .use(router)
        .use(i18n)
        .mount('#app')
}).catch((error) => {
    console.error("Failed to initialize the app:", error);
});