<script lang="ts" setup>
import {ref, onMounted, computed, watch, onUnmounted} from 'vue';
import {useTaskStore} from '../store/task.store';
import {useFriendshipStore} from '../store/friendship.store';
import websocketService from '../services/websocket.service';

import {
  type CreateTaskDto,
  type Friendship,
  type TaskDto, type TimerUpdateDto,
  type UpdateTaskDto
} from '../types/models';

// Import components
import TaskTypeSelector from '../components/TaskTypeSelector.vue';
import TaskSearchField from '../components/TaskSearchField.vue';
import TaskFilterPanel from '../components/TaskFilterPanel.vue';
import TaskList from '../components/TaskList.vue';
import TaskFormDialog from '../components/TaskFormDialog.vue';
import TaskShareDialog from '../components/TaskShareDialog.vue';
import TaskDetailsDialog from '../components/TaskDetailsDialog.vue';

const taskStore = useTaskStore();
const friendshipStore = useFriendshipStore();

// Share task dialog
const shareDialog = ref(false);
const currentTask = ref<TaskDto | null>(null);
const friendships = ref<Friendship[]>([]);

// Task details dialog
const detailsDialog = ref(false);
const selectedTask = ref<TaskDto | null>(null);

// Pomodoro timer
const timerCountdown = ref(0);
const timerInterval = ref<number | null>(null);
const timerSubscription = ref<{ unsubscribe: () => void } | null>(null);
const currentSubscriptionTaskId = ref<string | null>(null);
// Map to track active timers and their remaining time
const activeTimers = ref<Map<string, { remainingTimeMillis: number, timerActive: boolean }>>(new Map());
// Interval for updating active timers in the background
const backgroundTimerInterval = ref<number | null>(null);


// Task form data
const taskDialog = ref(false);
const isEditMode = ref(false);
const currentTaskId = ref('');
const taskForm = ref<CreateTaskDto>({
  name: '',
  description: '',
  dueDate: '',
  urgency: 'MEDIUM'
});

// Task filter
const showCompleted = ref(false);
const searchQuery = ref('');
const urgencyFilter = ref('ALL');
const taskTypeFilter = ref('all'); // Filter for all/owned/shared tasks
const filterPanelOpen = ref(1); // Controls the expansion panel state

// Loading state
const loading = ref(false);

