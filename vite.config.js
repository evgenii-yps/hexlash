import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {version} from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
    assetsInclude: ['**/*.glb'],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})
