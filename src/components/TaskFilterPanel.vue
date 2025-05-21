<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  urgencyFilter: string;
  showCompleted: boolean;
  panelOpen: number;
}>();

const emit = defineEmits<{
  (e: 'update:urgencyFilter', value: string): void;
  (e: 'update:showCompleted', value: boolean): void;
  (e: 'update:panelOpen', value: number): void;
}>();

const localUrgencyFilter = ref(props.urgencyFilter);
const localShowCompleted = ref(props.showCompleted);
const localPanelOpen = ref(props.panelOpen);

// Watch for changes in the local values and emit them
function updateUrgencyFilter(value: string) {
  localUrgencyFilter.value = value;
  emit('update:urgencyFilter', value);
}

function updateShowCompleted(value: boolean | null) {
  // If value is null, default to false
  const boolValue = value === null ? false : value;
  localShowCompleted.value = boolValue;
  emit('update:showCompleted', boolValue);
}

function updatePanelOpen(value: unknown) {
  const numValue = value as number;
  localPanelOpen.value = numValue;
  emit('update:panelOpen', numValue);
}
</script>

<template>
  <v-expansion-panels v-model="localPanelOpen" class="mb-4" @update:modelValue="updatePanelOpen">
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
              v-model="localUrgencyFilter"
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
              @update:modelValue="updateUrgencyFilter"
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-switch
              v-model="localShowCompleted"
              :color="localShowCompleted ? 'success' : 'grey'"
              :hide-details="true"
              class="mt-2"
              density="comfortable"
              label="completed"
              @update:modelValue="updateShowCompleted"
            ></v-switch>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
