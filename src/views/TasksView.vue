<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTaskStore } from '../store/task.store';
import { useFriendshipStore } from '../store/friendship.store';

import { type CreateTaskDto, type Friendship, type ShareTaskDto, type TaskDto, type UpdateTaskDto } from '../types/models';

const taskStore = useTaskStore();
const friendshipStore = useFriendshipStore();

// Share task dialog
const shareDialog = ref(false);
const shareTaskId = ref('');
const shareUsername = ref('');
const friends = ref<Friendship[]>([]);



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
    friends.value = friendshipStore.getFriends;
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
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const openShareDialog = (taskId: string) => {
  shareTaskId.value = taskId;
  shareUsername.value = '';
  fetchFriends();
  shareDialog.value = true;
};

const shareTask = async () => {
  if (!shareUsername.value || !shareTaskId.value) {
    return;
  }

  loading.value = true;
  try {
    await taskStore.shareTask(shareTaskId.value, shareUsername.value);
    shareDialog.value = false;
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
              label="Search tasks"
              prepend-icon="mdi-magnify"
              clearable
              :hide-details="'auto'"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="urgencyFilter"
              label="Filter by urgency"
              :items="[
                { title: 'All', value: 'ALL' },
                { title: 'High', value: 'HIGH' },
                { title: 'Medium', value: 'MEDIUM' },
                { title: 'Low', value: 'LOW' }
              ]"
              item-title="title"
              item-value="value"
              :hide-details="true"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-switch
              v-model="showCompleted"
              label="Show completed tasks"
              :hide-details="true"
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
                :model-value="task.completed"
                @change="completeTask(task.id)"
                :disabled="loading"
                :hide-details="true"
              ></v-checkbox>
            </template>

            <div class="task-content">
              <v-list-item-title :class="{ 'text-decoration-line-through': task.completed }" class="task-title">
                {{ task.name }}
              </v-list-item-title>

              <v-list-item-subtitle class="task-description">
                {{ task.description }}
              </v-list-item-subtitle>

              <!-- Shared with list -->
              <div v-if="task.sharedWith && task.sharedWith.length > 0" class="shared-with-list mt-2">
                <div class="shared-with-title">Shared with:</div>
                <v-chip
                  v-for="user in task.sharedWith"
                  :key="user.id"
                  size="small"
                  class="mr-1 mt-1"
                  closable
                  @click:close="unshareTask(task.id, user.username)"
                  :disabled="loading || !task.owner"
                >
                  {{ user.username }}
                </v-chip>
              </div>

              <div class="task-metadata">
                <div class="task-info">
                  <v-chip
                    :color="getUrgencyColor(task.urgency)"
                    size="small"
                    class="mr-2 mt-1"
                  >
                    {{ task.urgency }}
                  </v-chip>
                  <v-chip size="small" class="mr-2 mt-1">
                    {{ formatDate(task.dueDate) }}
                  </v-chip>
                  <v-chip v-if="task.visibility === 'SHARED'" color="info" size="small" class="mr-2 mt-1">
                    SHARED
                  </v-chip>
                </div>
                <div class="task-actions">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="openEditTaskDialog(task)"
                    :disabled="loading"
                    class="mt-1"
                  ></v-btn>
                  <v-btn
                    icon="mdi-share-variant"
                    variant="text"
                    size="small"
                    @click="openShareDialog(task.id)"
                    :disabled="loading"
                    class="mt-1"
                    v-if="!task.sharedWith || task.owner"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click="deleteTask(task.id)"
                    :disabled="loading"
                    class="mt-1"
                  ></v-btn>
                </div>
              </div>
            </div>
          </v-list-item>
        </v-list>

        <v-alert
          v-else
          type="info"
          text="No tasks found. Create a new task to get started!"
        ></v-alert>
      </v-card-text>
    </v-card>

    <!-- Add Task FAB -->
    <v-btn
      color="primary"
      icon="mdi-plus"
      size="large"
      class="add-task-btn"
      @click="openCreateTaskDialog"
      :disabled="loading"
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
                  label="Urgency"
                  :items="[
                    { title: 'High', value: 'HIGH' },
                    { title: 'Medium', value: 'MEDIUM' },
                    { title: 'Low', value: 'LOW' }
                  ]"
                  item-title="title"
                  item-value="value"
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            text=""
            @click="taskDialog = false"
            :disabled="loading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text=""
            @click="saveTask"
            :loading="loading"
            :disabled="loading || !taskForm.name"
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
                  label="Select Friend"
                  :items="friends"
                  item-title="friend.username"
                  item-value="friend.username"
                  :disabled="loading || friends.length === 0"
                  :hint="friends.length === 0 ? 'You have no friends to share with' : ''"
                  persistent-hint
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            text=""
            @click="shareDialog = false"
            :disabled="loading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text=""
            @click="shareTask"
            :loading="loading"
            :disabled="loading || !shareUsername"
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
