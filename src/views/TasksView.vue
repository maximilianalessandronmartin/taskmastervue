<script lang="ts" setup>
import {ref, onMounted, computed, watch} from 'vue';
import {useTaskStore} from '../store/task.store';
import {useFriendshipStore} from '../store/friendship.store';

import {
  type CreateTaskDto,
  type Friendship,
  type TaskDto,
  type UpdateTaskDto
} from '../types/models';

const taskStore = useTaskStore();
const friendshipStore = useFriendshipStore();

// Share task dialog
const shareDialog = ref(false);
const shareTaskId = ref('');
const shareUsername = ref('');
const currentTask = ref<TaskDto | null>(null);
const friendships = ref<Friendship[]>([]);

// Task details dialog
const detailsDialog = ref(false);
const selectedTask = ref<TaskDto | null>(null);


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
// Separate date and time for better UX
const taskDate = ref('');
const taskTime = ref('');

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
  // Reset date and time fields
  taskDate.value = '';
  taskTime.value = '';
  taskDialog.value = true;
};

const openEditTaskDialog = (task: TaskDto) => {
  isEditMode.value = true;
  currentTaskId.value = task.id;

  // Format the date for date and time inputs if it exists
  let formattedDueDate = '';
  if (task.dueDate) {
    // Create a date object and format it to YYYY-MM-DDThh:mm
    const date = new Date(task.dueDate);
    formattedDueDate = date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm

    // Split into date and time components
    taskDate.value = formattedDueDate.split('T')[0]; // YYYY-MM-DD
    taskTime.value = formattedDueDate.split('T')[1]; // hh:mm
  } else {
    taskDate.value = '';
    taskTime.value = '';
  }

  taskForm.value = {
    name: task.name,
    description: task.description,
    dueDate: formattedDueDate,
    urgency: task.urgency
  };
  taskDialog.value = true;
};