// Computed properties
const filteredTasks = computed(() => {
  // Get tasks based on the selected filter
  let tasks;
  switch (taskTypeFilter.value) {
    case 'owned':
      tasks = [...taskStore.getTasks];
      break;
    case 'shared':
      tasks = [...taskStore.getSharedTasks];
      break;
    default: // 'all'
      tasks = [...taskStore.getAllTasks];
      break;
  }

  // Filter by completion status
  if (!showCompleted.value) {
    tasks = tasks.filter(task => !task.completed);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tasks = tasks.filter(task =>
        task.name.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    );
  }

  // Filter by urgency
  if (urgencyFilter.value !== 'ALL') {
    tasks = tasks.filter(task => task.urgency === urgencyFilter.value);
  }

  // Sort by due date (closest first)
  return [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
});

// Check if a task has an active timer
const hasActiveTimer = (taskId: string) => {
  const timerInfo = activeTimers.value.get(taskId);
  return timerInfo && timerInfo.timerActive;
};

// Get the remaining time for a task
const getTaskRemainingTime = (taskId: string) => {
  const timerInfo = activeTimers.value.get(taskId);
  return timerInfo ? timerInfo.remainingTimeMillis : 0;
};

// Methods
const fetchTasks = async () => {
  loading.value = true;
  try {
    if (taskTypeFilter.value === 'shared') {
      await taskStore.fetchSharedTasks();
    } else {
      // For 'owned' or 'all', use fetchAllTasks with appropriate type
      await taskStore.fetchAllTasks(taskTypeFilter.value === 'all' ? undefined : taskTypeFilter.value);
    }

    // Update activeTimers map with any tasks that have active timers
    const allTasks = [...taskStore.getTasks, ...taskStore.getSharedTasks];
    allTasks.forEach(task => {
      if (task.pomodoroTimeMillis) {
        activeTimers.value.set(task.id, {
          remainingTimeMillis: task.remainingTimeMillis || task.pomodoroTimeMillis,
          timerActive: task.timerActive || false
        });
      }
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  } finally {
    loading.value = false;
  }
};

const fetchFriends = async () => {
  loading.value = true;
  try {
    await friendshipStore.fetchFriends();
    friendships.value = friendshipStore.getFriends;
  } catch (error) {
    console.error('Failed to fetch friends:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateTaskDialog = () => {
  isEditMode.value = false;
  taskForm.value = {
    name: '',
    description: '',
    dueDate: '',
    urgency: 'MEDIUM'
  };
  taskDialog.value = true;
};

const openEditTaskDialog = (task: TaskDto) => {
  isEditMode.value = true;
  currentTaskId.value = task.id;

  // Format the date for inputs if it exists
  let formattedDueDate = '';
  if (task.dueDate) {
    // Create a date object and format it to YYYY-MM-DDThh:mm
    const date = new Date(task.dueDate);
    formattedDueDate = date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
  }

  taskForm.value = {
    name: task.name,
    description: task.description,
    dueDate: formattedDueDate,
    urgency: task.urgency
  };
  taskDialog.value = true;
};

const saveTask = async (task: CreateTaskDto | UpdateTaskDto) => {
  if (!task.name) {
    return;
  }

  loading.value = true;

  try {
    if (isEditMode.value) {
      await taskStore.updateTask(currentTaskId.value, task as UpdateTaskDto);
    } else {
      await taskStore.createTask(task as CreateTaskDto);
    }
    taskDialog.value = false;
  } catch (error) {
    console.error('Failed to save task:', error);
  } finally {
    loading.value = false;
  }
};

const completeTask = async (taskId: string) => {
  loading.value = true;
  try {
    await taskStore.completeTask(taskId);
  } catch (error) {
    console.error('Failed to complete task:', error);
  } finally {
    loading.value = false;
  }
};

const deleteTask = async (taskId: string) => {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  loading.value = true;
  try {
    await taskStore.deleteTask(taskId);
  } catch (error) {
    console.error('Failed to delete task:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format milliseconds to MM:SS display
const formatTimeDisplay = (millis: number) => {
  if (millis <= 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'info';
  }
};

const openShareDialog = (task: TaskDto) => {
  currentTask.value = task;
  fetchFriends();
  shareDialog.value = true;
};

const openTaskDetailsDialog = (task: TaskDto) => {
  selectedTask.value = task;
  detailsDialog.value = true;

  // Initialize timer countdown if task has pomodoro time
  if (selectedTask.value?.pomodoroTimeMillis) {
    // Use the value from activeTimers if available, otherwise use the task's value
    const activeTimer = activeTimers.value.get(selectedTask.value.id);
    if (activeTimer) {
      timerCountdown.value = activeTimer.remainingTimeMillis;
    } else {
      timerCountdown.value = selectedTask.value.remainingTimeMillis || selectedTask.value.pomodoroTimeMillis;
      // Add to active timers map
      activeTimers.value.set(selectedTask.value.id, {
        remainingTimeMillis: timerCountdown.value,
        timerActive: selectedTask.value.timerActive || false
      });
    }
  } else {
    timerCountdown.value = 0;
  }

  // Check if we need to create a new subscription
  // We need a new subscription if:
  // 1. We don't have a subscription yet, or
  // 2. The current subscription is for a different task
  if (!timerSubscription.value || currentSubscriptionTaskId.value !== selectedTask.value?.id) {
    // Unsubscribe from any existing timer subscription
    if (timerSubscription.value) {
      timerSubscription.value.unsubscribe();
      timerSubscription.value = null;
    }

    // Subscribe to timer updates for this task
    if (selectedTask.value) {
      timerSubscription.value = websocketService.subscribeToTaskTimer(selectedTask.value.id, (timerUpdate: TimerUpdateDto) => {
        // Update the timer countdown
        timerCountdown.value = timerUpdate.remainingTimeMillis;

        // Update the active timers map
        activeTimers.value.set(selectedTask.value!.id, {
          remainingTimeMillis: timerUpdate.remainingTimeMillis,
          timerActive: timerUpdate.timerActive
        });

        // Start or stop the timer interval based on the timer active state
        if (timerUpdate.timerActive && !timerInterval.value && detailsDialog.value) {
          startTimerInterval();
        } else if (!timerUpdate.timerActive && timerInterval.value) {
          stopTimerInterval();
        }

        // Update the task's timer state
        if (selectedTask.value && selectedTask.value.id === task.id) {
          selectedTask.value.remainingTimeMillis = timerUpdate.remainingTimeMillis;
          selectedTask.value.timerActive = timerUpdate.timerActive;
        }
      });

      // Update the current subscription task ID
      currentSubscriptionTaskId.value = selectedTask.value.id;
    }
  }

  // Start timer interval if timer is active and not already running
  if (selectedTask.value?.timerActive && !timerInterval.value) {
    startTimerInterval();
  }
};

// Timer methods
const updatePomodoroTime = async (minutes: number) => {
  if (!selectedTask.value || !minutes) return;

  const millis = Math.max(0, Math.min(60, minutes)) * 60 * 1000; // Convert minutes to milliseconds
  console.log('Updating pomodoro time to', millis, 'ms');

  try {
    loading.value = true;
    const timerData: TimerUpdateDto = {
      remainingTimeMillis: millis,
      timerActive: false
    };

    await taskStore.updateTimer(selectedTask.value.id, timerData);
    timerCountdown.value = millis;

    // Update the active timers map
    activeTimers.value.set(selectedTask.value.id, {
      remainingTimeMillis: millis,
      timerActive: false
    });
  } catch (error) {
    console.error('Failed to update pomodoro time:', error);
  } finally {
    loading.value = false;
  }
};

const startTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await taskStore.startTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;

      // Update the active timers map
      if (updatedTask.pomodoroTimeMillis) {
        activeTimers.value.set(taskId, {
          remainingTimeMillis: updatedTask.remainingTimeMillis || updatedTask.pomodoroTimeMillis,
          timerActive: true
        });
      }
    }

    // Subscribe to timer updates when starting a timer
    if (!timerSubscription.value || currentSubscriptionTaskId.value !== taskId) {
      // Unsubscribe from any existing timer subscription
      if (timerSubscription.value) {
        timerSubscription.value.unsubscribe();
        timerSubscription.value = null;
      }

      // Subscribe to timer updates for this task
      timerSubscription.value = websocketService.subscribeToTaskTimer(taskId, (timerUpdate: TimerUpdateDto) => {
        // Update the active timers map
        activeTimers.value.set(taskId, {
          remainingTimeMillis: timerUpdate.remainingTimeMillis,
          timerActive: timerUpdate.timerActive
        });

        // Update the timer countdown if this is the selected task
        if (selectedTask.value && selectedTask.value.id === taskId) {
          timerCountdown.value = timerUpdate.remainingTimeMillis;
          selectedTask.value.remainingTimeMillis = timerUpdate.remainingTimeMillis;
          selectedTask.value.timerActive = timerUpdate.timerActive;

          // Start or stop the timer interval based on the timer active state
          if (timerUpdate.timerActive && !timerInterval.value && detailsDialog.value) {
            startTimerInterval();
          } else if (!timerUpdate.timerActive && timerInterval.value) {
            stopTimerInterval();
          }
        }
      });

      // Update the current subscription task ID
      currentSubscriptionTaskId.value = taskId;
    }

    startTimerInterval();
  } catch (error) {
    console.error('Failed to start timer:', error);
  } finally {
    loading.value = false;
  }
};

const pauseTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await taskStore.pauseTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;

      // Update the active timers map
      if (updatedTask.pomodoroTimeMillis) {
        activeTimers.value.set(taskId, {
          remainingTimeMillis: updatedTask.remainingTimeMillis || timerCountdown.value,
          timerActive: false
        });
      }
    }

    // Keep the subscription active even when pausing a timer
    // This ensures we continue to receive updates if the timer is started again (by us or another user)

    stopTimerInterval();
  } catch (error) {
    console.error('Failed to pause timer:', error);
  } finally {
    loading.value = false;
  }
};

const resetTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await taskStore.resetTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;

      // Reset the countdown to the full pomodoro time
      if (selectedTask.value.pomodoroTimeMillis) {
        timerCountdown.value = selectedTask.value.pomodoroTimeMillis;

        // Update the active timers map
        activeTimers.value.set(taskId, {
          remainingTimeMillis: selectedTask.value.pomodoroTimeMillis,
          timerActive: false
        });
      }
    }

    // Keep the subscription active even when resetting a timer
    // This ensures we continue to receive updates if the timer is started again (by us or another user)

    stopTimerInterval();
  } catch (error) {
    console.error('Failed to reset timer:', error);
  } finally {
    loading.value = false;
  }
};

