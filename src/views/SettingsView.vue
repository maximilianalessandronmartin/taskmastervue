<script setup lang="ts">
/**
 * Settings View Component
 * 
 * This view allows users to manage their account settings, appearance preferences,
 * and perform account-related actions like logout and account reset.
 */
import { ref } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useRouter } from 'vue-router';

// Store and router instances
const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

// Reactive state variables
const loading = ref(false);
const confirmDialog = ref(false);
const resetAccountDialog = ref(false);
const error = ref('');
const success = ref('');

/**
 * Handles user logout
 * Calls the auth store logout method and redirects to login page
 */
const logout = async () => {
  loading.value = true;
  try {
    await authStore.logout();
    router.push('/login');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Logout failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

/**
 * Handles account reset functionality
 * Currently a placeholder that simulates an API call
 * In a real implementation, this would call a backend endpoint
 */
const resetAccount = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    // This would need to be implemented in the backend
    // For now, just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    success.value = 'Your account has been reset successfully. Your XP and completed tasks have been reset.';
    resetAccountDialog.value = false;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to reset account. Please try again.';
  } finally {
    loading.value = false;
  }
};


</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">Settings</h1>

    <!-- Error and success alerts -->
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" class="mb-4">
      {{ success }}
    </v-alert>

    <!-- Theme settings card -->
    <v-card class="mb-4">
      <v-card-title>Appearance</v-card-title>
      <v-card-text>
        <!-- Theme toggle switch with dynamic label and icon -->
        <v-switch
            :model-value="themeStore.isDarkMode"
            @update:model-value="themeStore.toggleTheme()"
            :label="`Theme: ${themeStore.isDarkMode ? 'Dark' : 'Light'} Mode`"
            color="primary"
            :hide-details="true"
        >
          <template v-slot:prepend>
            <!-- Dynamic icon based on current theme -->
            <v-icon>{{ themeStore.isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
          </template>
        </v-switch>

      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Account Settings</v-card-title>
      <v-card-text>
        <div v-if="authStore.user" class="mb-4">
          <h3 class="text-h6">User Information</h3>
          <p><strong>Name:</strong> {{ authStore.user.firstname }} {{ authStore.user.lastname }}</p>
          <p><strong>Username:</strong> {{ authStore.user.username }}</p>
          <p><strong>XP:</strong> {{ authStore.user.xp }}</p>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Actions</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <v-btn 
              color="error" 
              block 
              @click="confirmDialog = true"
              :loading="loading"
              :disabled="loading"
            >
              <v-icon left>mdi-logout</v-icon>
              Logout
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6">
            <v-btn 
              color="warning" 
              block 
              @click="resetAccountDialog = true"
              :loading="loading"
              :disabled="loading"
            >
              <v-icon left>mdi-refresh</v-icon>
              Reset Account
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Logout</v-card-title>
        <v-card-text>
          Are you sure you want to logout?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="logout">Logout</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset Account Confirmation Dialog -->
    <v-dialog v-model="resetAccountDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Reset Account</v-card-title>
        <v-card-text>
          Are you sure you want to reset your account? This will reset your XP and completed tasks.
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="resetAccountDialog = false">Cancel</v-btn>
          <v-btn color="warning" @click="resetAccount">Reset Account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>

</style>
