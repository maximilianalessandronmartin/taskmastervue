import { ref } from 'vue';
import { type TaskDto, type TimerUpdateDto } from '../types/models';
import websocketService from './websocket.service';
import taskService from './task.service';

/**
 * Service for managing task timers
 */
class TimerService {
  // Map to track active timers and their remaining time
  private activeTimers = ref<Map<string, { remainingTimeMillis: number, timerActive: boolean }>>(new Map());

  // Map to track timer subscriptions for each task
  private timerSubscriptions = new Map<string, { unsubscribe: () => void }>();

  // Map to track callbacks for each task
  private timerCallbacks = new Map<string, (timerUpdate: TimerUpdateDto) => void>();

  // Background timer interval for updating timers in the background
  private backgroundTimerInterval: number | null = null;

  constructor() {
    // Start the background timer interval when the service is created
    this.startBackgroundTimerInterval();
  }

  /**
   * Get the active timers map
   */
  public getActiveTimers() {
    return this.activeTimers;
  }

  /**
   * Check if a task has an active timer
   * @param taskId The ID of the task to check
   * @returns True if the task has an active timer, false otherwise
   */
  public hasActiveTimer(taskId: string): boolean {
    const timerInfo = this.activeTimers.value.get(taskId);
    return timerInfo ? timerInfo.timerActive : false;
  }

  /**
   * Get the remaining time for a task
   * @param taskId The ID of the task to get the remaining time for
   * @returns The remaining time in milliseconds, or 0 if the task has no timer
   */
  public getTaskRemainingTime(taskId: string): number {
    const timerInfo = this.activeTimers.value.get(taskId);
    return timerInfo ? timerInfo.remainingTimeMillis : 0;
  }

  /**
   * Initialize timers from a list of tasks
   * @param tasks The list of tasks to initialize timers from
   */
  public initializeTimers(tasks: TaskDto[]): void {
    // Update activeTimers map with any tasks that have active timers
    tasks.forEach(task => {
      if (task.pomodoroTimeMillis) {
        this.activeTimers.value.set(task.id, {
          remainingTimeMillis: task.remainingTimeMillis || task.pomodoroTimeMillis,
          timerActive: task.timerActive || false
        });
      }
    });

    // Subscribe to active timers
    const activeTimerTasks = tasks.filter(task => task.timerActive && task.pomodoroTimeMillis);
    console.log(`Found ${activeTimerTasks.length} active timers to subscribe to`);

    // Subscribe to each active timer
    activeTimerTasks.forEach(task => {
      this.subscribeToTaskTimer(task.id);
    });
  }

  /**
   * Reconnect to all active timers
   * This is useful when returning to the tasks screen or reopening the app
   */
  public reconnectToActiveTimers(): void {
    console.log('Reconnecting to active timers');

    // Get all tasks with active timers from the activeTimers map
    const activeTimerTaskIds = Array.from(this.activeTimers.value.entries())
      .filter(([_, timerInfo]) => timerInfo.timerActive)
      .map(([taskId, _]) => taskId);

    console.log(`Found ${activeTimerTaskIds.length} active timers to reconnect to`);

    // Unsubscribe from all timers first to avoid duplicate subscriptions
    this.unsubscribeFromAllTimers();

    // Subscribe to each active timer
    activeTimerTaskIds.forEach(taskId => {
      this.subscribeToTaskTimer(taskId);
    });
  }

  /**
   * Subscribe to timer updates for a task
   * @param taskId The ID of the task to subscribe to timer updates for
   * @param callback Optional callback function to call when a timer update is received
   * @returns The subscription object
   */
  public subscribeToTaskTimer(taskId: string, callback?: (timerUpdate: TimerUpdateDto) => void): { unsubscribe: () => void } {
    // Only subscribe if we're not already subscribed to this task
    if (this.timerSubscriptions.has(taskId)) {
      // If we already have a subscription for this task, update the callback if provided
      if (callback) {
        this.timerCallbacks.set(taskId, callback);
      }
      return this.timerSubscriptions.get(taskId)!;
    }

    // Subscribe to timer updates for this task
    const subscription = websocketService.subscribeToTaskTimer(taskId, (timerUpdate: TimerUpdateDto) => {
      // Update the active timers map
      this.activeTimers.value.set(taskId, {
        remainingTimeMillis: timerUpdate.remainingTimeMillis,
        timerActive: timerUpdate.timerActive
      });

      // Call the callback if provided
      if (callback) {
        callback(timerUpdate);
      }
    });

    // Store the subscription and callback in the maps
    this.timerSubscriptions.set(taskId, subscription);
    if (callback) {
      this.timerCallbacks.set(taskId, callback);
    }

    return subscription;
  }

  /**
   * Get the callback for a task
   * @param taskId The ID of the task to get the callback for
   * @returns The callback function or undefined if no callback is registered
   */
  private getCallbackForTask(taskId: string): ((timerUpdate: TimerUpdateDto) => void) | undefined {
    return this.timerCallbacks.get(taskId);
  }

  /**
   * Unsubscribe from timer updates for a specific task
   * @param taskId The ID of the task to unsubscribe from
   */
  public unsubscribeFromTask(taskId: string): void {
    const subscription = this.timerSubscriptions.get(taskId);
    if (subscription) {
      subscription.unsubscribe();
      this.timerSubscriptions.delete(taskId);
      this.timerCallbacks.delete(taskId);
    }
  }

