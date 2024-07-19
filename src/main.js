import './assets/main.css'
import './assets/colors.css'

import { createApp } from 'vue'
import router from './router'


// Components
import App from './App.vue'


// Vuetify
import { createVuetify } from 'vuetify'
import {
    VTooltip,
    VBtn,
    VDialog,
    VCard,
    VCardTitle,
    VCardText,
    VCardActions,
    VSpacer,
    VIcon,
    VImg
} from 'vuetify/components';

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
        VImg
    },
});

createApp(App)
    .provide('AmmoLib', Ammo())
    .use(vuetify)
    .use(router)
    .mount('#app')