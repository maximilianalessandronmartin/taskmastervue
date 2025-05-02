<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { useRouter } from 'vue-router';
import { type LoginUserDto } from '../types/models';

const authStore = useAuthStore();
const router = useRouter();

const credentials = reactive<LoginUserDto>({
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const login = async () => {
  if (!credentials.email || !credentials.password) {
    error.value = 'Please fill in all fields';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await authStore.login(credentials);
    router.push('/app/tasks');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const goToSignup = () => {
  router.push('/signup');
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>TaskQuest - Login</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">
              {{ error }}
            </v-alert>
            
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="credentials.email"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="credentials.password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="secondary" 
              @click="goToSignup"
              :disabled="loading"
            >
              Sign Up
            </v-btn>
            <v-btn 
              color="primary" 
              @click="login"
              :loading="loading"
              :disabled="loading"
            >
              Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>