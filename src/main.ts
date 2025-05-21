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
import './accessibility-override.css'
import loggerService, { LogLevel } from './services/logger.service'

// Initialize logger
loggerService.configure({
  level: import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG,
  prefix: '[TaskMaster]'
})

// Log application startup
loggerService.info('Application starting up')


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


// Import Vuetify and its dependencies
import 'vuetify/styles/main.css'
import '@mdi/font/css/materialdesignicons.css'

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
          warning: '#FFC107',
          // Zusätzliche Oberflächen-Farben
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-variant': '#EEEEEE',
          'surface-bright': '#FFFFFF',
          'surface-light': '#F5F5F5',
          'surface-dark': '#E0E0E0',

          // Text-Farben
          'on-background': '#000000',
          'on-surface': '#000000',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-error': '#FFFFFF',
          'on-info': '#FFFFFF',
          'on-success': '#FFFFFF',
          'on-warning': '#000000',

          // Weitere UI-Komponenten-Farben
          'primary-darken-1': '#1565C0',
          'secondary-darken-1': '#303030',
          'primary-lighten-1': '#42A5F5',
          'secondary-lighten-1': '#616161'

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
          warning: '#FFC107',

          // Zusätzliche Oberflächen-Farben
          background: '#121212',
          surface: '#212121',
          'surface-variant': '#424242',
          'surface-bright': '#303030',
          'surface-light': '#383838',
          'surface-dark': '#1E1E1E',

          // Text-Farben
          'on-background': '#FFFFFF',
          'on-surface': '#FFFFFF',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-error': '#FFFFFF',
          'on-info': '#FFFFFF',
          'on-success': '#FFFFFF',
          'on-warning': '#000000',

          // Weitere UI-Komponenten-Farben
          'primary-darken-1': '#1E88E5',
          'secondary-darken-1': '#616161',
          'primary-lighten-1': '#64B5F6',
          'secondary-lighten-1': '#606060'

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
