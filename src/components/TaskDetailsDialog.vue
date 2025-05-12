<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type TaskDto } from '../types/models';
import PomodoroTimer from './PomodoroTimer.vue';

const props = defineProps<{
  modelValue: boolean;
  task: TaskDto | null;
  timerCountdown: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'edit', task: TaskDto): void;
  (e: 'share', task: TaskDto): void;
  (e: 'delete', taskId: string): void;
  (e: 'start-timer', taskId: string): void;
  (e: 'pause-timer', taskId: string): void;
  (e: 'reset-timer', taskId: string): void;
  (e: 'update-pomodoro', minutes: number): void;
}>();

const dialogOpen = ref(props.modelValue);
const activeTab = ref('details'); // Default to details tab

// Utility functions
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

// Format milliseconds to MM:SS display
const formatTimeDisplay = (millis: number) => {
  if (millis <= 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Event handlers
const closeDialog = () => {
  dialogOpen.value = false;
  emit('update:modelValue', false);
};

const editTask = () => {
  if (props.task) {
    emit('edit', props.task);
    closeDialog();
  }
};

const shareTask = () => {
  if (props.task) {
    emit('share', props.task);
    closeDialog();
  }
};

const deleteTask = () => {
  if (props.task) {
    emit('delete', props.task.id);
    closeDialog();
  }
};

const onStartTimer = (taskId: string) => {
  emit('start-timer', taskId);
};

const onPauseTimer = (taskId: string) => {
  emit('pause-timer', taskId);
};

const onResetTimer = (taskId: string) => {
  emit('reset-timer', taskId);
};

const onUpdatePomodoro = (minutes: number) => {
  emit('update-pomodoro', minutes);
};

// Reset active tab when dialog is opened
watch(() => props.modelValue, (newValue) => {
  dialogOpen.value = newValue;
  if (newValue) {
    activeTab.value = 'details';
  }
});

// Watch for changes in the local ref to emit updates
watch(dialogOpen, (newValue) => {
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue);
  }
});
</script>

<template>
  <v-dialog v-model="dialogOpen" max-width="500px" @update:modelValue="closeDialog">
    <v-card v-if="task" class="task-dialog-card">
      <v-card-title>
        <span class="text-h5" :class="{ 'text-decoration-line-through': task.completed }">
          {{ task.name }}
        </span>
      </v-card-title>

      <!-- Tabs for Details and Timer -->
      <v-tabs v-model="activeTab" color="primary" align-tabs="center">
        <v-tab value="details">
          <v-icon start>mdi-information-outline</v-icon>
          Details
        </v-tab>
        <v-tab value="timer">
          <v-icon start>mdi-timer-outline</v-icon>
          Pomodoro Timer
        </v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Details Tab -->
          <v-window-item value="details">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <div class="d-flex align-center flex-wrap mb-2">
                    <v-chip :color="getUrgencyColor(task.urgency)" class="mr-2 mb-1">
                      {{ task.urgency }}
                    </v-chip>
                    <v-chip v-if="task.dueDate" class="mr-2 mb-1">
                      {{ formatDate(task.dueDate) }}
                    </v-chip>
                    <v-chip v-if="task.dueDate" class="mr-2 mb-1">
                      {{ formatTime(task.dueDate) }}
                    </v-chip>
                    <v-chip v-if="task.visibility === 'SHARED'" :color="task.owner ? 'primary' : 'info'" class="mb-1">
                      {{ task.owner ? 'SHARED BY ME' : 'SHARED WITH ME' }}
                    </v-chip>
                    <v-chip v-if="task.timerActive" color="purple" class="mb-1">
                      <v-icon start>mdi-timer</v-icon>
                      {{ formatTimeDisplay(timerCountdown) }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>

              <v-row v-if="task.description">
                <v-col cols="12">
                  <div class="text-subtitle-1 font-weight-bold mb-1">Description:</div>
                  <div class="task-details-description">{{ task.description }}</div>
                </v-col>
              </v-row>

              <v-row v-if="task.sharedWith && task.sharedWith.length > 0">
                <v-col cols="12">
                  <v-divider class="my-3"></v-divider>
                  <div class="text-subtitle-1 font-weight-bold mb-1">{{ task.owner ? 'Shared with:' : 'Shared by:' }}</div>
                  <div class="shared-with-list">
                    <v-chip
                      v-for="user in task.sharedWith"
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
          </v-window-item>

          <!-- Timer Tab -->
          <v-window-item value="timer">
            <PomodoroTimer
              :task="task"
              :timer-countdown="timerCountdown"
              :loading="loading"
              @start="onStartTimer"
              @pause="onPauseTimer"
              @reset="onResetTimer"
              @update-pomodoro="onUpdatePomodoro"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :disabled="loading"
          color="secondary"
          text=""
          @click="closeDialog"
        >
          Close
        </v-btn>
        <v-btn
          :disabled="loading"
          color="primary"
          text=""
          @click="editTask"
        >
          Edit
        </v-btn>
        <v-btn
          v-if="!task.sharedWith || task.owner"
          :disabled="loading"
          color="info"
          text=""
          @click="shareTask"
        >
          Share
        </v-btn>
        <v-btn
          :disabled="loading"
          color="error"
          text=""
          @click="deleteTask"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.task-details-description {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
}

.shared-with-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
</style>
