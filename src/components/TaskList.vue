<script lang="ts" setup>
import { type TaskDto } from '../types/models';
import TaskItem from './TaskItem.vue';

const props = defineProps<{
  tasks: TaskDto[];
  loading: boolean;
  hasActiveTimer: (taskId: string) => boolean;
  getTaskRemainingTime: (taskId: string) => number;
}>();

const emit = defineEmits<{
  (e: 'complete', taskId: string): void;
  (e: 'uncomplete', taskId: string): void;
  (e: 'delete', taskId: string): void;
  (e: 'view-details', task: TaskDto): void;
}>();

const onTaskComplete = (taskId: string) => {
  emit('complete', taskId);
};

const onTaskUncomplete = (taskId: string) => {
  emit('uncomplete', taskId);
};

const onTaskDelete = (taskId: string) => {
  emit('delete', taskId);
};

const onViewTaskDetails = (task: TaskDto) => {
  emit('view-details', task);
};
</script>

<template>
  <div>
    <v-list v-if="tasks.length > 0" class="task-list">
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :loading="loading"
        :has-active-timer="hasActiveTimer"
        :get-task-remaining-time="getTaskRemainingTime"
        @complete="onTaskComplete"
        @uncomplete="onTaskUncomplete"
        @delete="onTaskDelete"
        @view-details="onViewTaskDetails"
      />
    </v-list>

    <v-alert
      v-else
      text="No tasks found. Create a new task to get started!"
      type="info"
    ></v-alert>
  </div>
</template>

<style scoped>
.task-list {
  padding: 8px;
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
}
</style>
