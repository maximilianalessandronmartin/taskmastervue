import { defineStore } from 'pinia';
import friendshipService from '../services/friendship.service';
import { type Friendship } from '../types/models';

interface FriendshipState {
  friends: Friendship[];
  pendingRequests: Friendship[];
  loading: boolean;
  error: string | null;
}

export const useFriendshipStore = defineStore('friendship', {
  state: (): FriendshipState => ({
    friends: [],
    pendingRequests: [],
    loading: false,
    error: null
  }),
  
  getters: {
    getFriends: (state) => state.friends,
    getPendingRequests: (state) => state.pendingRequests
  },
  
  actions: {
    async fetchFriends() {
      this.loading = true;
      this.error = null;
      
      try {
        const friends = await friendshipService.getFriends();
        this.friends = friends;
        return friends;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch friends';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchPendingRequests() {
      this.loading = true;
      this.error = null;
      
      try {
        const pendingRequests = await friendshipService.getPendingRequests();
        this.pendingRequests = pendingRequests;
        return pendingRequests;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch pending requests';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async sendFriendRequest(receiverMail: string) {
      this.loading = true;
      this.error = null;
      
      try {
        await friendshipService.sendFriendRequest(receiverMail);
        // Refresh pending requests after sending a new request
        await this.fetchPendingRequests();
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to send friend request';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async acceptFriendRequest(friendshipId: string) {
      this.loading = true;
      this.error = null;
      
      try {
        await friendshipService.acceptFriendRequest(friendshipId);
        // Refresh both friends and pending requests after accepting
        await Promise.all([
          this.fetchFriends(),
          this.fetchPendingRequests()
        ]);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to accept friend request';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async declineFriendRequest(friendshipId: string) {
      this.loading = true;
      this.error = null;
      
      try {
        await friendshipService.declineFriendRequest(friendshipId);
        // Remove the declined request from pending requests
        this.pendingRequests = this.pendingRequests.filter(
          request => request.id !== friendshipId
        );
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to decline friend request';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    clearError() {
      this.error = null;
    }
  }
});