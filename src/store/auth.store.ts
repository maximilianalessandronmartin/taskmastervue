import { defineStore } from 'pinia';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import { type LoginUserDto, type RegisterUserDto, type UserDto } from '../types/models';
import router from '../router';

interface AuthState {
  user: UserDto | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user
  },
  
  actions: {
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
    
    clearError() {
      this.error = null;
    }
  }
});