import apiService from './api.service';
import { type User, type UserDto } from '../types/models';


export const userService = {
  /**
   * Get the authenticated user's information
   * @returns Promise with the user data
   */
  getAuthenticatedUser(): Promise<UserDto> {
    return apiService.get<UserDto>('/users/me')
      .then(response => response.data);
  },

  /**
   * Get all users
   * @returns Promise with an array of users
   */
  getAllUsers(): Promise<User[]> {
    return apiService.get<User[]>('/users/all')
      .then(response => response.data);
  }
};

export default userService;