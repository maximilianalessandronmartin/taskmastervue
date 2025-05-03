<script setup lang="ts">
/**
 * ThemeProvider Component
 * 
 * This component serves as a bridge between the application's theme store and Vuetify's theming system.
 * It synchronizes the theme state from the Pinia store with Vuetify's theme configuration.
 * 
 * The component has no UI elements and works in the background to ensure theme consistency.
 * It should be included once at the application root level.
 */
import { useThemeStore } from '../store/theme.store';
import { useTheme } from 'vuetify';
import { watch, onMounted } from 'vue';

// Access the theme store to get the current theme preference
const themeStore = useThemeStore();

// Access Vuetify's theme API
const theme = useTheme();

/**
 * Updates Vuetify's active theme based on the current theme in the store
 * This ensures that Vuetify's theming system reflects the user's preference
 */
const updateTheme = () => {
  theme.global.name.value = themeStore.currentTheme;
};

/**
 * Watch for changes in the theme store and update Vuetify's theme accordingly
 * This ensures that when the user toggles the theme, the UI updates immediately
 */
watch(() => themeStore.currentTheme, updateTheme);

/**
 * Set the initial theme when the component is mounted
 * This ensures the correct theme is applied when the application first loads
 */
onMounted(() => {
  updateTheme();
});
</script>

<template>
  <!-- This is a functional component with no UI -->
</template>
