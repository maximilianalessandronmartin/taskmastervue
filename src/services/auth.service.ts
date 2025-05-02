import apiService from './api.service';
import type { 
  AuthenticationResponse, 
  LoginUserDto, 
  LogoutRequestDto, 
  RefreshRequestDto, 
  RegisterUserDto, 
  UserDto 
} from '../types/models';

export const authService = {
  /**
   * Register a new user
   * @param userData User registration data
   * @returns Promise with the registered user data
   */
  register(userData: RegisterUserDto): Promise<UserDto> {
    return apiService.post<UserDto>('/auth/signup', userData)
      .then(response => response.data);
  },

  /**
   * Login a user
   * @param credentials User login credentials
   * @returns Promise with the authentication response
   */
  login(credentials: LoginUserDto): Promise<AuthenticationResponse> {
    return apiService.post<AuthenticationResponse>('/auth/login', credentials)
      .then(response => {
        // Store tokens in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data;
      });
  },

  /**
   * Logout a user
   * @param token Refresh token to invalidate
   * @returns Promise with void
   */
  logout(token: string): Promise<void> {
    const logoutRequest: LogoutRequestDto = { token };
    return apiService.post<void>('/auth/logout', logoutRequest)
      .then(() => {
        // Clear tokens from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
  },

  /**
   * Refresh the access token
   * @param refreshToken Refresh token
   * @returns Promise with the new authentication response
   */
  refreshToken(refreshToken: string): Promise<AuthenticationResponse> {
    const refreshRequest: RefreshRequestDto = { token: refreshToken };
    return apiService.post<AuthenticationResponse>('/auth/refresh', refreshRequest)
      .then(response => {
        // Update tokens in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data;
      });
  },

  /**
   * Check if the user is authenticated
   * @returns Boolean indicating if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
};

export default authService;
