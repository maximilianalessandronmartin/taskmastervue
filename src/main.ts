/**
 * Main application entry point
 * 
 * This file initializes the Vue application, sets up Vuetify with theme support,
 * and configures the necessary plugins like Pinia for state management and Vue Router.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Import Vuetify and its dependencies
import 'vuetify/styles/main.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

/**
 * Create Pinia instance for state management
 * This must be created before any stores are used
 */
const pinia = createPinia()

/**
 * Initialize Vuetify with light and dark themes
 * 
 * The configuration includes:
 * - Default theme set to light mode
 * - Custom color palettes for both light and dark themes
 * - Components and directives from Vuetify
 */
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      // Light theme configuration
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      },
      // Dark theme configuration
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          secondary: '#757575',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
})

/**
 * Create and configure the Vue application
 */
const app = createApp(App)

// Register plugins
// Note: Pinia must be used before any stores are accessed
app.use(pinia)
app.use(router)
app.use(vuetify)

// Mount the application to the DOM
app.mount('#app')
