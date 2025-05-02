<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const confirmDialog = ref(false);
const resetAccountDialog = ref(false);
const error = ref('');
const success = ref('');

// Logout function
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

// Reset account function (placeholder - would need to be implemented in the backend)
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

// Clear messages
const clearMessages = () => {
  error.value = '';
  success.value = '';
};
</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">Settings</h1>
    
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>
    
    <v-alert v-if="success" type="success" class="mb-4">
      {{ success }}
    </v-alert>
    
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
          <v-btn color="secondary" text @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="logout">Logout</v-btn>
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
          <v-btn color="secondary" text @click="resetAccountDialog = false">Cancel</v-btn>
          <v-btn color="warning" text @click="resetAccount">Reset Account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.v-card {
  transition: transform 0.3s;
}
.v-card:hover {
  transform: translateY(-5px);
}
</style>