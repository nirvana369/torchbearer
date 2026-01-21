import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';

const ii_url =
    process.env.DFX_NETWORK === 'local'
        ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
        : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
// process.env.STORAGE_GATEWAY_URL = process.env.STORAGE_GATEWAY_URL || 'https://blob.caffeine.ai';

export default defineConfig({
    logLevel: 'error',
    build: {
        emptyOutDir: true,
        sourcemap: false,
        minify: false
    },
    css: {
        postcss: './postcss.config.js'
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:4943',
                changeOrigin: true
            }
        }
    },
    plugins: [
        environment('all', { prefix: 'CANISTER_' }),
        environment('all', { prefix: 'DFX_' }),
        environment(['II_URL']),
        // environment(['STORAGE_GATEWAY_URL']),
        react()
    ],
    resolve: {
        alias: [
            {
                find: 'declarations',
                replacement: fileURLToPath(new URL('../declarations', import.meta.url))
            },
            {
                find: '@',
                replacement: fileURLToPath(new URL('./src', import.meta.url))
            }
        ],
        dedupe: []
    }
});
