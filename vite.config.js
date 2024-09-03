import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {version} from "./package.json";
import compression from 'vite-plugin-compression';
import {viteStaticCopy} from 'vite-plugin-static-copy'
import obfuscator from 'rollup-plugin-obfuscator';

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
            debugProtection:true,
            exclude: ['src/router/**', 'node_modules/**'],
        }),
    ],
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.bin', '**/*.wasm'],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        assetsInlineLimit: 4096,
        sourcemap: false,
        minify: 'terser',
        // Настройки для оптимизации
        optimizeDeps: {
            include: ['axios', 'vue-router'], // Включите сюда часто используемые библиотеки
        },
        rollupOptions: {
            output: {
                // Разделение кода на чанки
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                }
            },
            // Опции минимизации кода
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
