import { ref } from 'vue';
import type { Notification } from '../types/models';
import loggerService from './logger.service';

/**
 * Service for handling browser notifications
 */
class BrowserNotificationService {
  // Reactive state for notification permission
  public notificationsEnabled = ref(false);
  public notificationsSupported = ref(false);
  public isIosSafari = ref(false);

  constructor() {
    // Detect if browser is Safari on iOS
    this.isIosSafari.value = this.detectIosSafari();

    // Check if browser notifications are supported
    this.notificationsSupported.value = 'Notification' in window || this.isIosSafari.value;

    // Check current permission status
    if (this.notificationsSupported.value && !this.isIosSafari.value) {
      this.notificationsEnabled.value = Notification.permission === 'granted';
    }
  }

  /**
   * Detects if the current browser is Safari on iOS
   * @returns {boolean} True if the browser is Safari on iOS
   */
  private detectIosSafari(): boolean {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i);
    return iOSSafari;
  }

  /**
   * Request permission to show browser notifications
   * @returns {Promise<boolean>} True if permission was granted, false otherwise
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.notificationsSupported.value) {
      loggerService.warn('Browser notifications are not supported');
      return false;
    }

    try {
      if (this.isIosSafari.value) {
        // For iOS Safari, we can't request permission in the traditional way
        // Instead, we'll assume notifications are "supported" but show a message to the user
        loggerService.info('Safari on iOS detected. Browser notifications require adding the app to home screen.');
        // Set notifications as enabled for iOS Safari to allow our custom implementation
        this.notificationsEnabled.value = true;
        return true;
      } else {
        // Standard notification permission request for other browsers
        loggerService.debug('Requesting notification permission');
        const permission = await Notification.requestPermission();
        this.notificationsEnabled.value = permission === 'granted';
        loggerService.info(`Notification permission ${permission === 'granted' ? 'granted' : 'denied'}`);
        return this.notificationsEnabled.value;
      }
    } catch (error) {
      loggerService.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a browser notification
   * @param {Notification} notification The notification to show
   */
  public showNotification(notification: Notification): void {
    if (!this.notificationsSupported.value || !this.notificationsEnabled.value) {
      loggerService.debug('Browser notifications are not supported or not enabled');
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

      loggerService.info(`Showing browser notification: ${title} - ${notification.message}`);

      if (this.isIosSafari.value) {
        // Custom notification implementation for iOS Safari
        loggerService.debug('Using custom iOS notification implementation');
        this.showIosNotification(title, notification.message);
      } else {
        // Standard notification for other browsers
        loggerService.debug('Using standard browser notification API');
        const browserNotification = new window.Notification(title, {
          body: notification.message,
          icon: '/favicon.ico', // Use app favicon as notification icon
        });

        // Handle notification click
        browserNotification.onclick = () => {
          loggerService.debug('Browser notification clicked');
          // Focus on the window when notification is clicked
          window.focus();
          // Close the notification
          browserNotification.close();
        };
      }
    } catch (error) {
      loggerService.error('Error showing browser notification:', error);
    }
  }

  /**
   * Show a custom notification for iOS Safari
   * @param {string} title The notification title
   * @param {string} message The notification message
   */
  private showIosNotification(title: string, message: string): void {
    // Create a custom notification element
    const notificationElement = document.createElement('div');
    notificationElement.className = 'ios-notification';
    notificationElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 300px;
      background-color: rgba(50, 50, 50, 0.9);
      color: white;
      border-radius: 10px;
      padding: 15px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      transition: all 0.3s ease;
    `;

    // Create title element
    const titleElement = document.createElement('div');
    titleElement.style.cssText = `
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 16px;
    `;
    titleElement.textContent = title;
    notificationElement.appendChild(titleElement);

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      font-size: 14px;
    `;
    messageElement.textContent = message;
    notificationElement.appendChild(messageElement);

    // Add to DOM
    document.body.appendChild(notificationElement);

    // Handle click to dismiss
    notificationElement.addEventListener('click', () => {
      document.body.removeChild(notificationElement);
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notificationElement)) {
        document.body.removeChild(notificationElement);
      }
    }, 5000);
  }
}

// Create a singleton instance of the browser notification service
export const browserNotificationService = new BrowserNotificationService();

export default browserNotificationService;
