<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { useRouter } from 'vue-router';
import { type RegisterUserDto } from '../types/models';

const authStore = useAuthStore();
const router = useRouter();

const userData = reactive<RegisterUserDto>({
  firstname: '',
  lastname: '',
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const confirmPassword = ref('');

const validateForm = (): boolean => {
  if (!userData.firstname || !userData.lastname || !userData.email || !userData.password) {
    error.value = 'Please fill in all fields';
    return false;
  }
  
  if (userData.password !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return false;
  }
  
  if (userData.password.length < 8) {
    error.value = 'Password must be at least 8 characters long';
    return false;
  }
  
  return true;
};

const register = async () => {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await authStore.register(userData);
    router.push('/login');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>TaskQuest - Sign Up</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">
              {{ error }}
            </v-alert>
            
            <v-form @submit.prevent="register">
              <v-text-field
                v-model="userData.firstname"
                label="First Name"
                name="firstname"
                prepend-icon="mdi-account"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="userData.lastname"
                label="Last Name"
                name="lastname"
                prepend-icon="mdi-account"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="userData.email"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="userData.password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                prepend-icon="mdi-lock-check"
                :type="showPassword ? 'text' : 'password'"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="secondary" 
              @click="goToLogin"
              :disabled="loading"
            >
              Back to Login
            </v-btn>
            <v-btn 
              color="primary" 
              @click="register"
              :loading="loading"
              :disabled="loading"
            >
              Sign Up
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>