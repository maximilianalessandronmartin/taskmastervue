<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type TaskDto, type Friendship } from '../types/models';

const props = defineProps<{
  modelValue: boolean;
  task: TaskDto | null;
  friendships: Friendship[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'share', username: string): void;
  (e: 'unshare', taskId: string, username: string): void;
  (e: 'fetch-friends'): void;
}>();

const dialogOpen = ref(props.modelValue);
const shareUsername = ref('');

// Watch for dialog open to fetch friends
watch(() => props.modelValue, (newValue) => {
  dialogOpen.value = newValue;
  if (newValue && props.task) {
    emit('fetch-friends');
    shareUsername.value = '';
  }
});

// Watch for changes in the local ref to emit updates
watch(dialogOpen, (newValue) => {
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue);
  }
});

const closeDialog = () => {
  dialogOpen.value = false;
  emit('update:modelValue', false);
};

const shareTask = () => {
  if (!shareUsername.value) {
    return;
  }

  emit('share', shareUsername.value);
  shareUsername.value = ''; // Clear the username field after sharing
};

const unshareTask = (taskId: string, username: string) => {
  emit('unshare', taskId, username);
};
</script>

<template>
  <v-dialog v-model="dialogOpen" max-width="500px" @update:modelValue="closeDialog">
    <v-card v-if="task" class="task-dialog-card">
      <v-card-title>
        <span class="text-h5">{{ task && task.owner ? 'Share Task' : 'Task Shared With Me' }}</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="shareUsername"
                :disabled="loading || friendships.length === 0"
                :hint="friendships.length === 0 ? 'You have no friends to share with' : ''"
                :items="friendships"
                :item-title="item => item.friend?.firstname + ' ' + item.friend?.lastname"
                :item-value="item => item.friend?.username"
                label="Select Friend"
                persistent-hint
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <v-list-item-subtitle>{{ item.raw.friend?.username || 'Kein Benutzername' }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div v-if="item.raw && item.raw.friend">
                    <div>{{ item.raw.friend.firstname }}</div>
                    <small>{{ item.raw.friend.username }}</small>
                  </div>
                  <div v-else>Choose a friend to share</div>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <!-- Shared with list -->
          <v-row v-if="task && task.sharedWith && task.sharedWith.length > 0">
            <v-col cols="12">
              <v-divider class="my-3"></v-divider>
              <h3 class="text-subtitle-1 mb-2">{{ task && task.owner ? 'Currently shared with:' : 'Shared by:' }}</h3>
              <div class="shared-with-list">
                <v-chip
                  v-for="user in task.sharedWith"
                  :key="user.id"
                  :disabled="loading || !task.owner"
                  class="mr-1 mt-1"
                  closable
                  size="small"
                  @click:close="unshareTask(task.id, user.username)"
                >
                  {{ user.firstname }} {{ user.lastname }}
                </v-chip>
              </div>
            </v-col>
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
          Close
        </v-btn>
        <v-btn
          :disabled="loading || !shareUsername"
          :loading="loading"
          color="primary"
          text=""
          @click="shareTask"
        >
          Share
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
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