const startTimerInterval = () => {
  // Clear any existing interval
  stopTimerInterval();

  // Start a new interval that decrements the countdown every 100 milliseconds
  // but only if the timer is active
  timerInterval.value = window.setInterval(() => {
    // Only decrement the countdown if the timer is active
    if (selectedTask.value && selectedTask.value.timerActive && timerCountdown.value > 0) {
      // Decrement by 100 milliseconds
      timerCountdown.value = Math.max(0, timerCountdown.value - 100);

      // Update the active timers map
      if (selectedTask.value.pomodoroTimeMillis) {
        activeTimers.value.set(selectedTask.value.id, {
          remainingTimeMillis: timerCountdown.value,
          timerActive: true
        });
      }
    } else if (timerCountdown.value <= 0) {
      // Timer reached zero
      stopTimerInterval();
      if (selectedTask.value) {
        taskStore.pauseTimer(selectedTask.value.id).catch(error => {
          console.error('Failed to pause timer at completion:', error);
        });

        // Update the active timers map
        if (selectedTask.value.pomodoroTimeMillis) {
          activeTimers.value.set(selectedTask.value.id, {
            remainingTimeMillis: 0,
            timerActive: false
          });
        }
      }
    }
  }, 100); // Run every 100 milliseconds for smoother updates
};