  /**
   * Unsubscribe from all timer subscriptions
   */
  public unsubscribeFromAllTimers(): void {
    this.timerSubscriptions.forEach((subscription, _) => {
      subscription.unsubscribe();
    });
    this.timerSubscriptions.clear();
    this.timerCallbacks.clear();
  }

  /**
   * Update the pomodoro time for a task
   * @param taskId The ID of the task to update the pomodoro time for
   * @param minutes The number of minutes to set the pomodoro time to
   * @returns Promise with the updated task
   */
  public async updatePomodoroTime(taskId: string, minutes: number): Promise<TaskDto> {
    if (!minutes) return Promise.reject(new Error('Minutes must be greater than 0'));

    const millis = Math.max(0, Math.min(60, minutes)) * 60 * 1000; // Convert minutes to milliseconds
    console.log('Updating pomodoro time to', millis, 'ms');

    const timerData: TimerUpdateDto = {
      remainingTimeMillis: millis,
      timerActive: false
    };

    const updatedTask = await taskService.updateTimer(taskId, timerData);

    // Update the active timers map
    this.activeTimers.value.set(taskId, {
      remainingTimeMillis: millis,
      timerActive: false
    });

    return updatedTask;
  }

  /**
   * Start the timer for a task
   * @param taskId The ID of the task to start the timer for
   * @returns Promise with the updated task
   */
  public async startTimer(taskId: string): Promise<TaskDto> {
    const updatedTask = await taskService.startTimer(taskId);

    // Update the active timers map
    if (updatedTask.pomodoroTimeMillis) {
      this.activeTimers.value.set(taskId, {
        remainingTimeMillis: updatedTask.remainingTimeMillis || updatedTask.pomodoroTimeMillis,
        timerActive: true
      });
    }

    // Subscribe to timer updates when starting a timer
    this.subscribeToTaskTimer(taskId);

    return updatedTask;
  }

  /**
   * Pause the timer for a task
   * @param taskId The ID of the task to pause the timer for
   * @returns Promise with the updated task
   */
  public async pauseTimer(taskId: string): Promise<TaskDto> {
    const updatedTask = await taskService.pauseTimer(taskId);

    // Update the active timers map
    if (updatedTask.pomodoroTimeMillis) {
      this.activeTimers.value.set(taskId, {
        remainingTimeMillis: updatedTask.remainingTimeMillis || this.getTaskRemainingTime(taskId),
        timerActive: false
      });
    }

    // Keep the subscription active even when pausing a timer
    // This ensures we continue to receive updates if the timer is started again (by us or another user)

    return updatedTask;
  }

  /**
   * Reset the timer for a task
   * @param taskId The ID of the task to reset the timer for
   * @returns Promise with the updated task
   */
  public async resetTimer(taskId: string): Promise<TaskDto> {
    const updatedTask = await taskService.resetTimer(taskId);

    // Reset the countdown to the full pomodoro time
    if (updatedTask.pomodoroTimeMillis) {
      // Update the active timers map
      this.activeTimers.value.set(taskId, {
        remainingTimeMillis: updatedTask.pomodoroTimeMillis,
        timerActive: false
      });
    }

    // Keep the subscription active even when resetting a timer
    // This ensures we continue to receive updates if the timer is started again (by us or another user)

    return updatedTask;
  }

  /**
   * Start the background timer interval
   */
  private startBackgroundTimerInterval(): void {
    // Clear any existing background interval
    this.stopBackgroundTimerInterval();

    // Start a new interval that decrements active timers every 100 milliseconds
    this.backgroundTimerInterval = window.setInterval(() => {
      // Update each active timer
      this.activeTimers.value.forEach((timer, taskId) => {
        if (timer.timerActive && timer.remainingTimeMillis > 0) {
          // Decrement the timer by 100 milliseconds
          timer.remainingTimeMillis = Math.max(0, timer.remainingTimeMillis - 100);

          // Update the map
          this.activeTimers.value.set(taskId, timer);

          // Notify any subscribers about the timer update
          const subscription = this.timerSubscriptions.get(taskId);
          if (subscription) {
            // Create a timer update object
            const timerUpdate: TimerUpdateDto = {
              remainingTimeMillis: timer.remainingTimeMillis,
              timerActive: timer.timerActive
            };

            // Call the callback with the timer update
            // This will update any UI components that are displaying this timer
            const callback = this.getCallbackForTask(taskId);
            if (callback) {
              callback(timerUpdate);
            }
          }

          // If the timer reaches zero, mark it as inactive
          if (timer.remainingTimeMillis <= 0) {
            timer.timerActive = false;
            this.activeTimers.value.set(taskId, timer);

            // Notify the backend that the timer has completed
            taskService.pauseTimer(taskId).catch(error => {
              console.error('Failed to pause timer at completion:', error);
            });
          }
        }
      });
    }, 100); // Run every 100 milliseconds for smoother updates
  }

  /**
   * Stop the background timer interval
   */
  private stopBackgroundTimerInterval(): void {
    if (this.backgroundTimerInterval !== null) {
      clearInterval(this.backgroundTimerInterval);
      this.backgroundTimerInterval = null;
    }
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  public cleanup(): void {
    // Stop the background timer interval
    this.stopBackgroundTimerInterval();

    // Unsubscribe from all timer updates
    this.unsubscribeFromAllTimers();
  }
}

// Create a singleton instance of the timer service
export const timerService = new TimerService();

export default timerService;
