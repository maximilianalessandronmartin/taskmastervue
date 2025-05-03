<script setup lang="ts">
/**
 * Root Application Component
 * 
 * This is the main application component that serves as the entry point for the UI.
 * It includes the ThemeProvider component to manage theme switching and
 * wraps the router view in Vuetify's v-app and v-main components.
 */
import ThemeProvider from './components/ThemeProvider.vue';
</script>

<template>
  <v-app>
    <!-- 
      ThemeProvider component
      This component synchronizes the theme state between the Pinia store and Vuetify.
      It has no UI elements but handles the theme switching functionality.
    -->
    <ThemeProvider />

    <!-- Main content area -->
    <v-main>
      <!-- Router view renders the current route's component -->
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
/**
 * Global application styles
 * These styles apply to the entire application.
 * Component-specific styles should be defined in their respective components.
 */
</style>
