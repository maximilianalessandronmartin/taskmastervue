import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig(({mode}) => {
    // Check if we're in production mode
    const isProduction = mode === 'production';

    return {
        plugins: [
            vue(),
            vuetify({autoImport: true}),
        ],
        // Define global to fix "global is not defined" error in sockjs-client
        define: {
            global: 'window',
        },
        // Fügen Sie optimizeDeps hinzu, um Probleme mit der Komponenteninitialisierung zu beheben
        optimizeDeps: {
            include: [
                'vue',
                'vue-router',
                'pinia',
                'vuetify',
                'vuetify/components',
                'vuetify/directives',
            ],
            exclude: []
        },
        // Stellen Sie sicher, dass der Build korrekt konfiguriert ist
        build: {
            sourcemap: !isProduction,
            ...(isProduction && {
                minify: 'esbuild',
                esbuildOptions: {
                    // esbuild-Optionen, falls benötigt
                    drop: ['console', 'debugger'],
                    legalComments: 'none'
                }
            }),


            // Verbessern Sie die Chunk-Größe und verhindern Sie Probleme mit dem Code-Splitting
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vue-vendor': ['vue', 'vue-router', 'pinia'],
                        'vuetify-vendor': ['vuetify']
                    }
                }
            }
        },
        server: {
            port: 3000,
            host: true  // Ermöglicht den Zugriff von außen
        }
    }
})
