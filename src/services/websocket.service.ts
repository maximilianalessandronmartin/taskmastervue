import { ref } from 'vue';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import type { Notification, NotificationDto, TimerUpdateDto } from '../types/models';
import { useNotificationStore } from '../store/notification.store';


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

  // Reactive state for connection status
  public isConnected = ref(false);
  public notifications = ref<Notification[]>([]);

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('STOMP client is already connected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      // Create a new SockJS instance
      const socket = new SockJS(`${SOCKET_BASE_URL}/ws`, null, { 
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      });

      // Create a new STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${token}` // Token for authentication
        },
        debug: function (str) {
          console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      // Set up connection event handlers
      this.stompClient.onConnect = this.handleConnect.bind(this);
      this.stompClient.onStompError = this.handleStompError.bind(this);
      this.stompClient.onWebSocketClose = this.handleWebSocketClose.bind(this);

      // Activate the STOMP client
      this.stompClient.activate();
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.stompClient) {
      // Unsubscribe from all active timer subscriptions
      this.unsubscribeFromAllTimers();

      // Deactivate the STOMP client
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected.value = false;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to notifications for a specific user
   * @param userEmail The email of the user to subscribe to notifications for
   */
  public subscribeToNotifications(userEmail: string): void {
    console.log(`Subscribing to notifications for user: ${userEmail}`);

    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP client is not connected');
      return;
    }

    console.log('STOMP client is connected, proceeding with subscription');

    // Get the notification store
    const notificationStore = useNotificationStore();
    console.log('Got notification store instance');

    // Subscribe to the user-specific notification channel
    console.log(`Subscribing to channel: /user/${userEmail}/queue/notifications`);
    const subscription = this.stompClient.subscribe(`/user/${userEmail}/queue/notifications`, (message: IMessage) => {
      console.log('Raw notification message received:', message.body);

      try {
        const notificationDto = JSON.parse(message.body) as NotificationDto;
        console.log('Received notification:', notificationDto);

        // Convert NotificationDto to Notification using the store's method
        const notification = notificationStore.convertDtoToNotification(notificationDto);
        console.log('Converted notification:', notification);

        // Store the notification in our local array
        console.log('Current local notifications count:', this.notifications.value.length);
        this.notifications.value = [...this.notifications.value, notification];
        console.log('Updated local notifications count:', this.notifications.value.length);

        // We'll only emit the event and let the store handle it through its listener
        // This avoids potentially calling handleNewNotification twice
        console.log('Emitting notification event');
        this.emitEvent('notification', notification);
      } catch (error) {
        console.error('Failed to parse notification message:', error);
      }
    });

    console.log('Subscription created successfully:', subscription.id);
  }

  /**
   * Subscribe to timer updates for a specific task
   * @param taskId The ID of the task to subscribe to timer updates for
   * @param callback The callback function to call when a timer update is received
   * @returns An object with an unsubscribe method
   */
  public subscribeToTaskTimer(taskId: string, callback: (timerUpdate: TimerUpdateDto) => void): { unsubscribe: () => void } {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP client is not connected');
      return { unsubscribe: () => {} };
    }

    // Check if already subscribed to this task's timer
    if (this.activeTimerSubscriptions.has(taskId)) {
      return this.activeTimerSubscriptions.get(taskId)!;
    }

    // Subscribe to the task-specific timer channel
    const subscription = this.stompClient.subscribe(`/topic/task/${taskId}/timer`, (message: IMessage) => {
      try {
        const timerUpdate = JSON.parse(message.body) as TimerUpdateDto;
        callback(timerUpdate);
      } catch (error) {
        console.error('Failed to parse timer update message:', error);
      }
    });

    // Create an object with an unsubscribe method
    const unsubscribeObj = {
      unsubscribe: () => {
        subscription.unsubscribe();
        this.activeTimerSubscriptions.delete(taskId);
      }
    };

    // Store the subscription
    this.activeTimerSubscriptions.set(taskId, unsubscribeObj);

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
    console.log('STOMP connection established:', frame);
    this.isConnected.value = true;
    this.reconnectAttempts = 0;

    // Emit the connection event
    this.emitEvent('connection', { connected: true });
  }

  /**
   * Handle STOMP error event
   */
  private handleStompError(frame: any): void {
    console.error('STOMP error:', frame);
    this.emitEvent('error', frame);
  }

  /**
   * Handle WebSocket close event
   */
  private handleWebSocketClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected.value = false;

    // Emit the disconnection event
    this.emitEvent('connection', { connected: false });

    // Attempt to reconnect if the connection was closed unexpectedly
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(event: string, data: any): void {
    console.log(`Emitting event: ${event}, listeners:`, this.listeners.has(event) ? this.listeners.get(event)?.length : 0);

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      console.log(`Found ${callbacks.length} callbacks for event: ${event}`);
      callbacks.forEach((callback, index) => {
        try {
          console.log(`Executing callback ${index + 1} for event: ${event}`);
          callback(data);
          console.log(`Callback ${index + 1} executed successfully`);
        } catch (error) {
          console.error(`Error in ${event} event listener (callback ${index + 1}):`, error);
        }
      });
    } else {
      // Only log a warning for events that should always have listeners
      // Connection and error events are common and might not always have listeners
      if (event !== 'connection' && event !== 'error') {
        console.warn(`No callbacks found for event: ${event}`);
      } else {
        console.log(`No callbacks registered for ${event} event - this is normal if no component needs to handle this event`);
      }
    }
  }
}

// Create a singleton instance of the WebSocket service
export const websocketService = new WebSocketService();

export default websocketService;
