import { defineStore } from 'pinia';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import { type LoginUserDto, type RegisterUserDto, type UserDto } from '../types/models';
import router from '../router';

/**
 * Interface representing the state of the authentication store
 */
interface AuthState {
  /** Current authenticated user or null if not authenticated */
  user: UserDto | null;
  /** Flag indicating if an authentication operation is in progress */
  loading: boolean;
  /** Error message from the last failed operation or null if no error */
  error: string | null;
}

/**
 * Authentication store for managing user authentication state
 * 
 * This store handles user authentication operations including login, registration,
 * logout, and fetching the current user. It maintains the current user state and
 * authentication status throughout the application.
 */
export const useAuthStore = defineStore('auth', {
  /**
   * Initial state of the authentication store
   */
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Determines if a user is currently authenticated
     * @returns {boolean} True if a user is logged in, false otherwise
     */
    isAuthenticated: (state) => !!state.user,

    /**
     * Gets the current authenticated user
     * @returns {UserDto|null} The current user or null if not authenticated
     */
    currentUser: (state) => state.user
  },

  actions: {
    /**
     * Registers a new user
     * @param {RegisterUserDto} userData - The user registration data
     * @returns {Promise<UserDto>} The newly registered user
     * @throws Will throw an error if registration fails
     */
    async register(userData: RegisterUserDto) {
      this.loading = true;
      this.error = null;

      try {
        const user = await authService.register(userData);
        this.user = user;
        router.push('/login');
        return user;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Registration failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logs in a user with the provided credentials
     * @param {LoginUserDto} credentials - The login credentials
     * @throws Will throw an error if login fails
     */
    async login(credentials: LoginUserDto) {
      this.loading = true;
      this.error = null;

      try {
        await authService.login(credentials);
        await this.fetchUser();
        router.push('/app/tasks');
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logs out the current user
     * Clears the user state and redirects to the login page
     */
    async logout() {
      this.loading = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken') || '';
        await authService.logout(refreshToken);
        this.user = null;
        router.push('/login');
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Logout failed';
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetches the current authenticated user
     * @returns {Promise<UserDto|undefined>} The current user or undefined if not authenticated
     */
    async fetchUser() {
      if (!authService.isAuthenticated()) {
        this.user = null;
        return;
      }

      this.loading = true;

      try {
        const user = await userService.getAuthenticatedUser();
        this.user = user;
        return user;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch user';
        this.user = null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clears any error messages in the store
     */
    clearError() {
      this.error = null;
    }
  }
});
