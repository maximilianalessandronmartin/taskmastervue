<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFriendshipStore } from '../store/friendship.store';
import { type Friendship } from '../types/models';

const friendshipStore = useFriendshipStore();

// State
const loading = ref(false);
const newFriendEmail = ref('');
const activeTab = ref(0);
const error = ref('');
const success = ref('');

// Methods
const fetchFriends = async () => {
  loading.value = true;
  try {
    await friendshipStore.fetchFriends();
  } catch (e) {
    console.error('Failed to fetch friends:', e);
  } finally {
    loading.value = false;
  }
};

const fetchPendingRequests = async () => {
  loading.value = true;
  try {
    await friendshipStore.fetchPendingRequests();
  } catch (e) {
    console.error('Failed to fetch pending requests:', e);
  } finally {
    loading.value = false;
  }
};

const sendFriendRequest = async () => {
  if (!newFriendEmail.value) {
    error.value = 'Please enter an email address';
    return;
  }
  
  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    await friendshipStore.sendFriendRequest(newFriendEmail.value);
    success.value = `Friend request sent to ${newFriendEmail.value}`;
    newFriendEmail.value = '';
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to send friend request';
  } finally {
    loading.value = false;
  }
};

const acceptFriendRequest = async (friendshipId: string) => {
  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    await friendshipStore.acceptFriendRequest(friendshipId);
    success.value = 'Friend request accepted';
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to accept friend request';
  } finally {
    loading.value = false;
  }
};

const declineFriendRequest = async (friendshipId: string) => {
  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    await friendshipStore.declineFriendRequest(friendshipId);
    success.value = 'Friend request declined';
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to decline friend request';
  } finally {
    loading.value = false;
  }
};

const clearMessages = () => {
  error.value = '';
  success.value = '';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getFriendName = (friendship: Friendship) => {
  return `${friendship.friend.firstname} ${friendship.friend.lastname}`;
};

const getSenderName = (friendship: Friendship) => {
  return `${friendship.user.firstname} ${friendship.user.lastname}`;
};

// Computed properties
const pendingRequests = computed(() => {
  return friendshipStore.getPendingRequests;
});

const friends = computed(() => {
  return friendshipStore.getFriends;
});

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([fetchFriends(), fetchPendingRequests()]);
});
</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">Friends</h1>
    
    <!-- Add Friend Form -->
    <v-card class="mb-4">
      <v-card-title>Add a Friend</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-2">
          {{ error }}
        </v-alert>
        <v-alert v-if="success" type="success" class="mb-2">
          {{ success }}
        </v-alert>
        
        <v-form @submit.prevent="sendFriendRequest">
          <v-row>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="newFriendEmail"
                label="Friend's Email"
                placeholder="Enter your friend's email address"
                prepend-icon="mdi-email"
                @focus="clearMessages"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center">
              <v-btn
                color="primary"
                block
                @click="sendFriendRequest"
                :loading="loading"
                :disabled="loading || !newFriendEmail"
              >
                Send Request
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
    
    <!-- Friends and Requests Tabs -->
    <v-card>
      <v-tabs v-model="activeTab" grow>
        <v-tab value="0">My Friends</v-tab>
        <v-tab value="1">Friend Requests</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab">
        <!-- Friends List -->
        <v-window-item value="0">
          <v-card-text>
            <v-list v-if="friends.length > 0">
              <v-list-item
                v-for="friendship in friends"
                :key="friendship.id"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" class="mr-3">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-h6">
                  {{ getFriendName(friendship) }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  Friends since {{ formatDate(friendship.updatedAt) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-chip color="primary">
                    XP: {{ friendship.friend.xp }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <v-alert
              v-else
              type="info"
              text="You don't have any friends yet. Send a friend request to get started!"
            ></v-alert>
          </v-card-text>
        </v-window-item>
        
        <!-- Friend Requests -->
        <v-window-item value="1">
          <v-card-text>
            <v-list v-if="pendingRequests.length > 0">
              <v-list-item
                v-for="request in pendingRequests"
                :key="request.id"
              >
                <template v-slot:prepend>
                  <v-avatar color="secondary" class="mr-3">
                    <v-icon color="white">mdi-account-question</v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-h6">
                  {{ getSenderName(request) }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  Request received on {{ formatDate(request.createdAt) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                    color="success"
                    variant="text"
                    icon="mdi-check"
                    class="mr-2"
                    @click="acceptFriendRequest(request.id)"
                    :loading="loading"
                    :disabled="loading"
                  ></v-btn>
                  <v-btn
                    color="error"
                    variant="text"
                    icon="mdi-close"
                    @click="declineFriendRequest(request.id)"
                    :loading="loading"
                    :disabled="loading"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
            
            <v-alert
              v-else
              type="info"
              text="You don't have any pending friend requests."
            ></v-alert>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>