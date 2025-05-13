<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type TaskDto } from '../types/models';
import { formatDate, formatTime, formatTimeDisplay, getUrgencyColor } from '../utils/formatters';

const props = defineProps<{
  task: TaskDto;
  loading: boolean;
  hasActiveTimer: (taskId: string) => boolean;
  getTaskRemainingTime: (taskId: string) => number;
}>();

// Animation state
const isAnimatingCompletion = ref(false);

const emit = defineEmits<{
  (e: 'complete', taskId: string): void;
  (e: 'uncomplete', taskId: string): void;
  (e: 'delete', taskId: string): void;
  (e: 'view-details', task: TaskDto): void;
}>();

// Swipe state
const swipeOffset = ref(0);
const isSwiping = ref(false);
const showDeleteConfirm = ref(false);
const touchStartX = ref(0);
const touchStartY = ref(0);

// Swipe thresholds
const COMPLETE_THRESHOLD = 80;
const UNCOMPLETE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;

// Utility functions are now imported from formatters.ts

// Event handlers
const onComplete = () => {
  // This method is now only used when a completed task is swiped right
  // Just emit the event immediately
  emit('complete', props.task.id);
};

// Watch for task completion status changes
watch(() => props.task.completed, (newValue, oldValue) => {
  // Reset animation state when task is uncompleted
  if (!newValue && oldValue) {
    isAnimatingCompletion.value = false;
  }
});

const onUncomplete = () => {
  emit('uncomplete', props.task.id);
};

const onDelete = () => {
  emit('delete', props.task.id);
};

const onViewDetails = () => {
  emit('view-details', props.task);
};

// Swipe handlers
const onTouchStart = (event: TouchEvent) => {
  if (props.loading) return;

  touchStartX.value = event.touches[0].clientX;
  touchStartY.value = event.touches[0].clientY;
  isSwiping.value = true;
  showDeleteConfirm.value = false;
};

const onTouchMove = (event: TouchEvent) => {
  if (!isSwiping.value || props.loading) return;

  const touchX = event.touches[0].clientX;
  const touchY = event.touches[0].clientY;

  // Calculate the horizontal and vertical distance moved
  const deltaX = touchX - touchStartX.value;
  const deltaY = touchY - touchStartY.value;

  // If vertical movement is greater than horizontal, it's likely a scroll
  if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
    isSwiping.value = false;
    swipeOffset.value = 0;
    return;
  }

  // Update the swipe offset
  swipeOffset.value = deltaX;

  // Prevent default to avoid scrolling while swiping
  event.preventDefault();
};

const onTouchEnd = () => {
  if (!isSwiping.value || props.loading) return;

  // Handle swipe actions based on offset
  if (swipeOffset.value > COMPLETE_THRESHOLD) {
    // Swipe right - complete task
    if (!props.task.completed) {
      // Reset the swipe offset to animate back to original position
      swipeOffset.value = 0;
      isSwiping.value = false;

      // Wait for the transition to complete before starting the drop animation
      setTimeout(() => {
        // Start the drop animation after returning to original position
        isAnimatingCompletion.value = true;

        // Delay the actual completion to allow drop animation to play
        setTimeout(() => {
          emit('complete', props.task.id);
        }, 500); // Half a second delay for the drop animation
      }, 200); // Wait for the 0.2s transition to complete

      return;
    } else {
      // If already completed, just complete immediately
      onComplete();
    }
  } else if (swipeOffset.value < DELETE_THRESHOLD) {
    // Swipe far left - show delete confirmation
    showDeleteConfirm.value = true;
  } else if (swipeOffset.value < UNCOMPLETE_THRESHOLD && props.task.completed) {
    // Swipe left - uncomplete task (only if task is completed)
    onUncomplete();
  }

  // Reset swipe state
  isSwiping.value = false;
  swipeOffset.value = 0;
};

const confirmDelete = () => {
  showDeleteConfirm.value = false;
  onDelete();
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
</script>

<template>
  <div class="task-item-container">
    <!-- Swipe action indicators -->
    <div class="swipe-indicators">
      <div class="swipe-indicator swipe-right" :style="{ opacity: swipeOffset > 0 ? Math.min(swipeOffset / COMPLETE_THRESHOLD, 1) : 0 }">
        <v-icon color="success">mdi-check-circle</v-icon>
        <span>Complete</span>
      </div>
      <div class="swipe-indicator swipe-left" :style="{ opacity: swipeOffset < 0 && swipeOffset > DELETE_THRESHOLD && task.completed ? Math.min(Math.abs(swipeOffset) / Math.abs(UNCOMPLETE_THRESHOLD), 1) : 0 }">
        <v-icon color="primary">mdi-refresh</v-icon>
        <span>Uncomplete</span>
      </div>
      <div class="swipe-indicator swipe-delete" :style="{ opacity: swipeOffset < DELETE_THRESHOLD ? Math.min(Math.abs(swipeOffset) / Math.abs(DELETE_THRESHOLD), 1) : 0 }">
        <v-icon color="error">mdi-delete</v-icon>
        <span>Delete</span>
      </div>
    </div>

    <!-- Task item with swipe functionality -->
    <v-list-item
      :class="{ 
        'completed-task': task.completed, 
        'task-completing': isAnimatingCompletion 
      }"
      class="task-item"
      :style="{ 
        transform: `translateX(${swipeOffset}px)`,
        '--swipe-offset': `${swipeOffset}px`
      }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
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

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Delete Task</v-card-title>
        <v-card-text>
          Are you sure you want to delete this task?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.task-item-container {
  position: relative;
  margin-bottom: 12px;
  overflow: hidden;
}

.task-item-container:last-child {
  margin-bottom: 0;
}

.completed-task {
  opacity: 0.7;
}

@keyframes task-drop-animation {
  0% {
    transform: translateX(var(--swipe-offset)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(var(--swipe-offset)) translateY(100px);
    opacity: 0;
  }
}

.task-completing {
  --swipe-offset: 0px;
  animation: task-drop-animation 0.5s ease-in forwards;
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
  margin-bottom: 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  background-color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
  height: auto !important; /* Allow height to adjust based on content */
  min-height: 80px !important; /* Increased minimum height for better touch targets */
  padding: 8px 16px; /* Add padding for better spacing */
  cursor: pointer;
  z-index: 1;
}

.task-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 0, 0, 0.15);
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

/* Swipe indicators */
.swipe-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  z-index: 0;
}

.swipe-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.swipe-right {
  margin-left: 20px;
  color: var(--v-theme-success);
}

.swipe-left {
  margin-right: auto;
  margin-left: auto;
  color: var(--v-theme-primary);
}

.swipe-delete {
  margin-right: 20px;
  color: var(--v-theme-error);
}

.swipe-indicator span {
  margin-top: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* Mobile-specific styles */
@media (max-width: 600px) {
  .task-item {
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
