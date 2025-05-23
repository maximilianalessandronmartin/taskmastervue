<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useNotificationStore } from '../store/notification.store';
import NotificationList from './NotificationList.vue';
import websocketService from '../services/websocket.service';


const notificationStore = useNotificationStore();
const showNotifications = ref(false);

// Compute the number of unread notifications
const unreadCount = computed(() => {
  const count = notificationStore.unreadCount;
  console.log('Computing unread count:', count);
  return count;
});

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
// This is a fallback in case the auth store didn't initialize it
onMounted(async () => {
  // Only initialize if not already initialized
  if (!notificationStore.isInitialized) {
    console.log('NotificationIcon: Notification store not initialized, initializing now');
    await notificationStore.initialize();
  } else {
    console.log('NotificationIcon: Notification store already initialized, skipping');
  }
});

// Watch for new notifications and update the badge
watch(() => websocketService.notifications.value, (newNotifications) => {
  if (newNotifications.length > 0) {
    // Der Store wird die neuen Benachrichtigungen durch den EventListener verarbeiten
    // Der Zähler wird automatisch durch das computed-Property aktualisiert
  }
}, { deep: true });


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

    <!-- Notification List -->
    <NotificationList
      :show="showNotifications"
      @close="closeNotifications"
    />
  </div>
</template>