const stopTimerInterval = () => {
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;

    // Update the active timers map if a task is selected
    if (selectedTask.value && selectedTask.value.pomodoroTimeMillis) {
      activeTimers.value.set(selectedTask.value.id, {
        remainingTimeMillis: timerCountdown.value,
        timerActive: selectedTask.value.timerActive || false
      });
    }
  }
};

const shareTask = async (username: string) => {
  if (!username || !currentTask.value) {
    return;
  }

  loading.value = true;
  try {
    await taskStore.shareTask(currentTask.value.id, username);

    // Update the currentTask after sharing
    if (currentTask.value) {
      // Find the task in the filtered tasks
      const updatedTask = filteredTasks.value.find(task => task.id === currentTask.value?.id);
      if (updatedTask) {
        currentTask.value = updatedTask;
      }
    }
  } catch (error) {
    console.error('Failed to share task:', error);
  } finally {
    loading.value = false;
  }
};

const unshareTask = async (taskId: string, username: string) => {
  loading.value = true;
  try {
    await taskStore.unshareTask(taskId, username);

    // Update the currentTask if it's the one being unshared
    if (currentTask.value && currentTask.value.id === taskId) {
      // Find the task in the filtered tasks
      const updatedTask = filteredTasks.value.find(task => task.id === taskId);
      if (updatedTask) {
        currentTask.value = updatedTask;
      }
    }
  } catch (error) {
    console.error('Failed to unshare task:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for changes in the task type filter
watch(taskTypeFilter, (_) => {
  fetchTasks();
});

// Watch for dialog close
watch(detailsDialog, (isOpen) => {
  if (!isOpen) {
    // Stop the timer interval but don't unsubscribe from timer updates
    // This allows the timer to continue running in the background
    // but prevents unnecessary UI updates when the dialog is closed
    stopTimerInterval();

    // Save the current timer state to the activeTimers map
    if (selectedTask.value && selectedTask.value.pomodoroTimeMillis) {
      activeTimers.value.set(selectedTask.value.id, {
        remainingTimeMillis: timerCountdown.value,
        timerActive: selectedTask.value.timerActive || false
      });
    }

    console.log('Detail dialog closed, timer continues in background');
  } else if (selectedTask.value?.timerActive) {
    // If reopening the dialog and the timer is active, restart the interval
    startTimerInterval();
  }
});

// Background timer methods
const startBackgroundTimerInterval = () => {
  // Clear any existing background interval
  stopBackgroundTimerInterval();

  // Start a new interval that decrements active timers every 100 milliseconds
  backgroundTimerInterval.value = window.setInterval(() => {
    // Update each active timer
    activeTimers.value.forEach((timer, taskId) => {
      if (timer.timerActive && timer.remainingTimeMillis > 0) {
        // Decrement the timer by 100 milliseconds
        timer.remainingTimeMillis = Math.max(0, timer.remainingTimeMillis - 100);

        // Update the map
        activeTimers.value.set(taskId, timer);

        // If the timer reaches zero, mark it as inactive
        if (timer.remainingTimeMillis <= 0) {
          timer.timerActive = false;
          activeTimers.value.set(taskId, timer);

          // Notify the backend that the timer has completed
          taskStore.pauseTimer(taskId).catch(error => {
            console.error('Failed to pause timer at completion:', error);
          });
        }
      }
    });
  }, 100); // Run every 100 milliseconds for smoother updates
};

const stopBackgroundTimerInterval = () => {
  if (backgroundTimerInterval.value !== null) {
    clearInterval(backgroundTimerInterval.value);
    backgroundTimerInterval.value = null;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Initialize with the default filter (all)
  taskTypeFilter.value = 'all';
  fetchTasks().then(() => {
    // Subscribe to active timers when reopening the app
    const allTasks = [...taskStore.getTasks, ...taskStore.getSharedTasks];
    const activeTimerTasks = allTasks.filter(task => task.timerActive && task.pomodoroTimeMillis);

    console.log(`Found ${activeTimerTasks.length} active timers to subscribe to`);

    // Subscribe to each active timer
    activeTimerTasks.forEach(task => {
      // Only subscribe if we're not already subscribed to this task
      if (!timerSubscription.value || currentSubscriptionTaskId.value !== task.id) {
        const subscription = websocketService.subscribeToTaskTimer(task.id, (timerUpdate: TimerUpdateDto) => {
          // Update the active timers map
          activeTimers.value.set(task.id, {
            remainingTimeMillis: timerUpdate.remainingTimeMillis,
            timerActive: timerUpdate.timerActive
          });

          // Update the task in the store if it's the selected task
          if (selectedTask.value && selectedTask.value.id === task.id) {
            selectedTask.value.remainingTimeMillis = timerUpdate.remainingTimeMillis;
            selectedTask.value.timerActive = timerUpdate.timerActive;
            timerCountdown.value = timerUpdate.remainingTimeMillis;

            // Start or stop the timer interval based on the timer active state
            if (timerUpdate.timerActive && !timerInterval.value && detailsDialog.value) {
              startTimerInterval();
            } else if (!timerUpdate.timerActive && timerInterval.value) {
              stopTimerInterval();
            }
          }
        });

        // Store the subscription for the most recently active timer
        if (!timerSubscription.value) {
          timerSubscription.value = subscription;
          currentSubscriptionTaskId.value = task.id;
        }
      }
    });
  });

  // Start the background timer interval
  startBackgroundTimerInterval();
});

// Clean up when component is unmounted
onUnmounted(() => {
  // Stop the timer intervals
  stopTimerInterval();
  stopBackgroundTimerInterval();

  // Unsubscribe from timer updates when component is unmounted
  // This prevents memory leaks and unnecessary network traffic
  if (timerSubscription.value) {
    timerSubscription.value.unsubscribe();
    timerSubscription.value = null;
    currentSubscriptionTaskId.value = null;
  }

  // Save the current timer state if a task is selected
  if (selectedTask.value && selectedTask.value.pomodoroTimeMillis) {
    activeTimers.value.set(selectedTask.value.id, {
      remainingTimeMillis: timerCountdown.value,
      timerActive: selectedTask.value.timerActive || false
    });
  }

  console.log('Component unmounted, timer subscriptions cleaned up');
});
</script>

<template>
  <div>
    <!-- Task Type Selector -->
    <TaskTypeSelector v-model="taskTypeFilter" />

    <!-- Search Field - Always visible -->
    <TaskSearchField v-model="searchQuery" />

    <!-- Filters - Collapsible -->
    <TaskFilterPanel 
      v-model:urgencyFilter="urgencyFilter"
      v-model:showCompleted="showCompleted"
      v-model:panelOpen="filterPanelOpen"
    />

    <!-- Task List -->
    <TaskList
      :tasks="filteredTasks"
      :loading="loading"
      :has-active-timer="hasActiveTimer"
      :get-task-remaining-time="getTaskRemainingTime"
      @complete="completeTask"
      @view-details="openTaskDetailsDialog"
    />

    <!-- Add Task FAB -->
    <v-btn
        :disabled="loading"
        class="add-task-btn"
        color="primary"
        icon="mdi-plus"
        size="large"
        @click="openCreateTaskDialog"
    ></v-btn>

    <!-- Task Form Dialog -->
    <TaskFormDialog
      v-model="taskDialog"
      :is-edit-mode="isEditMode"
      :loading="loading"
      :task="taskForm"
      @save="saveTask"
    />

    <!-- Share Task Dialog -->
    <TaskShareDialog
      v-model="shareDialog"
      :task="currentTask"
      :friendships="friendships"
      :loading="loading"
      @share="shareTask"
      @unshare="unshareTask"
      @fetch-friends="fetchFriends"
    />

    <!-- Task Details Dialog -->
    <TaskDetailsDialog
      v-model="detailsDialog"
      :task="selectedTask"
      :timer-countdown="timerCountdown"
      :loading="loading"
      @edit="openEditTaskDialog"
      @share="openShareDialog"
      @delete="deleteTask"
      @start-timer="startTimer"
      @pause-timer="pauseTimer"
      @reset-timer="resetTimer"
      @update-pomodoro="updatePomodoroTime"
    />
  </div>
</template>

<style scoped>
.add-task-btn {
  position: fixed;
  bottom: 70px;
  right: 16px;
}
</style>
