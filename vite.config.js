import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from "vite-plugin-vuetify";
import {version} from "./package.json";
import compression from 'vite-plugin-compression';
import {viteStaticCopy} from 'vite-plugin-static-copy'
import obfuscator from 'rollup-plugin-obfuscator';
import viteImagemin from "@vheemstra/vite-plugin-imagemin";

import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminWebp from 'imagemin-webp'
import imageminPngquant from 'imagemin-pngquant'


// https://vitejs.dev/config/
export default defineConfig(({mode}) => {

    //TODO ENABLE AFTER TESTS
    const apiServers = {
        //prod: 'https://api.bitfightclub.com',
        test: 'https://apitest.bitfightclub.com',

    };
    const apiServer = apiServers[mode] || apiServers.test;

    const wsServers = {
        //prod: 'wss://api.bitfightclub.com:444',
        test: 'wss://apitest.bitfightclub.com:444',
    };
    const wsServer = wsServers[mode] || wsServers.test;

    console.log(apiServer + " current api server");
    console.log(wsServer + " current ws server");

    return {
        plugins: [
            vue(),
            vuetify({autoImport: true}),
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
            })
        ],
        define:
            {
                __APP_VERSION__: JSON.stringify(version),
                __API_SERVER_URL__: JSON.stringify(apiServer),
                __WEB_SOCKET_URL__: JSON.stringify(wsServer),
            },
        assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.bin', '**/*.wasm'],
        resolve:
            {
                alias: {
                    '@':
                        fileURLToPath(new URL('./src', import.meta.url)),
                    util:
                        "util/",
                    buffer:
                        "buffer/"
                }
            },
        build: {
            assetsInlineLimit: 4096,
            sourcemap:
                false,
            minify:
                'terser',
            // Настройки для оптимизации
            optimizeDeps:
                {
                    include: ['three'],
                },
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('three') || id.includes('postprocessing') || id.includes('kokomi')) {
                                return 'three-vendor';  // Чанк для графических библиотек
                            }
                            if (id.includes('axios')) {
                                return 'axios-vendor';  // Чанк для Axios
                            }
                            if (id.includes('ethers')) {
                                return 'ethers-vendor';  // Чанк для ethers.js
                            }
                            if (id.includes('web3modal')) {
                                return 'web3modal-vendor';  // Чанк для @web3modal/ethers
                            }
                            if (id.includes('coinbase')) {
                                return 'coinbase-vendor';  // Чанк для @coinbase/wallet-sdk
                            }
                            if (id.includes('vue') || id.includes('vue-router') || id.includes('vuex') || id.includes('vue-i18n')) {
                                return 'vue-vendor';  // Чанк для Vue и связанных библиотек
                            }
                            return 'vendor';  // Все остальные библиотеки в один чанк
                        }
                    }
                },
                treeshake: true,
            },
            // Удаление комментариев и консольных логов в продакшене
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger:
                        true,
                },
            },
        }
    }
})
