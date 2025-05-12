import { ref } from 'vue';
import type { Notification } from '../types/models';

/**
 * Service for handling browser notifications
 */
class BrowserNotificationService {
  // Reactive state for notification permission
  public notificationsEnabled = ref(false);
  public notificationsSupported = ref(false);

  constructor() {
    // Check if browser notifications are supported
    this.notificationsSupported.value = 'Notification' in window;
    
    // Check current permission status
    if (this.notificationsSupported.value) {
      this.notificationsEnabled.value = Notification.permission === 'granted';
    }
  }

  /**
   * Request permission to show browser notifications
   * @returns {Promise<boolean>} True if permission was granted, false otherwise
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.notificationsSupported.value) {
      console.warn('Browser notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled.value = permission === 'granted';
      return this.notificationsEnabled.value;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a browser notification
   * @param {Notification} notification The notification to show
   */
  public showNotification(notification: Notification): void {
    if (!this.notificationsSupported.value || !this.notificationsEnabled.value) {
      console.log('Browser notifications are not supported or not enabled');
      return;
    }

    try {
      // Create notification title based on notification type
      let title = 'TaskMaster';
      switch (notification.type) {
        case 'FRIEND_REQUEST':
          title = 'New Friend Request';
          break;
        case 'FRIEND_REQUEST_ACCEPTED':
          title = 'Friend Request Accepted';
          break;
        case 'ACHIEVEMENT_UNLOCKED':
          title = 'Achievement Unlocked';
          break;
        case 'TASK_SHARED':
          title = 'Task Shared With You';
          break;
        case 'TASK_COMPLETED':
          title = 'Task Completed';
          break;
      }

      // Create and show the notification
      const browserNotification = new window.Notification(title, {
        body: notification.message,
        icon: '/favicon.ico', // Use app favicon as notification icon
      });

      // Handle notification click
      browserNotification.onclick = () => {
        // Focus on the window when notification is clicked
        window.focus();
        // Close the notification
        browserNotification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
}

// Create a singleton instance of the browser notification service
export const browserNotificationService = new BrowserNotificationService();

export default browserNotificationService;