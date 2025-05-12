<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const searchQuery = ref(props.modelValue);

// Watch for changes in the local value and emit them
function updateSearchQuery(value: string) {
  searchQuery.value = value;
  emit('update:modelValue', value);
}
</script>

<template>
  <v-text-field
    v-model="searchQuery"
    :hide-details="'auto'"
    clearable
    label="Search tasks"
    variant="outlined"
    class="mb-4"
    @update:modelValue="updateSearchQuery"
  >
    <template v-slot:prepend-inner>
      <v-icon>mdi-magnify</v-icon>
    </template>
  </v-text-field>
</template>