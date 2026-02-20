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

    const apiServers = {
       prod: 'https://api.hexlash.com',
        test: 'https://apitest.hexlash.com',
        // test: 'http://localhost:8080',

    };
    const apiServer = apiServers[mode] || apiServers.test;

    const wsServers = {
        prod: 'wss://api.hexlash.com:444',
        test: 'wss://apitest.hexlash.com:444',
        // test: 'ws://localhost:8444',
    };
    const wsServer = wsServers[mode] || wsServers.test;

    const isProd = mode === 'prod';

    console.log(isProd ? "Production mode" : "Test mode");
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
                __IS_PROD__: JSON.stringify(isProd),
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
               /* output: {
                    manualChunks(id) {
                        if(id) {
                            if (id.includes('node_modules')) {
                                return id.toString().split('node_modules/')[1].split('/')[0].toString();
                            }
                        }
                    }
                },*/
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
