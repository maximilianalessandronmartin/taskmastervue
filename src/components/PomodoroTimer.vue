<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { type TaskDto } from '../types/models';

const props = defineProps<{
  task: TaskDto;
  timerCountdown: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'start', taskId: string): void;
  (e: 'pause', taskId: string): void;
  (e: 'reset', taskId: string): void;
  (e: 'update-pomodoro', minutes: number): void;
}>();

// Initialize with default value of 25 minutes, not tied to timerCountdown
const pomodoroMinutes = ref(25);

// Format milliseconds to MM:SS display
const formatTimeDisplay = (millis: number) => {
  if (millis <= 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Timer control methods
const startTimer = () => {
  emit('start', props.task.id);
};

const pauseTimer = () => {
  emit('pause', props.task.id);
};

const resetTimer = () => {
  emit('reset', props.task.id);
};

const incrementPomodoro = () => {
  if (!pomodoroMinutes.value) return;
  pomodoroMinutes.value = Math.min(60, Number(pomodoroMinutes.value) + 5);
  updatePomodoroTime();
};

const decrementPomodoro = () => {
  if (!pomodoroMinutes.value) return;
  pomodoroMinutes.value = Math.max(5, Number(pomodoroMinutes.value) - 5);
  updatePomodoroTime();
};

const updatePomodoroTime = () => {
  emit('update-pomodoro', pomodoroMinutes.value);
};

// Initialize pomodoroMinutes when component is mounted
onMounted(() => {
  // If there's an existing value, use it as the initial value for the duration field
  if (props.task.pomodoroTimeMillis) {
    pomodoroMinutes.value = Math.floor(props.task.pomodoroTimeMillis / 60000); // Convert milliseconds to minutes
  }
});
</script>

<template>
  <v-container>
    <!-- Timer Display -->
    <div class="timer-display text-center mb-4">
      <div class="timer-countdown">{{ formatTimeDisplay(timerCountdown) }}</div>
      <div v-if="task.timerActive" class="timer-status">Timer is running</div>
      <div v-else class="timer-status">Timer is paused</div>
    </div>

    <!-- Timer Controls -->
    <div class="timer-controls d-flex justify-center mb-4">
      <v-btn
        v-if="!task.timerActive"
        color="success"
        class="mx-1"
        :disabled="loading || !task.pomodoroTimeMillis"
        @click="startTimer"
      >
        <v-icon>mdi-play</v-icon>
        Start
      </v-btn>
      <v-btn
        v-else
        color="warning"
        class="mx-1"
        :disabled="loading"
        @click="pauseTimer"
      >
        <v-icon>mdi-pause</v-icon>
        Pause
      </v-btn>
      <v-btn
        color="error"
        class="mx-1"
        :disabled="loading"
        @click="resetTimer"
      >
        <v-icon>mdi-refresh</v-icon>
        Reset
      </v-btn>
    </div>

    <!-- Timer Duration Setting -->
    <div class="timer-settings">
      <div class="pomodoro-control-group">
        <v-btn
          icon
          variant="text"
          color="primary"
          :disabled="loading || task.timerActive"
          @click="decrementPomodoro"
        >
          <v-icon>mdi-minus</v-icon>
        </v-btn>

        <v-text-field
          v-model="pomodoroMinutes"
          label="Duration (min)"
          type="number"
          min="0"
          max="60"
          :disabled="loading || task.timerActive"
          @change="updatePomodoroTime"
          class="mb-2 pomodoro-input"
          density="compact"
          hide-details
          style="max-width: 150px;"
        ></v-text-field>

        <v-btn
          icon
          variant="text"
          color="primary"
          :disabled="loading || task.timerActive"
          @click="incrementPomodoro"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.timer-display {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.timer-countdown {
  font-size: 2.5rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  font-family: monospace;
  letter-spacing: 2px;
}

.timer-status {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-top: 4px;
}

.timer-controls {
  margin-bottom: 16px;
}

.timer-settings {
  background-color: rgba(var(--v-theme-surface-variant), 0.05);
  border-radius: 8px;
  padding: 16px;
}

.pomodoro-control-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pomodoro-input {
  width: 150px;
  border-radius: 8px;
  transition: all 0.2s ease;
  text-align: center;
  margin: 0 8px;
}

/* Hide number input spinners (up/down arrows) */
.pomodoro-input :deep(input[type="number"]::-webkit-outer-spin-button),
.pomodoro-input :deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.pomodoro-input :deep(input[type="number"]) {
  -moz-appearance: textfield;
}
</style>
