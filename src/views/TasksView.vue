<script lang="ts" setup>
import {ref, onMounted, computed} from 'vue';
import {useTaskStore} from '../store/task.store';
import {useFriendshipStore} from '../store/friendship.store';

import {
  type CreateTaskDto,
  type Friendship,
  type ShareTaskDto,
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

// Loading state
const loading = ref(false);

// Computed properties
const filteredTasks = computed(() => {
  // Combine own and shared tasks
  let tasks = [...taskStore.getTasks, ...taskStore.getSharedTasks];

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
    await taskStore.fetchAllTasks();
    await taskStore.fetchSharedTasks();
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
  taskForm.value = {
    name: task.name,
    description: task.description,
    dueDate: task.dueDate,
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

// Lifecycle hooks
onMounted(fetchTasks);
</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">Tasks</h1>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-text-field
                v-model="searchQuery"
                :hide-details="'auto'"
                clearable
                label="Search tasks"
                prepend-icon="mdi-magnify"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
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
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-switch
                v-model="showCompleted"
                :hide-details="true"
                label="Show completed tasks"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Task List -->
    <v-card>
      <v-card-text>
        <v-list v-if="filteredTasks.length > 0">
          <v-list-item
              v-for="task in filteredTasks"
              :key="task.id"
              :class="{ 'completed-task': task.completed }"
          >
            <template v-slot:prepend>
              <v-checkbox
                  :disabled="loading"
                  :hide-details="true"
                  :model-value="task.completed"
                  @change="completeTask(task.id)"
              ></v-checkbox>
            </template>

            <div class="task-content">
              <v-list-item-title :class="{ 'text-decoration-line-through': task.completed }" class="task-title">
                {{ task.name }}
              </v-list-item-title>

              <v-list-item-subtitle class="task-description">
                {{ task.description }}
              </v-list-item-subtitle>


              <div class="task-metadata">
                <div class="task-info">
                  <v-chip
                      :color="getUrgencyColor(task.urgency)"
                      class="mr-2 mt-1"
                      size="small"
                  >
                    {{ task.urgency }}
                  </v-chip>
                  <v-chip class="mr-2 mt-1" size="small">
                    {{ formatDate(task.dueDate) }}
                  </v-chip>
                  <v-chip v-if="task.visibility === 'SHARED'" class="mr-2 mt-1" color="info" size="small">
                    SHARED
                  </v-chip>
                </div>
                <div class="task-actions">
                  <v-btn
                      :disabled="loading"
                      class="mt-1"
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="openEditTaskDialog(task)"
                  ></v-btn>
                  <v-btn
                      v-if="!task.sharedWith || task.owner"
                      :disabled="loading"
                      class="mt-1"
                      icon="mdi-share-variant"
                      size="small"
                      variant="text"
                      @click="openShareDialog(task)"
                  ></v-btn>
                  <v-btn
                      :disabled="loading"
                      class="mt-1"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      @click="deleteTask(task.id)"
                  ></v-btn>
                </div>
              </div>
            </div>
          </v-list-item>
        </v-list>

        <v-alert
            v-else
            text="No tasks found. Create a new task to get started!"
            type="info"
        ></v-alert>
      </v-card-text>
    </v-card>

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
      <v-card>
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
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                    v-model="taskForm.description"
                    label="Description"
                    rows="3"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    v-model="taskForm.dueDate"
                    label="Due Date"
                    type="datetime-local"
                ></v-text-field>
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
          <span class="text-h5">Share Task</span>
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
                    item-title="friend.firstname"

                    item-value="friend.username"
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
                    <div v-else>Ungültiger Benutzer</div>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Shared with list -->
            <v-row v-if="currentTask && currentTask.sharedWith && currentTask.sharedWith.length > 0">
              <v-col cols="12">
                <v-divider class="my-3"></v-divider>
                <h3 class="text-subtitle-1 mb-2">Currently shared with:</h3>
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

.task-content {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.task-title {
  font-weight: bold;
  margin-bottom: 0;
  word-break: break-word;
}

.task-description {
  margin-bottom: 8px;
  word-break: break-word;
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

/* Mobile-specific styles */
@media (max-width: 600px) {

}
</style>
