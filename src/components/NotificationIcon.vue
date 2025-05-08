<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '../store/notification.store';
import NotificationList from './NotificationList.vue';

const notificationStore = useNotificationStore();
const showNotifications = ref(false);

// Compute the number of unread notifications
const unreadCount = computed(() => notificationStore.unreadCount);

// Toggle the notification drawer
const toggleNotifications = () => {
  console.log('Before toggle:', showNotifications.value);
  showNotifications.value = !showNotifications.value;
  console.log('After toggle:', showNotifications.value);
};

// Close the notification drawer
const closeNotifications = () => {
  showNotifications.value = false;
};

// Initialize the notification system when the component is mounted
onMounted(async () => {
  await notificationStore.initialize();
});

// Disconnect from WebSocket when the component is unmounted
onUnmounted(() => {
  // This is optional, as we might want to keep the connection alive
  // even when this component is unmounted
  // websocketService.disconnect();
});
</script>

<template>
  <div class="me-3">
    <v-badge
      :content="unreadCount"
      :model-value="unreadCount > 0"
      color="error"
      location="top end"
    >
      <v-btn
          icon
          @click="toggleNotifications"
          aria-label="Show notifications"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-badge>

    <NotificationList
      :show="showNotifications"
      @close="closeNotifications"
    />
  </div>
</template>
