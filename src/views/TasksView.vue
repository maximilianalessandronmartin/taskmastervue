<script lang="ts" setup>
import {ref, onMounted, computed, watch, onUnmounted} from 'vue';
import {useTaskStore} from '../store/task.store';
import timerService from '../services/timer.service';
import taskSharingService from '../services/task-sharing.service';
import { formatDate, formatTime, formatTimeDisplay, getUrgencyColor } from '../utils/formatters';

import {
  type CreateTaskDto,
  type TaskDto,
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

// Share task dialog
const shareDialog = ref(false);
const currentTask = ref<TaskDto | null>(null);

// Task details dialog
const detailsDialog = ref(false);
const selectedTask = ref<TaskDto | null>(null);

// Pomodoro timer
const timerCountdown = ref(0);


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
  return timerService.hasActiveTimer(taskId);
};

// Get the remaining time for a task
const getTaskRemainingTime = (taskId: string) => {
  return timerService.getTaskRemainingTime(taskId);
};

// Methods
const fetchTasks = async () => {
  loading.value = true;
  try {
    // Check if we already have tasks loaded
    const hasExistingTasks = taskStore.getTasks.length > 0 || taskStore.getSharedTasks.length > 0;

    if (hasExistingTasks) {
      console.log('Tasks already loaded, reconnecting to active timers');
      // If tasks are already loaded, just reconnect to active timers
      timerService.reconnectToActiveTimers();
    } else {
      // Otherwise, fetch tasks from the server
      if (taskTypeFilter.value === 'shared') {
        await taskStore.fetchSharedTasks();
      } else {
        // For 'owned' or 'all', use fetchAllTasks with appropriate type
        await taskStore.fetchAllTasks(taskTypeFilter.value === 'all' ? undefined : taskTypeFilter.value);
      }

      // Initialize timers with the fetched tasks
      const allTasks = [...taskStore.getTasks, ...taskStore.getSharedTasks];
      timerService.initializeTimers(allTasks);
    }
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  } finally {
    loading.value = false;
  }
};

const fetchFriends = async () => {
  try {
    await taskSharingService.fetchFriends();
  } catch (error) {
    console.error('Failed to fetch friends:', error);
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
    // Get the remaining time from the timer service
    timerCountdown.value = timerService.getTaskRemainingTime(selectedTask.value.id);
  } else {
    timerCountdown.value = 0;
  }

  // We don't need to subscribe to timer updates here anymore
  // Active timers are already subscribed to in the timer service
};

// Timer methods
const updatePomodoroTime = async (minutes: number) => {
  if (!selectedTask.value || !minutes) return;

  try {
    const updatedTask = await timerService.updatePomodoroTime(selectedTask.value.id, minutes);
    if (selectedTask.value) {
      selectedTask.value = updatedTask;
      timerCountdown.value = updatedTask.pomodoroTimeMillis || 0;
    }
  } catch (error) {
    console.error('Failed to update pomodoro time:', error);
  }
};

const startTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await timerService.startTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;
      timerCountdown.value = updatedTask.remainingTimeMillis || updatedTask.pomodoroTimeMillis || 0;
    }
  } catch (error) {
    console.error('Failed to start timer:', error);
  } finally {
    loading.value = false;
  }
};

const pauseTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await timerService.pauseTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;
      timerCountdown.value = updatedTask.remainingTimeMillis || 0;
    }
  } catch (error) {
    console.error('Failed to pause timer:', error);
  } finally {
    loading.value = false;
  }
};

const resetTimer = async (taskId: string) => {
  try {
    loading.value = true;
    const updatedTask = await timerService.resetTimer(taskId);
    if (selectedTask.value && selectedTask.value.id === taskId) {
      selectedTask.value = updatedTask;
      timerCountdown.value = updatedTask.pomodoroTimeMillis || 0;
    }
  } catch (error) {
    console.error('Failed to reset timer:', error);
  } finally {
    loading.value = false;
  }
};

// Timer interval methods have been moved to the timer service

const shareTask = async (username: string) => {
  if (!username || !currentTask.value) {
    return;
  }

  try {
    await taskSharingService.shareTask(currentTask.value.id, username);

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
  }
};

const unshareTask = async (taskId: string, username: string) => {
  try {
    await taskSharingService.unshareTask(taskId, username);

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
  }
};

// Watch for changes in the task type filter
watch(taskTypeFilter, (_) => {
  fetchTasks();
});

// Watch for dialog close
watch(detailsDialog, (isOpen) => {
  if (!isOpen && selectedTask.value) {
    // We don't need to unsubscribe from timer updates here anymore
    // We want to stay subscribed to all active timers
    console.log('Detail dialog closed');
  }
});

// Watch for changes in active timers to update the timer countdown for the selected task
watch(() => timerService.getActiveTimers().value, (activeTimers) => {
  if (selectedTask.value && detailsDialog.value) {
    const taskId = selectedTask.value.id;
    const timerInfo = activeTimers.get(taskId);

    if (timerInfo) {
      // Update the timer countdown
      timerCountdown.value = timerInfo.remainingTimeMillis;

      // Update the task's timer state
      selectedTask.value.remainingTimeMillis = timerInfo.remainingTimeMillis;
      selectedTask.value.timerActive = timerInfo.timerActive;
    }
  }
}, { deep: true });

// Track when the document became hidden
let documentHiddenTime: number | null = null;

// Handle visibility change (when tab becomes visible again or app is reopened)
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // Store the time when the document became hidden
    documentHiddenTime = Date.now();
  } else if (document.visibilityState === 'visible') {
    console.log('Document became visible, reconnecting to active timers');

    // If the document was hidden for more than 30 seconds, refresh the task data
    if (documentHiddenTime && (Date.now() - documentHiddenTime > 30000)) {
      console.log('Document was hidden for more than 30 seconds, refreshing task data');
      // Fetch tasks to get the latest data
      fetchTasks();
    } else {
      // Otherwise, just reconnect to active timers
      timerService.reconnectToActiveTimers();
    }

    // Reset the hidden time
    documentHiddenTime = null;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Initialize with the default filter (all)
  taskTypeFilter.value = 'all';
  fetchTasks();

  // Add visibility change event listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// Clean up when component is unmounted
onUnmounted(() => {
  // Clean up timer service resources
  timerService.cleanup();

  // Remove visibility change event listener
  document.removeEventListener('visibilitychange', handleVisibilityChange);

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
      :friendships="taskSharingService.getFriendships().value"
      :loading="taskSharingService.getLoading().value"
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
