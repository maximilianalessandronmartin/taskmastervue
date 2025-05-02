import apiService from './api.service';
import { type Friendship } from '../types/models';

export const friendshipService = {
  /**
   * Get all friends of the authenticated user
   * @returns Promise with an array of friendships
   */
  getFriends(): Promise<Friendship[]> {
    return apiService.get<Friendship[]>('/friendships/friends')
      .then(response => response.data);
  },

  /**
   * Get pending friend requests for the authenticated user
   * @returns Promise with an array of pending friendships
   */
  getPendingRequests(): Promise<Friendship[]> {
    return apiService.get<Friendship[]>('/friendships/pending')
      .then(response => response.data);
  },

  /**
   * Send a friend request to another user
   * @param receiverMail Email of the user to send the request to
   * @returns Promise with void
   */
  sendFriendRequest(receiverMail: string): Promise<void> {
    return apiService.post<void>(`/friendships/send?receiverMail=${receiverMail}`)
      .then(() => {});
  },

  /**
   * Accept a friend request
   * @param friendshipId ID of the friendship to accept
   * @returns Promise with void
   */
  acceptFriendRequest(friendshipId: string): Promise<void> {
    return apiService.post<void>(`/friendships/accept?friendshipId=${friendshipId}`)
      .then(() => {});
  },

  /**
   * Decline a friend request
   * @param friendshipId ID of the friendship to decline
   * @returns Promise with void
   */
  declineFriendRequest(friendshipId: string): Promise<void> {
    return apiService.delete<void>(`/friendships/decline?friendshipId=${friendshipId}`)
      .then(() => {});
  }
};

export default friendshipService;