import { ref } from 'vue';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import type { Notification, NotificationDto, TimerUpdateDto } from '../types/models';
import { useNotificationStore } from '../store/notification.store';
import loggerService from './logger.service';


// Use the WebSocket-specific URL if available
const SOCKET_BASE_URL = import.meta.env.VITE_API_BASE_URL_SOCKET || 'http://localhost:8080';

/**
 * WebSocket service for handling real-time notifications and timer updates
 */
class WebSocketService {
  private stompClient: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private activeTimerSubscriptions: Map<string, { unsubscribe: () => void }> = new Map();
  private pendingNotificationSubscription: boolean = false;

  // Reactive state for connection status
  public isConnected = ref(false);
  public notifications = ref<Notification[]>([]);

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      loggerService.debug('STOMP client is already connected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      loggerService.error('No authentication token found for WebSocket connection');
      return;
    }

    try {
      loggerService.info('Connecting to WebSocket server');
      // Create a new SockJS instance
      const socket = new SockJS(`${SOCKET_BASE_URL}/ws`, null, { 
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      });
      loggerService.debug(`Created SockJS instance with URL: ${SOCKET_BASE_URL}/ws`);

      // Create a new STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${token}` // Token for authentication
        },
        debug: function (str) {
          // Only log STOMP debug messages at debug level
          loggerService.debug(`STOMP: ${str}`);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });
      loggerService.debug('Created STOMP client');

      // Set up connection event handlers
      this.stompClient.onConnect = this.handleConnect.bind(this);
      this.stompClient.onStompError = this.handleStompError.bind(this);
      this.stompClient.onWebSocketClose = this.handleWebSocketClose.bind(this);
      loggerService.debug('Set up STOMP event handlers');

      // Activate the STOMP client
      loggerService.debug('Activating STOMP client');
      this.stompClient.activate();
    } catch (error) {
      loggerService.error('Failed to connect to WebSocket server:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    loggerService.info('Disconnecting from WebSocket server');

    if (this.stompClient) {
      // Unsubscribe from all active timer subscriptions
      loggerService.debug('Unsubscribing from all active timer subscriptions');
      this.unsubscribeFromAllTimers();

      // Deactivate the STOMP client
      loggerService.debug('Deactivating STOMP client');
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected.value = false;
      loggerService.debug('STOMP client deactivated');
    } else {
      loggerService.debug('No active STOMP client to disconnect');
    }

    if (this.reconnectTimeout) {
      loggerService.debug('Clearing reconnect timeout');
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear any pending notification subscription
    if (this.pendingNotificationSubscription) {
      loggerService.debug('Clearing pending notification subscription');
      this.pendingNotificationSubscription = false;
    }

    this.reconnectAttempts = 0;
    loggerService.info('WebSocket disconnection complete');
  }

  /**
   * Subscribe to notifications for the current user
   * Spring uses the session ID for routing notifications, so no user identifier is needed.
   */
  public subscribeToNotifications(): void {
    loggerService.info('Subscribing to notifications');

    if (!this.stompClient || !this.stompClient.connected) {
      loggerService.warn('STOMP client is not connected, queueing subscription request');
      // Mark that we have a pending subscription
      if (!this.pendingNotificationSubscription) {
        this.pendingNotificationSubscription = true;
        loggerService.debug('Queued notification subscription');
      }

      // If not connected at all, try to connect
      if (!this.stompClient) {
        loggerService.info('No STOMP client exists, attempting to connect');
        this.connect();
      }
      return;
    }

    loggerService.debug('STOMP client is connected, proceeding with subscription');

    // Get the notification store
    const notificationStore = useNotificationStore();
    loggerService.debug('Got notification store instance');

    // Subscribe to the user-specific notification channel
    // Spring transforms /user/{username}/queue/notifications to /queue/notifications-user{session-id}
    // So we use the simplified path that Spring will handle with the session ID
    loggerService.debug(`Subscribing to channel: /user/queue/notifications`);
    const subscription = this.stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
      loggerService.debug('Raw notification message received');

      try {
        const notificationDto = JSON.parse(message.body) as NotificationDto;
        loggerService.info(`Received notification: ${notificationDto.type} - ${notificationDto.message}`);
        loggerService.debug('Notification details:', notificationDto);

        // Convert NotificationDto to Notification using the store's method
        const notification = notificationStore.convertDtoToNotification(notificationDto);
        loggerService.debug('Converted notification to application model');

        // Store the notification in our local array
        loggerService.debug(`Current local notifications count: ${this.notifications.value.length}`);
        this.notifications.value = [...this.notifications.value, notification];
        loggerService.debug(`Updated local notifications count: ${this.notifications.value.length}`);

        // We'll only emit the event and let the store handle it through its listener
        // This avoids potentially calling handleNewNotification twice
        loggerService.debug('Emitting notification event');
        this.emitEvent('notification', notification);
      } catch (error) {
        loggerService.error('Failed to parse notification message:', error);
      }
    });

    loggerService.debug(`Subscription created successfully: ${subscription.id}`);
    loggerService.info('Successfully subscribed to notifications topic');
  }

  /**
   * Subscribe to timer updates for a specific task
   * @param taskId The ID of the task to subscribe to timer updates for
   * @param callback The callback function to call when a timer update is received
   * @returns An object with an unsubscribe method
   */
  public subscribeToTaskTimer(taskId: string, callback: (timerUpdate: TimerUpdateDto) => void): { unsubscribe: () => void } {
    loggerService.debug(`Subscribing to timer updates for task: ${taskId}`);

    if (!this.stompClient || !this.stompClient.connected) {
      loggerService.error('STOMP client is not connected, cannot subscribe to timer updates');
      return { unsubscribe: () => {
        loggerService.debug('Dummy unsubscribe called for non-existent timer subscription');
      } };
    }

    // Check if already subscribed to this task's timer
    if (this.activeTimerSubscriptions.has(taskId)) {
      loggerService.debug(`Already subscribed to timer updates for task: ${taskId}, returning existing subscription`);
      return this.activeTimerSubscriptions.get(taskId)!;
    }

    loggerService.debug(`Creating new subscription for task timer: ${taskId}`);
    // Subscribe to the task-specific timer channel
    const subscription = this.stompClient.subscribe(`/topic/task/${taskId}/timer`, (message: IMessage) => {
      loggerService.debug(`Received timer update for task: ${taskId}`);
      try {
        const timerUpdate = JSON.parse(message.body) as TimerUpdateDto;
        loggerService.debug(`Timer update details: timerActive=${timerUpdate.timerActive}, remainingTimeMillis=${timerUpdate.remainingTimeMillis}`);
        callback(timerUpdate);
      } catch (error) {
        loggerService.error(`Failed to parse timer update message for task ${taskId}:`, error);
      }
    });

    // Create an object with an unsubscribe method
    const unsubscribeObj = {
      unsubscribe: () => {
        loggerService.debug(`Unsubscribing from timer updates for task: ${taskId}`);
        subscription.unsubscribe();
        this.activeTimerSubscriptions.delete(taskId);
        loggerService.debug(`Successfully unsubscribed from timer updates for task: ${taskId}`);
      }
    };

    // Store the subscription
    this.activeTimerSubscriptions.set(taskId, unsubscribeObj);
    loggerService.info(`Successfully subscribed to timer updates for task: ${taskId}`);

    return unsubscribeObj;
  }

  /**
   * Unsubscribe from timer updates for a specific task
   * @param taskId The ID of the task to unsubscribe from timer updates for
   */
  public unsubscribeFromTaskTimer(taskId: string): void {
    const subscription = this.activeTimerSubscriptions.get(taskId);
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  /**
   * Unsubscribe from all active timer subscriptions
   */
  public unsubscribeFromAllTimers(): void {
    this.activeTimerSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.activeTimerSubscriptions.clear();
  }

  /**
   * Add an event listener for a specific event type
   */
  public addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Remove an event listener for a specific event type
   */
  public removeEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Handle STOMP connect event
   */
  private handleConnect(frame: any): void {
    loggerService.info('STOMP connection established successfully');
    loggerService.debug('STOMP connection frame:', frame);
    this.isConnected.value = true;
    this.reconnectAttempts = 0;

    // Process any pending notification subscription
    if (this.pendingNotificationSubscription) {
      loggerService.info('Processing pending notification subscription');

      // Clear the pending subscription flag
      this.pendingNotificationSubscription = false;

      // Process the pending subscription
      loggerService.debug('Processing queued subscription');
      this.subscribeToNotifications();
    }

    // Emit the connection event
    loggerService.debug('Emitting connection event (connected: true)');
    this.emitEvent('connection', { connected: true });
  }

  /**
   * Handle STOMP error event
   */
  private handleStompError(frame: any): void {
    loggerService.error('STOMP protocol error:', frame);
    this.emitEvent('error', frame);
  }

  /**
   * Handle WebSocket close event
   */
  private handleWebSocketClose(event: CloseEvent): void {
    loggerService.warn(`WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
    this.isConnected.value = false;

    // Emit the disconnection event
    loggerService.debug('Emitting connection event (connected: false)');
    this.emitEvent('connection', { connected: false });

    // Attempt to reconnect if the connection was closed unexpectedly
    if (event.code !== 1000) {
      loggerService.info(`WebSocket closed unexpectedly (code: ${event.code}), attempting to reconnect`);
      this.attemptReconnect();
    } else {
      loggerService.debug('WebSocket closed normally (code: 1000), not attempting to reconnect');
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      loggerService.warn(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached, giving up`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    loggerService.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      loggerService.debug(`Reconnect timeout elapsed, initiating connection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(event: string, data: any): void {
    const listenerCount = this.listeners.has(event) ? this.listeners.get(event)?.length : 0;
    loggerService.debug(`Emitting event: ${event}, listeners: ${listenerCount}`);

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      loggerService.debug(`Found ${callbacks.length} callbacks for event: ${event}`);
      callbacks.forEach((callback, index) => {
        try {
          loggerService.debug(`Executing callback ${index + 1} for event: ${event}`);
          callback(data);
          loggerService.debug(`Callback ${index + 1} executed successfully`);
        } catch (error) {
          loggerService.error(`Error in ${event} event listener (callback ${index + 1}):`, error);
        }
      });
    } else {
      // Only log a warning for events that should always have listeners
      // Connection and error events are common and might not always have listeners
      if (event !== 'connection' && event !== 'error') {
        loggerService.warn(`No callbacks found for event: ${event}`);
      } else {
        loggerService.debug(`No callbacks registered for ${event} event - this is normal if no component needs to handle this event`);
      }
    }
  }
}

// Create a singleton instance of the WebSocket service
export const websocketService = new WebSocketService();

export default websocketService;
