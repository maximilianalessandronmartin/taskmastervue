<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNotificationStore } from '../store/notification.store';
import type { Notification } from '../types/models';
import { formatDate, formatTime } from '../utils/formatters';

const props = defineProps<{
  show: boolean;
}>();

// Create a local ref that's synced with the prop
const isOpen = ref(props.show);

// Watch for changes to the prop and update the local ref
watch(() => props.show, (newValue) => {
  console.log('show prop changed:', newValue);
  isOpen.value = newValue;
}, { immediate: true });

// Watch for changes to the local ref and emit events
watch(isOpen, (newValue) => {
  console.log('isOpen changed:', newValue);
  if (!newValue) {
    emit('close');
  }
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const notificationStore = useNotificationStore();

const notifications = computed(() => notificationStore.allNotifications);
const hasNotifications = computed(() => notifications.value.length > 0);

// Format the notification date to a readable format
const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

// Get the appropriate icon for the notification type
const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'FRIEND_REQUEST':
      return 'mdi-account-plus';
    case 'FRIEND_REQUEST_ACCEPTED':
      return 'mdi-account-check';
    case 'ACHIEVEMENT_UNLOCKED':
      return 'mdi-trophy';
    case 'TASK_SHARED':
      return 'mdi-share';
    case 'TASK_COMPLETED':
      return 'mdi-check-circle';
    default:
      return 'mdi-bell';
  }
};

// Mark a notification as read
const markAsRead = async (notification: Notification) => {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id);
    // Close the details dialog if it's the selected notification
    if (selectedNotification.value && selectedNotification.value.id === notification.id) {
      closeDetailsDialog();
    }
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  await notificationStore.markAllAsRead();
};

// Selected notification for details view
const selectedNotification = ref<Notification | null>(null);
const showDetailsDialog = ref(false);

// Open notification details dialog
const openNotificationDetails = (notification: Notification) => {
  selectedNotification.value = notification;
  showDetailsDialog.value = true;
};

// Close notification details dialog
const closeDetailsDialog = () => {
  showDetailsDialog.value = false;
};

// Close the notification drawer
const closeDrawer = () => {
  isOpen.value = false;
};
</script>

<template>
  <v-dialog
    v-model="isOpen"
    max-width="400"
    transition="dialog-right-transition"
    position="right"
    style="z-index: 1000;"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Notifications</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="markAllAsRead" :disabled="!hasNotifications">
          <v-icon>mdi-check-all</v-icon>
        </v-btn>
        <v-btn icon @click="closeDrawer">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-list v-if="hasNotifications">
        <v-list-item
          v-for="notification in notifications"
          :key="notification.id"
          :class="{ 'unread': !notification.read }"
          @click="openNotificationDetails(notification)"
        >
          <template v-slot:prepend>
            <v-avatar color="primary" class="mr-3">
              <v-icon :icon="getNotificationIcon(notification.type)" color="white"></v-icon>
            </v-avatar>
          </template>

          <v-list-item-title>{{ notification.message }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatDateTime(notification.createdAt) }}</v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              v-if="!notification.read"
              icon="mdi-check"
              size="small"
              color="primary"
              @click.stop="markAsRead(notification)"
              title="Mark as read"
            ></v-btn>
            <v-icon v-if="!notification.read" color="primary" class="ml-2">mdi-circle-small</v-icon>
          </template>
        </v-list-item>
      </v-list>

      <v-card-text v-else class="text-center pa-5">
        <v-icon size="64" color="grey">mdi-bell-off</v-icon>
        <div class="text-h6 mt-2">No notifications</div>
        <div class="text-body-2">You don't have any notifications yet.</div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Notification Details Dialog -->
  <v-dialog v-model="showDetailsDialog" max-width="500">
    <v-card v-if="selectedNotification">
      <v-card-title class="d-flex align-center">
        <v-avatar color="primary" class="mr-3">
          <v-icon :icon="getNotificationIcon(selectedNotification.type)" color="white"></v-icon>
        </v-avatar>
        <span>{{ selectedNotification.type.replace(/_/g, ' ') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDetailsDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-list-item>
          <v-list-item-title class="text-h6">{{ selectedNotification.message }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatDateTime(selectedNotification.createdAt) }}</v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-3"></v-divider>

        <div v-if="selectedNotification.payload" class="mt-3">
          <div class="text-subtitle-1 font-weight-bold">Additional Information:</div>
          <div class="text-body-1 mt-1">{{ selectedNotification.payload }}</div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!selectedNotification.read"
          color="primary"
          @click="markAsRead(selectedNotification)"
        >
          Mark as Read
        </v-btn>
        <v-btn color="grey" @click="closeDetailsDialog">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.unread {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Ensure text wrapping for notification details */
.v-list-item-title, .text-body-1, .v-card-title span {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
