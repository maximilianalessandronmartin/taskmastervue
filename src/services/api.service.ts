import axios, {type AxiosInstance, type AxiosRequestConfig,type AxiosResponse } from 'axios';
import type { AuthenticationResponse, RefreshRequestDto } from '../types/models';
import loggerService from './logger.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';


// Create a base API instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,

    headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    loggerService.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      loggerService.debug('Added authorization token to request');
    } else {
      loggerService.debug('No authorization token available');
    }

    return config;
  },
  (error) => {
    loggerService.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    loggerService.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;
    const method = originalRequest?.method?.toUpperCase();

    loggerService.warn(`API Error: ${status} ${method} ${url}`, error.message);

    // If the error is 401 and we haven't retried yet
    if (status === 401 && !originalRequest._retry) {
      loggerService.info('Attempting to refresh authentication token');
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          loggerService.warn('No refresh token available, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        loggerService.debug('Sending refresh token request');
        const refreshRequest: RefreshRequestDto = { token: refreshToken };
        const response = await axios.post<AuthenticationResponse>(
            `${API_BASE_URL}/auth/refresh`,
            refreshRequest
        );

        // Update tokens in localStorage
        const { token, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        loggerService.info('Token refreshed successfully');

        // Retry the original request with the new token
        loggerService.debug(`Retrying original request: ${method} ${url}`);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        loggerService.error('Token refresh failed, redirecting to login', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    loggerService.info(`API GET request to ${url}`);
    return apiClient.get<T>(url, config);
  },

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    loggerService.info(`API POST request to ${url}`);
    loggerService.debug(`POST data:`, data);
    return apiClient.post<T>(url, data, config);
  },

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    loggerService.info(`API PUT request to ${url}`);
    loggerService.debug(`PUT data:`, data);
    return apiClient.put<T>(url, data, config);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    loggerService.info(`API DELETE request to ${url}`);
    return apiClient.delete<T>(url, config);
  }
};

export default apiService;
