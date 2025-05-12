<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type CreateTaskDto, type UpdateTaskDto } from '../types/models';

const props = defineProps<{
  modelValue: boolean;
  isEditMode: boolean;
  loading: boolean;
  task: CreateTaskDto;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', task: CreateTaskDto | UpdateTaskDto): void;
}>();

const dialogOpen = ref(props.modelValue);
const taskForm = ref<CreateTaskDto>({ ...props.task });
const showAdvancedOptions = ref(props.isEditMode);
const taskDate = ref('');
const taskTime = ref('');

// Watch for changes in the prop to update the local ref
watch(() => props.modelValue, (newValue) => {
  dialogOpen.value = newValue;
  if (newValue) {
    // Dialog opened
    taskForm.value = { ...props.task };
    showAdvancedOptions.value = props.isEditMode;

    // Format the date for date and time inputs if it exists
    if (props.task.dueDate) {
      // Create a date object and format it to YYYY-MM-DDThh:mm
      const date = new Date(props.task.dueDate);
      const formattedDueDate = date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm

      // Split into date and time components
      taskDate.value = formattedDueDate.split('T')[0]; // YYYY-MM-DD
      taskTime.value = formattedDueDate.split('T')[1]; // hh:mm
    } else {
      taskDate.value = '';
      taskTime.value = '';
    }
  }
});

// Watch for changes in the task prop
watch(() => props.task, (newTask) => {
  taskForm.value = { ...newTask };

  // Format the date for date and time inputs if it exists
  if (newTask.dueDate) {
    // Create a date object and format it to YYYY-MM-DDThh:mm
    const date = new Date(newTask.dueDate);
    const formattedDueDate = date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm

    // Split into date and time components
    taskDate.value = formattedDueDate.split('T')[0]; // YYYY-MM-DD
    taskTime.value = formattedDueDate.split('T')[1]; // hh:mm
  } else {
    taskDate.value = '';
    taskTime.value = '';
  }
});

const closeDialog = () => {
  dialogOpen.value = false;
  emit('update:modelValue', false);
};

// Watch for changes in the local ref to emit updates
watch(dialogOpen, (newValue) => {
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue);
  }
});

const saveTask = () => {
  if (!taskForm.value.name) {
    return;
  }

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

  emit('save', taskForm.value);
};
</script>

<template>
  <v-dialog v-model="dialogOpen" max-width="500px" @update:modelValue="closeDialog">
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

            <!-- Toggle button for advanced options -->
            <v-col cols="12" class="pt-0">
              <v-btn
                variant="text"
                color="primary"
                @click="showAdvancedOptions = !showAdvancedOptions"
                class="px-0"
              >
                <v-icon class="mr-1">{{ showAdvancedOptions ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                {{ showAdvancedOptions ? 'Hide additional options' : 'Show additional options' }}
              </v-btn>
            </v-col>

            <!-- Advanced options section -->
            <template v-if="showAdvancedOptions">
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
            </template>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :disabled="loading"
          color="secondary"
          text=""
          @click="closeDialog"
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
</template>

<style scoped>
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
</style>