const saveTask = async () => {
  if (!taskForm.value.name) {
    return;
  }

  loading.value = true;

  try {
    // Combine date and time if both are provided
    if (taskDate.value && taskTime.value) {
      taskForm.value.dueDate = `${taskDate.value}T${taskTime.value}`;
    } else if (taskDate.value) {
      // If only date is provided, set time to start of day
      taskForm.value.dueDate = `${taskDate.value}T00:00`;
    } else {
      // If no date is provided, clear the due date
      taskForm.value.dueDate = '';
    }

    if (isEditMode.value) {
      await taskStore.updateTask(currentTaskId.value, taskForm.value as UpdateTaskDto);
    } else {
      await taskStore.createTask(taskForm.value);
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
  shareTaskId.value = task.id;
  shareUsername.value = '';
  currentTask.value = task;
  fetchFriends();
  shareDialog.value = true;
};

const openTaskDetailsDialog = (task: TaskDto) => {
  selectedTask.value = task;
  detailsDialog.value = true;
};

const shareTask = async () => {
  // Überprüfen Sie, ob shareUsername.value einen Wert hat
  if (!shareUsername.value || !shareTaskId.value) {
    return;
  }

  loading.value = true;
  try {
    // Nehmen wir an, dass shareUsername.value nun direkt den Benutzernamen enthält
    await taskStore.shareTask(shareTaskId.value, shareUsername.value);

    // Update the currentTask after sharing
    if (currentTask.value && currentTask.value.id === shareTaskId.value) {
      // Find the task in the filtered tasks
      const updatedTask = filteredTasks.value.find(task => task.id === shareTaskId.value);
      if (updatedTask) {
        currentTask.value = updatedTask;
      }
    }

    // Clear the username field but keep the dialog open to allow sharing with more users
    shareUsername.value = '';
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

// Lifecycle hooks
onMounted(() => {
  // Initialize with the default filter (all)
  taskTypeFilter.value = 'all';
  fetchTasks();
});
</script>

<template>
  <div>
    <!-- Task Type Selector -->
    <v-btn-toggle
      v-model="taskTypeFilter"
      color="primary"
      :mandatory="true"
      class="mb-4 task-type-toggle"
    >
      <v-btn value="all">
        All Tasks
      </v-btn>
      <v-btn value="owned">
        My Tasks
      </v-btn>
      <v-btn value="shared">
        For Me
      </v-btn>
    </v-btn-toggle>

    <!-- Search Field - Always visible -->
    <v-text-field
        v-model="searchQuery"
        :hide-details="'auto'"
        clearable
        label="Search tasks"
        variant="outlined"
        class="mb-4"
    >
      <template v-slot:prepend-inner>
        <v-icon>mdi-magnify</v-icon>
      </template>
    </v-text-field>

    <!-- Filters - Collapsible -->
    <v-expansion-panels v-model="filterPanelOpen" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-filter</v-icon>
            <span>Additional Filters</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12">
              <v-select
                  v-model="urgencyFilter"
                  :hide-details="true"
                  :items="[
                  { title: 'All', value: 'ALL' },
                  { title: 'Low', value: 'LOW' },
                  { title: 'Medium', value: 'MEDIUM' },
                  { title: 'High', value: 'HIGH' }
                ]"
                  item-title="title"
                  item-value="value"
                  label="Filter by urgency"
                  variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-switch
                v-model="showCompleted"
                :color="showCompleted ? 'success' : 'grey'"
                :hide-details="true"
                class="mt-2"
                density="comfortable"
                label="completed"
              ></v-switch>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Task List -->
    <v-list v-if="filteredTasks.length > 0" class="task-list">
      <v-list-item
          v-for="task in filteredTasks"
          :key="task.id"
          :class="{ 'completed-task': task.completed }"
          class="task-item"
          @click="openTaskDetailsDialog(task)"
      >
            <template v-slot:prepend>
              <v-checkbox
                  :disabled="loading"
                  :hide-details="true"
                  :model-value="task.completed"
                  @change="completeTask(task.id)"
                  @click.stop
              ></v-checkbox>
            </template>

            <div class="task-content">
              <div class="d-flex align-center justify-space-between">
                <v-list-item-title :class="{ 'text-decoration-line-through': task.completed }" class="task-title text-truncate">
                  {{ task.name }}
                </v-list-item-title>

                <div class="task-actions">
                  <v-btn
                      :disabled="loading"
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click.stop="openEditTaskDialog(task)"
                  ></v-btn>
                  <v-btn
                      v-if="!task.sharedWith || task.owner"
                      :disabled="loading"
                      icon="mdi-share-variant"
                      size="small"
                      variant="text"
                      @click.stop="openShareDialog(task)"
                  ></v-btn>
                  <v-btn
                      :disabled="loading"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      @click.stop="deleteTask(task.id)"
                  ></v-btn>
                </div>
              </div>

              <div class="task-info">
                <v-chip
                    :color="getUrgencyColor(task.urgency)"
                    class="mr-2 mb-1"
                    size="x-small"
                >
                  {{ task.urgency }}
                </v-chip>
                <v-chip v-if="task.dueDate" class="mr-2 mb-1" size="x-small">
                  {{ formatDate(task.dueDate) }}
                </v-chip>
                <v-chip v-if="task.dueDate" class="mr-2 mb-1" size="x-small">
                  {{ formatTime(task.dueDate) }}
                </v-chip>
                <v-chip v-if="task.visibility === 'SHARED'" class="mr-2 mb-1" :color="task.owner ? 'primary' : 'info'" size="x-small">
                  {{ task.owner ? 'SHARED BY ME' : 'SHARED WITH ME' }}
                </v-chip>
              </div>
            </div>
          </v-list-item>
    </v-list>

    <v-alert
        v-else
        text="No tasks found. Create a new task to get started!"
        type="info"
    ></v-alert>

    <!-- Add Task FAB -->
    <v-btn
        :disabled="loading"
        class="add-task-btn"
        color="primary"
        icon="mdi-plus"
        size="large"
        @click="openCreateTaskDialog"
    ></v-btn>

    <!-- Task Dialog -->
    <v-dialog v-model="taskDialog" max-width="500px">
      <v-card class="task-dialog-card">
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Edit Task' : 'New Task' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                    v-model="taskForm.name"
                    label="Task Name"
                    required
                    class="task-input"
                    variant="outlined"
                    hide-details="auto"
                    :loading="false"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                    v-model="taskForm.description"
                    label="Description"
                    rows="3"
                    class="task-input"
                    variant="outlined"
                    hide-details="auto"
                    :loading="false"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <div class="date-time-container">
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                          v-model="taskDate"
                          label="Due Date"
                          type="date"
                          hint="Select the date"
                          persistent-hint
                          class="task-input"
                          variant="outlined"
                          density="comfortable"
                          :loading="false"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                          v-model="taskTime"
                          label="Due Time"
                          type="time"
                          hint="Select the time"
                          persistent-hint
                          class="task-input"
                          variant="outlined"
                          density="comfortable"
                          :loading="false"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
              <v-col cols="12">
                <v-select
                    v-model="taskForm.urgency"
                    :items="[
                    { title: 'High', value: 'HIGH' },
                    { title: 'Medium', value: 'MEDIUM' },
                    { title: 'Low', value: 'LOW' }
                  ]"
                    item-title="title"
                    item-value="value"
                    label="Urgency"
                    class="task-input"
                    variant="outlined"
                    hide-details="auto"
                    :loading="false"
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              :disabled="loading"
              color="secondary"
              text=""
              @click="taskDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
              :disabled="loading || !taskForm.name"
              :loading="loading"
              color="primary"
              text=""
              @click="saveTask"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share Task Dialog -->
    <v-dialog v-model="shareDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ currentTask && currentTask.owner ? 'Share Task' : 'Task Shared With Me' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-select
                    v-model="shareUsername"
                    :disabled="loading || friendships.length === 0"
                    :hint="friendships.length === 0 ? 'You have no friends to share with' : ''"
                    :items="friendships"
                    :item-title="item => item.friend?.firstname + ' ' + item.friend?.lastname"
                    :item-value="item => item.friend?.username"
                    label="Select Friend"
                    persistent-hint
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <v-list-item-subtitle>{{ item.raw.friend?.username || 'Kein Benutzername' }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <div v-if="item.raw && item.raw.friend">
                      <div>{{ item.raw.friend.firstname }}</div>
                      <small>{{ item.raw.friend.username }}</small>
                    </div>
                    <div v-else>Choose a friend to share</div>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Shared with list -->
            <v-row v-if="currentTask && currentTask.sharedWith && currentTask.sharedWith.length > 0">
              <v-col cols="12">
                <v-divider class="my-3"></v-divider>
                <h3 class="text-subtitle-1 mb-2">{{ currentTask && currentTask.owner ? 'Currently shared with:' : 'Shared by:' }}</h3>
                <div class="shared-with-list">
                  <v-chip
                      v-for="user in currentTask.sharedWith"
                      :key="user.id"
                      :disabled="loading || !currentTask.owner"
                      class="mr-1 mt-1"
                      closable
                      size="small"
                      @click:close="unshareTask(currentTask.id, user.username)"
                  >
                    {{ user.firstname }} {{ user.lastname }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              :disabled="loading"
              color="secondary"
              text=""
              @click="shareDialog = false"
          >
            Close
          </v-btn>
          <v-btn
              :disabled="loading || !shareUsername"
              :loading="loading"
              color="primary"
              text=""
              @click="shareTask"
          >
            Share
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Task Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="500px">
      <v-card v-if="selectedTask">
        <v-card-title>
          <span class="text-h5" :class="{ 'text-decoration-line-through': selectedTask.completed }">
            {{ selectedTask.name }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <div class="d-flex align-center flex-wrap mb-2">
                  <v-chip :color="getUrgencyColor(selectedTask.urgency)" class="mr-2 mb-1">
                    {{ selectedTask.urgency }}
                  </v-chip>
                  <v-chip v-if="selectedTask.dueDate" class="mr-2 mb-1">
                    {{ formatDate(selectedTask.dueDate) }}
                  </v-chip>
                  <v-chip v-if="selectedTask.dueDate" class="mr-2 mb-1">
                    {{ formatTime(selectedTask.dueDate) }}
                  </v-chip>
                  <v-chip v-if="selectedTask.visibility === 'SHARED'" :color="selectedTask.owner ? 'primary' : 'info'" class="mb-1">
                    {{ selectedTask.owner ? 'SHARED BY ME' : 'SHARED WITH ME' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>

            <v-row v-if="selectedTask.description">
              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mb-1">Description:</div>
                <div class="task-details-description">{{ selectedTask.description }}</div>
              </v-col>
            </v-row>

            <v-row v-if="selectedTask.sharedWith && selectedTask.sharedWith.length > 0">
              <v-col cols="12">
                <v-divider class="my-3"></v-divider>
                <div class="text-subtitle-1 font-weight-bold mb-1">{{ selectedTask.owner ? 'Shared with:' : 'Shared by:' }}</div>
                <div class="shared-with-list">
                  <v-chip
                      v-for="user in selectedTask.sharedWith"
                      :key="user.id"
                      class="mr-1 mt-1"
                      size="small"
                  >
                    {{ user.firstname }} {{ user.lastname }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-checkbox
              :model-value="selectedTask.completed"
              :disabled="loading"
              label="Completed"
              @change="completeTask(selectedTask.id)"
          ></v-checkbox>
          <v-spacer></v-spacer>
          <v-btn
              :disabled="loading"
              color="secondary"
              text=""
              @click="detailsDialog = false"
          >
            Close
          </v-btn>
          <v-btn
              :disabled="loading"
              color="primary"
              text=""
              @click="openEditTaskDialog(selectedTask); detailsDialog = false"
          >
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.completed-task {
  opacity: 0.7;
}

.add-task-btn {
  position: fixed;
  bottom: 70px;
  right: 16px;
}

/* Improved styling for the task dialog */
.date-time-container {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

.task-dialog-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.task-dialog-card v-card-title {
  padding: 20px 24px;
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.task-dialog-card v-card-text {
  padding-top: 24px;
}

/* Input field styling */
.task-input {
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.task-input:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 4px 0;
}

.task-title {
  font-weight: bold;
  margin-bottom: 0;
  max-width: 70%;
}

.task-description {
  margin-bottom: 8px;
  word-break: break-word;
  display: none; /* Hide description in the list view */
}

.task-metadata {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.task-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 4px;
}

.task-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.shared-with-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.shared-with-title {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
  margin-right: 8px;
  margin-top: 4px;
}

/* Task list styling for visual separation */
.task-list {
  padding: 8px;
  background: transparent;
}

.task-item {
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
  height: 72px !important; /* Fixed height for all task items */
  cursor: pointer;
}

.task-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: rgb(var(--v-theme-primary), #1976d2);
  opacity: 0.7;
}

.task-item.completed-task::before {
  background-color: rgb(var(--v-theme-success), #4caf50);
}

/* Task details dialog styles */
.task-details-description {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Task type toggle styles */
.task-type-toggle {
  margin-bottom: 16px;
  display: flex;
}

.task-type-toggle .v-btn {
  flex: 1;
}

/* Mobile-specific styles */
@media (max-width: 600px) {
  .task-item {
    margin-bottom: 8px;
  }

  .task-type-toggle {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .task-type-toggle .v-btn {
    min-width: 100px;
  }
}
</style>
