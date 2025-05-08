import { defineStore } from 'pinia';
import { type Notification } from '../types/models';
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';
import { useAuthStore } from './auth.store';

/**
 * Interface representing the state of the notification store
 */
interface NotificationState {
  /** List of notifications for the current user */
  notifications: Notification[];
  /** Flag indicating if notifications are being loaded */
  loading: boolean;
  /** Error message from the last failed operation or null if no error */
  error: string | null;
}

/**
 * Notification store for managing user notifications
 * 
 * This store handles fetching, updating, and managing real-time notifications.
 * It integrates with the WebSocket service to receive real-time updates.
 */
export const useNotificationStore = defineStore('notification', {
  /**
   * Initial state of the notification store
   */
  state: (): NotificationState => ({
    notifications: [],
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Gets all notifications
     * @returns {Notification[]} All notifications
     */
    allNotifications: (state) => state.notifications,

    /**
     * Gets unread notifications
     * @returns {Notification[]} Unread notifications
     */
    unreadNotifications: (state) => state.notifications.filter(notification => !notification.read),

    /**
     * Gets the count of unread notifications
     * @returns {number} Count of unread notifications
     */
    unreadCount: (state) => state.notifications.filter(notification => !notification.read).length
  },

  actions: {
    /**
     * Initializes the notification system
     * Fetches existing notifications and sets up WebSocket listeners
     */
    async initialize() {
      // Fetch existing notifications
      await this.fetchNotifications();

      // Set up WebSocket listener for new notifications
      websocketService.addEventListener('notification', this.handleNewNotification.bind(this));

      // Connect to WebSocket if not already connected
      if (!websocketService.isConnected.value) {
        websocketService.connect();
      }

      // Subscribe to notifications for the current user
      // We need to get the user's email from the auth store
      const authStore = useAuthStore();
      if (authStore.user && authStore.user.username) {
        websocketService.subscribeToNotifications(authStore.user.username);
      } else {
        // If user is not available yet, wait for it to be fetched
        await authStore.fetchUser();
        if (authStore.user && authStore.user.username) {
          websocketService.subscribeToNotifications(authStore.user.username);
        }
      }
    },

    /**
     * Handles a new notification received via WebSocket
     * @param {Notification} notification - The new notification
     */
    handleNewNotification(notification: Notification) {
      // Add the notification to the store if it doesn't already exist
      const exists = this.notifications.some(n => n.id === notification.id);
      if (!exists) {
        this.notifications.unshift(notification);
      }
    },

    /**
     * Fetches all notifications for the current user
     * @returns {Promise<Notification[]>} The list of notifications
     */
    async fetchNotifications() {
      this.loading = true;
      this.error = null;

      try {
        const response = await apiService.get<Notification[]>('/notifications');
        this.notifications = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch notifications';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Marks a notification as read
     * @param {string} notificationId - The ID of the notification to mark as read
     */
    async markAsRead(notificationId: string) {
      this.loading = true;
      this.error = null;

      try {
        await apiService.post(`/notifications/${notificationId}/read`);

        // Update the local notification state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to mark notification as read';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Marks all notifications as read
     */
    async markAllAsRead() {
      this.loading = true;
      this.error = null;

      try {
        await apiService.post('/notifications/read-all');

        // Update all notifications in the local state
        this.notifications.forEach(notification => {
          notification.read = true;
        });
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to mark all notifications as read';
        throw error;
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
