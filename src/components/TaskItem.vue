<script lang="ts" setup>
import { computed } from 'vue';
import { type TaskDto } from '../types/models';

const props = defineProps<{
  task: TaskDto;
  loading: boolean;
  hasActiveTimer: (taskId: string) => boolean;
  getTaskRemainingTime: (taskId: string) => number;
}>();

const emit = defineEmits<{
  (e: 'complete', taskId: string): void;
  (e: 'view-details', task: TaskDto): void;
}>();

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

// Event handlers
const onComplete = () => {
  emit('complete', props.task.id);
};

const onViewDetails = () => {
  emit('view-details', props.task);
};
</script>

<template>
  <v-list-item
    :class="{ 'completed-task': task.completed }"
    class="task-item"
  >
    <template v-slot:prepend>
      <v-checkbox
        :disabled="loading"
        :hide-details="true"
        :model-value="task.completed"
        @change="onComplete"
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
            icon="mdi-information-outline"
            size="medium"
            variant="tonal"
            class="task-action-btn"
            aria-label="View task details"
            @click.stop="onViewDetails"
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
        <v-chip v-if="hasActiveTimer(task.id)" class="mr-2 mb-1" color="purple" size="x-small">
          <v-icon start size="x-small">mdi-timer-outline</v-icon>
          {{ formatTimeDisplay(getTaskRemainingTime(task.id)) }}
        </v-chip>
      </div>
    </div>
  </v-list-item>
</template>

<style scoped>
.completed-task {
  opacity: 0.7;
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
  max-width: 85%;
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
  padding: 4px 0;
}

.task-action-btn {
  min-width: 44px !important; /* Minimum touch target size per WCAG */
  min-height: 44px !important; /* Minimum touch target size per WCAG */
  border-radius: 8px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.task-action-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item {
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
  height: auto !important; /* Allow height to adjust based on content */
  min-height: 80px !important; /* Increased minimum height for better touch targets */
  padding: 8px 16px; /* Add padding for better spacing */
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
  background-color: rgb(var(--v-theme-primary));
  opacity: 0.7;
}

.task-item.completed-task::before {
  background-color: rgb(var(--v-theme-success));
}

/* Mobile-specific styles */
@media (max-width: 600px) {
  .task-item {
    margin-bottom: 8px;
    min-height: 90px !important; /* Slightly taller on mobile for better touch */
    padding: 8px 12px; /* Adjusted padding for mobile */
  }

  .task-title {
    max-width: 75%; /* More space for title with fewer buttons */
    font-size: 0.95rem; /* Slightly smaller font on mobile */
  }

  .task-action-btn {
    min-width: 48px !important; /* Even larger touch targets on mobile */
    min-height: 48px !important;
  }

  .task-actions {
    padding: 6px 0; /* More padding on mobile */
  }

  /* Ensure task info chips are readable on mobile */
  .task-info > * {
    margin-bottom: 4px;
  }
}
</style>
