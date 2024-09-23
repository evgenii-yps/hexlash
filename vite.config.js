import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {version} from "./package.json";
import compression from 'vite-plugin-compression';
import {viteStaticCopy} from 'vite-plugin-static-copy'
import obfuscator from 'rollup-plugin-obfuscator';
import viteImagemin from "@vheemstra/vite-plugin-imagemin";

import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminWebp from 'imagemin-webp'
import imageminPngquant from 'imagemin-pngquant'
import {optimizeCssModules} from "vite-plugin-optimize-css-modules";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        compression({
            algorithm: 'brotliCompress',
            ext: '.br',
        }),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets/models/punching-bags.bin',
                    dest: 'assets'
                }
            ]
        }),
        obfuscator({
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            stringArray: false,
            stringArrayThreshold: 0.75,
            debugProtection: false,
            exclude: ['src/router/**', 'node_modules/**'],
        }),
        viteImagemin({
            plugins: {
                jpg: imageminMozjpeg(),
                png: imageminPngquant()
            },
            makeWebp: {
                plugins: {
                    jpg: imageminWebp(),
                },
            },
        }),
        optimizeCssModules()
    ],
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.bin', '**/*.wasm'],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            util: "util/",
            buffer: "buffer/"
        }
    },
    build: {
        assetsInlineLimit: 4096,
        sourcemap: false,
        minify: 'terser',
        // Настройки для оптимизации
        optimizeDeps: {
            include: ['axios', 'vue-router'],
        },
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('vue')) {
                            return 'vue'; // Все библиотеки, связанные с Vue.js, в один чанк
                        }
                        if (id.includes('axios')) {
                            return 'axios'; // Отдельный чанк для axios
                        }
                       /* if (id.includes('three')) {
                            return 'three'; // Все библиотеки для Three.js
                        }*/
                        if (id.includes('gsap')) {
                            return 'gsap'; // GSAP можно выделить в отдельный чанк
                        }
                        if (
                            id.includes('ethers') ||
                            id.includes('@coinbase/wallet-sdk') ||
                            id.includes('@web3modal')
                        ) {
                            return 'web3'; // Чанк для всех библиотек Web3
                        }
                        return 'vendor'; // Все остальные библиотеки в общий чанк vendor
                    }
                }
            },
            treeshake: true,
        },
        // Удаление комментариев и консольных логов в продакшене
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    }
})
