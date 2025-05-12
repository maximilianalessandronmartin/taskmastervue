<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const taskTypeFilter = ref(props.modelValue);

// Watch for changes in the local value and emit them
function updateTaskType(value: string) {
  taskTypeFilter.value = value;
  emit('update:modelValue', value);
}
</script>

<template>
  <v-btn-toggle
    v-model="taskTypeFilter"
    color="primary"
    :mandatory="true"
    class="mb-4 task-type-toggle"
    @update:modelValue="updateTaskType"
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
</template>

<style scoped>
/* Task type toggle styles */
.task-type-toggle {
  margin-bottom: 16px;
  display: flex;
}

/* Styling for v-btn inside task-type-toggle */
.task-type-toggle > * {
  flex: 1;
}

/* Mobile-specific styles */
@media (max-width: 600px) {
  .task-type-toggle {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  /* Styling for buttons inside task-type-toggle */
  .task-type-toggle > * {
    min-width: 100px;
  }
}
</style>
