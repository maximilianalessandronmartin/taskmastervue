<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const currentTab = computed(() => {
  const path = route.path;
  if (path.includes('/tasks')) return 0;
  if (path.includes('/achievements')) return 1;
  if (path.includes('/friends')) return 2;
  if (path.includes('/settings')) return 3;
  return 0;
});

const tabs = [
  { title: 'Tasks', icon: 'mdi-checkbox-marked-circle-outline', route: '/app/tasks' },
  { title: 'Achievements', icon: 'mdi-trophy', route: '/app/achievements' },
  { title: 'Friends', icon: 'mdi-account-group', route: '/app/friends' },
  { title: 'Settings', icon: 'mdi-cog', route: '/app/settings' }
];

const navigateTo = (route: string) => {
  router.push(route);
};

onMounted(async () => {
  // Fetch user data when the app layout is mounted
  try {
    await authStore.fetchUser();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    // If fetching user data fails, redirect to login
    router.push('/login');
  }
});
</script>

<template>
  <div>
    <v-app-bar color="primary" app dark>
      <v-app-bar-title>TaskQuest</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="authStore.user" class="mr-2">
        XP: {{ authStore.user.xp }}
      </v-chip>
    </v-app-bar>

    <div class="content-container">
      <v-container fluid>
        <router-view />
      </v-container>
    </div>

    <v-bottom-navigation
      :model-value="currentTab"
      color="primary"
      grow
    >
      <v-btn
        v-for="(tab, index) in tabs"
        :key="index"
        @click="navigateTo(tab.route)"
      >
        <v-icon>{{ tab.icon }}</v-icon>
        {{ tab.title }}
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<style scoped>
.v-bottom-navigation {
  position: fixed;
  bottom: 0;
  width: 100%;
}

.content-container {
  padding-bottom: 56px; /* Height of the bottom navigation */
}
</style>
