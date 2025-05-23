import { defineStore } from 'pinia';
import { type Notification, type NotificationDto, type User } from '../types/models';
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';
import browserNotificationService from '../services/browser-notification.service';
import { useAuthStore } from './auth.store';
import loggerService from '../services/logger.service';

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
      loggerService.info('Initializing notification store');

      // Log current state
      loggerService.debug(`Current initialized state: ${this.initialized}`);
      loggerService.debug(`Current websocket connected state: ${websocketService.isConnected.value}`);

      // If already initialized, skip initialization
      if (this.initialized) {
        loggerService.debug('Notification store already initialized, skipping');
        return;
      }


      // Fetch existing notifications
      await this.fetchNotifications();
      loggerService.info(`Fetched initial notifications, count: ${this.notifications.length}`);
      loggerService.debug(`Initial unread count: ${this.unreadCount}`);

      // Set up WebSocket listener for new notifications
      loggerService.debug('Setting up WebSocket listener for notifications');
      const boundHandler = this.handleNewNotification.bind(this);
      loggerService.debug('Created bound handler for notifications');
      websocketService.addEventListener('notification', boundHandler);
      loggerService.debug('Added event listener for notifications');

      // Connect to WebSocket if not already connected
      if (!websocketService.isConnected.value) {
        loggerService.info('WebSocket not connected, connecting now');
        websocketService.connect();
      } else {
        loggerService.debug('WebSocket already connected');
      }

      // Subscribe to notifications for the current user
      // We need to get the user's email from the auth store
      loggerService.debug('Getting user from auth store');
      const authStore = useAuthStore();
      loggerService.debug('Auth store user:', authStore.user);

      if (authStore.user && authStore.user.username) {
        loggerService.info(`User found in auth store: ${authStore.user.username}`);
        loggerService.debug('Subscribing to notifications');
        websocketService.subscribeToNotifications();
        loggerService.debug('Subscribed to notifications');

        // Mark as initialized after successful subscription
        this.initialized = true;
        loggerService.info('Notification store initialized successfully');
      } else {
        loggerService.warn('User not found in auth store, fetching user');
        // If user is not available yet, wait for it to be fetched
        await authStore.fetchUser();
        loggerService.debug('User fetched from API');

        if (authStore.user && authStore.user.username) {
          loggerService.info(`User fetched successfully: ${authStore.user.username}`);
          loggerService.debug('Subscribing to notifications');
          websocketService.subscribeToNotifications();
          loggerService.debug('Subscribed to notifications');

          // Mark as initialized after successful subscription
          this.initialized = true;
          loggerService.info('Notification store initialized successfully');
        } else {
          loggerService.error('Failed to fetch user or user has no username');
        }
      }
    },

    /**
     * Handles a new notification received via WebSocket
     * @param {Notification | NotificationDto} notification - The new notification
     */
    handleNewNotification(notification: Notification | NotificationDto) {
      loggerService.debug('handleNewNotification called with:', notification);

      // Check if the notification is a NotificationDto and convert it if needed
      const notificationObj = 'recipient' in notification && 'username' in notification.recipient
        ? notification as Notification
        : this.convertDtoToNotification(notification as NotificationDto);

      loggerService.debug('Notification object after conversion:', notificationObj);
      loggerService.debug(`Current notifications count: ${this.notifications.length}`);
      loggerService.debug(`Current unread count: ${this.unreadCount}`);

      // Add the notification to the store if it doesn't already exist
      const exists = this.notifications.some(n => n.id === notificationObj.id);
      loggerService.debug(`Notification already exists: ${exists}`);

      if (!exists) {
        loggerService.info(`Adding new notification: ${notificationObj.type} - ${notificationObj.message}`);
        // Create a new array to ensure reactivity is triggered
        this.notifications = [notificationObj, ...this.notifications];
        loggerService.debug(`New notifications count: ${this.notifications.length}`);
        loggerService.debug(`New unread count: ${this.unreadCount}`);

        // Show browser notification if enabled
        const authStore = useAuthStore();
        if (authStore.user?.notificationsEnabled) {
          loggerService.debug('User has notifications enabled, showing browser notification');
          browserNotificationService.showNotification(notificationObj);
        } else {
          loggerService.debug('User has notifications disabled or preference not set');
        }
      } else {
        loggerService.debug('Notification already exists, not adding to store');
      }
    },

    /**
     * Fetches all notifications for the current user
     * @returns {Promise<Notification[]>} The list of notifications
     */
    async fetchNotifications() {
      loggerService.info('Fetching notifications');
      this.loading = true;
      this.error = null;

      try {
        const response = await apiService.get<NotificationDto[]>('/notifications');
        // Convert NotificationDto[] to Notification[]
        this.notifications = response.data.map(dto => this.convertDtoToNotification(dto));
        loggerService.info(`Successfully fetched ${this.notifications.length} notifications`);
        loggerService.debug(`Unread notifications: ${this.unreadCount}`);
        return this.notifications;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
        this.error = errorMessage;
        loggerService.error(`Error fetching notifications: ${errorMessage}`, error);
        throw error;
      } finally {
        this.loading = false;
        loggerService.debug('Notifications fetch completed');
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
      loggerService.debug(`Marking notification as read: ${notificationId}`);
      this.loading = true;
      this.error = null;

      try {
        await apiService.post(`/notifications/${notificationId}/read`);
        loggerService.debug(`API call successful for marking notification ${notificationId} as read`);

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
          loggerService.info(`Notification marked as read, new unread count: ${this.unreadCount}`);
        } else {
          loggerService.warn(`Notification with ID ${notificationId} not found in local store`);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
        this.error = errorMessage;
        loggerService.error(`Error marking notification as read: ${errorMessage}`, error);
        throw error;
      } finally {
        this.loading = false;
        loggerService.debug(`Mark as read operation completed for notification ${notificationId}`);
      }
    },

    /**
     * Marks all notifications as read
     */
    async markAllAsRead() {
      loggerService.info('Marking all notifications as read');
      this.loading = true;
      this.error = null;

      try {
        await apiService.post('/notifications/read-all');
        loggerService.debug('API call successful for marking all notifications as read');

        // Create a new array with all notifications marked as read to ensure reactivity
        const previousUnreadCount = this.unreadCount;
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        loggerService.info(`All notifications marked as read, marked ${previousUnreadCount} notifications as read`);
        loggerService.debug(`New unread count: ${this.unreadCount}`);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to mark all notifications as read';
        this.error = errorMessage;
        loggerService.error(`Error marking all notifications as read: ${errorMessage}`, error);
        throw error;
      } finally {
        this.loading = false;
        loggerService.debug('Mark all as read operation completed');
      }
    },

    /**
     * Clears any error messages in the store
     */
    clearError() {
      loggerService.debug('Clearing notification store error');
      this.error = null;
    },

    /**
     * Resets the notification store
     * Clears notifications, resets the initialized flag, and disconnects from WebSocket
     * This should be called when the user logs out
     */
    reset() {
      loggerService.info('Resetting notification store');

      // Disconnect from WebSocket
      websocketService.disconnect();
      loggerService.debug('Disconnected from WebSocket');

      // Reset store state
      const notificationCount = this.notifications.length;
      this.notifications = [];
      this.error = null;
      this.initialized = false;
      loggerService.info(`Notification store reset, cleared ${notificationCount} notifications`);
    }
  }
});
