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
    VIcon, VImg, VInput, VRow, VCol, VInfiniteScroll
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
        VInfiniteScroll
    },
    // theme: {
    //     defaultTheme: 'light',
    //     themes: {
    //         light: {
    //             dark: false,
    //             colors: {
    //                 primary: '#1976D2',
    //                 secondary: '#424242',
    //                 accent: '#82B1FF',
    //                 error: '#FF5252',
    //                 info: '#2196F3',
    //                 success: '#4CAF50',
    //                 warning: '#FFC107',
    //             },
    //         },
    //         dark: {
    //             dark: true,
    //             colors: {
    //                 primary: '#BB86FC',
    //                 secondary: '#03DAC6',
    //                 accent: '#3700B3',
    //                 error: '#CF6679',
    //                 info: '#2196F3',
    //                 success: '#4CAF50',
    //                 warning: '#FB8C00',
    //             },
    //         },
    //     },
    // }
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