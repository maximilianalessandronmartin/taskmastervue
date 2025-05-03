import { defineStore } from 'pinia';

/**
 * Interface representing the state of the theme store
 */
interface ThemeState {
  /** Current theme mode: 'light' or 'dark' */
  mode: 'light' | 'dark';
}

/**
 * Theme store for managing application theme settings
 * 
 * This store handles the application's theme state, allowing users to switch
 * between light and dark modes. The selected theme is persisted in localStorage
 * to maintain user preferences across sessions.
 */
export const useThemeStore = defineStore('theme', {
  /**
   * Initial state of the theme store
   * Retrieves the saved theme from localStorage or defaults to 'light'
   */
  state: (): ThemeState => ({
    mode: localStorage.getItem('themeMode') as 'light' | 'dark' || 'light'
  }),

  getters: {
    /**
     * Determines if the current theme is dark mode
     * @returns {boolean} True if dark mode is active, false otherwise
     */
    isDarkMode: (state) => state.mode === 'dark',

    /**
     * Gets the current theme name
     * @returns {'light' | 'dark'} The current theme mode
     */
    currentTheme: (state) => state.mode
  },

  actions: {
    /**
     * Toggles between light and dark themes
     * Switches the current theme and saves the preference to localStorage
     */
    toggleTheme() {
      this.mode = this.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', this.mode);
    },

    /**
     * Sets the theme to a specific mode
     * @param {('light'|'dark')} mode - The theme mode to set
     */
    setTheme(mode: 'light' | 'dark') {
      this.mode = mode;
      localStorage.setItem('themeMode', this.mode);
    }
  }
});
