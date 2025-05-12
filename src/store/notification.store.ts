import { defineStore } from 'pinia';
import { type Notification, type NotificationDto, type User } from '../types/models';
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';
import browserNotificationService from '../services/browser-notification.service';
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
  /** Flag indicating if the notification system has been initialized */
  initialized: boolean;
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
    error: null,
    initialized: false
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
    unreadCount: (state) => state.notifications.filter(notification => !notification.read).length,

    /**
     * Checks if the notification system has been initialized
     * @returns {boolean} True if initialized, false otherwise
     */
    isInitialized: (state) => state.initialized
  },

  actions: {
    /**
     * Initializes the notification system
     * Fetches existing notifications and sets up WebSocket listeners
     */
    async initialize() {
      console.log('Initializing notification store');

      // If already initialized, skip initialization
      if (this.initialized) {
        console.log('Notification store already initialized, skipping');
        return;
      }

      // Fetch existing notifications
      await this.fetchNotifications();
      console.log('Fetched initial notifications, count:', this.notifications.length);
      console.log('Initial unread count:', this.unreadCount);

      // Set up WebSocket listener for new notifications
      console.log('Setting up WebSocket listener for notifications');
      const boundHandler = this.handleNewNotification.bind(this);
      console.log('Created bound handler for notifications');
      websocketService.addEventListener('notification', boundHandler);
      console.log('Added event listener for notifications');

      // Connect to WebSocket if not already connected
      if (!websocketService.isConnected.value) {
        console.log('WebSocket not connected, connecting now');
        websocketService.connect();
      } else {
        console.log('WebSocket already connected');
      }

      // Subscribe to notifications for the current user
      // We need to get the user's email from the auth store
      console.log('Getting user from auth store');
      const authStore = useAuthStore();
      console.log('Auth store user:', authStore.user);

      if (authStore.user && authStore.user.username) {
        console.log(`User found in auth store: ${authStore.user.username}`);
        console.log('Subscribing to notifications for user');
        websocketService.subscribeToNotifications(authStore.user.username);
        console.log('Subscribed to notifications for user');

        // Mark as initialized after successful subscription
        this.initialized = true;
        console.log('Notification store initialized successfully');
      } else {
        console.log('User not found in auth store, fetching user');
        // If user is not available yet, wait for it to be fetched
        await authStore.fetchUser();
        console.log('User fetched from API');

        if (authStore.user && authStore.user.username) {
          console.log(`User fetched successfully: ${authStore.user.username}`);
          console.log('Subscribing to notifications for user');
          websocketService.subscribeToNotifications(authStore.user.username);
          console.log('Subscribed to notifications for user');

          // Mark as initialized after successful subscription
          this.initialized = true;
          console.log('Notification store initialized successfully');
        } else {
          console.error('Failed to fetch user or user has no username');
        }
      }
    },

    /**
     * Handles a new notification received via WebSocket
     * @param {Notification | NotificationDto} notification - The new notification
     */
    handleNewNotification(notification: Notification | NotificationDto) {
      console.log('handleNewNotification called with:', notification);

      // Check if the notification is a NotificationDto and convert it if needed
      const notificationObj = 'recipient' in notification && 'username' in notification.recipient
        ? notification as Notification
        : this.convertDtoToNotification(notification as NotificationDto);

      console.log('Notification object after conversion:', notificationObj);
      console.log('Current notifications count:', this.notifications.length);
      console.log('Current unread count:', this.unreadCount);

      // Add the notification to the store if it doesn't already exist
      const exists = this.notifications.some(n => n.id === notificationObj.id);
      console.log('Notification already exists:', exists);

      if (!exists) {
        console.log('Adding new notification to store');
        // Create a new array to ensure reactivity is triggered
        this.notifications = [notificationObj, ...this.notifications];
        console.log('New notifications count:', this.notifications.length);
        console.log('New unread count:', this.unreadCount);

        // Show browser notification if enabled
        const authStore = useAuthStore();
        if (authStore.user?.notificationsEnabled) {
          console.log('User has notifications enabled, showing browser notification');
          browserNotificationService.showNotification(notificationObj);
        } else {
          console.log('User has notifications disabled or preference not set');
        }
      } else {
        console.log('Notification already exists, not adding to store');
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
        const response = await apiService.get<NotificationDto[]>('/notifications');
        // Convert NotificationDto[] to Notification[]
        this.notifications = response.data.map(dto => this.convertDtoToNotification(dto));
        return this.notifications;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch notifications';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Converts a NotificationDto to a Notification
     * @param {NotificationDto} dto - The NotificationDto to convert
     * @returns {Notification} The converted Notification
     */
    convertDtoToNotification(dto: NotificationDto): Notification {
      return {
        id: dto.id,
        recipient: {
          id: dto.recipient.id,
          firstname: dto.recipient.firstname,
          lastname: dto.recipient.lastname,
          username: dto.recipient.username,
          email: dto.recipient.email,
          xp: dto.recipient.xp,
          createdAt: dto.recipient.createdAt,
          updatedAt: '', // Not provided in NotificationDto
          enabled: true, // Default values for fields not in NotificationDto
          accountNonLocked: true,
          credentialsNonExpired: true,
          accountNonExpired: true
        } as User,
        type: dto.type,
        message: dto.message,
        payload: dto.payload,
        read: dto.read,
        createdAt: dto.createdAt
      };
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
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          // Create a new array with the updated notification to ensure reactivity
          const updatedNotifications = [...this.notifications];
          updatedNotifications[index] = { 
            ...this.notifications[index], 
            read: true 
          };
          this.notifications = updatedNotifications;
          console.log('Notification marked as read, new unread count:', this.unreadCount);
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

        // Create a new array with all notifications marked as read to ensure reactivity
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        console.log('All notifications marked as read, new unread count:', this.unreadCount);
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
    },

    /**
     * Resets the notification store
     * Clears notifications, resets the initialized flag, and disconnects from WebSocket
     * This should be called when the user logs out
     */
    reset() {
      console.log('Resetting notification store');

      // Disconnect from WebSocket
      websocketService.disconnect();
      console.log('Disconnected from WebSocket');

      // Reset store state
      this.notifications = [];
      this.error = null;
      this.initialized = false;
      console.log('Notification store reset');
    }
  }
});
